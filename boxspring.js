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
