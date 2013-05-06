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
	var dbUtils;
	
	if (typeof exports !== 'undefined') {
		dbUtils = exports;
	} else {
		dbUtils = global.dbUtils = {};
	}
	
	dbUtils.construct = function (name, config) {
		// create the database;
		_.extend(this, _.defaults(config || {}, {
			'name': name,
			'id': _.uniqueId('db-'),
			'designName': '_design/default',
			'maker': bx.defaultDesign,
			'index' : 'Index',
			'server': 'couch',
			'platform': 'couch',
			'vis': 'google'
		}));
		this.db = _.create(bx.db, name);
		
		// What it does: Extends the db object with methods for bulk save/remove. 
		// Over-writes db save/remove methods;
		var bulk = function (docList) {
			return this.db.extend(_.create(bx.bulk, docList || [], this));
		};
		this.bulk = bulk;

		var doc = function (id) {
			return this.db.extend(_.create(bx.doc, id));
		};
		this.doc = doc;

		// What it does: Returns a design document for the named design; sets up linkages to the 
		// definitions for map/reduce, document access methods, and key/column definitions;
		var design = function(ddocId, maker, index) {		
			return this.db.extend(_.create(bx.design, 
				this.doc(ddocId || this.designName || '_design/default'), 
				maker || this.maker,
				index || this.index));
		};
		this.design = design;
		this.hash = dbUtils.hash;
		this.hash.set(this.id, this);
		// all created db's use the same hash
		var Id = function (id) {
			return this.hash.get(id);
		};
		this.Id = Id;
	};
	// Provide for lookup by id;
	dbUtils.hash = bx.Lookup.Hash();	
}(this));	
