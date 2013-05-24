/* ===================================================
 * bulk.js v0.01
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
	// Purpose: routines for bulk saving and removing
	var bulk = function (doclist) {
		var that
		, lastResponse = [];
		
		// extend the bulk object with the owner db object
		that = _.extend({}, this);
		that.docs = { 'docs': doclist || [] };
		that.Max = undefined;
		that.headers = { 'X-Couch-Full-Commit': false };
		that.options = { 'batch': 'ok' };

		// What it does: Returns and array to the caller with false at the index
		// of the doc if it succeeded, and the document information if it failed
		var status = function() {
			return _.map(lastResponse, function(doc) {
				return (doc && doc.error === 'conflict') ? doc : false;
			});
		};
		that.status = status;

		var exec = function (docsObj, callback) {

			this.queryHTTP('bulk', { 
				'body': docsObj,
				'headers': this.headers 
				}, this.options, function (err, response) {
					if (!err) {
						lastResponse = response && response.data;						
					}
					callback(err, response);
				});
		};
		that.exec = exec;

		var save = function (handler) {
			var local = this;
			// updates is the design document containing update methods		
			if (this.updates) {
				var funcs = this.updates().updates;
				// iterate the update functions to run before posting
				_.each(this.docs.docs, function (doc) { 
					_.each(funcs, function (update_method) {
						update_method(doc);
					});
				});				
			}

			// What this does: Sends the bulk data out in MAX slices;
			// does no checking for update conflicts. saving or removing docs without their _rev will fail
			(function (handler) {
				var doclist=_.clone(local.docs.docs)
					, Queue= boxspring.UTIL.queue();

				// Create a Queue to hold the slices of our list of docs
				var doclistSlice = function (data) {
					local.exec({ docs: data }, function (err, response) {
						handler(err, response);	
						Queue.finish();
					});						
				};
				// submit to the queue until there are no more
				if (local.Max && (doclist.length > local.Max)) {		
					while (doclist.length > local.Max) {
						Queue.submit(doclistSlice, doclist.slice(0,local.Max));
						doclist = doclist.slice(local.Max);
					}
				}

				// Submit a final job of remaining docs
				Queue.submit(doclistSlice, doclist);
				Queue.run();
			}(handler));
			return this;
		};
		that.save = save;

		var remove = function (handler) {
			var local = this
			, doclist={ docs: [] }
			, pathType = [ 'path', 'url', 'request']
			, buffer = []
			, eachDoc = function (headinfo) {
				if (headinfo.data !== 'error') {
					var path = _.fetch(headinfo, 'path', 'url', 'request');
					buffer = path.split('/');
					doclist.docs.push({ 
						'_id': buffer[buffer.length-1], 
						'_rev': local.getRev(headinfo) 
					});
					
					if (doclist.docs.length === local.docs.docs.length) {
						// do this when all the _revs have been found
						local.docs.docs = doclist.docs;
						local.docs.docs.forEach(function(nextDoc) {
							nextDoc._deleted = true;
						});
						local.exec(local.docs, function (err, response) {								
							handler(err, response);
						});								
					}							
				}
			};

			// use the HEAD method to quickly get the _revs for each document
			this.docs.docs.forEach(function(nextDoc) {
				local.doc(nextDoc._id).head(function(err, headinfo) {
					if (err) {
						return console.log(err);
					}
					eachDoc(headinfo);
				});
			});
		};
		that.remove = remove;

		var max =  function (max) {
			this.Max=_.toInt(max);
			return this;
		};
		that.max = max;

		var push = function (item, handler) {
			if (item) {
				this.docs.docs.push(item);
				if (handler && 
					_.isFunction(handler) && 
					this.docs.docs.length===this.Max) {
					this.save(handler);
					this.docs.docs = [];
				}
			}
			return this;
		};
		that.push = push;

		var getLength = function () {
			return this.docs.docs.length;
		};
		that.getLength = getLength;

		var fullCommit = function (fc) {
			this.headers = fc;
			this.options = {};
			return this;
		};
		that.fullCommit = fullCommit;
		return that;
	};
	global.bulk = bulk;
	
}(boxspring));
