/* ===================================================
 * view-utils.js v0.01
 * https://github.com/rranauro/base-utilsjs
 * ===================================================
 * Copyright 2013 Incite Advisors, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

/*jslint newcap: false, node: true, vars: true, white: true, nomen: true  */
/*global _: true, bx: true */

(function(global) {
	"use strict";
	var view = global.view = {};
	
	// What it does: Helper function for 'get' routine. To make sure only relevant combinations
	// of query parameters are sent to the server
	var translateQuery = function (source) {
		var target = _.clean(source)
		, selector
		, value
		, validQueries = {
			'group': {
				1: ['group', 'reduce', 'descending'],
				0: ['reduce', 'descending']
			},
			'reduce': {
				1: ['reduce', 'group_level', 'startkey', 'endkey', 
				'key', 'keys', 'descending'],
				0: ['reduce', 'limit', 'startkey', 'endkey', 
				'key', 'keys', 'include_docs', 'descending']
			}
		};
		
		if (_.has(target, 'group')) {
			selector = 'group';
		} else {
			selector = 'reduce';
			target.reduce = target.reduce || false;
		}
		value = target[selector] ? 1 : 0;
		try {
			target = _.pick(target, validQueries[selector][value]);
		} catch (e) {
			throw new Error('[translateQuery] - ' + e); 
		}
		return target;
	};
	
	view.construct = function (db, options, design, views, emitter) {
		_.extend(this, global.Events());
		this.db = db;
		this.design = design;
		this.index = (options && options.index);
		this.views = views;
		this.emitter = emitter;
		this.query = translateQuery(_.omit(options, 'system'));
		// system parameter passed in via the set/get connected to the calling query object
		this.system = _.defaults(options.system || {}, {
			'asynch': false, 
			'page_size': 0, 
			'cache_size': undefined });
			
		this.on('get-more-data', function() {
			console.log('construct: get-more-data');
		});
			
		var setQuery = function (queryParams, systemParams) {
			if (_.isObject (queryParams)) {
				this.query = _.extend(this.query, queryParams);
			}
			// rule: if reduce=true then page_size=0;
			if (_.has(this.query, 'reduce') && this.query.reduce === true) {
				this.system.page_size = 0;
				this.system.asynch = false;
			} else if (systemParams.asynch === true) {
				this.system.page_size = systemParams.page_size;
				this.system.cache_size = systemParams.cache_size;
			}
			return this.query;
		};
		this.setQuery = setQuery;
		this.setQuery(this.options, this.system);
	};

	view.fetch = function (server) {
		var tRows = 0
		, db = this.db
		, design = this.design
		, index = this.index
		, events = this
		, query = this.query
		, system = this.system
		, emitter = this.emitter
		, nextkey;

		var nextQuery = function(query, startkey) {
			// only called with a startkey by 'chunk' on subsequent invokations
			// thus, will only happen when 'asynch===true'
			if (startkey) {
				return(_.extend(query, {
					'startkey_docid': startkey.id, 
					'startkey': startkey.key }));
			}
			return query;
		};

		var nextLimit = function(query, size) {					
			if (system.asynch && _.isNumber(size) && size > 0) {
				return(_.extend(query, { 'limit': system.page_size+1 }));
			}
			return query;
		};

		var chunk = function (startkey) {
			var queryMethod = (index === 'all_docs') ? 'all_docs' : 'view';

			// remaining cache_size get smaller on each successive fetch
			system.cache_size = _.isNumber(system.cache_size) 
				? system.cache_size-1 
				: undefined;

			query = nextQuery(query, startkey);
			query = nextLimit(query, system.page_size);
			// execute the query and process the response
			//console.log('db.query', design, index, query);

			db.queryHTTP(queryMethod, 
				_.extend({ 'id': design }, {'view': index }), query,
				function (response) {
				//console.log('got response!', response.code, response.request);
				if (response.code === 200) {
					if (system.asynch && response.data && _.has(response.data, 'rows')) {	
						response.data.nextkey = 
							response.data.rows[response.data.rows.length-1];
						nextkey = response.data.nextkey;	
						response.queryOptions = query;
						response.moreData = events.moreData;

						// trim the rows, because we got page_size+1
						if ((system.page_size > 0) && 
							(response.data.rows.length > system.page_size)) { 
								response.data.rows = 
								response.data.rows.slice(0,response.data.rows.length-1);
						}

						if (!_.has(response.data, 'total_rows')){
							// reduce fetches don't produce offset/total_rows
							// for now, there is no paging reduced views from the server;
							response.data.offset = 0;
							response.data.total_rows = response.data.rows.length;
						} 
						tRows += response.data.rows.length; 
					}
					events.trigger('chunk-data', response);
				} else {
					events.trigger('view-error', response);
				}				
			});
		};

		events.on('chunk-data', function (res) {
			// if I've got less than the full index; and asynchronous request
			//console.log('chunk-data', res.data.rows.length, tRows, res.data.total_rows, system);

			if ((res.data.rows.length > 0 && tRows < res.data.total_rows) && 
				(system.asynch === true) && system.cache_size > 0) {
					// pause the asynchronous read, so we don't flood the browser and the net
					_.wait((system && system.delay) || 1/10, function() {
						chunk(res.data.nextkey);						
					});
			} else {
				// if we're building the index internally, call it here. the prefetch is 
				// 'all_docs' with 'include_docs' = true
				if (server === 'node' && emitter) {
					_.map(res.data.rows, function(item) {
						return emitter.map.call(this, (item && item.doc) || item);
					});
					emitter.getRows(res.data);
					tRows = res.data.total_rows;					
					events.trigger('chunk-finished', res);
				}
			}
		});

		this.moreData = function () {
			system.cache_size += 1;
			chunk(nextkey);
		};
		chunk();		
	};
	

	
	// if 'node' server is requested, then built-in server side view will be used.
	// generate the list of docs for this db
	view.node = function () {
		var events = this;

		events.on('chunk-finished', function (res) {
			events.trigger('view-data',  res);
		});
		this.fetch(this, 'node');
	};

	view.couch = function () {
		var events = this;
		
		events.on('chunk-data', function (res) {						
			events.trigger('view-data', res);
		});
		this.fetch(this);
	};

	view.end = function (server, eventHandler) {
		var res = global.Events()
		, requestEvents = this
		, local = this;

		// Note: Responses from this method are evented. 
		eventHandler(res);
		// execute the view by calling the requested server function
		local[server](res, this.query);

		this.on('view-data', function (response) {
			if (response.code === 200) {
				res.trigger('data', response);
			} else {
				res.trigger('view-error', response);
			}
		});

		this.on('view-error', function (response) {	
			requestEvents.trigger('error', 'bad-view', local.index, response.reason());
		});
		return this;					
	};
	
}(boxspring));	
