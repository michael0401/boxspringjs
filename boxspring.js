/* ===================================================
 * base-utils.js v0.01
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


(function(global) {
	"use strict";


	// From Eloquent Javascript
	// Returns an object using the supplied object as its prototype
	var duplicate = function(object) {
		function OneShotConstructor(){}
		OneShotConstructor.prototype = object;
		return new OneShotConstructor();
	};

	var forEachIn = function (object, action) {
		var property;

		for (property in object) {
			if (Object.prototype.hasOwnProperty.call(object, property)) {
				action(property, object[property]);
			}
		}
	};

	var Boxspring = function () {
		return this;
	};

	var boxspring = function () {
		return boxspring.db.apply(new Boxspring(), arguments);
	};
		
	// Current version.
	boxspring.VERSION = '0.0.1';
	
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = boxspring;
	    }
		exports.boxspring = boxspring;
	} else {
		global.boxspring = boxspring;
	}

}).call(this);

/*	
	// throw an error if someone else is defining Object.create
	if (typeof Object.prototype.create === 'undefined') {
		// Adapted From Eloquent Javascript 
		// Adds a 'create' method to all objects using the caller as the prototype.
		// create executes a 'construct' method of the prototype, if it exists	
		Object.prototype.create = function() {
			var object = duplicate(this);

			if (object.construct !== undefined) {
				object.construct.apply(object, arguments);
			}
			return object;
		};

		Object.prototype.extend = function(properties) {
			var result = duplicate(this);

			forEachIn(properties, function(name, value) {
				result[name] = value;
			});
			return result;
		};
	} else {
		throw 'Fatal - someone else is defining Object.create';
	}
*/
	
	/*
	var tmp = function(name, config) {
		// create the db
		var db = duplicate(boxspring.db)
			.create(_.extend({'name': (name || _.uniqueId('db-')) }, config));

		// What it does: Extends the db object with methods for bulk save/remove. 
		// Over-writes db save/remove methods;
		var bulk = function (docList) {
			return _.extend(duplicate(db), boxspring.bulk.create(docList || [], this));
		};
		db.bulk = bulk;

		var doc = function (id) {
			return _.extend(duplicate(db), boxspring.doc.create(id));
		};
		db.doc = doc;

		// What it does: Returns a design document for the named design; sets up linkages to the 
		// definitions for map/reduce, document access methods, and key/column definitions;
		var design = function(ddocId, maker, index) {	
			return _.extend(duplicate(db), boxspring.design.create({
				'doc': doc(ddocId || db.designName || '_design/default'),
				'maker': maker || this.maker,
				'index': index || this.index
			}));
		};
		db.design = design;
		return db;
	};
	*/
