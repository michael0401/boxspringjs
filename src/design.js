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
/*global _: true, Boxspring: true, emit: true, sum: true */

(function(global) {
	"use strict";

	// What it does: Templated data structure for a CouchDB design document; 
	// map functions of defaultDesign are capable of also running in Nodejs.
	var defaultDesign = function () {
		// Note: CouchdDB defines toJSON globally to its environment, this won't be there on the server
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
		, designName = id || this.designName || _.uniqueId('_design/design-');
		
		// design documents are '_design/' + name. If '_design' is not provided with the id then prepend
		if (designName.indexOf('_design/') !== 0) {
			designName = '_design/'+designName.split('/')[0];
		}
				
		// update the object.designName
		that.designName = designName;
								
		// set the view index for this design
		that.index = arguments.length === 3 ? index : this.index; 
		// custom maker or configged maker, or defaultDesign; default headers
		that.maker = (custom || this.maker || defaultDesign);
		that.views = that.maker().views;
		
		/*jslint unparam: true */
		// create a document object
		that.ddoc = this.doc(designName);
		
		// update the document object with 
		that.ddoc.headers.set( 'X-Couch-Full-Commit', false );
		that.ddoc.set('ddoc', {
			'language': 'javascript',
			'updates': {},
			'types': {},
			'views': {},
			'shows': {},
			'lists': {}
		});

		// system parameters to control the query behavior
		that.system = this.UTIL.hash({
			'asynch': false,
			'cache-size': undefined, //10,
			'page-size': undefined, //100,
			'delay': 0.5
		});

		// What it does: provides the first map view as the default
		this['default-index'] = _.fetch(that.views, 'default-index');
		that.lib = _.fetch(that.views, 'lib');
		that.types = that.maker() && that.maker().types;
		that.formats = that.views && that.views.lib && that.views.lib.formats;

		(function (libs) {
			var ddoc = {}
			, views = this.views
			, libSrc = '\n';

			ddoc.ddoc = this.ddoc.get('ddoc')


			if (views && views.hasOwnProperty('lib')) {
				_.each(views.lib, function(lib, name) {
					if (libs && libs.hasOwnProperty(name)) {
						libSrc += global.libs[name] + '\n';						
					}
				});
			}

			// add application views and template views from default design object	
			_.each(this.views, function (views, name) { 
				var mapFunc = views.map
					, reduceFunc = views && views.reduce
					, header = views && views.header;

				if (name === 'lib') {
					ddoc.ddoc.views.lib = {};
					_.each(views, function (value, key) {
						var fn = _.Serialize(value)
							, prePend = '';
						ddoc.ddoc.views.lib[key] = {};
						ddoc.ddoc.views.lib[key] = prePend + _.Serialize(value); 
					});
				} else {
					if (!mapFunc) {
						throw new Error ('[ design.build ] missing-view - '+name);
					}
					ddoc.ddoc.views[name] = {};
					_.extend(ddoc.ddoc.views[name], {
						'map': libSrc + _.Serialize(mapFunc), 
						'reduce': (reduceFunc && _.Serialize(reduceFunc)) || '_count',
						'header':  header || { 'keys': [], 'columns': [] }
					});					
				}
			});

			// 'updates' methods
			_.each(this.maker().updates, function (updates, name) { 
				ddoc.ddoc.updates[name] = {};
				ddoc.ddoc.updates[name] = _.Serialize(updates);
			});

			// add the 'types' structure, if it exists
			if (this.maker().hasOwnProperty('types')) {
				this.ddoc.set('types', this.maker().types);
			}

			// finally update the design document content using .docinfo() method
			this.ddoc.source(ddoc.ddoc);
			
			return this;
		}.call(that));

		// this update takes advantage of CouchDB 'updates' handlers. 
		// The design document function specified in 'updateName' will execute on 
		// the server, saving the round-trip to the client a enforcing consistent
		// attributing of the documents on the server for a corpus.
		var commit = function (targetId, updateName, newProperties, handler) {
			var commitDoc = this.doc([ this.designName, '_update', updateName, targetId ].join('/'))
				.source(newProperties);
				
				
			commitDoc.options.set('batch', 'ok');
			commitDoc.save(handler);
			return this;			
		};
		that.commit = commit;

		// Purpose: wrapper for evented .view function. 
		// Default behavior 'asynch: true'  to execute callback only on the first 
		// delivery of data from the server. 
		// 'asynch: false' (or undefined) executes the callback each time and the 
		// application has to manage the data

		var fetch = function (options, callback, callerDataCatcher) {
			
			var local = this 
			, triggered = false
			, system = this.system.post()
			// caller can provide an object to wrap the data as an argument to the callback;
			// _.item just returns the the item passed in
			, caller = (callerDataCatcher && _.isFunction(callerDataCatcher)) ? 
				callerDataCatcher : _.item
			, view = this.view(_.extend({'index': this.index }, options), 
																this.designName, this.views);									

			view.on('error', function (err) {
				throw new Error(err || 'Invalid request.');
			});

			view.end('couch', function(res) {
				res.on('data', function (r) {
					// create a result object instrumented with row helpers 
					// and design document info
					var result = local.events(local.rows(r, local.maker(), local));	
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
		
		that.superiorQuery = that.query;
		var query = function(options) {
			return this.superiorQuery(options);	
		};
		that.query = query;	
		
		
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
	global.design = design;
	
}(Boxspring));
