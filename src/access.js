/* ===================================================
 * access.js v0.01
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
	var access;
	
	if (typeof exports !== 'undefined') {
		access = exports;
	} else {
		access = global.access = {};
	}
	
	// What this does: methods for accessing the properties of a document and mapping them to the
	// key/columns for a view
	access.construct = function (doc) {
		this.doc = bx.Lookup.Hash(doc);
	};

	// What it does: accesses the source document.
	// uses an Array or variable length list of properties and returns the first matching property
	var fetch = function (items) {
		var local = this
			, args = _.isArray(items) ? items : _.toArray(arguments)
			, results = [];

		args.forEach(function(item) {
			results.push(_.hfetch(local, item));					
		});
		return args.length > 0 && results[0];
	};
	access.fetch = fetch;
			
	// What it does: used by map functions to assert the validity of the input
	var assert = function (type) {
		return(this.doc.get('_id') && (this.dog.get('type')===type) && this);
	};
	access.assert = assert;
		
	var Id = function () {
		return this.doc.get('_id');
	};
	access.Id = Id;
	

}(this));