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
/*global _: true, Boxspring: true */

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
	
	// Validates the query parameters for a CouchDB query;
	var isValidQuery = function (s) {
		var target = {} 
		, validCouchProperties = [
		'reduce', 'limit', 
		'startkey', 'endkey', 
		'group_level', 'group', 
		'key', 'keys',
		'rev' ]
		, formatKey = function(target, key, exclude) {
			if (_.has(target, key) && typeof target[key] !== 'undefined') {
				target[key] = JSON.stringify(target[key]);
				target = _.omit(target, exclude);
			}
			return(target);
		};

		// remove residual application parameters
		target = _.extend(_.pick(_.clean(s), validCouchProperties));

		// couchdb needs properly formatted JSON string
		if (_.has(target, 'key')) {
			target = formatKey(target, 'key', ['keys', 'endkey', 'startkey']);
		} else if (_.has(target,'keys')) {
			target = formatKey(target, 'keys', ['endkey', 'startkey']);					
		} else if (_.has(target, 'startkey')) {
			target = formatKey(target, 'startkey');
			if (_.has(target, 'endkey')) {
				target = formatKey(target, 'endkey');
			}
		}
		try {
			// reduce has to be true or false, not 'true' or 'false'
			if (_.has(target, 'reduce') && typeof target.reduce === 'string') {
				target.reduce = _.coerce('boolean', target.reduce);
				throw 'reduce value must be a boolean, converting string to boolean';
			}

			// Enforces rule: if group_level specified, then reduce must be true
			if (typeof target.group_level === 'number' && 
				typeof target.reduce === 'boolean' && 
				target.reduce === false) {
				target.reduce = true;
				throw 'reduce must be true when specifying group_level';
			}
			// 'limit' and 'group_level' must be integers
			['limit', 'group_level'].forEach(function(key) {
				if (_.has(target, key)) {
					target[key] = _.toInt(target[key]);
					if (!_.isNumber(target[key])) {
						throw key + ' value must be a number';
					}
				}
			});
			// if reduce=true, then include_docs can't be true
			if (typeof target.include_docs !== 'undefined'&& 
				target.include_docs === true && 
				typeof target.reduce !== undefined && 
				target.reduce === true) {
				target = _.omit(target, 'include_docs');
				throw 'unable to apply include_docs parameter for reduced views';
			}					
		} catch (e) {
			throw new Error('[ db isValidQuery] - ' + JSON.stringify(s));
		}				
		return target;
	};
	
	var view = function (system) {	
		var that = _.extend({}, this, this.events())
		, query = translateQuery(this.options.post());

		that.system = this.UTIL.hash((system) || {	
			'asynch': false,
			'cache-size': undefined, //10,
			'page-size': undefined, //100,
			'delay': 0.5 
		});
		system = that.system.post();
						
		// rule: if reduce=true then page-size=0, asynch=false;
		if (_.has(query, 'reduce') && query.reduce === true) {
			system['page-size'] = 0;
			system.asynch = false;
		} else if (system.asynch === true) {
			system['cache-size'] = system['cache-size'] || Number.MAX_VALUE;
		}
		
		var fetchView = function (server) {
			var tRows = 0
			, db = this
			, events = this
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
				// remaining cache-size get smaller on each successive fetch
				system['cache-size'] = _.isNumber(system['cache-size']) 
					? system['cache-size']-1 
					: undefined;

				query = nextQuery(query, startkey);
				query = nextLimit(query, system['page-size']);
				
				// _all_docs is a special case view; 
				if (db.url().split('/')[db.url().split('/').length-1] === '_all_docs') {
					// use the built-in all_docs method
					db.read = db.all_docs;
				} else {
					// update the query options;
					db.options.update(isValidQuery(query));
				}
								
				// execute the query and process the response
				db.read(function(err, response) {
					//console.log('got response!', response.code, response.request, response.data);
					if (err) {
						events.trigger('view-error', new Error('error: ' + response.data.error + 
							' reason: '+response.data.reason));
							
					} else {
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
						//console.log('moving to chunk data', response.data.total_rows);
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

		// if 'node' server is requested, then built-in server side view will be used.
		// generate the list of docs for this db
		var node = function () {
			var events = this;

			events.on('chunk-finished', function (res) {
				events.trigger('view-data',  res);
			});
			fetchView.call(this, 'node');
		};

		var couch = function () {
			var events = this;

			events.on('chunk-data', function (res) {	
				//console.log('got this chunk data', res.data.total_rows);								
				events.trigger('view-data', res);
			});
			fetchView.call(this);
		};
		
		var end = function (server, eventHandler) {
			var machine = {
				'couch': couch,
				'node': node
			} 
			, res = this.events()
			, requestEvents = this
			, local = this;

			// Note: Responses from this method are evented. 
			eventHandler(res);
			// execute the view by calling the requested server function
			machine[server].call(local, res, this.query);

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
		
		// Purpose: wrapper for evented .view function. 
		// Default behavior 'asynch: true'  to execute callback only on the first 
		// delivery of data from the server. 
		// 'asynch: false' (or undefined) executes the callback each time and the 
		// application has to manage the data
		var fetch = function (options, callback, callerDataCatcher) {
			var local = this 
			, triggered = false
			// caller can provide an object to wrap the data, ie. data method of "Result" object;
			, caller = (callerDataCatcher && _.isFunction(callerDataCatcher)) 
				? callerDataCatcher 
				: function (x) { return x; }							

			// update the 'system' options
			system = this.system.post();
			
			this.on('error', function (err) {
				throw err;
			});

			this.end('couch', function(res) {
				res.on('data', function (r) {
					// create a result object instrumented with row helpers 
					// and design document info
					var result = local.events(local.rows(r, local.maker()));	
					if (callback && _.isFunction(callback)) {
						if (system && system.asynch === false) {
							// just write wrapped data to the calling program. 
							//console.log('got data!', caller(result), caller === _.item);
							callback(null, caller(result));
						} else if ((system && system.asynch === true) && 
							triggered === false) {
							// let calling program continue, continuously receive data
							callback(null, caller(result));
							triggered = true;								
						} else {
							// add data to Result object of the caller
							caller(result);
						}
					}
				});			
			});
			return this;
		};
		that.fetch = fetch;
		
		// Purpose: Emulates CouchDB view/emit functions on the "client"
		// TBD: Not tested
		var emulate = function (name) {
			// When running in node.js, calling functions need to find 'emit' in its scope 
			// On server side, will use couchdb's built-in emit()
			var emitter = function(viewfunc) {
				var tree = global.Btree()
					, map = (viewfunc && viewfunc.map)
					, reduce = (viewfunc && viewfunc.reduce);

				var emit = function (key, value) {
					tree.store(JSON.stringify(key), value);
				};
				tree.emit = emit;
				tree.map = map;
				tree.reduce = reduce;
				return tree;
			}
			, e = emitter(this.maker().views[name]);
			emit = e.emit;
			return(e);
		};
		that.emulate = emulate;
		return that;		
	};
	global.view = view;

}(Boxspring));	
