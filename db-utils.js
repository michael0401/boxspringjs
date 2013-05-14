/* ===================================================
 * db-utils.js v0.01
 * https://github.com/rranauro/base-utilsjs
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
	var dbWrapper = global.dbWrapper = {};
	
	// What it does: Extends the db object with methods for bulk save/remove. 
	// Over-writes db save/remove methods;
	var bulk = function (docList) {
		return _.extend(this, global.bulk.create(docList || [], this));
	};
	dbWrapper.bulk = bulk;

	var doc = function (id) {
		return _.extend(this, global.doc.create(id));
	};
	dbWrapper.doc = doc;

	// What it does: Returns a design document for the named design; sets up linkages to the 
	// definitions for map/reduce, document access methods, and key/column definitions;
	var design = function(ddocId, maker, index) {		
		return _.extend(dbWrapper.db, global.design.create( 
			this.doc(ddocId || this.designName || '_design/default'), 
			maker || this.maker,
			index || this.index));
	};
	dbWrapper.design = design;
	global.dbWrapper = dbWrapper;

}(boxspring));
