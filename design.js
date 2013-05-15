/* ===================================================
 * design.js v0.01
 * https://github.com/rranauro/boxspringjs
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
/*global _: true, boxspring: true, emit: true, sum: true */

(function(global) {
	"use strict";

	// What it does: Templated data structure for a CouchDB design document; 
	// map functions of defaultDesign are capable of also running in Nodejs.
	var defaultDesign = function () {
		var toJSON = function(o) {
			return(JSON.stringify(o));
		};
		// Note: This code may run on the server, where exports may not be defined.
		if (typeof exports === 'undefined') {
			var exports = {};
		}

		return({
			'language': 'javascript',
			'updates': {
				// want to force all my documents to have a created_at, size, last_updated;
				// able to pass in additional key-values to the in-place method
				// applications should use this method to enforce their 'type'-ing
				"in-place" : function (doc, req) {
					var i;

					if (req && req.query) {
						for (i in req.query) {
							if (req.query.hasOwnProperty(i)) {
								doc[i] = req.query[i];
							}
						}		
					}
					doc['last-updated'] = Date();
					doc['in-place-succeeded'] = true;
					doc.size = JSON.stringify(doc).length;
					return [doc, toJSON(doc) ];
				}				
			},
			'views': {
				'lib': {
					'underscore': exports.val = ";"
				},
				'Index': {
					'map': function (doc) {
						if (doc && doc._id) {
							emit(doc._id, doc);
						}
					},
					'reduce': function(keys, values, rereduce) {
						if (rereduce) {
							return sum(values);
						}
						return values.length;
					},
					'header': {
						'sortColumn': '_id',
						'keys': ['_id'],
						'columns': ['_id', 'doc']
					}
				}			
			},
			'shows': {},
			'lists': {}
		});
	};
	
	var design = function (id, custom, index) {		
		// extend this object with the db methods from the caller
		var that = _.extend({}, this)
		
		// create a document object
		, doc = this.doc(id || this.designName || _.uniqueId('_design/design-'));
				
		// set the view index for this design
		that.index = arguments.length === 3 ? index : (this.index || 'Index'); 
		
		// defaultDesign, custom maker (if supplied), default headers
		that.custom = custom || this.maker || defaultDesign;
		that.headers = { 'X-Couch-Full-Commit': false };
		
				
		// What this does: Serializes its map/reduce functions; extends the _design/ document 
		// A VIEW is a property of a DESIGN document.
		// addView method extends the 'views' object with the supplied map/reduce functions;
		/*jslint unparam: true */
		that.ddoc = _.extend({}, doc, {
			'owner': this,
			'ddoc': {
				'language': 'javascript',
				'updates': {},
				'types': {},
				'views': {},
				'shows': {},
				'lists': {}
			}
		});

		// What it does: returns the maker function for this design, either provided by the 
		// application or defaulted from global.
		var maker = function () {
			return((this && this.custom) || defaultDesign);
		};
		that.maker = maker;
		that.views = that.maker()().views;

		// system parameters to control the query behavior
		that.system = boxspring.Lookup.Hash({
			'asynch': false,
			'cache_size': 10,
			'page_size': 100,
			'delay': 1
		});

		// What it does: provides the first map view as the default
		this['default-index'] = _.fetch(that.views, 'default-index');
		that.dateFilter = _.fetch(that.views, 'dateFilter');
		that.lib = _.fetch(that.views, 'lib');
		that.doc = _.fetch(that.views, 'doc');
		that.types = that.maker()() && that.maker()().types;
		that.formats = that.views && that.views.lib && that.views.lib.formats;

		(function (libs) {
			var ddoc = this.ddoc
			, views = this.views
			, libSrc = 'var bx = { "COUCH": true };\n';

			if (views && views.hasOwnProperty('lib')) {
				_.each(views.lib, function(lib, name) {
					if (libs && libs.hasOwnProperty(name)) {
						libSrc += global.libs[name] + '\n';						
					}
				});
			}

			// add application views and template views from the default design template object	
			_.each((this.maker())().views, function (views, name) { 
				var mapFunc = views.map
					, reduceFunc = views && views.reduce
					, header = views && views.header;

				if (name === 'lib') {
					ddoc.ddoc.views.lib = {};
					_.each(views, function (value, key) {
						var fn = global.Serialize(value)
							, prePend = fn.indexOf('function') !== -1 ? 'exports.fn = ' : 'exports.val = ';
						ddoc.ddoc.views.lib[key] = {};
						ddoc.ddoc.views.lib[key] = prePend + global.Serialize(value); 
					});
				} else {
					if (!mapFunc) {
						throw new Error ('[ design.build ] missing-view - '+name);
					}
					ddoc.ddoc.views[name] = {};
					_.extend(ddoc.ddoc.views[name], {
						'map': libSrc + global.Serialize(mapFunc), 
						'reduce': (reduceFunc && global.Serialize(reduceFunc)) || '_count',
						'header':  header || { 'keys': [], 'columns': [] }
					});					
				}
			});

			// 'updates' methods
			_.each((this.maker())().updates, function (updates, name) { 
				ddoc.ddoc.updates[name] = {};
				ddoc.ddoc.updates[name] = global.Serialize(updates);
			});

			// add the 'types' structure, if it exists
			if ((this.maker()()).hasOwnProperty('types')) {
				this.ddoc.ddoc.types = (this.maker()()).types;
			}

			// finally update the design document content using .docinfo() method
			this.ddoc.docinfo(this.ddoc.ddoc);
			return this;
		}.call(that));

		// Purpose: Emulates CouchDB view/emit functions on the "client", to execute map functions
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
			, e = emitter((this.maker())().views[name]);
			emit = e.emit;
			return(e);
		};
		that.emulate = emulate;

		// this update takes advantage of CouchDB 'updates' handlers. The design document function 
		// specified in 'updateName' will execute on the server, saving the round-trip to the 
		// client a enforcing consistent attributing of the documents on the server for a corpus.

		var full = function (fc) {
			this.headers['X-Couch-Full-Commit'] = fc;
			return this;
		};
		that.full = full;

		var commit = function (targetId, updateName, newProperties, handler) {
			var properties = _.extend({}, { 'batch': 'ok' }, newProperties);
			this.ddoc.queryHTTP('update', _.extend(this.ddoc.docId(), {
				'update': updateName, 
				'target': targetId,
				'headers': this.headers }), properties, handler);
			return this;			
		};
		that.commit = commit;

		// Purpose: wrapper for evented .view function. 
		// Default behavior 'asynch: true'  to execute callback only on the first 
		// delivery of data from the server. 
		// 'asynch: false' (or undefined) executes the callback each time and the 
		// application has to manage the data

		var get = function (options, callback, callerDataCatcher) {
			var local = this 
			, triggered = false
			, system = this.system.post()
			// caller can provide an object to wrap the data as an argument to the callback;
			// _.item just returns the the item passed in
			, caller = (callerDataCatcher && _.isFunction(callerDataCatcher)) ? 
				callerDataCatcher : _.item
			, view = global.view(this, _.extend({'index': this.index, 'system': system }, options), 
																this.ddoc.docId().id, this.ddoc.views);
				/* this.emulate(options.nam.index || 'default') */
			view.on('error', function (err, code, param) {				
				throw new Error(err, code, param);
			});

			view.end('couch', function(res) {
				res.on('data', function (r) {
					// create a result object instrumented with row helpers and design document info
					var result = global.rows(r, local.ddoc.ddoc, local);					
					if (callback && _.isFunction(callback)) {
						if (system && system.asynch === false) {
							// just write wrapped data to the calling program. 
							//console.log('view got data!', r.code, 'calling', typeof callback);

							callback(caller(result));
						} else if ((system && system.asynch === true) && triggered === false) {
							// let the calling program continue, while we continue to write data
							callback(caller(result));
							triggered = true;								
						} else {
							// add data to Result object of the caller
							//console.log('getting more data', result.offset());
							caller(result);
						}
					}
				});			
			});
			return this;
		};
		that.get = get;

		var query = function(options) {
			return global.query(this, options);	
		};
		that.query = query;	
		return that;	
	};
	global.design = design;
	
}(boxspring));
