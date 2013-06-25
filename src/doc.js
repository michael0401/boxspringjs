/* ===================================================
 * doc.js v0.01
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
/*global _: true, Boxspring: true */

(function(global) {
	"use strict";
	
	var reserved = {
		'_attachment': true,	// creates a document with a special _attachment property
		'_bulk_docs': true, 	// body has no _id on save; 
		'_users': true,			// the special _users database; id is empty, body has no _id
		'_design': true,		// _design/name; _design/designName
		'_update': true,		// _design/name/_update/updateName; 
		'_view': true			// _design/name/_view/viewName
	};

	var doc = function(id) {
		// inherit from the caller object, always a db object
		var that = _.extend({}, this)

		// split off reserved document ids
		, idRoot = id && id.split('/')[0] || ''	

		// give this doc its own hash
		that = _.extend(that, this.UTIL.hash());
		
		// expose the default headers and options for this doc object
		that.headers = this.UTIL.hash({ 
			'X-Couch-Full-Commit': true, 
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Connection': 'keep-alive' 
		});
		that.options = this.UTIL.hash();
		
		// configure the url for this resource; if called without an id, then this is a database document
		that.set('url', ((this && this.url && this.url())) || 
			'/' + (typeof id !== 'undefined' ? (this.name + '/' + id) : this.name));

		var url = function () {
			return this.get('url');
		};
		that.url = url;
		
		var pathHelper = function (pathIn) {
			var newUrl
			, local = this;
			// append the pathIn argument to the existing url
			['_view', '_design', '_update'].forEach(function(tag) {
				if (pathIn.split('/')[0] === tag) {
					if (pathIn.split('/').length === 1) {
						// if the local[tag] does not have the _tag prepended, then fix it
						if (local[tag].charAt(0) !== '_') {
							local[tag] = [ tag, local[tag] ].join('/');
						}
						// append the default 
						newUrl = [ local.url(), local[tag] ].join('/');
					} else {
						// append the pathIn provided by the app
						newUrl = [ local.url(), pathIn ].join('/');
					}
				}				
			});
			return newUrl;
		};
		
		// check for reserved document id's
		if (id && id.charAt(0) === '_') {
			// extend the path for _view, _design, and _update
			if (pathHelper.call(this, id)) {
				that.set('url', pathHelper.call(this, id));
			} else {
				that.set('url', [ this.url(), id].join('/'));
			}
		} else if (id) {
			// set an _id attribute for all other doc types
			that.set('_id', id);
			that.set('url', [ this.url(), id ].join('/'));
		}

		// Purpose: takes an object and updates the state of the document hash
		var source = function (docinfo) {
			var local = this;
			if (docinfo) {
				_.each(docinfo, function(item, key) {
					local.set(key, item);
				});		
			}
			return this;
		};
		that.docinfo = source;
		that.source = source;
		
		// Purpose: internal function to keep document attributes up-to-date
		var sync = function (handler) {
			var local = this;
			
			return function(err, response) {
				// if a doc, then update all fields
				if (!err) {
					local.source(response.data);
				}
				return handler.call(local, err, response);
			};
		};

		// What it does: helper to convert a URL into a valid docId
		var url2Id = function (host, reverse) {

			if (reverse && typeof host === 'string') {
				return(host.replace(/-/g, '.'));
			}
			if (host.indexOf('http://') === -1) {				
				return(_.urlParse('http://' + host).host.replace(/\./g, '-'));
			}
			return(_.urlParse(host).host.replace(/\./g, '-'));
		};
		that.url2Id = url2Id;
		
		var exists = function () {
			return (this.contains('_rev'));
		};
		that.exists = exists;

		// Purpose: Method for saving to the database
		var save = function (handler) {
			this.queryHTTP({
					'url': this.url(),
					'method': (id === '_bulk_docs') ? 'POST' : 'PUT',
					'headers': this.headers.post(),
					'query': this.options.post(),
					'body': _.omit((id && this.post()) || {},'url') }, sync.call(this, handler));
			return this;
		};
		that.save = save;
		
		var all_docs = function (handler) {
			this.doc('_all_docs').read(handler);
			return this;
		};
		that.all_docs = all_docs;

		var db_info = function (handler) {
			this.doc().read(handler);
			return this;
		};
		that.db_info = db_info;

		var retrieve = function (handler) {		
			this.queryHTTP({
				'url': this.url(),
				'headers': this.headers.post(),
				'query': this.options.post() 
				}, sync.call(this, handler));
			return this;
		};
		that.retrieve = retrieve;
		that.read = retrieve;
		
		// Purpose: helper to get the 'rev' code from documents. used by doc and bulk requests
		var getRev = function (o) {				
			if (o && o.header && o.header.etag) {
				return o.header.etag.replace(/\"/g, '').replace(/\r/g,'');
			}
		};
		that.getRev = getRev;
		
		var head = function (handler) {
			var local = this;

			this.queryHTTP({
					'url': this.url(),
					'method': 'HEAD',
					'headers': this.headers.post()
				}, function (err, response) {
					if (err) {
						return handler(err, response);
					}
					local.set('_rev', local.getRev(response));
					if (handler && typeof handler === 'function') {
						handler.call(local, err, response);						
					}
				});
			return this;
		};
		that.head = head;

		// if data is provided, add it to the current document over-writing 
		// existing key-values; otherwise just save the current state of the doc in memory
		var update = function (handler, data) {
			var local = this;
			
			// cache the data since read will over-write with stale content from the server;
			if (!data) {
				data = _.clone(this.post());
			}
			
			this.read(function(err, response) {
				// when updating, we might get an error if the doc doesn't exist
				if (!err || response.code === 404) {
					// now add back data to update from above and save
					return local.source(data).save(handler);	
				}
				handler.call(local, err, response);
			});
			return this;
		};
		that.update = update;

		var remove = function (handler) {
			var local = this;
						
			// remove differs depending on whether its a 'db' or 'doc'
			if (!id) {
				// its a 'db'
				this.headers.set('content-type','application/x-www-form-urlencoded');
				this.queryHTTP({
						'url': this.url(),
						'method': 'DELETE', 
						'headers': this.headers.post() }, handler);
			} else {
				// its a 'doc'
				this.head(function(err, response) {
					if (!err) {
						return local.queryHTTP({
							'url': local.url(),
							'method': 'DELETE',
							'query': {'rev': local.get('_rev') }}, handler);		
					}
					handler.call(this, err, response);		
				});
			}
			return this;
		};
		that.remove = remove;
		that.delete = remove;
		
		/*
		if (attachment) {
			try {
				// _attachment is a special field in the document. Must be base 64 encoded.
				doc._attachments = {
					"html": {
						"content_type":"text\/plain",
						'data': _.encode(attachment.replace(/\n/g, '').replace(/\r/g, ''))					
					}
				}				
			} catch (e) {
				console.log('Base64 encoding error - ', e)
			}
		}
		*/
		var attachment = function(attach, handler) {
			this.doc(id + '/' + attach).read(handler);
			return this;			
		};
		that.attachment = attachment;
		
		var info = function (handler) {
			// set the 'revs_info' flag to true on retrieve;
			this.options.set('revs_info', true);
			this.read(handler);
			return this;
		};
		that.info = info;
		
		// drop-in replacement for Backbone.sync. Use this in Backbone models to delegate to Backbones
		// success and error handling for ajax.
		// To do: add in Backbone 'request' and 'sync' events.
		var backboneSync = function (method, model, options) {
			var doc = this.doc(model.get('_id')).source(model.attributes);
			
			doc[method](function(err, response) {
				if (err) {
					return options.error.call(model, model, response);
				}
				options.success.call(model, 
					response, response && response.status, response && response.xhr);				
			});
		};
		that.sync = backboneSync;
		
		// if idRoot is '_design', then add in the design() methods;
		if (idRoot === '_design') {
			return that.design();
		}
		
		// if idRoot is '_view', add the view() methods;
		if (idRoot === '_view') {
			// make sure a design document is at the base of this
			if (that.url().indexOf('_design') === -1) {
				that.set('url', '/' + that.url().split('/').slice(1,2).join('/'));
				return that.clone().doc('_design').doc(id).view();
			}
			return that.view();
		}
		
		// this update takes advantage of CouchDB 'updates' handlers. 
		// The design document function specified in '_update' will execute on 
		// the server, saving the round-trip to the client a enforcing consistent
		// attributing of the documents on the server for a corpus.
		var commit = function (targetId, handler) {
			this.set('url', [ this.url(), targetId ].join('/'));
			
			this.save(handler);
			return this;			
		};
		
		if (idRoot === '_update') {
			that.update = commit;
		}
		return that;		
	};
	global.doc = doc;

}(Boxspring));
