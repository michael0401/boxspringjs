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
	

	var doc = function(id) {
		// inherit from the caller object, in this case a db object
		var that = this.UTIL.hash()
		// configure the url for this resource; if called without an id, then this is a database document
		, url = '/' + (typeof id !== 'undefined' ? (this.name + '/' + id) : this.name);		

		// expose the headers and options for this doc object
		that.headers = this.UTIL.hash({ 'X-Couch-Full-Commit': true });
		that.options = this.UTIL.hash();

		_.extend(that, this);
		
		// if the document is not a reserved id, then create an _id attribute
		if (id && id.charAt(0) !== '_') {
			that.set('_id', id);
		}
		that.set('id', id);

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
				return handler(err, response);
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
					'url': url,
					'method': 'PUT',
					'headers': this.headers.post(),
					'query': this.options.post(),
					'body': id && this.post() }, sync.call(this, handler));
			return this;
		};
		
		// Bulk document save
		var bulkSave = function (handler) {
			// set headers and options
			this.headers.set('X-Couch-Full-Commit', false);
			this.options.set('batch', 'ok');
			this.queryHTTP({
				'url': url,
				'method': 'POST',
				'body': this.post(),
				'headers': this.headers.post(),
				'query': this.options.post()
			}, handler);
			return this;
		};
		
		if (id === '_bulk_docs') {
			that.save = bulkSave;
		} else {
			that.save = save;
			that.create = save;
		}

		var retrieve = function (handler) {		
			this.queryHTTP({
				'url': url,
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
					'url': url,
					'method': 'HEAD',
					'headers': this.headers.post()
				}, function (err, response) {
					if (!err) {
						local.set('_rev', local.getRev(response));
					} 
					if (handler && typeof handler === 'function') {
						handler(err, response);						
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
			if (data && _.isObject(data)) {
				data = this.source(data).post();
			}
			
			this.read(function(err, response) {
				// when updating, we might get an error if the doc doesn't exist
				if (!err || response.code === 404) {
					// now add back data to update from above and save
					return local.source(data).save(handler);	
				}
				handler(err, response);
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
						'url': url,
						'method': 'DELETE', 
						'headers': this.headers.post() }, handler);
			} else {
				// its a 'doc'
				this.head(function(err) {
					local.queryHTTP({
						'url': url,
						'method': 'DELETE',
						'query': {'rev': local.get('_rev') }}, handler);					
				});
			}
			return this;
		};
		that.remove = remove;
		that.delete = remove;
		
		var attachment = function(attach, handler) {
			this.doc(id + '/' + attach).read(handler);			
		};
		that.attachment = attachment;
		
		var info = function (handler) {
			// set the 'revs_info' flag to true on retrieve;
			this.options.set('revs_info', true);
			this.read(handler);
			return this;
		};
		that.info = info;
		return that;		
	};
	global.doc = doc;

}(Boxspring));
