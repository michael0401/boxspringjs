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
	var bulk;
	
	if (typeof exports !== 'undefined') {
		bulk = exports;
	} else {
		bulk = global.bulk = {};
	}
	
	// Purpose: routines for bulk saving and removing
	bulk.construct = function (doclist, owner) {
		this.docs = { 'docs': doclist };
		this.Max = undefined;
		this.headers = { 'X-Couch-Full-Commit': false };
		this.options = { 'batch': 'ok' };
		this.db = owner;
	};
	
	var exec = function (docsObj, callback) {
		var conflicts = function (response) { // some posts may fail, captures Ok and NotOk posts
				response.conflicts = false;
				(response && response.data).forEach(function(doc) {
					if (doc.error === 'conflict') {
						response.conflicts = true;
					}
				});
			return(response);
		};
		this.query('bulk', { 
			'body': docsObj,
			'headers': this.headers }, this.options, function (response) {
			if (callback && typeof callback === 'function') { 
				if (response.ok()) {
					callback(conflicts(response));					
				} else {
					throw new Error('[ bulk exec ] failed - '+response.code+' '+ response.reason());
				}
			} 
		});			
	};
	bulk.exec = exec;
		
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
				, Queue= bx.Queue();

			// Create a Queue to hold the slices of our list of docs
			var doclistSlice = function (data) {
				local.exec({ docs: data }, function (response) {
					handler(response);							
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
	bulk.save = save;
	
	var remove = function (handler) {
		var local = this
		, doclist={ docs: [] }
		, pathType = [ 'path', 'url', 'request']
		, buffer = []
		, eachDoc = function (headinfo) {
			if (headinfo.data !== 'error') {
				var path = _.fetch(headinfo, 'path', 'url', 'request');
				buffer = path.split('/');
				doclist.docs.push({ _id: buffer[buffer.length-1], _rev: headinfo.rev });
				if (doclist.docs.length === local.docs.docs.length) {
					// do this when all the _revs have been found
					local.docs.docs = doclist.docs;
					local.docs.docs.forEach(function(nextDoc) {
						nextDoc._deleted = true;
					});
					local.exec(local.docs, function (response) {								
						handler(response);
					});								
				}							
			}
		};

		// use the HEAD method to quickly get the _revs for each document
		this.docs.docs.forEach(function(nextDoc) {
			local.db.doc(nextDoc._id).head(function(headinfo) {
				eachDoc(headinfo);
			});
		});
	};
	bulk.remove = remove;
	
	var max =  function (max) {
		this.Max=_.toInt(max);
		return this;
	};
	bulk.max = max;
	
	var push = function (item, handler) {
		if (item) {
			this.docs.docs.push(item);
			if (handler && _.isFunction(handler) && this.docs.docs.length===this.Max) {
				this.save(handler);
				this.docs.docs = [];
			}
		}
		return this;
	};
	bulk.push = push;
	
	var getLength = function () {
		return this.docs.docs.length;
	};
	bulk.getLength = getLength;
	
	var fullCommit = function (fc) {
		this.headers = fc;
		this.options = {};
		return this;
	};
	bulk.fullCommit = fullCommit;
	
}(this));
