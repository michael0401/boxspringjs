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
/*global _: true, bx: true */

(function(global) {
	"use strict";

	var doc = function(id) {
		var that = {
			'updated_docinfo': { '_id': id }
		};
		
		// inherit from the caller object, in this case a db object
		_.extend(that, this);
		
		// Purpose: internal function to keep docinfo up-to-date
		var sync = function (err, response) {
			
			// if a doc, then update all fields
			if (!err) {
				this.updated_docinfo = _.extend(this.updated_docinfo, response.data);
			}
			return(response);
		};
		that.sync = sync;

		// Purpose: helper function used by most methods
		var docId = function () {
			return({ 'id': this.updated_docinfo._id });
		};
		that.docId = docId;
		
		
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

		var docRev = function () {
			return(this.updated_docinfo._rev ? { 'rev': this.updated_docinfo._rev } : {});
		};
		that.docRev = docRev;

		var docHdr = function (name, value) {
			var hdr = {};
			return((name && value) ? { 'headers': hdr[name] = value } : {});
		};
		that.docHdr = docHdr;
		
		var exists = function () {
			return (_.has(this.updated_docinfo, '_rev'));
		};
		that.exists = exists;

		// Purpose: Method for saving to the database
		// Arguments: { docinfo: document object, oncompletion: string or function }
		var save = function (handler) {
			var local = this;
			this.queryHTTP('doc_save', _.extend(local.docId(), docHdr('X-Couch-Full-Commit', true), {
				'body': local.updated_docinfo }), {}, function (err, response) {
				handler(err, local.sync(err, response));
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
				handler(err, local.sync(err, response));
			});
			return this;
		};
		that.retrieve = retrieve;
		that.open = retrieve;

		var head = function (handler) {
			var local = this;

			this.queryHTTP('doc_head', 
				_.extend(this.docId(), docHdr('X-Couch-Full-Commit', true)), {}, 
				function (err, response) {
					//console.log('head:', responseOk(response), response.header);
					if (!err) {
						_.extend(local.updated_docinfo, { '_rev': local.getRev(response) });
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
			
			retrieve.call(this, function(err, response) {
				// when updating, we might get an error if the doc doesn't exist
				// otherwise just keep going
				if (!err || response.code === 404) {
					local.updated_docinfo = _.extend(local.updated_docinfo, data || {});
					return save.call(local, handler);	
				}
				handler(err, response);
			});
			return this;
		};
		that.update = update;

		var remove = function (handler) {
			var local = this;
			head.call(this, function (err) {
				if (err) {
					handler(err);
				}				
				local.queryHTTP('doc_remove', local.docId(), local.docRev(), 
				function (err, response) {
					handler(err, response);
				});				
			});
			return this;
		};
		that.remove = remove;
		that.delete = remove;

		var info = function (handler) {
			// set the 'revs_info' flag to true on retrieve;
			this.retrieve(handler, true);
			return this;
		};
		that.info = info;

		// Purpose: takes a document object as input, 
		// or returns an existing document object.
		var docinfo = function (docinfo) {
			if (docinfo) {
				_.extend(this.updated_docinfo, docinfo);
				return this;
			}
			return(this.updated_docinfo);
		};
		that.docinfo = docinfo;
		that.source = docinfo;
		return that;		
	};
	global.doc = doc;

}(boxspring));
