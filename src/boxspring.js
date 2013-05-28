/* ===================================================
 * boxspring.js v0.01
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
if (typeof boxspring === 'undefined') {
	boxspring = {};
}

if (typeof UTIL === 'undefined') {
	throw new Error('boxspring.js mut define a UTIL variable.');
}

// Inherit the UTIL objects 
boxspring.UTIL = UTIL;


(function(template) {
	"use strict";
		
	// add 'boxspring' to the template
	template.boxspring = template;
		
	var Boxspring = function () {
		return this;
	}
	
	Boxspring.prototype.extend = function () {	
		// db.apply returns a new database object with the supplied arguments
		return template.db.apply(template, arguments);
	};

	// Current version.
	Boxspring.prototype.VERSION = '0.0.1';
	
	
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = new Boxspring();
	} else {
		this.Boxspring = new Boxspring();
	}

}).call(this, boxspring);
