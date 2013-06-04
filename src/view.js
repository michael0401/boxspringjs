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
	
	var view = function (db, options, design, views, emitter) {	
		var that = _.extend({}, db.events());
			
		that.db = db;
		that.design = design;
		that.index = (options && options.index) || (db && db.index);
		that.views = views;
		that.emitter = emitter;
		that.query = translateQuery(_.omit(options, 'system'));
		that.system = (that.db && that.db.system && that.db.system.post()) ||
			{ 	'asynch': false,
				'cache-size': undefined, //10,
				'page-size': undefined, //100,
				'delay': 0.5 };
				
		var setQuery = function (queryParams, systemParams) {
			if (_.isObject (queryParams)) {
				this.query = _.extend(this.query, queryParams);
			}
			// rule: if reduce=true then page-size=0;
			if (_.has(this.query, 'reduce') && this.query.reduce === true) {
				this.system['page-size'] = 0;
				this.system.asynch = false;
			} else if (systemParams.asynch === true) {
				this.system['page-size'] = systemParams['page-size'];
				this.system['cache-size'] = systemParams['cache-size'] || Number.MAX_VALUE;
			}
			return this.query;
		};
		that.setQuery = setQuery;
		that.setQuery(that.options, that.system);

		var fetch = function (server) {
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
					return(_.extend(query, { 'limit': system['page-size']+1 }));
				}
				return query;
			};

			var chunk = function (startkey) {
				var queryMethod = (index === 'all_docs') ? 'all_docs' : 'view';

				// remaining cache-size get smaller on each successive fetch
				system['cache-size'] = _.isNumber(system['cache-size']) 
					? system['cache-size']-1 
					: undefined;

				query = nextQuery(query, startkey);
				query = nextLimit(query, system['page-size']);
				// execute the query and process the response
				//console.log('db.query', design, index, query);
				db.queryHTTP(queryMethod, 
					_.extend({ 'id': design }, {'view': index }), query,
					function (err, response) {
						
					if (err) {
						events.trigger('view-error', new Error('error: ' + response.data.error + 
							' reason: '+response.data.reason));
							
					} else {
						//console.log('got response!', response.code, response.request);
						//console.log('db.query after', design, index, query);
						if (system.asynch && response.data && _.has(response.data, 'rows')) {	
							response.data.nextkey = 
								response.data.rows[response.data.rows.length-1];
							nextkey = response.data.nextkey;	
							response.queryOptions = query;
							response.moreData = events.moreData;

							// trim the rows, because we got page-size+1
							if ((system['page-size'] > 0) && 
								(response.data.rows.length > system['page-size'])) { 
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
					}
				});
			};

			events.on('chunk-data', function (res) {
				// if I've got less than the full index; and asynchronous request
				//console.log('chunk-data', res.data.rows.length > 0, tRows < res.data.total_rows, (system.asynch === true && system['cache-size']), res.data.offset);
				
				if ((res.data.rows.length > 0 && tRows < res.data.total_rows) && 
					(system.asynch === true && system['cache-size'])) {
						// pause so we don't flood the browser and the net						
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
				system['cache-size'] += 1;
				chunk(nextkey);
			};
			chunk();		
		};
		that.fetch = fetch;

		// if 'node' server is requested, then built-in server side view will be used.
		// generate the list of docs for this db
		var node = function () {
			var events = this;

			events.on('chunk-finished', function (res) {
				events.trigger('view-data',  res);
			});
			this.fetch(this, 'node');
		};
		that.node = node;

		var couch = function () {
			var events = this;

			events.on('chunk-data', function (res) {									
				events.trigger('view-data', res);
			});
			this.fetch(this);
		};
		that.couch = couch;
		
		var end = function (server, eventHandler) {
			var res = this.db.events()
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

			this.on('view-error', function (err) {	
				requestEvents.trigger('error', err);
			});
			return this;					
		};
		that.end = end;
		return that;		
	};
	global.view = view;

}(boxspring));	
