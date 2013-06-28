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
	
	var design = function (name, custom) {
		// extend this object with the db methods from the caller
		var ddoc = {}
		, maker
		, views 
		, that = _.extend({}, this.doc());
		
		if (name && _.isFunction(name)) {
			custom = name;
			name = this._design;
		} else if (!name) {
			name = this._design;
		} else {
			that._design = name;
		}

		// update the url for this design object
		if (name.split('/').length > 1) {
			that.url([ that.url(), name ].join('/'));
		} else {
			that.url([ that.url(), '_design', name ].join('/'));			
		}

		// update the document object with 
		that.headers.set( 'X-Couch-Full-Commit', false );

		// custom maker or configged maker, or defaultDesign; default headers
		that.maker = maker = (custom || this.maker || defaultDesign);
		that.views = views = that.maker().views;

		// What it does: provides the first map view as the default
		that.types = that.maker() && that.maker().types;
		that.formats = that.views && that.views.lib && that.views.lib.formats;

		// set the language
		ddoc.language = 'javascript';

		// add application views
		ddoc.views = {};	
		_.each(views, function (views, name) { 
			var mapFunc = views.map
				, reduceFunc = views && views.reduce
				, header = views && views.header;
				
			if (name !== 'lib') {
				if (!mapFunc) {
					throw new Error ('[ design.build ] missing-view - '+name);
				}
				ddoc.views[name] = {};
				ddoc.views[name]['map'] = _.Serialize(mapFunc);
				if (reduceFunc) {
					ddoc.views[name]['reduce'] = _.Serialize(reduceFunc);
				}
				ddoc.views[name]['header'] = header || { 'keys': [], 'columns': [] };					
			}
		});

		// 'updates', 'shows', 'lists' 
		['updates', 'shows', 'lists'].forEach(function(item) {
			ddoc[item] = {};
			_.each(maker()[item] || [], function (toString, name) { 
				ddoc[item][name] = {};
				ddoc[item][name] = _.Serialize(toString);
			});
		});

		// add the 'types' structure, if it exists
		if (maker().hasOwnProperty('types')) {
			ddoc.types = maker().types;
		}
		
		// add validate_doc_update, if it exists
		if (maker().hasOwnProperty('validate_doc_update')) {
			ddoc.validate_doc_update = _.Serialize(maker().validate_doc_update);
		}
		
		// finally update the design document content using method
		that.source(ddoc);

		// if there is no default _view for this design, then use the first view supplied
		if (!that['_view']) {
			that['_view'] = '_view/' + _.keys(that.views)[0];
		}
		
		var updateDoc = function (name) {
			var owner = this
			, doc = this.doc();
			
			if (!name) {
				name = owner._update;
			}

			// update the url for this update object
			if (name.split('/').length > 1) {
				doc.url([ owner.url(), name ].join('/'));
			} else {
				doc.url([ owner.url(), '_update', name ].join('/'));			
			}

			// this update takes advantage of CouchDB 'updates' handlers. 
			// The design document function specified in '_update' will execute on 
			// the server, saving the round-trip to the client a enforcing consistent
			// attributing of the documents on the server for a corpus.
			var commit = function (targetId, properties, handler) {
				// properties is 'optional'
				if (_.isFunction(properties)) {
					handler = properties;
					properties = {}
				}
				
				// install the new properites in the doc to be updated
				doc.options.update(properties);
				doc.url([ this.url(), targetId ].join('/'));
				console.log('commit', doc.url(), doc.post(), doc.options.post());
				doc.save(handler);
				return this;			
			};
			doc.update = commit;
			return doc;		
		};
		that.updateDoc = updateDoc;
		return that;	
	};
	global.design = design;
	
}(Boxspring));
