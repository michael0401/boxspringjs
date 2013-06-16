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
		, headers = this.UTIL.hash();
		
		_.extend(that, this);
		that.set('_id', id);

		// Purpose: takes an object and updates the state of the document hash
		var docinfo = function (docinfo) {
			var local = this;
			if (docinfo) {
				_.each(docinfo, function(item, key) {
					local.set(key, item);
				});		
			}
			return this;
		};
		that.docinfo = docinfo;
		that.source = docinfo;
		
		// Purpose: internal function to keep docinfo up-to-date
		var sync = function (err, response) {
			
			// if a doc, then update all fields
			if (!err) {
				this.source(response.data);
			}
			return(response);
		};

		// Purpose: helper function used by most methods
		var docId = function () {
			return({ 'id': this.get('_id') });
		};
		that.docId = docId;
		
		var docRev = function () {
			return(this.get('_rev') ? { 'rev': this.get('_rev') } : {});
		};
		that.docRev = docRev;

		var docHdr = function (name, value) {
			if (typeof name === 'object') {
				headers = this.UTIL.hash(name);
			} else {
				headers.set(name, value);				
			}
			return ({'headers': headers.post() });
		};
		that.docHdr = docHdr;	
		
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
			return (_.has(this.updated_docinfo, '_rev'));
		};
		that.exists = exists;

		// Purpose: Method for saving to the database
		// Arguments: { docinfo: document object, oncompletion: string or function }
		var save = function (handler) {
			var local = this;
			this.queryHTTP('doc_save', _.extend(local.docId(), docHdr('X-Couch-Full-Commit', true), {
				'body': local.post() }), {}, function (err, response) {
				handler(err, sync.call(local, err, response));
			});
			return this;
		};
		that.save = save;
		that.create = save;

		var retrieve = function (handler, revs_info) {
			var local = this
			, options = revs_info ? { 'revs_info': true } : {};
			
			this.queryHTTP('doc_retrieve', this.docId(), options, 
			function (err, response) {
				handler(err, sync.call(local, err, response));
			});
			return this;
		};
		that.retrieve = retrieve;
		that.read = retrieve;
		
		var info = function (handler) {
			// set the 'revs_info' flag to true on retrieve;
			this.retrieve(handler, true);
			return this;
		};
		that.info = info;

		var attachment = function(name, handler) {
			var local = this;
		
			this.queryHTTP('doc_attachment', { 'id': this.docId().id, 'attachment': name }, {}, 
			function (err, response) {
				handler(err, sync.call(local, err, response));
			});
			return this;			
		};
		that.attachment = attachment;
		
		var head = function (handler) {
			var local = this;

			this.queryHTTP('doc_head', 
				_.extend(this.docId(), docHdr('X-Couch-Full-Commit', true)), {}, 
				function (err, response) {
					if (!err) {
						local.source(response.data);
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
			
			// retrieve will over-write our in memory updates with the content from the server;
			if (data && _.isObject(data)) {
				data = this.source(data).post();
			}
			
			retrieve.call(this, function(err, response) {
				// when updating, we might get an error if the doc doesn't exist
				// otherwise just keep going
				if (!err || response.code === 404) {
					// now add back data to update from above and save
					return local.source(data).save.call(local, handler);	
				}
				handler(err, response);
			});
			return this;
		};
		that.update = update;

		var remove = function (handler) {
			var local = this;
			//retrieve.call(this, function(err, response) {
			head.call(this, function (err, response) {
				if (err) {
					handler(err, response);
				} else {
					local.queryHTTP('doc_remove', local.docId(), local.docRev(), handler);								
				}				
			});
			return this;
		};
		that.remove = remove;
		that.delete = remove;
		return that;		
	};
	global.doc = doc;

}(Boxspring));
