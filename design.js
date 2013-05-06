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
/*global _: true, bx: true */

(function(global) {
	"use strict";
	var design;
	
	if (typeof exports !== 'undefined') {
		design = exports;
	} else {
		design = global.design = {};
	}
		
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
					'reduce': function() {
						'_count';
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


	// What this does: Serializes its map/reduce functions; extends the _design/ document 
	// A VIEW is a property of a DESIGN document.
	// addView method extends the 'views' object with the supplied map/reduce functions;
	/*jslint unparam: true */	
	design.construct = function (doc, custom, index) {
		var emit
		, libSrc = ''
		, views;
		
		this.ddoc = _.extend({}, doc, {
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
		
		this.defaultDesign = defaultDesign;
		this.custom = custom;
		this.index = index || 'Index';
		this.headers = { 'X-Couch-Full-Commit': false }
		
		// What it does: returns the maker function for this design, either provided by the 
		// application or defaulted from bx.
		var maker = function () {
			return((this && this.custom) || defaultDesign);
		};
		this.maker = maker;
		this.views = design.maker()().views;
		
		// What it does: provides the first map view as the default
		this['default-index'] = _.fetch(views, 'default-index');
		this.dateFilter = _.fetch(views, 'dateFilter');
		this.lib = _.fetch(views, 'lib');
		this.doc = _.fetch(views, 'doc');
		this.types = this.maker()() && this.maker()().types;
		this.formats = this.views && this.views.lib && this.views.lib.formats;
	};
	
	// Purpose: Emulates CouchDB view/emit functions on the "client", to execute map functions
	var emulate = function (name) {
		// When running in node.js, calling functions need to find 'emit' in its scope 
		// On server side, will use couchdb's built-in emit()
		var emitter = function(viewfunc) {
			var tree = bx.Btree()
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
		, e = emitter((this.maker())().views[name])
		emit = e.emit;
		return(e);
	};
	design.emulate = emulate;
	
	
	// Purpose: wrapper for evented .view function. 
	// Default behavior 'asynch: true'  to execute callback only on the first 
	// delivery of data from the server. 
	// 'asynch: false' (or undefined) executes the callback each time and the 
	// application has to manage the data
	var get = function (options, callback, callerDataCatcher) {
		var local = this 
		, triggered = false
		// caller can provide an object to wrap the data as an argument to the callback;
		// _.item just returns the the item passed in
		, caller = (callerDataCatcher && _.isFunction(callerDataCatcher)) || callback
		, view = _.create(bx.view, this, 
						_.extend({'index': this.index }, options), this.ddoc.docId().id, this.ddoc.views)
			/* this.emulate(options.nam.index || 'default') */
		view.on('error', function (err, code, param) {				
			throw new Error(err, code, param);
		});

		view.end('couch', function(res) {
			res.on('data', function (r) {
				// create a result object instrumented with row helpers and design document info
				var result = _.create(bx.rows, r, local.ddoc.ddoc, local);
				result.events = res;
				if (callback && _.isFunction(callback)) {
					if (options && options.asynch === false) {
						// just write data to the calling program. 
						// asynch===false should not allow limit= requests.
						callback(caller(result));
					} else if ((options && options.asynch === true) && triggered === false) {
						// let the calling program continue, while we continue to write data
						callback(caller(result));
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
	design.get = get;
	
	// this update takes advantage of CouchDB 'updates' handlers. The design document function 
	// specified in 'updateName' will execute on the server, saving the round-trip to the 
	// client a enforcing consistent attributing of the documents on the server for a corpus.
	
	design.full = function (fc) {
		this.headers['X-Couch-Full-Commit'] = fc;
		return this;
	};
	
	design.commit = function (targetId, updateName, newProperties, handler) {
		var properties = _.extend({}, { 'batch': 'ok' }, newProperties);
		this.ddoc.query('update', _.extend(this.ddoc.docId(), {
			'update': updateName, 
			'target': targetId,
			'headers': this.headers }), properties, handler);
		return this;			
	};
	
	design.build = function (libs) {
		var ddoc = this.ddoc
		, views = this.views
		, libSrc = 'var bx = { "COUCH": true };\n';
		
		if (views && views.hasOwnProperty('lib')) {
			_.each(views.lib, function(lib, name) {
				if (libs && libs.hasOwnProperty(name)) {
					libSrc += bx.libs[name] + '\n';						
				}
			});
		}

		// add the application views and the template views from the default design template object	
		_.each((this.maker())().views, function (views, name) { 
			var mapFunc = views.map
				, reduceFunc = views && views.reduce
				, header = views && views.header;
					
			if (name === 'lib') {
				ddoc.ddoc.views.lib = {};
				_.each(views, function (value, key) {
					var fn = bx.Serialize(value)
						, prePend = fn.indexOf('function') !== -1 ? 'exports.fn = ' : 'exports.val = ';
					ddoc.ddoc.views.lib[key] = {};
					ddoc.ddoc.views.lib[key] = prePend + bx.Serialize(value); 
				});
			} else {
				if (!mapFunc) {
					throw new Error ('[ design.build ] missing-view - '+name);
				}
				ddoc.ddoc.views[name] = {};
				_.extend(ddoc.ddoc.views[name], {
					'map': libSrc + bx.Serialize(mapFunc), 
					'reduce': (reduceFunc && bx.Serialize(reduceFunc)) || '_count',
					'header':  header || { 'keys': [], 'columns': [] }
				});					
			}
		});
		
		// 'updates' methods
		_.each((this.maker())().updates, function (updates, name) { 
			ddoc.ddoc.updates[name] = {};
			ddoc.ddoc.updates[name] = bx.Serialize(updates);
		});
		
		// add the 'types' structure, if it exists
		if ((this.maker()()).hasOwnProperty('types')) {
			this.ddoc.ddoc.types = (this.maker()()).types;
		}
		
		// finally update the design document content using .docinfo() method
		this.ddoc.docinfo(this.ddoc.ddoc);
		return this;
	};

}(this));
