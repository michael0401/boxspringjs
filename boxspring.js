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
/*global _: true */


if (typeof _ === 'undefined') {
	if (typeof exports !== 'undefined') {
		var _ = require('underscore');
	} else {
		throw new Error('base-utils depends on Underscore.js');
	}
}

(function() {
	"use strict";
	var baseUtils = {};

	// test for existence of browser
	var browser = function () {
		return (typeof exports === 'undefined' || typeof window !== 'undefined');
	};
	baseUtils.browser = browser;
	
	// converts a string to a decimal integer
	var toInt = function(s) {
		return _.isString(s) ? parseInt(s, 10) : s;
	};
	baseUtils.toInt = toInt;

	// remove multiple, leading or trailing spaces
	var trim = function (s) {
		if (s) {
			s = s.replace(/(^\s*)|(\s*$)/gi,"");
			s = s.replace(/[ ]{2,}/gi," ");
			s = s.replace(/\n /,"\n");
			return s;				
		}
	};
	baseUtils.trim = trim;
	
	// What it does: takes a string and returns the first character initialized
	var initialCaps = function (str) {
		return _.map(str.split(/_/g), function(s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
		}).join(' ');
	};
	baseUtils.initialCaps = initialCaps;

	// What it does: wraps a function in a closure and returns it so the returned function
	// has access to the arguments of the original function. Useful when firing 'click' events
	var enclose = function(func) {
		var args = _.toArray(arguments).slice(1);
		return function (context) {
			return func.apply(context || null, args);
		};
	};
	baseUtils.enclose = enclose;

	// What it does: Handy utility for handling arguments from function.apply calls when the argument
	// can be a true array or array-like; And, what you want is Array
	var args = function (a) {
		return (_.isArray(a) ? a : _.toArray(arguments));
	};
	baseUtils.args = args;

	// Purpose: finds the index of a value in an Array
	var find = function (items, key) {
		var index;

		if ((_.isString(key) || _.isNumber(key)) && items.length > 0) {
			for (index=0;index<items.length;index+=1) {
				if (items[index] === key) {
					return index;
				}			
			}				
		}
		return(-1);
	};
	
	// What it does: return true if the item k is found in array a
	var found = function() {
		return (find.apply(null, arguments) !== -1);
	};
	baseUtils.found = found;

	// What it does: returns true if all the members of k1 are present in k2
	var compare = function (k1, k2) {
		return _.all(k1, function(v){
		    return _.contains(k2, v);
		});					
	};
	baseUtils.compare = compare;

	// What it does: returns true k1 and k2 have the same members in same order
	var identical = function (k1, k2) {
		var i;

		if (k1.length === k2.length) {
			for (i = 0; i < k1.length; i += 1) { 
				if (k1[i] !== k2[i]) {
					return false;
				} 
			}					
		} else {
			return false;
		}
		return true;
	};
	baseUtils.identical = identical;

	// What it does: recursive find function requires a sorted list
	// Specifying 'it' function allows access to array of object properties for 
	// comparison to 'k'
	var bfind = function (a, k, it) {
		var start = 0
			, end = 0
			, iterator = (_.isFunction(it)) ? it : function (i) { return i; };			

		if (k && a) {
			if (a.length-1 === 0) {
				return(a[a.length-1] === k ? a.slice(0,1) : null);
			} 
			end = Math.floor((a.length) / 2);
			if (k === iterator(a[end])) {
				return(a.slice(end,end+1));
			}				
			if (k < iterator(a[end])) {
				return(bfind(a.slice(0, end), a));
			} 
			start = Math.ceil(a.length / 2);
			return(bfind(a.slice(start, a.length), k));				
		}
	};
	baseUtils.bfind = bfind;

	// What it does: coerces the argument into an array, or just returns the suppied array
	var forceToArray = function (l) {
		if (typeof l === 'string' || typeof l === 'number') {
			return [ l ];
		}
		if (_.isArray(l)) {
			return l;
		} 
		return _.toArray(l);
	};
	baseUtils.forceToArray = forceToArray;
	
	// What it does: reverses the order of items in an array
	var reverse = function (a) {
		return _.reduce(a, function(x, y) { x.unshift(y); return x; }, []);
	};
	baseUtils.reverse = reverse;

	var coerce = function(expectedType, value) {
		var types = {
			'string': '',
			'number': 0,
			'array': [],
			'boolean': false
		};
		if (_.isDate(value)) {
			return value;
		}
		if (expectedType === 'date' && !_.isDate(value)) {
			return (value && new Date(value)) || new Date(1900,1,1);
		}
		if (expectedType && typeof value === 'undefined') {
			return types[expectedType];
		}
		if (expectedType && typeof value !== 'undefined') {
			if (expectedType === 'string') {
				return (value && value.toString()) || '';						
			}
			if (expectedType === 'number') {
				return _.isNumber(toInt(value)) ? toInt(value) : types.number;
			}
			if (expectedType === 'array') {
				return _.isArray(value) ? value : [ value || '' ];
			}
			if (expectedType === 'boolean') {
				if (value === 'true') {
					return true;
				}
				if (value === 'false') {
					return false;
				}
				return _.isBoolean(value) ? value : types.boolean;
			}
		}
		return value || '';
	};
	baseUtils.coerce = coerce;

	// What it does: argument to map function to return the next item to map
	var item = function(x) {
		return x;
	};
	baseUtils.item = item;

	// What it does: Filter out characters that resolve to 0;
	var filterNonAscii = function (s) {
		return _.reduce(s, function(str, c, i) {
			if (s.charCodeAt(i) !== 0) {
				str += c;
			}
			return str;
		},'');
	};
	baseUtils.filterNonAscii = filterNonAscii;
	
	var filterNonAlphaNumeric = function (s) {
		return _.trim(s.replace(/[^a-z0-9]/gi,'-'));
	};
	baseUtils.filterNonAlphaNumeric = filterNonAlphaNumeric;
	
	// What it does: extracts the properties from the first object based on the 
	// properties in the from array or list of argument strings.
	var select = function(source, from) {
		var target = {}
			, src = source || {}
			, items = []
			, i;

		if (_.isArray(from)) {
			items = from;
		} else {
			for (i=1;i<arguments.length;i+=1) { items.push(arguments[i]);}
		}	

		_.each(items, function(item) {
			if (src.hasOwnProperty(item) && typeof src[item] !== 'undefined') {
				target[item] = src[item];
			} 
		});
		return target;
	};
	baseUtils.select = select;
	
	// What it does: removes key/values from items whose value === 'value'. 
	// Note: undefined is default
	var clean = function(items, value) {
		return (items && _.reduce(_.map(_.keys(items), function(k) { if (items[k] !== value) { 
					return ([k, items[k]]); }
				}), function(target, y) { if (y) { target[y[0]] = y[1]; } return target; }, {}));
	};
	baseUtils.clean = clean;

	// What it does: follows an object until it finds a matching property tag, 
	// then returns the value of it
	var pfetch = function (o, p) {
		var found
			, k;

		if (typeof o==='object' && o[p]) {
			return o[p];
		} 
		for (k in o) {
			if (o.hasOwnProperty(k)) {
				if (typeof o[k]==='object') {
					if (typeof found ==='undefined') {
						found = pfetch.call(this, o[k], p);						
					}
				}				
			}
		}			
		return found;
	};
	baseUtils.pfetch = pfetch;

	// What it does: given a property, or list of propertis, return the value of the first hit
	// note 1: if o is an Array, delegate to 'find' which operates on Arrays
	// note: owner flag suppresses return of #text value; give the owning object to caller
	var fetch = function (o, p, owner) {
		var i
			, keys = []
			, value;

		// convert p or list of p to Array for iteration
		if (_.isArray(p)) {
			keys = p;
		} else {
			for (i=1; i<arguments.length;i+=1) { keys.push(arguments[i]); }
		}
		
		if (o) {
			if (_.isArray(o)) {
				return find(o, p);
			}
			for (i=0; i<keys.length; i += 1) {
				value = pfetch(o, keys[i]);
				if (typeof value !== 'undefined' && owner === true) {
					return value;
				} 
				if (typeof value !== 'undefined') {
					return ((value && _.isObject(value) && value['#text']) || value) ;
				}
			}
		}
	};
	baseUtils.fetch = fetch;

	// What it does: takes item 'p1/p2/../pN' and searches for occurence of pN in pN-1
	var hfetch = function (o, item) {
		var items = _.compact(item.split('/'))
			, found = o;
		if (items.length > 1) {
			items.forEach(function(tag) {
				found = fetch(found, tag);
			});
			return found;					
		}
		return fetch(o, item);
	};
	baseUtils.hfetch = hfetch;


	
	// Purpose: Iterator for traversing abstract JSON objects; calls the supplied 'action' function
	var walk = function(obj, action, d) {
		var name
			, meta = _.clone(d) || { 'path': '', 'depth': 0}
			, path = meta.path;

		// terminates when called with a terminal element
		if (typeof obj === 'object') {
			for (name in obj) {
				// visit this object
				if (obj.hasOwnProperty(name)) {
					meta.path = path + name;
					action(obj, name, meta.path);

					if (typeof obj[name] === 'object' && meta.depth < 1000) {
						meta.depth += 1;
						meta.path += '/';
						this.walk(obj[name], action, meta);
					} else if (meta.depth === 1000) {
						throw '[ base-utils: walk() ] - nested object depth 1000 exceeded';
					}
				}
			}
		}
	};
	baseUtils.walk = walk;

	// Purpose: html string builder
	var buildHTML = function(tag, html, attrs) {
		var attr;
		// you can skip html param
		if (typeof(html) !== 'string') {
			attrs = html;
			html = null;
		}

		var h = '<' + tag;
		for (attr in attrs) {
			if (attrs.hasOwnProperty(attr) && attrs[attr] !== false && attrs[attr] !== undefined) { 
					h += ' ' + attr + '="' + attrs[attr] + '"';
			}
		}
		h += html ? ">" + html + "</" + tag + ">": "/>";
		//	console.log('buildHTML:', h);
		return h;
	};
	baseUtils.buildHTML = buildHTML;

	// Purpose: execute a function afer a set time in seconds.
	var wait = function (seconds, func) {
		var ms = seconds * 1000;	// converting to milli seconds
		setTimeout(function() {
			if (func && typeof func === 'function') {
				func();
			}
		}, ms);
	};
	baseUtils.wait = wait;
	
	// make these utilities available from Underscore.js
	_.mixin(baseUtils);
	
}());
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
/*global _: true */


if (typeof _ === 'undefined') {
	if (typeof exports !== 'undefined') {
		var _ = require('underscore');
	} else {
		throw new Error('base-utils depends on Underscore.js');
	}
}

(function() {
	"use strict";
	var baseUtils = {};

	// test for existence of browser
	var browser = function () {
		return (typeof exports === 'undefined' || typeof window !== 'undefined');
	};
	baseUtils.browser = browser;
	
	// converts a string to a decimal integer
	var toInt = function(s) {
		return _.isString(s) ? parseInt(s, 10) : s;
	};
	baseUtils.toInt = toInt;

	// remove multiple, leading or trailing spaces
	var trim = function (s) {
		if (s) {
			s = s.replace(/(^\s*)|(\s*$)/gi,"");
			s = s.replace(/[ ]{2,}/gi," ");
			s = s.replace(/\n /,"\n");
			return s;				
		}
	};
	baseUtils.trim = trim;
	
	// What it does: takes a string and returns the first character initialized
	var initialCaps = function (str) {
		return _.map(str.split(/_/g), function(s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
		}).join(' ');
	};
	baseUtils.initialCaps = initialCaps;

	// What it does: wraps a function in a closure and returns it so the returned function
	// has access to the arguments of the original function. Useful when firing 'click' events
	var enclose = function(func) {
		var args = _.toArray(arguments).slice(1);
		return function (context) {
			return func.apply(context || null, args);
		};
	};
	baseUtils.enclose = enclose;

	// What it does: Handy utility for handling arguments from function.apply calls when the argument
	// can be a true array or array-like; And, what you want is Array
	var args = function (a) {
		return (_.isArray(a) ? a : _.toArray(arguments));
	};
	baseUtils.args = args;

	// Purpose: finds the index of a value in an Array
	var find = function (items, key) {
		var index;

		if ((_.isString(key) || _.isNumber(key)) && items.length > 0) {
			for (index=0;index<items.length;index+=1) {
				if (items[index] === key) {
					return index;
				}			
			}				
		}
		return(-1);
	};
	
	// What it does: return true if the item k is found in array a
	var found = function() {
		return (find.apply(null, arguments) !== -1);
	};
	baseUtils.found = found;

	// What it does: returns true if all the members of k1 are present in k2
	var compare = function (k1, k2) {
		return _.all(k1, function(v){
		    return _.contains(k2, v);
		});					
	};
	baseUtils.compare = compare;

	// What it does: returns true k1 and k2 have the same members in same order
	var identical = function (k1, k2) {
		var i;

		if (k1.length === k2.length) {
			for (i = 0; i < k1.length; i += 1) { 
				if (k1[i] !== k2[i]) {
					return false;
				} 
			}					
		} else {
			return false;
		}
		return true;
	};
	baseUtils.identical = identical;

	// What it does: recursive find function requires a sorted list
	// Specifying 'it' function allows access to array of object properties for 
	// comparison to 'k'
	var bfind = function (a, k, it) {
		var start = 0
			, end = 0
			, iterator = (_.isFunction(it)) ? it : function (i) { return i; };			

		if (k && a) {
			if (a.length-1 === 0) {
				return(a[a.length-1] === k ? a.slice(0,1) : null);
			} 
			end = Math.floor((a.length) / 2);
			if (k === iterator(a[end])) {
				return(a.slice(end,end+1));
			}				
			if (k < iterator(a[end])) {
				return(bfind(a.slice(0, end), a));
			} 
			start = Math.ceil(a.length / 2);
			return(bfind(a.slice(start, a.length), k));				
		}
	};
	baseUtils.bfind = bfind;

	// What it does: coerces the argument into an array, or just returns the suppied array
	var forceToArray = function (l) {
		if (typeof l === 'string' || typeof l === 'number') {
			return [ l ];
		}
		if (_.isArray(l)) {
			return l;
		} 
		return _.toArray(l);
	};
	baseUtils.forceToArray = forceToArray;
	
	// What it does: reverses the order of items in an array
	var reverse = function (a) {
		return _.reduce(a, function(x, y) { x.unshift(y); return x; }, []);
	};
	baseUtils.reverse = reverse;

	var coerce = function(expectedType, value) {
		var types = {
			'string': '',
			'number': 0,
			'array': [],
			'boolean': false
		};
		if (_.isDate(value)) {
			return value;
		}
		if (expectedType === 'date' && !_.isDate(value)) {
			return (value && new Date(value)) || new Date(1900,1,1);
		}
		if (expectedType && typeof value === 'undefined') {
			return types[expectedType];
		}
		if (expectedType && typeof value !== 'undefined') {
			if (expectedType === 'string') {
				return (value && value.toString()) || '';						
			}
			if (expectedType === 'number') {
				return _.isNumber(toInt(value)) ? toInt(value) : types.number;
			}
			if (expectedType === 'array') {
				return _.isArray(value) ? value : [ value || '' ];
			}
			if (expectedType === 'boolean') {
				if (value === 'true') {
					return true;
				}
				if (value === 'false') {
					return false;
				}
				return _.isBoolean(value) ? value : types.boolean;
			}
		}
		return value || '';
	};
	baseUtils.coerce = coerce;

	// What it does: argument to map function to return the next item to map
	var item = function(x) {
		return x;
	};
	baseUtils.item = item;

	// What it does: Filter out characters that resolve to 0;
	var filterNonAscii = function (s) {
		return _.reduce(s, function(str, c, i) {
			if (s.charCodeAt(i) !== 0) {
				str += c;
			}
			return str;
		},'');
	};
	baseUtils.filterNonAscii = filterNonAscii;
	
	var filterNonAlphaNumeric = function (s) {
		return _.trim(s.replace(/[^a-z0-9]/gi,'-'));
	};
	baseUtils.filterNonAlphaNumeric = filterNonAlphaNumeric;
	
	// What it does: extracts the properties from the first object based on the 
	// properties in the from array or list of argument strings.
	var select = function(source, from) {
		var target = {}
			, src = source || {}
			, items = []
			, i;

		if (_.isArray(from)) {
			items = from;
		} else {
			for (i=1;i<arguments.length;i+=1) { items.push(arguments[i]);}
		}	

		_.each(items, function(item) {
			if (src.hasOwnProperty(item) && typeof src[item] !== 'undefined') {
				target[item] = src[item];
			} 
		});
		return target;
	};
	baseUtils.select = select;
	
	// What it does: removes key/values from items whose value === 'value'. 
	// Note: undefined is default
	var clean = function(items, value) {
		return (items && _.reduce(_.map(_.keys(items), function(k) { if (items[k] !== value) { 
					return ([k, items[k]]); }
				}), function(target, y) { if (y) { target[y[0]] = y[1]; } return target; }, {}));
	};
	baseUtils.clean = clean;

	// What it does: follows an object until it finds a matching property tag, 
	// then returns the value of it
	var pfetch = function (o, p) {
		var found
			, k;

		if (typeof o==='object' && o[p]) {
			return o[p];
		} 
		for (k in o) {
			if (o.hasOwnProperty(k)) {
				if (typeof o[k]==='object') {
					if (typeof found ==='undefined') {
						found = pfetch.call(this, o[k], p);						
					}
				}				
			}
		}			
		return found;
	};
	baseUtils.pfetch = pfetch;

	// What it does: given a property, or list of propertis, return the value of the first hit
	// note 1: if o is an Array, delegate to 'find' which operates on Arrays
	// note: owner flag suppresses return of #text value; give the owning object to caller
	var fetch = function (o, p, owner) {
		var i
			, keys = []
			, value;

		// convert p or list of p to Array for iteration
		if (_.isArray(p)) {
			keys = p;
		} else {
			for (i=1; i<arguments.length;i+=1) { keys.push(arguments[i]); }
		}
		
		if (o) {
			if (_.isArray(o)) {
				return find(o, p);
			}
			for (i=0; i<keys.length; i += 1) {
				value = pfetch(o, keys[i]);
				if (typeof value !== 'undefined' && owner === true) {
					return value;
				} 
				if (typeof value !== 'undefined') {
					return ((value && _.isObject(value) && value['#text']) || value) ;
				}
			}
		}
	};
	baseUtils.fetch = fetch;

	// What it does: takes item 'p1/p2/../pN' and searches for occurence of pN in pN-1
	var hfetch = function (o, item) {
		var items = _.compact(item.split('/'))
			, found = o;
		if (items.length > 1) {
			items.forEach(function(tag) {
				found = fetch(found, tag);
			});
			return found;					
		}
		return fetch(o, item);
	};
	baseUtils.hfetch = hfetch;


	
	// Purpose: Iterator for traversing abstract JSON objects; calls the supplied 'action' function
	var walk = function(obj, action, d) {
		var name
			, meta = _.clone(d) || { 'path': '', 'depth': 0}
			, path = meta.path;

		// terminates when called with a terminal element
		if (typeof obj === 'object') {
			for (name in obj) {
				// visit this object
				if (obj.hasOwnProperty(name)) {
					meta.path = path + name;
					action(obj, name, meta.path);

					if (typeof obj[name] === 'object' && meta.depth < 1000) {
						meta.depth += 1;
						meta.path += '/';
						this.walk(obj[name], action, meta);
					} else if (meta.depth === 1000) {
						throw '[ base-utils: walk() ] - nested object depth 1000 exceeded';
					}
				}
			}
		}
	};
	baseUtils.walk = walk;

	// Purpose: html string builder
	var buildHTML = function(tag, html, attrs) {
		var attr;
		// you can skip html param
		if (typeof(html) !== 'string') {
			attrs = html;
			html = null;
		}

		var h = '<' + tag;
		for (attr in attrs) {
			if (attrs.hasOwnProperty(attr) && attrs[attr] !== false && attrs[attr] !== undefined) { 
					h += ' ' + attr + '="' + attrs[attr] + '"';
			}
		}
		h += html ? ">" + html + "</" + tag + ">": "/>";
		//	console.log('buildHTML:', h);
		return h;
	};
	baseUtils.buildHTML = buildHTML;

	// Purpose: execute a function afer a set time in seconds.
	var wait = function (seconds, func) {
		var ms = seconds * 1000;	// converting to milli seconds
		setTimeout(function() {
			if (func && typeof func === 'function') {
				func();
			}
		}, ms);
	};
	baseUtils.wait = wait;
	
	// make these utilities available from Underscore.js
	_.mixin(baseUtils);
	
}());
/*
Serialize, formatJson: http://blog.stchur.com/2007/04/06/serializing-objects-in-javascript/
works differently than JSON.stringify. Why? JSON.stringify won't convert functions.

*/

/*jslint newcap: false, node: true, vars: true, white: true, nomen: true  */
/*global  */

(function() {
	"use strict";
	var formatjs = {};
	
	// Borrowed: http://blog.stchur.com/2007/04/06/serializing-objects-in-javascript/
	// works differently than JSON.stringify. Why? JSON.stringify won't convert functions.
	formatjs.Serialize = function (thsobj) {
		var result;

		var serialize = function () {
			switch (typeof thsobj) {
				// numbers, booleans, and functions are trivial:
				// just return the object itself since its default .toString()
				// gives us exactly what we want
				case 'number':
				case 'boolean':
				case 'function':
					return thsobj;

				// for JSON format, strings need to be wrapped in quotes
				case 'string':
					return '\'' + thsobj + '\'';

				case 'object':
				var str;
				if (thsobj.constructor === Array || typeof thsobj.callee !== 'undefined')
				{
					str = '[';
					var i, len = thsobj.length;
					for (i = 0; i < len-1; i+=1) { str += serialize(thsobj[i]) + ','; }
					str += serialize(thsobj[i]) + ']';
				}
				else
				{
					str = '{';
					var key;
					for (key in thsobj) { 
						if (thsobj.hasOwnProperty(key)) {
							str += key + ':' + serialize(thsobj[key]) + ',';
						}
					}
					str = str.replace(/\,$/, '') + '}';
				}
				return str;

				default:
					return 'UNKNOWN';
			}
		};
		result = serialize();
		return result.toString();
	};

	formatjs.formatJson = function (val) {
		var retval = ''
			, str = val
			, pos = 0
			, strLen = str && str.length
			, indentStr = '&nbsp;&nbsp;&nbsp;&nbsp;'
			, newLine = '<br />'
			, char = ''
			, i
			, k
			, j;

		for (i=0; i<strLen; i+=1) {
			char = str.substring(i,i+1);

			if (char === '}' || char === ']') {
				retval = retval + newLine;
				pos = pos - 1;
				for (j=0; j<pos; j+=1) {
					retval = retval + indentStr;
				}
			}
			retval = retval + char;
			if (char === '{' || char === '[' || char === ',') {
				retval = retval + newLine;
				if (char === '{' || char === '[') {
					pos = pos + 1;
				}
				for (k=0; k<pos; k+=1) {
					retval = retval + indentStr;
				}
			}
		}
		return retval;
	};

	_.mixin(formatjs);
}());
/*
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for sprintfUtils

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
*/

/*jslint newcap: false, node: true, vars: true, white: true, nomen: true  */
/*global  */


(function() {
	"use strict";
	var sprintfUtils = {};

	var sprintf = (function() {
		function get_type(variable) {
			return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
		}
		function str_repeat(input, multiplier) {
			var output;
			for (output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
			return output.join('');
		}

		var str_format = function() {
			if (!str_format.cache.hasOwnProperty(arguments[0])) {
				str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
			}
			return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
		};

		str_format.format = function(parse_tree, argv) {
			var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
			for (i = 0; i < tree_length; i++) {
				node_type = get_type(parse_tree[i]);
				if (node_type === 'string') {
					output.push(parse_tree[i]);
				}
				else if (node_type === 'array') {
					match = parse_tree[i]; // convenience purposes only
					if (match[2]) { // keyword argument
						arg = argv[cursor];
						for (k = 0; k < match[2].length; k++) {
							if (!arg.hasOwnProperty(match[2][k])) {
								throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
							}
							arg = arg[match[2][k]];
						}
					}
					else if (match[1]) { // positional argument (explicit)
						arg = argv[match[1]];
					}
					else { // positional argument (implicit)
						arg = argv[cursor++];
					}

					if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
						throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
					}
					switch (match[8]) {
						case 'b': arg = arg.toString(2); break;
						case 'c': arg = String.fromCharCode(arg); break;
						case 'd': arg = parseInt(arg, 10); break;
						case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
						case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
						case 'o': arg = arg.toString(8); break;
						case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
						case 'u': arg = Math.abs(arg); break;
						case 'x': arg = arg.toString(16); break;
						case 'X': arg = arg.toString(16).toUpperCase(); break;
					}
					arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
					pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
					pad_length = match[6] - String(arg).length;
					pad = match[6] ? str_repeat(pad_character, pad_length) : '';
					output.push(match[5] ? arg + pad : pad + arg);
				}
			}
			return output.join('');
		};

		str_format.cache = {};

		str_format.parse = function(fmt) {
			var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
			while (_fmt) {
				if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
					parse_tree.push(match[0]);
				}
				else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
					parse_tree.push('%');
				}
				else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
					if (match[2]) {
						arg_names |= 1;
						var field_list = [], replacement_field = match[2], field_match = [];
						if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
							field_list.push(field_match[1]);
							while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
								if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
									field_list.push(field_match[1]);
								}
								else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
									field_list.push(field_match[1]);
								}
								else {
									throw('[sprintf] huh?');
								}
							}
						}
						else {
							throw('[sprintf] huh?');
						}
						match[2] = field_list;
					}
					else {
						arg_names |= 2;
					}
					if (arg_names === 3) {
						throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
					}
					parse_tree.push(match);
				}
				else {
					throw('[sprintf] huh?');
				}
				_fmt = _fmt.substring(match[0].length);
			}
			return parse_tree;
		};

		return str_format;
	})();
	sprintfUtils.sprintf = sprintf;

	var vsprintf = function(fmt, argv) {
		argv.unshift(fmt);
		return sprintf.apply(null, argv);
	};
	sprintfUtils.vsprintf = vsprintf;
	
	_.mixin(sprintfUtils)

}());
/*
Carlo Zottman: https://github.com/carlo/jquery-base64
# jquery-base64

Rather simple jQuery'fication of
[Nick Galbreath's base64 string encoder](http://stringencoders.googlecode.com/svn-history/r210/trunk/javascript/base64.js).

I didn't like having a global `base64` variable around, that's all.


## Usage

* `$.base64.encode( "this is a test" )` returns `"dGhpcyBpcyBhIHRlc3Q="`
* `$.base64.decode( "dGhpcyBpcyBhIHRlc3Q=" )` returns `"this is a test"`


## Known issues

JSLint is complaining about the "unexpected use of '<<'/'|'".  No idea, suggestions welcome.


## Developers

Original code by [Nick Galbreath](http://stringencoders.googlecode.com/svn-history/r210/trunk/javascript/base64.js).
Port by [Carlo Zottmann](http://github.com/carlo).


## License

MIT license, just like [the original](http://stringencoders.googlecode.com/svn-history/r210/trunk/javascript/base64.js).


*/
"use strict";
(function () {
    var $,
		_PADCHAR = "=",
        _ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        _VERSION = "1.0";

    function _getbyte64(s, i) {
        var idx = _ALPHA.indexOf(s.charAt(i));
        if (idx === -1) {
            throw "Cannot decode base64"
        }
        return idx
    }

    function _decode(s) {
        var pads = 0,
            i, b10, imax = s.length,
            x = [];
        s = String(s);
        if (imax === 0) {
            return s
        }
        if (imax % 4 !== 0) {
            throw "Cannot decode base64"
        }
        if (s.charAt(imax - 1) === _PADCHAR) {
            pads = 1;
            if (s.charAt(imax - 2) === _PADCHAR) {
                pads = 2
            }
            imax -= 4
        }
        for (i = 0; i < imax; i += 4) {
            b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12) | (_getbyte64(s, i + 2) << 6) | _getbyte64(s, i + 3);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255, b10 & 255))
        }
        switch (pads) {
        case 1:
            b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12) | (_getbyte64(s, i + 2) << 6);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255));
            break;
        case 2:
            b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12);
            x.push(String.fromCharCode(b10 >> 16));
            break
        }
        return x.join("")
    }

    function _getbyte(s, i) {
        var x = s.charCodeAt(i);
        if (x > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5 ("+x+")";
        }
        return x
    }

    function _encode(s) {
        if (arguments.length !== 1) {
            throw "SyntaxError: exactly one argument required"
        }
        s = String(s);
        var i, b10, x = [],
            imax = s.length - s.length % 3;
        if (s.length === 0) {
            return s
        }
        for (i = 0; i < imax; i += 3) {
            b10 = (_getbyte(s, i) << 16) | (_getbyte(s, i + 1) << 8) | _getbyte(s, i + 2);
            x.push(_ALPHA.charAt(b10 >> 18));
            x.push(_ALPHA.charAt((b10 >> 12) & 63));
            x.push(_ALPHA.charAt((b10 >> 6) & 63));
            x.push(_ALPHA.charAt(b10 & 63))
        }
        switch (s.length - imax) {
        case 1:
            b10 = _getbyte(s, i) << 16;
            x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 63) + _PADCHAR + _PADCHAR);
            break;
        case 2:
            b10 = (_getbyte(s, i) << 16) | (_getbyte(s, i + 1) << 8);
            x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 63) + _ALPHA.charAt((b10 >> 6) & 63) + _PADCHAR);
            break
        }
        return x.join("")
    }
    _.mixin ({
        decode: _decode,
        encode: _encode,
        VERSION: _VERSION
    });

}());/* ===================================================
 * js-url.js v0.01
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
/*global _: true */

if (typeof _ === 'undefined') {
	if (typeof exports !== 'undefined') {
		var _ = require('underscore');
	} else {
		throw new Error('js-url depends on underscore.js');
	}
}

(function() {
	"use strict";
	var urlUtils = {};
	
	var urlFormat = function (source) {
		var target = '';

		if (source) {
			target = source.protocol ? source.protocol + '//' : '';
			target = target + (source.auth ? source.auth + '@' : '');
			target = target + (source.host || (source.hostname || ''));
			target = target + (source.path || '');
			target = target + (source.hash || '');
		}
		return target;
	};
	urlUtils.urlFormat = urlFormat;

	var formatQuery = function (source) {
		var target = '?';

		_.each(source, function(value, name) {
			target += name + '=' + value + '&';
		});

		// clip the trailing '&'
		return (target.slice(0,target.length-1));
	};
	urlUtils.formatQuery = formatQuery;

	var parseQuery = function (queryString) {
		var qs = queryString;

		var tmp = qs.charAt(0) === '?' ? qs.slice(1).toLowerCase() : qs.toLowerCase()
			, qryobj = {};			

		tmp.split('&').forEach(function(pair) {
			if (pair.split('=').length > 1) {
				qryobj[pair.split('=')[0]] = pair.split('=')[1] || '';					
			}
		});
		return qryobj;	
	};
	urlUtils.parseQuery = parseQuery;

	var urlParse = function (url, query, slashes) {
		/*jslint sub: true */
		var tmpurl = (url && url.toLowerCase()) || ''
			, thisurl = _.extend({}, { 'href': url || '', 'path': '' })
			, segment;

		if (tmpurl.split('#').length > 1) {
			tmpurl.split('#').forEach(function() {
				thisurl.hash = '#' + url.split('#')[1];
			});				
		}

		if (tmpurl.split('?').length > 1) {
			tmpurl.split('?').forEach(function() {
				thisurl.search = '?' + url.split('?')[1].split('#')[0];
			});				
		}

		// http, https, ftp, gopher, file
		segment = tmpurl.split('//')[0].substr(0,3);
		if (segment === 'htt' || segment === 'ftp' || segment === 'gop' || segment === 'fil') {
			thisurl.protocol = tmpurl.split('/')[0];
		}

		// 'http://user:pass@host.com:8080/p/a/t/h?query=string#hash'
		// 'http://www.example.com/a/b 
		// www.example.com
		// /a/b/c
		tmpurl.split('/').forEach(function(segment) {
			if (segment.split('@').length > 1) {
				thisurl.auth = segment.split('@')[0];
			}
		});

		if (tmpurl.split('//').length > 1) {
			segment = tmpurl.split('//')[1].split('/')[0];
			if (segment.split('@').length > 1) {
				thisurl.host = segment.split('@')[1];
			} else {
				thisurl.host = segment;
			}				
		}

		if (thisurl.host && thisurl.host.search(':')) {
			thisurl.hostname = thisurl.host.split(':')[0];
			thisurl.port = thisurl.host.split(':')[1] || '';
		}

		if (thisurl.host) {
			thisurl.path = 
			tmpurl.substr(tmpurl.search(thisurl.host)+thisurl.host.length);
		} else {
			thisurl.path = tmpurl;
		}

		thisurl.pathname = thisurl.path.split('?')[0];
		thisurl.path = thisurl.pathname + (thisurl.search || '');

		if (query && query === true && thisurl.search) {
			thisurl['query'] = parseQuery(thisurl['search']);
		} else {
			if (thisurl.hasOwnProperty('search')) {
				thisurl['query'] = thisurl['search'].slice(1);					
			}
		}
		if (slashes && slashes === true) {
			throw 'slashes is not supported in url() object.';
		}
		return thisurl;
	};
	urlUtils.urlParse = urlParse;
	
	// make these utilities available from Underscore.js
	_.mixin(urlUtils);

}())

/* ===================================================
 * date-utils.js v0.01
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
/*global _: true */


if (typeof _ === 'undefined') {
	if (typeof exports !== 'undefined') {
		var _ = require('underscore');
	} else {
		throw new Error('js-dates depends on underscore.js');
	}
}

(function() {
	"use strict";
	var dateUtils = {};

	var date = function(o) {
		var that = o || {}
		, map = {
			'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
			'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
		}
		, formats = [
			'dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy/mm/dd', 'yyyy/dd/mm',
			'dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd', 'yyyy-dd-mm',
			'mm-yyyy', 'mm yyyy', 'mm/yyyy', 'mm dd yyyy', 'yyyy mm dd', 'day yyyy mm dd' ]
		, separator
		, template = function (v) {
			var obj = v || this.dateValue;

			return({
				'yyyy': obj.getFullYear(),
				'mm': obj.getMonth(),
				'dd': obj.getDate(),
				'day': obj.getDay(),
				'time': obj.toTimeString().split(' ')[0]				
			});
		};
		that.template = template;

//console.log('making date for', that.dateIn);
		// if no dateIn supplied, use the system date and proper format;
		if (!that.dateIn)  {
			that.format = 'day yyyy mm dd';
			that.dateValue = new Date();
			that.dateIn = that.dateValue.toString();
		} else if (_.isArray(that.dateIn)) {
			that.format = (o && o.format) || 'yyyy mm dd';
			that.dateValue = new Date(_.map(that.dateIn, function(x) { return _.toInt(x); }));
			that.dateValue.setMonth(that.dateValue.getMonth()+1);
		} else if (_.isObject(that.dateIn)) {
			that.dateValue = that.dateIn;
			that.format = 'yyyy mm dd';
		} else {
			that.dateValue = new Date(that.dateIn);
			// if no format provided, then date object will think month is zero-based and decrement
			// application must adapt
			if (!that.format) {
				that.dateValue.setMonth(that.dateValue.getMonth()+1);				
			}
			that.format = (o && o.format) || 'yyyy mm dd';
		}
		// check that application supplied a valid date
		if (_.fetch(formats, that.format) === -1) {
			throw '[ date ] - unrecognized date format ' + that.format;
		}

		// get the separator for the date format
		var getSeparator = function (f) {
			var separator
				, temp = [];
			[ '/', '-', ' '].forEach(function(sep) {
				if (temp.length < 2) {
					separator = sep;
					temp = f.split(separator);
				}
			});
			return separator;				
		};
		// get the format separator character
		separator = getSeparator(that.format);

		// What it does: method to return a date as an array [yyyy, mm, dd ] .concat([ time ])
		var key = function (f) {
			var fmt = f || this.format
			, sepchar = getSeparator(fmt)
			, local = this;

			return _.map((fmt || 'yyyy mm dd').split(sepchar), function(part) {
				return local.template()[part];
			});
		};
		that.key = key;

		// What it does: Joins the value of 'today' using deciphered 'separator' to form
		// the date format string. And, reformats numeric 'mm' to string
		var print = function (format) {
			return(this.key(format).join(getSeparator((format || this.format))));
		};
		that.print = print;

		var docId = function () {
			return(this.print('time-yyyy-mm-dd'));
		};
		that.docId = docId;

		// What it does: takes month string and returns an ordinal integer value. If none provided,
		// returns the value of the month for this object
		var m2n = function (monthStr) {
			var mon = (monthStr && monthStr.toLowerCase());
			return _.isString(mon) && (map[mon] || map[mon.substr(0,3)]);
		};
		that.m2n = m2n;

		// What it does: takes a number and returns a string month
		var n2m = function (monthNo) {
			var month
				, targetMonth = (monthNo || this.template().mm);

			for (month in map) {
			//	console.log('finding month in map', map[month], month, typeof month);
				if (map.hasOwnProperty(month) && (map[month]=== targetMonth)) {
					//console.log('returning month', month, typeof month);
					return month;					
				}
			}
			return targetMonth;
		};
		that.n2m = n2m;

		var valueOf = function () {
			return this.dateValue.valueOf();
		};
		that.valueOf = valueOf;

		var setTime = function(v) {
			this.dateValue = new Date();
			this.dateValue.setTime(v);
			return this;
		};
		that.setTime = setTime;

		// what it does: returns the 'today' value using the place in template for date 'part' 
		var getPart = function (part) {
			return this.template()[part];
		};
		that.getPart = getPart;

		var getYear = function () {
			return this.getPart('yyyy');
		};
		that.getYear = getYear;

		var getMonth = function () {
			return this.getPart('mm');
		};
		that.getMonth = getMonth;

		var getDate = function () {
			return this.getPart('dd');
		};
		that.getDate = getDate;

		var setYear = function (val) {
			this.dateValue.setFullYear(_.toInt(val));
			return this;
		};
		that.setYear = setYear;

		var setMonth = function (val) {
			this.dateValue.setMonth(_.toInt(val));
			return this;
		};
		that.setMonth = setMonth;

		var setDate = function (val) {
			this.dateValue.setDate(_.toInt(val));
			return this;
		};
		that.setDate = setDate;

		var gt = function (d2) {
			return this.valueOf() > d2.valueOf();
		};
		that.gt = gt;

		var lt = function (d2) {
			return !this.gt(d2);		
		};
		that.lt = lt;

		var le = function (d2) {
			return ((!this.gt(d2)) || this.eq(d2));		
		};
		that.le = le;

		var ge = function (d2) {
			return ((this.gt(d2)) || this.eq(d2));		
		};
		that.ge = ge;

		var eq = function (d2) {
			return this.valueOf() === d2.valueOf();
		};
		that.eq = eq;

		var inRange = function (start, end) {
			return (this.ge(start) && this.le(end));
		};
		that.inRange = inRange;
		return that;		
	};
	dateUtils.date = date;
	
	// returns a boxspring.js date object from an array [yyyy, mm, dd]
	var toDate = function(d) {
		return _.date({'dateIn': d });
	};
	dateUtils.toDate = toDate;
	
	// make these utilities available from Underscore.js
	_.mixin(dateUtils);
	
}());




/*jslint newcap: false, node: true, vars: true, white: true, nomen: true  */

if (typeof UTIL === 'undefined') {
	var UTIL = {};
}

(function(global) {
	"use strict";
	
	var Tree = function(obj) {
		var items;
		
		for (items in obj) {
			if (obj.hasOwnProperty(items)) {
				this[items] = obj[items];				
			}
		}
		this.child = undefined;
		this.sibling = undefined;
		this.owner = undefined;
		return this;
	};
	
	
	Tree.prototype.addChild = function (obj) {
		return this.insertChild(new Tree(obj));
	};

	Tree.prototype.firstChild = function () {
		return this.child;
	};

	Tree.prototype.nextSibling = function () {
		return this.sibling;
	};
	Tree.prototype.lastSibling = function () {
		var sib = ((this && this.sibling) || this)
		, LIMIT = 1000000
		, counter = 0;
		
		while ((sib && sib.sibling) && counter < LIMIT) {
			sib = sib.sibling;
		}
		if (counter === LIMIT) {
			throw new Error('cycle encountered');
		}
		return sib;
	};
	Tree.prototype.lastChild = function () {
		return this.firstChild() && this.firstChild().lastSibling();
	};
	Tree.prototype.parent = function () {
		return this.owner;
	};
	Tree.prototype.firstSibling = function () {
		return this.parent() && this.parent().firstChild();		
	};
	Tree.prototype.previousSibling = function () {
		var predecessor = this.firstSibling();
		while (predecessor && predecessor.sibling && predecessor.sibling !== this) {
			predecessor = predecessor.sibling;
		}
		return predecessor;
	};
	Tree.prototype.grandParent = function () {
		return (this.parent() && this.parent().parent());
	};
	// What it does: fetches the last sibling from the objects children and inserts child at the end.
	Tree.prototype.insertChild = function (child) {
		var lastChild = this.lastChild();

		// case 1: no first child, just add the child
		if (!this.firstChild()) {
			child.sibling = undefined;
			child.owner = undefined;
			return this.insertFirstChild(child);
		}
		// case 2: fetch last child and add this to the end
		try {
			lastChild.sibling = child;
			child.owner = lastChild.owner;
			child.sibling = undefined;				
		} catch (e) {
			throw '[insertChild] - lastChild wrong!';
		}
		return this;
	};
	
	// insert an element as the first child of a parent; previous first child is sibling of new
	Tree.prototype.insertFirstChild = function (child) {
		if (child) {
			if (this && this.child) {
				child.sibling = this.child;
			} else {
				child.sibling = undefined;					
			}
			this.child = child;
			child.owner = this;
		}
		return this;				
	};

	// insert an element as a sibling of this element
	Tree.prototype.spliceIn = function (sib) {
		if (sib) {
			sib.sibling = this.sibling;
			this.sibling = sib;
			sib.owner = this.owner;
		}
		return sib;
	};

	// remove a sibling from a Tree of siblings
	Tree.prototype.spliceOut = function () {
		var location = this && this.parent() && this.parent().firstChild()
		, owner = this && this.parent();

		// only child
		if (this === location && !this.sibling) {
			this.owner.child = undefined;
			this.owner = undefined;
			return undefined;
		}
		// first child with siblings
		if (this === location && this.sibling) {
			this.owner.child = this.sibling;
			this.owner = undefined;
			this.sibling = undefined;
			return owner.firstChild();
		}
		// middle child or end child
		while (location && location.sibling && location.sibling !== this) { 
			location = location.sibling; 
		}
		location.sibling = this.sibling;
		this.owner = undefined;
		this.sibling = undefined;
		return location;
	};

	Tree.prototype.siblings = function (it) {
		var result = [] 
		, next = (this && this.owner && this.owner.child)
		, iterator = (((typeof it === 'function') && it) || function () { return true; });

		while (next) {
			if (iterator(next) === true) {
				result.push(next);						
			}
			next = next.sibling;					
		}
		return result;
	};	

	Tree.prototype.each = function () {
		var result = [];

		this.walk(function() {
			result.push(this);
		});
		return result.slice(1);
	};

	Tree.prototype.walk = function(fn) {			
		if (typeof fn !== 'function') {
			throw 'you must supply a function to the Tree walk method.';				
		}
		// visit this node
		fn.call(this, this);
		if (this && this.child) {
			// its child
			this.child.walk(fn);
		}
		if (this && this.sibling) {
			this.sibling.walk(fn);
		}
	};

	Tree.prototype.find = function(id, fn) {
		var local = this
			, found;

		// the empty argument Tree returns the id of self	
		if (arguments.length === 0) {
			return this.id;
		}

		this.walk(function(item) {
			if (item.id === id) {
				if (fn && typeof fn === 'function') {
					fn.call(local, item);
				} else {
					found = item;
				}
			}
		});
		return found;
	};
	Tree.prototype.Id = Tree.prototype.find;
	
	var tree = function (o) {
		return new Tree(o);
	};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = tree;
	    }
		exports.tree = tree;
	} else {
		if (typeof global.UTIL === 'undefined') {
			global.UTIL = {};
		}
		global.UTIL.tree = tree;
	}
	
}(this));

if (typeof module !== 'undefined' && module.exports) {
	UTIL.tree = module.exports;
}
/* ===================================================
 * JS-Hash.js v0.01
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

if (typeof UTIL === 'undefined') {
	var UTIL = {};
}

(function(global) {
	"use strict";
	
	var Hash = function(init) {
		var item
		, newItem;
		this.values = {};
		this.original = {};
		
		
		for (item in init) {
			if (init.hasOwnProperty(item)) {
				this.values[item] = this.original[item] = init[item];
			}
		}
		return this;		
	};

	Hash.prototype.set = function (name, value) {
		this.values[name] = value;
		return this;
	};
	Hash.prototype.store = Hash.prototype.set;

	Hash.prototype.get = function (name) {			
		return this.values && this.values[name];
	};
	Hash.prototype.lookup = Hash.prototype.get;
	Hash.prototype.find = Hash.prototype.get;

	Hash.prototype.contains = function (name) {
		return (typeof this.get(name) !== 'undefined');
	};

	Hash.prototype.post = function (v) {
		if (v) {
			this.values = v;
		}
		return this.values;
	};

	Hash.prototype.getLength = function () {
		var k
		, count = 0;

		for (k in this.values) {
			if (this.values.hasOwnProperty(k)) {
				count += 1;				
			}
		}
		return count;
	};

	// What it does: Remove an item from the Hash
	Hash.prototype.remove = function (name) {
		if (this.values[name]) {
			delete this.values[name];
		}
		return this;
	};
	// What it does: Return the Hash as an array so it can be used as an argument to map/reduce
	Hash.prototype.each = function () {
		var objectArray = []
		, obj;

		for (obj in this.values) {
			if (this.values.hasOwnProperty(obj)) {
				objectArray.push(this.values[obj]);				
			}
		}
		return objectArray;
	};

	Hash.prototype.keys = function () {
		var keyArray = []
		, obj;

		for (obj in this.values) {
			if (this.values.hasOwnProperty(obj)) {
				keyArray.push(obj);				
			}
		}
		return keyArray;
	};

	Hash.prototype.first = function () {
		return(this.get(this.keys()[0]));		
	};
	
	// What it does: Bulk update the properties of the Hash
	Hash.prototype.update = function (properties) {
		var property;
		
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				this.set(property, properties[property]);
			}
		}
		return this;		
	};
	
	// What it does: Returns an object containing only the selected items. args can be an Array of strings
	// or separate argument strings
	Hash.prototype.pick = function (args) {
		var i
		, list = []
		, target = {};
		
		// accepts arguments as either array of items to pick, or argument list of items
		if (typeof args === 'string') {
			// convert the arguments list to an array
			for (i=0; i < arguments.length; i += 1) {
				list.push(arguments[i]);
			}
		} else {
			// or, just use as is
			list = args;
		}
		// iterate over the arguments to pick up the items requested
		for (i=0; i < list.length; i += 1) {
			target[list[i]] = this.get(list[i]);
		}
		return target;
	};
	// What it does: Returns the object values to its original state
	Hash.prototype.restore = function () {
		var item;
		
//		this.values = {};
		for (item in this.values) {
			if (this.values.hasOwnProperty(item)) {
				this.values[item] = undefined;
			}
		}
		for (item in this.original) {
			if (this.original.hasOwnProperty(item)) {
				this.values[item] = this.original[item];
			}
		}
		return this;
	};
	
	Hash.prototype.empty = function () {
		return this.post({});
	};
	
	var hash = function (o) {
		return new Hash(o);
	};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = hash;
	    }
		exports.hash = hash;
	} else {
		if (typeof global.UTIL === 'undefined') {
			global.UTIL = {};
		}
		global.UTIL.hash = hash;
	}
	
}(this));


if (typeof module !== 'undefined' && module.exports) {
	UTIL.hash = module.exports;
}
	/* ===================================================
 * js-queue.js v0.01
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
/*global */


if (typeof UTIL === 'undefined') {
	var UTIL = {};
}

(function(global) {
	"use strict";
	
	var Queue = function() {
		this.Pending = [];
		this.Running = [];
		this.cleared = false;
		this.hold = false;
		this.afterFunc = function () { return; };
		this.afterFuncArgs = [];
		this.depth = 1;
		return this;		
	};
	
	Queue.prototype.submit = function (func) {
		var i
		, args = [];
		// any arguments to submit after func are the arguments to func. Conver them to array.
		for (i=1; i < arguments.length; i += 1) {
			args.push(arguments[i]);
		}
		// the queue will dequeue func with argument args
		this.Pending.push({ 'func': func, 'args': args });
		return this;		
	};

	// What it does: Called by the application to start the queue running. 
	// cycle method continuously calls it while there are still jobs pending.
	Queue.prototype.run = function () {
		var nextJob = {};

		if (this.hold === true) { return; }
		if ((this.Pending.length > 0) // remaining jobs
				&& (this.Running.length < this.depth)) { // more capacity available
			this.Running.push({});
			this.cycle();
			nextJob = this.Pending.shift();
			try {
				nextJob.func.apply(this, nextJob.args);
			} catch (e) {
				throw e;
			}
		} 
		return this;
	};

	// What it does: We need some space between the last dequeue and the next attempt to run a job; or else
	// we can get a race.
	Queue.prototype.cycle = function () {
		var local = this;
		
		setTimeout(function () {
			local.run();
			if (local.Pending.length > 0) { 
				local.cycle(); 
			}
		}, 100);
	};
	// What this does: Called by the application when the job finishes. If the queue is empty, 
	// run the 'afterFunc', if one was supplied.
	Queue.prototype.finish = function () {
		this.Running.pop();
		if (this.Pending.length === 0 && this.Running.length === 0) {
			this.afterFunc.apply(this, this.afterFuncArgs);
		}
		return this;		
	};
	
	Queue.prototype.max = function (depth) {
		if (depth) {
			this.depth = parseInt(depth, 10);
		}
		return this;		
	};

	Queue.prototype.after = function (func, args) {
		if (func && typeof func === 'function') {
			this.afterFunc = func;
			this.afterFuncArgs = args;
		}
		return this;
	};

	Queue.prototype.suspend = function () {
		this.hold = true;
		return this;
	};
	
	Queue.prototype.resume = function () {
		this.hold = false;
		return this;
	};
	
	Queue.prototype.pending = function () {
		return this.Pending.length;
	};
	
	Queue.prototype.running = function () {
		return this.Running.length;
	};
	
	Queue.prototype.clear = function () {
		while (this.Pending.length > 0) {
			this.Pending.pop();
		}
		this.cleared = true;
		this.afterFunc(this.afterFuncArgs);
		return this;		
	};

	var queue = function () {
		return new Queue();
	};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = queue;
	    }
		exports.queue = queue;
	} else {
		if (typeof global.UTIL === 'undefined') {
			global.UTIL = {};
		}
		global.UTIL.queue = queue;
	}
	
}(this));


if (typeof module !== 'undefined' && module.exports) {
	UTIL.queue = module.exports;
}
/* 
 *	Based on ObjTree.js from 
 *	Yusuke Kawasaki http://www.kawa.net/ 
 *
*/


if (typeof UTIL === 'undefined') {
	var UTIL = {};
}


// If running in Node.js, need package library 'xmldom'. 
// Provides the DOMParser object. Everything else stays the same!
if (typeof window === 'undefined') {
	var DOMParser = require('xmldom').DOMParser;	

	var window = {};
	window.DOMParser = true;
}

(function(global) {
	var XML;
	
	// ========================================================================
	//  XML.ObjTree -- XML source code from/to JavaScript object like E4X
	// ========================================================================
	if ( typeof(XML) == 'undefined' ) XML = function() {};

	//  constructor

	XML.ObjTree = function () {
	    return this;
	};

	//  class variables

	XML.ObjTree.VERSION = "0.24";

	//  object prototype

	XML.ObjTree.prototype.xmlDecl = '<?xml version="1.0" encoding="UTF-8" ?>\n';
	XML.ObjTree.prototype.attr_prefix = '-';
	XML.ObjTree.prototype.overrideMimeType = 'text/xml';

	//  method: parseXML( xmlsource )

	XML.ObjTree.prototype.parseXML = function ( xml ) {
	    var root;
	    if ( window.DOMParser ) {
	        var xmldom = new DOMParser();
	//      xmldom.async = false;           // DOMParser is always sync-mode
	        var dom = xmldom.parseFromString( xml, "application/xml" );
	        if ( ! dom ) return;
	        root = dom.documentElement;
	    } else if ( window.ActiveXObject ) {
	        xmldom = new ActiveXObject('Microsoft.XMLDOM');
	        xmldom.async = false;
	        xmldom.loadXML( xml );
	        root = xmldom.documentElement;
	    }
	    if ( ! root ) return;
	    return this.parseDOM( root );
	};

	//  method: parseHTTP( url, options, callback )

	XML.ObjTree.prototype.parseHTTP = function ( url, options, callback ) {
	    var myopt = {};
	    for( var key in options ) {
	        myopt[key] = options[key];                  // copy object
	    }
	    if ( ! myopt.method ) {
	        if ( typeof(myopt.postBody) == "undefined" &&
	             typeof(myopt.postbody) == "undefined" &&
	             typeof(myopt.parameters) == "undefined" ) {
	            myopt.method = "get";
	        } else {
	            myopt.method = "post";
	        }
	    }
	    if ( callback ) {
	        myopt.asynchronous = true;                  // async-mode
	        var __this = this;
	        var __func = callback;
	        var __save = myopt.onComplete;
	        myopt.onComplete = function ( trans ) {
	            var tree;
	            if ( trans && trans.responseXML && trans.responseXML.documentElement ) {
	                tree = __this.parseDOM( trans.responseXML.documentElement );
	            } else if ( trans && trans.responseText ) {
	                tree = __this.parseXML( trans.responseText );
	            }
	            __func( tree, trans );
	            if ( __save ) __save( trans );
	        };
	    } else {
	        myopt.asynchronous = false;                 // sync-mode
	    }
	    var trans;
	    if ( typeof(HTTP) != "undefined" && HTTP.Request ) {
	        myopt.uri = url;
	        var req = new HTTP.Request( myopt );        // JSAN
	        if ( req ) trans = req.transport;
	    } else if ( typeof(Ajax) != "undefined" && Ajax.Request ) {
	        var req = new Ajax.Request( url, myopt );   // ptorotype.js
	        if ( req ) trans = req.transport;
	    }
	//  if ( trans && typeof(trans.overrideMimeType) != "undefined" ) {
	//      trans.overrideMimeType( this.overrideMimeType );
	//  }
	    if ( callback ) return trans;
	    if ( trans && trans.responseXML && trans.responseXML.documentElement ) {
	        return this.parseDOM( trans.responseXML.documentElement );
	    } else if ( trans && trans.responseText ) {
	        return this.parseXML( trans.responseText );
	    }
	}

	//  method: parseDOM( documentroot )

	XML.ObjTree.prototype.parseDOM = function ( root ) {
	    if ( ! root ) return;

	    this.__force_array = {};
	    if ( this.force_array ) {
	        for( var i=0; i<this.force_array.length; i++ ) {
	            this.__force_array[this.force_array[i]] = 1;
	        }
	    }

	    var json = this.parseElement( root );   // parse root node
	    if ( this.__force_array[root.nodeName] ) {
	        json = [ json ];
	    }
	    if ( root.nodeType != 11 ) {            // DOCUMENT_FRAGMENT_NODE
	        var tmp = {};
	        tmp[root.nodeName] = json;          // root nodeName
	        json = tmp;
	    }
	    return json;
	};

	//  method: parseElement( element )

	XML.ObjTree.prototype.parseElement = function ( elem ) {
	    //  COMMENT_NODE
	    if ( elem.nodeType == 7 ) {
	        return;
	    }

	    //  TEXT_NODE CDATA_SECTION_NODE
	    if ( elem.nodeType == 3 || elem.nodeType == 4 ) {
	        var bool = elem.nodeValue.match( /[^\x00-\x20]/ );
	        if ( bool == null ) return;     // ignore white spaces
	        return elem.nodeValue;
	    }

	    var retval;
	    var cnt = {};

	    //  parse attributes
	    if ( elem.attributes && elem.attributes.length ) {
	        retval = {};
	        for ( var i=0; i<elem.attributes.length; i++ ) {
	            var key = elem.attributes[i].nodeName;
	            if ( typeof(key) != "string" ) continue;
	            var val = elem.attributes[i].nodeValue;
	            if ( ! val ) continue;
	            key = this.attr_prefix + key;
	            if ( typeof(cnt[key]) == "undefined" ) cnt[key] = 0;
	            cnt[key] ++;
	            this.addNode( retval, key, cnt[key], val );
	        }
	    }

	    //  parse child nodes (recursive)
	    if ( elem.childNodes && elem.childNodes.length ) {
	        var textonly = true;
	        if ( retval ) textonly = false;        // some attributes exists
	        for ( var i=0; i<elem.childNodes.length && textonly; i++ ) {
	            var ntype = elem.childNodes[i].nodeType;
	            if ( ntype == 3 || ntype == 4 ) continue;
	            textonly = false;
	        }
	        if ( textonly ) {
	            if ( ! retval ) retval = "";
	            for ( var i=0; i<elem.childNodes.length; i++ ) {
	                retval += elem.childNodes[i].nodeValue;
	            }
	        } else {
	            if ( ! retval ) retval = {};
	            for ( var i=0; i<elem.childNodes.length; i++ ) {
	                var key = elem.childNodes[i].nodeName;
	                if ( typeof(key) != "string" ) continue;
	                var val = this.parseElement( elem.childNodes[i] );
	                if ( ! val ) continue;
	                if ( typeof(cnt[key]) == "undefined" ) cnt[key] = 0;
	                cnt[key] ++;
	                this.addNode( retval, key, cnt[key], val );
	            }
	        }
	    }
	    return retval;
	};

	//  method: addNode( hash, key, count, value )

	XML.ObjTree.prototype.addNode = function ( hash, key, cnts, val ) {
	    if ( this.__force_array[key] ) {
	        if ( cnts == 1 ) hash[key] = [];
	        hash[key][hash[key].length] = val;      // push
	    } else if ( cnts == 1 ) {                   // 1st sibling
	        hash[key] = val;
	    } else if ( cnts == 2 ) {                   // 2nd sibling
	        hash[key] = [ hash[key], val ];
	    } else {                                    // 3rd sibling and more
	        hash[key][hash[key].length] = val;
	    }
	};

	//  method: writeXML( tree )

	XML.ObjTree.prototype.writeXML = function ( tree ) {
	    var xml = this.hash_to_xml( null, tree );
	    return this.xmlDecl + xml;
	};

	//  method: hash_to_xml( tagName, tree )

	XML.ObjTree.prototype.hash_to_xml = function ( name, tree ) {
	    var elem = [];
	    var attr = [];
	    for( var key in tree ) {
	        if ( ! tree.hasOwnProperty(key) ) continue;
	        var val = tree[key];
	        if ( key.charAt(0) != this.attr_prefix ) {
	            if ( typeof(val) == "undefined" || val == null ) {
	                elem[elem.length] = "<"+key+" />";
	            } else if ( typeof(val) == "object" && val.constructor == Array ) {
	                elem[elem.length] = this.array_to_xml( key, val );
	            } else if ( typeof(val) == "object" ) {
	                elem[elem.length] = this.hash_to_xml( key, val );
	            } else {
	                elem[elem.length] = this.scalar_to_xml( key, val );
	            }
	        } else {
	            attr[attr.length] = " "+(key.substring(1))+'="'+(this.xml_escape( val ))+'"';
	        }
	    }
	    var jattr = attr.join("");
	    var jelem = elem.join("");
	    if ( typeof(name) == "undefined" || name == null ) {
	        // no tag
	    } else if ( elem.length > 0 ) {
	        if ( jelem.match( /\n/ )) {
	            jelem = "<"+name+jattr+">\n"+jelem+"</"+name+">\n";
	        } else {
	            jelem = "<"+name+jattr+">"  +jelem+"</"+name+">\n";
	        }
	    } else {
	        jelem = "<"+name+jattr+" />\n";
	    }
	    return jelem;
	};

	//  method: array_to_xml( tagName, array )

	XML.ObjTree.prototype.array_to_xml = function ( name, array ) {
	    var out = [];
	    for( var i=0; i<array.length; i++ ) {
	        var val = array[i];
	        if ( typeof(val) == "undefined" || val == null ) {
	            out[out.length] = "<"+name+" />";
	        } else if ( typeof(val) == "object" && val.constructor == Array ) {
	            out[out.length] = this.array_to_xml( name, val );
	        } else if ( typeof(val) == "object" ) {
	            out[out.length] = this.hash_to_xml( name, val );
	        } else {
	            out[out.length] = this.scalar_to_xml( name, val );
	        }
	    }
	    return out.join("");
	};

	//  method: scalar_to_xml( tagName, text )

	XML.ObjTree.prototype.scalar_to_xml = function ( name, text ) {
	    if ( name == "#text" ) {
	        return this.xml_escape(text);
	    } else {
	        return "<"+name+">"+this.xml_escape(text)+"</"+name+">\n";
	    }
	};

	//  method: xml_escape( text )

	XML.ObjTree.prototype.xml_escape = function ( text ) {
	    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	};
	
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = XML;
	} else {
		if (typeof global.UTIL === 'undefined') {
			global.UTIL = {};
		}
		global.UTIL.XML = XML;
	}
	
}(this));


if (typeof module !== 'undefined' && module.exports) {
	UTIL.XML = module.exports;
}


/*
// ========================================================================

=head1 NAME

XML.ObjTree -- XML source code from/to JavaScript object like E4X

=head1 SYNOPSIS

    var xotree = new XML.ObjTree();
    var tree1 = {
        root: {
            node: "Hello, World!"
        }
    };
    var xml1 = xotree.writeXML( tree1 );        // object tree to XML source
    alert( "xml1: "+xml1 );

    var xml2 = '<?xml version="1.0"?><response><error>0</error></response>';
    var tree2 = xotree.parseXML( xml2 );        // XML source to object tree
    alert( "error: "+tree2.response.error );

=head1 DESCRIPTION

XML.ObjTree class is a parser/generater between XML source code
and JavaScript object like E4X, ECMAScript for XML.
This is a JavaScript version of the XML::TreePP module for Perl.
This also works as a wrapper for XMLHTTPRequest and successor to JKL.ParseXML class
when this is used with prototype.js or JSAN's HTTP.Request class.

=head2 JavaScript object tree format

A sample XML source:

    <?xml version="1.0" encoding="UTF-8"?>
    <family name="Kawasaki">
        <father>Yasuhisa</father>
        <mother>Chizuko</mother>
        <children>
            <girl>Shiori</girl>
            <boy>Yusuke</boy>
            <boy>Kairi</boy>
        </children>
    </family>

Its JavaScript object tree like JSON/E4X:

    {
        'family': {
            '-name':    'Kawasaki',
            'father':   'Yasuhisa',
            'mother':   'Chizuko',
            'children': {
                'girl': 'Shiori'
                'boy': [
                    'Yusuke',
                    'Kairi'
                ]
            }
        }
    };

Each elements are parsed into objects:

    tree.family.father;             # the father's given name.

Prefix '-' is inserted before every attributes' name.

    tree.family["-name"];           # this family's family name

A array is used because this family has two boys.

    tree.family.children.boy[0];    # first boy's name
    tree.family.children.boy[1];    # second boy's name
    tree.family.children.girl;      # (girl has no other sisiters)

=head1 METHODS

=head2 xotree = new XML.ObjTree()

This constructor method returns a new XML.ObjTree object.

=head2 xotree.force_array = [ "rdf:li", "item", "-xmlns" ];

This property allows you to specify a list of element names
which should always be forced into an array representation.
The default value is null, it means that context of the elements
will determine to make array or to keep it scalar.

=head2 xotree.attr_prefix = '@';

This property allows you to specify a prefix character which is
inserted before each attribute names.
Instead of default prefix '-', E4X-style prefix '@' is also available.
The default character is '-'.
Or set '@' to access attribute values like E4X, ECMAScript for XML.
The length of attr_prefix must be just one character and not be empty.

=head2 xotree.xmlDecl = '';

This library generates an XML declaration on writing an XML code per default.
This property forces to change or leave it empty.

=head2 tree = xotree.parseXML( xmlsrc );

This method loads an XML document using the supplied string
and returns its JavaScript object converted.

=head2 tree = xotree.parseDOM( domnode );

This method parses a DOM tree (ex. responseXML.documentElement)
and returns its JavaScript object converted.

=head2 tree = xotree.parseHTTP( url, options );

This method loads a XML file from remote web server
and returns its JavaScript object converted.
XMLHTTPRequest's synchronous mode is always used.
This mode blocks the process until the response is completed.

First argument is a XML file's URL
which must exist in the same domain as parent HTML file's.
Cross-domain loading is not available for security reasons.

Second argument is options' object which can contains some parameters:
method, postBody, parameters, onLoading, etc.

This method requires JSAN's L<HTTP.Request> class or prototype.js's Ajax.Request class.

=head2 xotree.parseHTTP( url, options, callback );

If a callback function is set as third argument,
XMLHTTPRequest's asynchronous mode is used.

This mode calls a callback function with XML file's JavaScript object converted
after the response is completed.

=head2 xmlsrc = xotree.writeXML( tree );

This method parses a JavaScript object tree
and returns its XML source generated.

=head1 EXAMPLES

=head2 Text node and attributes

If a element has both of a text node and attributes
or both of a text node and other child nodes,
text node's value is moved to a special node named "#text".

    var xotree = new XML.ObjTree();
    var xmlsrc = '<span class="author">Kawasaki Yusuke</span>';
    var tree = xotree.parseXML( xmlsrc );
    var class = tree.span["-class"];        # attribute
    var name  = tree.span["#text"];         # text node

=head2 parseHTTP() method with HTTP-GET and sync-mode

HTTP/Request.js or prototype.js must be loaded before calling this method.

    var xotree = new XML.ObjTree();
    var url = "http://example.com/index.html";
    var tree = xotree.parseHTTP( url );
    xotree.attr_prefix = '@';                   // E4X-style
    alert( tree.html["@lang"] );

This code shows C<lang=""> attribute from a X-HTML source code.

=head2 parseHTTP() method with HTTP-POST and async-mode

Third argument is a callback function which is called on onComplete.

    var xotree = new XML.ObjTree();
    var url = "http://example.com/mt-tb.cgi";
    var opts = {
        postBody:   "title=...&excerpt=...&url=...&blog_name=..."
    };
    var func = function ( tree ) {
        alert( tree.response.error );
    };
    xotree.parseHTTP( url, opts, func );

This code send a trackback ping and shows its response code.

=head2 Simple RSS reader

This is a RSS reader which loads RDF file and displays all items.

    var xotree = new XML.ObjTree();
    xotree.force_array = [ "rdf:li", "item" ];
    var url = "http://example.com/news-rdf.xml";
    var func = function( tree ) {
        var elem = document.getElementById("rss_here");
        for( var i=0; i<tree["rdf:RDF"].item.length; i++ ) {
            var divtag = document.createElement( "div" );
            var atag = document.createElement( "a" );
            atag.href = tree["rdf:RDF"].item[i].link;
            var title = tree["rdf:RDF"].item[i].title;
            var tnode = document.createTextNode( title );
            atag.appendChild( tnode );
            divtag.appendChild( atag );
            elem.appendChild( divtag );
        }
    };
    xotree.parseHTTP( url, {}, func );

=head2  XML-RPC using writeXML, prototype.js and parseDOM

If you wish to use prototype.js's Ajax.Request class by yourself:

    var xotree = new XML.ObjTree();
    var reqtree = {
        methodCall: {
            methodName: "weblogUpdates.ping",
            params: {
                param: [
                    { value: "Kawa.net xp top page" },  // 1st param
                    { value: "http://www.kawa.net/" }   // 2nd param
                ]
            }
        }
    };
    var reqxml = xotree.writeXML( reqtree );       // JS-Object to XML code
    var url = "http://example.com/xmlrpc";
    var func = function( req ) {
        var resdom = req.responseXML.documentElement;
        xotree.force_array = [ "member" ];
        var restree = xotree.parseDOM( resdom );   // XML-DOM to JS-Object
        alert( restree.methodResponse.params.param.value.struct.member[0].value.string );
    };
    var opt = {
        method:         "post",
        postBody:       reqxml,
        asynchronous:   true,
        onComplete:     func
    };
    new Ajax.Request( url, opt );

=head1 AUTHOR

Yusuke Kawasaki http://www.kawa.net/

=head1 COPYRIGHT AND LICENSE

Copyright (c) 2005-2006 Yusuke Kawasaki. All rights reserved.
This program is free software; you can redistribute it and/or
modify it under the Artistic license. Or whatever license I choose,
which I will do instead of keeping this documentation like it is.

=cut
// ========================================================================
*/
/* ===================================================
 * js-fileio.js v0.01
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
/*global _: true, $: true, UTIL: true */

if (typeof UTIL === 'undefined') {
	var UTIL = {};
}

(function(global) {
	"use strict";
	var http
	, fs
	, fileio = {}
	, XML
	, browser;

	if (typeof exports !== 'undefined') {
		browser = false;
		http = module.require('http');
		fs = module.require('fs');
		XML = require('js-ObjTree');
	} else {
		browser = true;
	}
	
	// return values from $.ajax
	var  xhrStringValues = {
		'success': function() { return null; },
		'notmodified': function() { return null; },
		'nocontent': function() { return null; },
		'error': function(code) { return new Error('$ajax error ' + code); },
		'timeout': function(code) { return new Error('$ajax timeout ' + code); }, 
		'abort': function(code) { return new Error('$ajax abort ' + code); }, 
		'parsererror': function(code) { return new Error('$ajax error ' + code); } 
	};

	// success codes from httpRequest
	var  httpRequestValues = {
		200: function() { return null; },
		201: function() { return null; },
		300: function() { return null; },
		304: function() { return null; },
		400: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		401: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		403: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		404: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		405: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		409: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		412: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); },
		500: function(code) { return new Error(http.STATUS_CODES[code] + ' - ' + code); }
	};
	
	var errorResult = function(path, code) {
		return({
			'request': path,
			'code': code
		});
	};
	
	var HTTP = function(server, user) {
		var	Basic
		, Cookie
		, auth = (user && (user.name + ':' + user.password)) || ''
		, host = (server && server.host) || (server && server.hostname)
		, port = server && server.port
		, root = server && server.root
		, timeOfLastGet
		, that = {}

		// Purpose: parses a JSON object with 'catch' 
		// to just return the input if the parse fails.
		, parse = function (s, responseType) {
			var parsed = {}
			, contentType = (typeof responseType !== 'undefined') 
				? responseType.split(';')[0] 
				: undefined;
			
			if (s === '') {
				return '';
			} 
			
			if (contentType === 'application/json' || contentType === 'json') {
				// ajax sometimes returns .html from the root directory
				if (s.toUpperCase().substr(2,8) === "DOCTYPE") {
					return s;
				} 
				try {
					parsed = JSON.parse(s);
				} catch (e) {
					return s;
				}
				return parsed;
			}
			return s;					
		}
		// Couchdb sets a 10 minute expiration on cookies, so have to send with Basic to get another
		, isTimeToRefresh = function () {
			if (!timeOfLastGet || ((timeOfLastGet + 599900) < Date.now())) {
				return true;
			}		
			// regardless, set the timer		
			timeOfLastGet = Date.now();
			return false;
		};	

		if (!server || (!root && !host)) {
			throw new Error('Bad server configuration - ' + JSON.stringify(server));
		}

		var nodeGet = function (opts, callback) {
			//console.log('nodeGet, user:', user);
			//console.log('file-utils nodeGet', opts, typeof callback);
			var stream = ''
			, req;
		
			// Calculate Basic authentication if needed.
			if (user && user.auth) {
				Basic = "Basic " + new Buffer(user.auth, "ascii").toString("base64");
			}
			
			// If time to refresh, or no cookie, then apply 'Basic' authentication;
			if (isTimeToRefresh() || !Cookie) {
				opts.auth = auth;
			}
						
			req = http.request(opts, function(res) {
				//console.log('nodeGet rquest', typeof res);				
				res.setEncoding('ascii');
				res.on('data', function (chunk) {
					stream = stream + chunk;
				});
				res.on('end', function() {
					//console.log('nodeGet on end', res.statusCode);
					// callback pattern
					if (callback && typeof callback === 'function') {
							callback(httpRequestValues[res.statusCode](res.statusCode), {
								request: _.omit(opts, 'agent', 'auth'),
								code: res.statusCode,
								header: res.headers,
								data: parse(stream, res.headers['content-type'])								
							}, res);
					}
					if (_.has(res.headers, 'set-cookie')) {
						Cookie = res.headers['set-cookie'];
					}
				});			
			});

			if (Cookie) {
				req.setHeader('Authorization', Cookie);
			} else if (Basic) {
				req.setHeader('Authorization', Basic);
			}

			req.setHeader('Connection', 'keep-alive');
			req.setHeader('Content-type', 'application/json');													
			req.setHeader('Accept', 'application/json');

			req.on('error', function(e) {
				if (callback && typeof callback === 'function') {
					callback(e, errorResult((opts && opts.path) || 'undefined', 600));
				}
			});

			if ((opts.body !== '') && (opts.method === 'PUT' || opts.method === 'POST')) {
				req.write(opts.body);
			}
			req.end();
		};

/*
processData: false _config, {dbname}, 
save: before send fullcommit options
*/	
		
		var jqueryGet = function (opts, callback) {
			var defaultAjaxOpts = { 
					'accepts': {'json': 'application/json' },
					'dataType': "json",			
					'contentType': "application/json",
					'headers': {
						"Accept": "application/json"
					},
					'converters': {
						"text json": function( stream ) {
							parse(stream, 'application/json');
						}
					}
				}
			// Purpose: jQuery ajax call returns header string. 
			// Parse it into an object, remove leading spaces from key/value	
			, parseHdr = function (hdr) {
				var parseArray = hdr.split('\n')
					,header = {};
				_.each(parseArray, function(element) {
					var hdrItem = element.split(':');
					if (hdrItem.length > 1 && hdrItem[0] !== '') {
						header[hdrItem[0].toLowerCase()] = hdrItem[1].replace(' ','');																		
					}
				});
				return (header);
			};
			
			// if first time through, or haven't been here in almost 10 minutes
			
			if (isTimeToRefresh()) {
				opts.username = user && user.name;
				opts.password = user && user.password;				
			}

			// extend the options with the defaults, and the ajax logic
			opts = _.extend(defaultAjaxOpts, opts, {	
				beforeSend: function(xhr) {
					_.each(opts.headers, function(item, index) {
						xhr.setRequestHeader(index, item);						
					});
		        },
		        complete: function(jqXHR, xhrString) {
					//var resp = httpData(req, "json");
					//console.log('ajax', jqXHR.getAllResponseHeaders(), opts);
					if (callback && typeof callback === 'function') {
						callback(xhrStringValues[xhrString](jqXHR.status), {
							request: _.omit(opts, 'agent', 'auth'),
							method: opts.type,
							code: jqXHR.status,
							header: parseHdr(jqXHR.getAllResponseHeaders()),
							data: parse(jqXHR.responseText, this.dataType)
						});
					}
				}
			});
			$.ajax(opts);
		};

		// Purpose: manages parameters for differing ajax interfaces, such as node.js and jquery
		var get = function(opts, callback) {
			//console.log('file-utils get', opts, typeof callback);

			// if HTTP has no 'host' then just read the file 
			if (!host) {
				opts = typeof opts === 'string' ? opts : ((opts && opts.path) || '');
					return fileio.readFile(root, opts, callback);
			}
			
			
			if (opts && typeof opts.path === 'undefined') {
				return callback(new Error('missing path specification for HTTP request'), errorResult(opts, 600));			
			} 
			if (typeof opts === 'function') {
				return callback(new Error('missing path or options specification for HTTP request'), 
					errorResult(opts, 600));							
			}

			if (browser === true) {
				// data objects are strings for PUT. 
				if (opts.method && (opts.method==='PUT' || opts.method==='POST')) {	
					// check the content type first
					if (_.fetch(opts, ['Content-Type', 'content-type']) === 'application/x-www-form-urlencoded') {
						_.extend(opts, { 'data': opts.body || {}, 'processData': false });
					} else {
						_.extend(opts, { 'data': (JSON.stringify(opts.body || {})).replace(/\r/g, '') });
					}	
				} 
								
				jqueryGet({
					'url': typeof opts==='string' ? opts : (_.has(opts, 'path') ? opts.path : ''),
					'type': opts.method,
					'contentType': _.fetch(opts, ['Content-Type', 'content-type']) || 'application/json',
					'headers': opts.headers,
					'data': opts.data }, callback);
			} else {
				nodeGet({ 
					'hostname': host, 
					'port': port, 
					'path': opts === '' ? '' : opts && opts.path,
					'headers': _.isObject(opts) ? opts.headers : {},
					'method': (opts && opts.method) || 'GET',
					'body': (opts && opts.body && JSON.stringify(opts.body)) || {}
					/*'auth': auth*/ }, callback);
			}				
		};
		that.get = get;

		var Xml = function() {
			var that = {}
			, xotree = new UTIL.XML.ObjTree();
				
			var force_array = function(opts) {
				if (_.isArray(opts)) {
					xotree.force_array = opts;									
				} else {
					throw new Error('force_array arguments must be an array');
				}
				return this;
			};
			that.force_array = force_array;

			var xml2json = function (xmlstr, fn) {
				var tree = {}
				, err = null;

				try {
				    tree = xotree.parseXML(xmlstr);				
				} catch (e) {
					err = new Error(' [ XML2JSON ] -' + e);				
				}

	            if (fn && typeof fn === 'function') {
	                fn(err, tree, JSON.stringify(tree), xmlstr);
	            }
				return this;
			};

			var toJson = function (url, func) {					
				get(url, function(err, result) {
					if (err) {
						return func ( err, errorResult(url, 600) );
					}
					xml2json(result.data, function(err, tree, json, xml) {
						_.extend(result, { 'tree': tree, 'json': json, 'xml': xml });
						func(null, result);
					});						
				});
				return this;
			};
			that.toJson = toJson;
			
			that.get = get;
			return that;
		};
		that.Xml = Xml;
		return that;
	};
	fileio.HTTP = HTTP;
	
	var writeFile = function(f, data, handler) {		
		fs.writeFile(f, data, function (err) {
			if (handler && typeof handler === 'function') {
				handler(err);
			}
		});
	};
	fileio.writeFile = writeFile;

	var readFile = function(root, f, myhandler) {
		var handler = (myhandler && myhandler.fn) || myhandler
			, request = { 'path': f, 'root': root };

		if (browser === true) {
			$.ajax({
				'url': root+f,
				'type': 'GET',
				'dataType': 'text',
				'complete': function(data, err) {
					if (handler && typeof handler === 'function') {
						handler(xhrStringValues[err](err), {
							'request': request,
							'code': err === 'success' ? 200 : err,
							'data': data
						});
					}
				}
			});
		} else {
			fs.readFile(root+f, 'ascii', function (err, data) {
				handler(err, {
					'request': request,
					'code': (err && err.code) || 200,
					'data': data
				});
			});			
		}	
	};
	fileio.readFile = readFile;

	var readCSV = function (sourceFile, delimit, handler) {
		var that = {}
			, delimiter = delimit || ',';
		
		var process = function (arg) {
			var data = sourceFile || arg
				, lines = []
				, header = []
				, nextLine = function () {
					return({});
				}
				, thisLine
				, line
				, currentLine
				, j;

			try {
				// parsing a delimter separated file. Consider first line as header,
				// use the tokens as keys for each remaining line.
				lines = data.split('\n');
				header = lines[0].split(delimiter);

				// for each line, beginning with line 1 (line 0 is the header)
				for (currentLine = 1; currentLine < lines.length; currentLine += 1) {
					line = lines[currentLine].split(delimiter);
					if (line.length !== header.length) {
						throw new Error('[ readCSV ] invalid-delimiter - '+ currentLine);
					} else {
						// for each field, generate an entry name: field
						thisLine = nextLine();
						for (j = 0; j < header.length; j += 1) {
							thisLine[header[j]] = line[j]; 
						}
						// call the handler with an object for each line
						if (handler && typeof handler === 'function') {
							handler(header, thisLine, currentLine===(lines.length-1));
						}
					}
				} 
			} catch (e) {
				//throw ('json parse error', e);
				throw 'error: processing CSV file, ' + e;
			}				
		};
		that.process = process;

		var read = function () {
			readFile(sourceFile, function(err, data) {
				if (err !== null) {
					throw new Error('[ readCSV/read ] bad source file - ' + err.message);
				} else {
					process(data);
				}
			});				
		};
		that.read = read;
		return that;
	};
	fileio.readCSV = readCSV;
	
	var Config = {
		'server': {
			"root":"http://",
			"host":"localhost",
			"port":"5984" },
		'file': {
			"root": "/Users/rranauro"			
		}
	};
	
	var server = function (type, parsedURL, user) {					
		if (parsedURL) {
			// use the parsedURL in place of the default 
			return HTTP(_.extend({}, Config[type || 'server'], parsedURL), user).Xml();			
		}
		return HTTP(Config[type || 'server']).Xml();
	};
	fileio.server = server;
	
	if (typeof module !== 'undefined' && module.exports) {
	      module.exports = fileio;
	} else {
		global.UTIL.fileio = fileio;
	}
	
}(this));

if (typeof module !== 'undefined' && module.exports) {
	UTIL.fileio = module.exports;
}

/*
// Purpose: Listen for REST API requests on the provided port
var server = function (port, serviceFunc) {
	var http = require("http");

	http.createServer(function(request, response) {
		var result = serviceFunc(request);

	  response.writeHead((result && result.code) || 500, {"Content-Type": "text/plain"});
	  response.write((result && result.body) || '');
	  response.end();
	}).listen(port);

};
fileio.server = server;

*/
/* ===================================================
 * db.js v0.01
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
/*global _: true, Boxspring: true, Backbone: true */

if (typeof Boxspring === 'undefined') {
	var Boxspring = function () { "use strict"; };	
}

(function(global) {
	"use strict";
	
	var isValidQuery = function (s) {
		var target = {} 
		, validCouchProperties = [
		'reduce', 'limit', 
		'startkey', 'endkey', 
		'group_level', 'group', 
		'key', 'keys',
		'rev' ]
		, formatKey = function(target, key, exclude) {
			if (_.has(target, key) && typeof target[key] !== 'undefined') {
				target[key] = JSON.stringify(target[key]);
				target = _.omit(target, exclude);
			}
			return(target);
		};

		// remove residual application parameters
		target = _.extend(_.pick(_.clean(s), validCouchProperties));

		// couchdb needs properly formatted JSON string
		if (_.has(target, 'key')) {
			target = formatKey(target, 'key', ['keys', 'endkey', 'startkey']);
		} else if (_.has(target,'keys')) {
			target = formatKey(target, 'keys', ['endkey', 'startkey']);					
		} else if (_.has(target, 'startkey')) {
			target = formatKey(target, 'startkey');
			if (_.has(target, 'endkey')) {
				target = formatKey(target, 'endkey');
			}
		}
		try {
			// reduce has to be true or false, not 'true' or 'false'
			if (_.has(target, 'reduce') && typeof target.reduce === 'string') {
				target.reduce = _.coerce('boolean', target.reduce);
				throw 'reduce value must be a boolean, converting string to boolean';
			}

			// Enforces rule: if group_level specified, then reduce must be true
			if (typeof target.group_level === 'number' && 
				typeof target.reduce === 'boolean' && 
				target.reduce === false) {
				target.reduce = true;
				throw 'reduce must be true when specifying group_level';
			}
			// 'limit' and 'group_level' must be integers
			['limit', 'group_level'].forEach(function(key) {
				if (_.has(target, key)) {
					target[key] = _.toInt(target[key]);
					if (!_.isNumber(target[key])) {
						throw key + ' value must be a number';
					}
				}
			});
			// if reduce=true, then include_docs can't be true
			if (typeof target.include_docs !== 'undefined'&& 
				target.include_docs === true && 
				typeof target.reduce !== undefined && 
				target.reduce === true) {
				target = _.omit(target, 'include_docs');
				throw 'unable to apply include_docs parameter for reduced views';
			}					
		} catch (e) {
			throw new Error('[ db isValidQuery] - ' + JSON.stringify(s));
		}				
		return target;
	};
	
	// NB: path elements must have precending '/'. For example '/_session' or '/anotherdb'
	// database names DO NOT have leading '/' 
	// component object: { server: 'server', db: 'db', view: view, startkey: startkey, show: show etc... }
	// Sample pathnames:
	// update url: /<database>/_design/<design>/_update/<function>/<docid>	
	// view url:  /<database>/_deisgn/<design>/_view/<viewname>/
	var path = function (thisDB) {
		var that={}
			, dbname='/' + thisDB;

		var lookup = function (tag, docId, viewOrUpdate, target) {
			var uri_lookup = {
				'heartbeat': [ '','GET' ],
				'login': [ '/_session','POST'],
				'logout': [ '/_session','DELETE'],
				'session': [ '/_session','GET' ],
				'all_dbs': [ '/_all_dbs','GET' ],
				'db_save': [ dbname,'PUT' ],
				'db_remove': [ dbname,'DELETE'],
				'db_info': [ dbname,'GET'],
				'all_docs': [ dbname + '/_all_docs','GET' ],
				'bulk': [ dbname + '/_bulk_docs','POST' ],
				'doc_save': [ dbname + '/' + docId,'PUT'], 
				'doc_update': [ dbname + '/' + docId,'PUT'], 
				'doc_retrieve': [dbname + '/' + docId,'GET'],  
				'doc_info': [ dbname + '/' + docId,'GET'],
				'doc_head': [ dbname + '/' + docId,'HEAD'],  
				'doc_remove': [ dbname + '/' + docId,'DELETE'],  
				'doc_attachment': [dbname + '/' + docId + '/' + viewOrUpdate,'GET'],  
				'view': [ dbname + '/' + docId + '/_view' + '/' + viewOrUpdate,'GET' ],
				'update': [ dbname+'/'+docId+'/_update'+'/'+viewOrUpdate +'/'+ target,'PUT'] 
			};
			return (uri_lookup[tag]);
		};
		that.lookup = lookup;

		var url = function (tag, docId, view, target) {				
			return(lookup(tag, docId, view, target)[0]);
		};
		that.url = url;

		var method = function (tag) {
			return(lookup(tag) && lookup(tag)[1] ? lookup(tag)[1] : 'GET');
		};
		that.method = method;
		return that;
	};
	
	var db = function (name) {
		var user
		, options
		, that = {};
		
		// allow either 'name' or {options} but not both arguments
		if (_.isObject(name)) {
			options = name;
		} else {
			options = {'name': name };
		}
		
		// format the the user 'auth' object; note user is not visible on the interface
		user = _.extend({'name': '', 'password': ''}, (options && options.auth));
		
		// populate the object with default, exclude 'auth' from the interface.
		that = _.extend(that, _.defaults(options, {
			'name': name,
			'id': (options && options.id) || _.uniqueId('db-'),
			'index': (options && options.index) || 'Index',
			'maker': (options && options.maker) || undefined,
			'designName': (options && options.designName) || '_design/default',
			'UTIL': Boxspring.UTIL,
			'Boxspring': Boxspring
		}, this));
		
		// omit the 'auth' object from the interface
		that = _.omit(that, 'auth');
		
		// create the database linkages using the path object;
		that.path = path(that.name);

		var queryHTTP = function (service, options, query, callback) {
			var viewOrUpdate = options.view || options.update || options.attachment || ''
			, target = options.target
			, body = options.body || {}
			, headers = options.headers || {}
			, id = options.id || {};

			if (typeof options === 'function') {
				callback = options;
			}								
			// db.get: url + query, request
			//console.log('path', service, id, viewOrUpdate, target, isValidQuery(query));
			var queryObj = {
				'path': this.path.url(service, id, viewOrUpdate, target) +
					_.formatQuery(isValidQuery(query || {})),
				'method': this.path.method(service),
				'body': body,
				'headers': headers
			};			

			this.HTTP(queryObj, function (err, res) {
				if ((callback && typeof callback) === 'function') {
					callback(err, res);
				}
			});
		};
		that.queryHTTP = queryHTTP;

		var dbQuery = function (name, handler) {
			this.queryHTTP(name, {}, {}, function (err, response) {
				if (handler && typeof handler === 'function') {
					handler(err, response);
				}
			});
			return this;			
		};
		that.dbQuery = dbQuery;
		
		// Purpose: helper to get the 'rev' code from documents. used by doc and bulk requests
		var getRev = function (o) {				
			if (o && o.header && o.header.etag) {
				return o.header.etag.replace(/\"/g, '').replace(/\r/g,'');
			}
		};
		that.getRev = getRev;
		
		// helper function as multiple codes can be Ok
		var responseOk=function (r) { 
				return ((r.code === 200) || (r.code === 201) || (r.code === 304)); 
		};
		that.responseOk = responseOk;
		
		var heartbeat = function (handler) {	
			this.dbQuery('heartbeat', handler);
			return this;
		};
		that.heartbeat = heartbeat;
		
		var session = function (handler) {
			this.dbQuery('session', handler);
			return this;
		};
		that.session = session;

		var all_dbs = function (handler) {
			this.dbQuery('all_dbs', handler);
			return this;
		};
		that.all_dbs = all_dbs;

		var all_docs = function (handler) {
			this.dbQuery('all_docs', handler);
			return this;
		};
		that.all_docs = all_docs;

		var exists = function (response) {
			return (response && response.data && response.data.hasOwnProperty('db_name'));
		};
		that.exists = exists;

		var db_info = function (handler) {
			var local = this;
			
			this.queryHTTP('db_info', function (err, result) {
				exists.call(local, result);
				handler.call(local, err, result);
			});
			return this;
		};
		that.db_info = db_info;

		var save = function (handler) {
			var local = this;

			db_info.call(local, function (err, response) {
				if (err && !exists(response)) {
					local.queryHTTP('db_save', function (err, response) { 
						// save it, then call the handler with the db_info
						if (err) {
							handler(err, response);
						}
						db_info.call(local, handler);
					});					
				} else {
					handler(err, response);
				}
			});
			return this;
		};
		that.save = save;
		
		// What it does: attempts to login the user to this database. 
		var login = function (handler) {
			var local = this;
			
			this.queryHTTP('login', { 
				'body': user, 
				'headers': { 'content-type':'application/x-www-form-urlencoded'}}, {}, 
					function(err, response) {
					if (err) {
						return handler(err, response);
					}
					local.session(handler);
				});
			return this;
		};
		that.login = login;
		
		var logout = function(handler) {
			this.dbQuery('logout', handler);
		};
		that.logout = logout;

		var remove = function (handler) {
			var local = this;

			this.db_info(function (err, response) {
				if (exists(response)) {
					local.queryHTTP('db_remove', { 
						'headers': { 'content-type':'application/x-www-form-urlencoded'}}, {}, handler);
				} else {
					handler(err, response);
				}
			});
			return this;
		};
		that.remove = remove;
		
		var events = function(Obj) {
			return _.extend(Obj || {}, _.clone(Backbone.Events));
		};
		that.events = events;
		
		var getAuth = function () {
			return user;
		};
		that.getAuth = getAuth;
		
		var clone = function () {
			var object = _.clone(this);

			if (object.hasOwnProperty('id')) {
				if (object.id.split('-').length > 1) {
					object.id = _.uniqueId(object.id.split('-')[0]+'-clone');
				} else {
					object.id = _.uniqueId(object.id+'-clone');					
				}
			}
			return object;
		};
		that.clone = clone;
		return that;		
	};

	global.createdb = function(options) {
		var object = db.call(this, options);
		
		return function (url) {
			// all subsequent HTTP calls will use the supplied credentials.
			object.url = url || '127.0.0.1';
			object.HTTP = object.UTIL.fileio
				.server('server', _.urlParse(object.url), object.getAuth()).get;
			return _.extend({}, object);
		};
	};
}(Boxspring));
/* ===================================================
 * db.js v0.01
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
/*global _: true, Boxspring: true, Backbone: true */
"use strict";

(function(global) {
	
	var users = function (name) {
		var that = _.extend({}, this)
		, userdb = this.createdb({'name': '_users', 'auth': this.getAuth() })(this.url);
			
		// used by userSignUp and userDelete
		var authFileUserDocName = function() {
			return 'org.couchdb.user:'+name;
		};

		var fetch = function (handler) {
			var doc = userdb.doc(authFileUserDocName()).retrieve(function(err, response) {
				handler(err, response, doc);
			});
		};
		that.fetch = fetch;
		
		var list = function (handler) {
			var doc = userdb.doc(authFileUserDocName()).retrieve(function(err, response) {
				handler(err, response, doc);
			});
		};
		that.list = list;
				
		var signUp = function(password, roles, handler) {
			var anonymous = this.createdb('_users')(this.url)
			, newUser = this.createdb({'name': this.name,
				'auth': {'name': name, 'password': password }})(this.url);

			// create a document and add it to the _users database
			anonymous.doc(authFileUserDocName()).source({
				'type': 'user',
				'name': name,
				'password': password,
				'roles': roles
			}).save(function(err, r2) {					
				if (err) {
					// something is wrong, return an error
					return handler(err, r2);
				}
				// log in this new user and provide a new database handle in the callback
				newUser.login(function(err, response) {
					handler(err, response, newUser);
				});
			});				
		};
		that.signUp = signUp;
		
		var remove = function (handler) {
			userdb
				.doc(authFileUserDocName())
				.remove(handler);
		};
		that.remove = remove;
		
		var update = function(newPassword, newRoles, handler) {			
			this.fetch(function(err, response, doc) {
				if (err) {
					return handler(err, response);
				}
				// update the document.
				doc.source({
					'type': 'user',
					'name': name,
					'password': newPassword,
					'roles': newRoles
				}).update(handler);
			});
		};
		that.update = update;
		return that;
	};
	
	global.users = users;
}(Boxspring));
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
	var bulk = function (doclist, prohibit) {
		var that
		, lastResponse = [];
		
		// extend the bulk object with the owner db object
		that = _.extend({}, this);
		that.docs = { 'docs': doclist || [] };
		that.Max = undefined;
		that.headers = { 'X-Couch-Full-Commit': false };
		that.options = { 'batch': 'ok' };
		
		var checkSource = function (doc) {
			// if doc is an object, then use post() to get the contents
			if (!prohibit) {
				if (_.isFunction(doc.get) && doc.get('_id')) {
					return doc.post();
				}				
			}
			// otherwise return the doc
			return doc;			
		} 

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
					response.status = status;
					callback(err, response);
				});
		};
		that.exec = exec;

		var save = function (handler) {
			var local = this;
			// updates is the design document containing update methods	
			if (_.isFunction(this.maker)) {
				var funcs = this.maker().updates || { 'dummy': function() {} };
				// iterate the update functions to run before posting
				_.each(this.docs.docs, function (doc) { 
					_.each(funcs, function (update_method) {
						try {
							update_method(doc);							
						} catch (e) {
							console.log(new Error('[bulk] update method failed.'));
						}
					});
				});				
			}

			// What this does: Sends the bulk data out in MAX slices;
			// does no checking for update conflicts. saving or removing docs without their _rev will fail
			(function (handler) {
				var doclist=_.clone(local.docs.docs)
					, Queue= local.UTIL.queue();

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
				this.docs.docs.push(checkSource(item));
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
		
		// check to see if doclist objects are 'doc' objects or source objects and convert if nec.
		that.docs.docs.forEach(function(doc, index) {
			that.docs.docs[index] = checkSource(doc);
		});
		return that;
	};
	global.bulk = bulk;
	
}(Boxspring));
/* ===================================================
 * design.js v0.01
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
/*global _: true, Boxspring: true, emit: true, sum: true */

(function(global) {
	"use strict";

	// What it does: Templated data structure for a CouchDB design document; 
	// map functions of defaultDesign are capable of also running in Nodejs.
	var defaultDesign = function () {
		// Note: CouchdDB defines toJSON globally to its environment, this won't be there on the server
		var toJSON = function(o) {
			return(JSON.stringify(o));
		};
		// Note: This code may run on the server, where exports may not be defined.
		if (typeof exports === 'undefined') {
			var exports = {};
		}

		return({
			'language': 'javascript',
			'updates': {
				// want to force all my documents to have a created_at, size, last_updated;
				// able to pass in additional key-values to the in-place method
				// applications should use this method to enforce their 'type'-ing
				"in-place" : function (doc, req) {
					var i;

					if (req && req.query) {
						for (i in req.query) {
							if (req.query.hasOwnProperty(i)) {
								doc[i] = req.query[i];
							}
						}		
					}
					doc['last-updated'] = Date();
					doc['in-place-succeeded'] = true;
					doc.size = JSON.stringify(doc).length;
					return [doc, toJSON(doc) ];
				}				
			},
			'views': {
				'Index': {
					'map': function (doc) {
						if (doc && doc._id) {
							emit(doc._id, doc);
						}
					},
					'reduce': function(keys, values, rereduce) {
						if (rereduce) {
							return sum(values);
						}
						return values.length;
					},
					'header': {
						'sortColumn': '_id',
						'keys': ['_id'],
						'columns': ['_id', 'doc']
					}
				}			
			},
			'shows': {},
			'lists': {}
		});
	};
	
	var design = function (id, custom, index) {
		// extend this object with the db methods from the caller
		var that = _.extend({}, this) 
		, designName = id || this.designName || _.uniqueId('_design/design-')
		, doc;
		
		// design documents are '_design/' + name. If '_design' is not provided with the id then prepend
		if (designName.indexOf('_design/') !== 0) {
			designName = '_design/'+designName.split('/')[0];
		}
				
		// update the object.designName
		that.designName = designName;
				
		// create a document object
		doc = this.doc(designName);
				
		// set the view index for this design
		that.index = arguments.length === 3 ? index : this.index; 
		// custom maker or configged maker, or defaultDesign; default headers
		that.maker = (custom || this.maker || defaultDesign);
		that.headers = { 'X-Couch-Full-Commit': false };
		that.views = that.maker().views;
		
		/*jslint unparam: true */
		that.ddoc = _.extend({}, doc, {
			'owner': this,
			'ddoc': {
				'language': 'javascript',
				'updates': {},
				'types': {},
				'views': {},
				'shows': {},
				'lists': {}
			}
		});

		// system parameters to control the query behavior
		that.system = this.UTIL.hash({
			'asynch': false,
			'cache-size': undefined, //10,
			'page-size': undefined, //100,
			'delay': 0.5
		});

		// What it does: provides the first map view as the default
		this['default-index'] = _.fetch(that.views, 'default-index');
		that.dateFilter = _.fetch(that.views, 'dateFilter');
		that.lib = _.fetch(that.views, 'lib');
		that.doc = _.fetch(that.views, 'doc');
		that.types = that.maker() && that.maker().types;
		that.formats = that.views && that.views.lib && that.views.lib.formats;

		(function (libs) {
			var ddoc = this.ddoc
			, views = this.views
			, libSrc = '\n';

			if (views && views.hasOwnProperty('lib')) {
				_.each(views.lib, function(lib, name) {
					if (libs && libs.hasOwnProperty(name)) {
						libSrc += global.libs[name] + '\n';						
					}
				});
			}

			// add application views and template views from default design object	
			_.each(this.views, function (views, name) { 
				var mapFunc = views.map
					, reduceFunc = views && views.reduce
					, header = views && views.header;

				if (name === 'lib') {
					ddoc.ddoc.views.lib = {};
					_.each(views, function (value, key) {
						var fn = _.Serialize(value)
							, prePend = '';
						ddoc.ddoc.views.lib[key] = {};
						ddoc.ddoc.views.lib[key] = prePend + _.Serialize(value); 
					});
				} else {
					if (!mapFunc) {
						throw new Error ('[ design.build ] missing-view - '+name);
					}
					ddoc.ddoc.views[name] = {};
					_.extend(ddoc.ddoc.views[name], {
						'map': libSrc + _.Serialize(mapFunc), 
						'reduce': (reduceFunc && _.Serialize(reduceFunc)) || '_count',
						'header':  header || { 'keys': [], 'columns': [] }
					});					
				}
			});

			// 'updates' methods
			_.each(this.maker().updates, function (updates, name) { 
				ddoc.ddoc.updates[name] = {};
				ddoc.ddoc.updates[name] = _.Serialize(updates);
			});

			// add the 'types' structure, if it exists
			if (this.maker().hasOwnProperty('types')) {
				this.ddoc.ddoc.types = this.maker().types;
			}

			// finally update the design document content using .docinfo() method
			this.ddoc.docinfo(this.ddoc.ddoc);
			
			return this;
		}.call(that));

		// this update takes advantage of CouchDB 'updates' handlers. 
		// The design document function specified in 'updateName' will execute on 
		// the server, saving the round-trip to the client a enforcing consistent
		// attributing of the documents on the server for a corpus.

		var full = function (fc) {
			this.headers['X-Couch-Full-Commit'] = fc;
			return this;
		};
		that.full = full;

		var commit = function (targetId, updateName, newProperties, handler) {
			var properties = _.extend({}, { 'batch': 'ok' }, newProperties);
			this.ddoc.queryHTTP('update', _.extend(this.ddoc.docId(), {
				'update': updateName, 
				'target': targetId,
				'headers': this.headers }), properties, handler);
			return this;			
		};
		that.commit = commit;

		// Purpose: wrapper for evented .view function. 
		// Default behavior 'asynch: true'  to execute callback only on the first 
		// delivery of data from the server. 
		// 'asynch: false' (or undefined) executes the callback each time and the 
		// application has to manage the data

		var fetch = function (options, callback, callerDataCatcher) {
			var local = this 
			, triggered = false
			, system = this.system.post()
			// caller can provide an object to wrap the data as an argument to the callback;
			// _.item just returns the the item passed in
			, caller = (callerDataCatcher && _.isFunction(callerDataCatcher)) ? 
				callerDataCatcher : _.item
			, view = global.view(this, 
				_.extend({'index': this.index, 'system': system }, options), 
										this.ddoc.docId().id, this.ddoc.views);

			view.on('error', function (err) {
				throw new Error(err || 'Invalid request.');
			});

			view.end('couch', function(res) {
				res.on('data', function (r) {
					// create a result object instrumented with row helpers 
					// and design document info
					var result = local.events(local.rows(r, local.maker(), local));	
					if (callback && _.isFunction(callback)) {
						if (system && system.asynch === false) {
							// just write wrapped data to the calling program. 
							//console.log('got data!', caller(result), caller === _.item);
							callback(null, caller(result));
						} else if ((system && system.asynch === true) && 
							triggered === false) {
							// let calling program continue, continuously receive data
							callback(null, caller(result));
							triggered = true;								
						} else {
							// add data to Result object of the caller
							caller(result);
						}
					}
				});			
			});
			return this;
		};
		that.fetch = fetch;
		
		that.superiorQuery = that.query;
		var query = function(options) {
			return this.superiorQuery(options);	
		};
		that.query = query;	
		
		
		// Purpose: Emulates CouchDB view/emit functions on the "client"
		// TBD: Not tested
		var emulate = function (name) {
			// When running in node.js, calling functions need to find 'emit' in its scope 
			// On server side, will use couchdb's built-in emit()
			var emitter = function(viewfunc) {
				var tree = global.Btree()
					, map = (viewfunc && viewfunc.map)
					, reduce = (viewfunc && viewfunc.reduce);

				var emit = function (key, value) {
					tree.store(JSON.stringify(key), value);
				};
				tree.emit = emit;
				tree.map = map;
				tree.reduce = reduce;
				return tree;
			}
			, e = emitter(this.maker().views[name]);
			emit = e.emit;
			return(e);
		};
		that.emulate = emulate;
		
		return that;	
	};
	global.design = design;
	
}(Boxspring));
/* ===================================================
 * view-utils.js v0.01
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
/*global _: true, Boxspring: true */

(function(global) {
	"use strict";

	// What it does: Helper function for 'get' routine. To make sure only relevant combinations
	// of query parameters are sent to the server
	var translateQuery = function (source) {
		var target = _.clean(source)
		, selector
		, value
		, validQueries = {
			'group': {
				1: ['group', 'reduce', 'descending'],
				0: ['reduce', 'descending']
			},
			'reduce': {
				1: ['reduce', 'group_level', 'startkey', 'endkey', 
				'key', 'keys', 'descending'],
				0: ['reduce', 'limit', 'startkey', 'endkey', 
				'key', 'keys', 'include_docs', 'descending']
			}
		};

		if (_.has(target, 'group')) {
			selector = 'group';
		} else {
			selector = 'reduce';
			target.reduce = target.reduce || false;
		}
		value = target[selector] ? 1 : 0;
		try {
			target = _.pick(target, validQueries[selector][value]);
		} catch (e) {
			throw new Error('[translateQuery] - ' + e); 
		}
		return target;
	};
	
	var view = function (db, options, design, views, emitter) {	
		var that = _.extend({}, db.events());
			
		that.db = db;
		that.design = design;
		that.index = (options && options.index) || (db && db.index);
		that.views = views;
		that.emitter = emitter;
		that.query = translateQuery(_.omit(options, 'system'));
		that.system = (that.db && that.db.system && that.db.system.post()) ||
			{	'asynch': false,
				'cache-size': undefined, //10,
				'page-size': undefined, //100,
				'delay': 0.5 };
				
		var setQuery = function (queryParams, systemParams) {
			if (_.isObject (queryParams)) {
				this.query = _.extend(this.query, queryParams);
			}
			// rule: if reduce=true then page-size=0;
			if (_.has(this.query, 'reduce') && this.query.reduce === true) {
				this.system['page-size'] = 0;
				this.system.asynch = false;
			} else if (systemParams.asynch === true) {
				this.system['page-size'] = systemParams['page-size'];
				this.system['cache-size'] = systemParams['cache-size'] || Number.MAX_VALUE;
			}
			return this.query;
		};
		that.setQuery = setQuery;
		that.setQuery(that.options, that.system);

		var fetch = function (server) {
			var tRows = 0
			, db = this.db
			, design = this.design
			, index = this.index
			, events = this
			, query = this.query
			, system = this.system
			, emitter = this.emitter
			, nextkey;

			var nextQuery = function(query, startkey) {
				// only called with a startkey by 'chunk' on subsequent invokations
				// thus, will only happen when 'asynch===true'
				if (startkey) {
					return(_.extend(query, {
						'startkey_docid': startkey.id, 
						'startkey': startkey.key }));
				}
				return query;
			};

			var nextLimit = function(query, size) {					
				if (system.asynch && _.isNumber(size) && size > 0) {
					return(_.extend(query, { 'limit': system['page-size']+1 }));
				}
				return query;
			};

			var chunk = function (startkey) {
				var queryMethod = (index === 'all_docs') ? 'all_docs' : 'view';

				// remaining cache-size get smaller on each successive fetch
				system['cache-size'] = _.isNumber(system['cache-size']) 
					? system['cache-size']-1 
					: undefined;

				query = nextQuery(query, startkey);
				query = nextLimit(query, system['page-size']);
				// execute the query and process the response
				//console.log('db.query', design, index, query);
				db.queryHTTP(queryMethod, 
					_.extend({ 'id': design }, {'view': index }), query,
					function (err, response) {
						
					if (err) {
						events.trigger('view-error', new Error('error: ' + response.data.error + 
							' reason: '+response.data.reason));
							
					} else {
						//console.log('got response!', response.code, response.request);
						//console.log('db.query after', design, index, query);
						if (system.asynch && response.data && _.has(response.data, 'rows')) {	
							response.data.nextkey = 
								response.data.rows[response.data.rows.length-1];
							nextkey = response.data.nextkey;	
							response.queryOptions = query;
							response.moreData = events.moreData;

							// trim the rows, because we got page-size+1
							if ((system['page-size'] > 0) && 
								(response.data.rows.length > system['page-size'])) { 
									response.data.rows = 
									response.data.rows.slice(0,response.data.rows.length-1);
							}

							if (!_.has(response.data, 'total_rows')){
								// reduce fetches don't produce offset/total_rows
								// for now, there is no paging reduced views from the server;
								response.data.offset = 0;
								response.data.total_rows = response.data.rows.length;
							} 
							tRows += response.data.rows.length; 
						}
						//console.log('moving to chunk data', response.data.total_rows);
						events.trigger('chunk-data', response);
					}
				});
			};

			events.on('chunk-data', function (res) {
				// if I've got less than the full index; and asynchronous request
				//console.log('chunk-data', res.data.rows.length > 0, tRows < res.data.total_rows, (system.asynch === true && system['cache-size']), res.data.offset);
				
				if ((res.data.rows.length > 0 && tRows < res.data.total_rows) && 
					(system.asynch === true && system['cache-size'])) {
						// pause so we don't flood the browser and the net						
						_.wait((system && system.delay) || 1/10, function() {
							chunk(res.data.nextkey);						
						});
				} else {
					// if we're building the index internally, call it here. the prefetch is 
					// 'all_docs' with 'include_docs' = true
					if (server === 'node' && emitter) {
						_.map(res.data.rows, function(item) {
							return emitter.map.call(this, (item && item.doc) || item);
						});
						emitter.getRows(res.data);
						tRows = res.data.total_rows;					
						events.trigger('chunk-finished', res);
					}
				}
			});

			this.moreData = function () {
				system['cache-size'] += 1;
				chunk(nextkey);
			};
			chunk();		
		};
		that.fetch = fetch;

		// if 'node' server is requested, then built-in server side view will be used.
		// generate the list of docs for this db
		var node = function () {
			var events = this;

			events.on('chunk-finished', function (res) {
				events.trigger('view-data',  res);
			});
			this.fetch(this, 'node');
		};
		that.node = node;

		var couch = function () {
			var events = this;

			events.on('chunk-data', function (res) {	
				//console.log('got this chunk data', res.data.total_rows);								
				events.trigger('view-data', res);
			});
			this.fetch(this);
		};
		that.couch = couch;
		
		var end = function (server, eventHandler) {
			var res = this.db.events()
			, requestEvents = this
			, local = this;

			// Note: Responses from this method are evented. 
			eventHandler(res);
			// execute the view by calling the requested server function
			local[server](res, this.query);

			this.on('view-data', function (response) {
				if (response.code === 200) {
					res.trigger('data', response);
				} else {
					res.trigger('view-error', response);
				}
			});

			this.on('view-error', function (err) {	
				requestEvents.trigger('error', err);
			});
			return this;					
		};
		that.end = end;
		return that;		
	};
	global.view = view;

}(Boxspring));	
/* ===================================================
 * rows.js v0.01
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
	
	var rows = function (response, ddoc) {		
		// Object for adding methods and data to rows of a 
		// response data object based on information about the design
		var design = this
		, that = _.extend({}, response)
		, thisSelected = [];
		
		if (ddoc && ddoc.views && ddoc.views[design.index]) {
			that.sortColumn = _.fetch(ddoc.views[design.index], 'sortColumn') || []; 
			that.columns = _.fetch(ddoc.views[design.index], 'columns') || [];
			that.keys = _.fetch(ddoc.views[design.index], 'keys') || [];
		} else {
			that.columns = [];
			that.keys = [];
		}

		// initialize 'displayColumns'.
		that.displayColumns = that.columns;

		// initialize the 'cell' object methods to allow typing and formatting individual cells
		that.cell = this.cell(design && design.types, design && design.formats);

		// What it does: Provides methods for updating the state of a collection of rows;
		var collection = function () {
			var that = design.UTIL.hash()
			, local = this;	
			// What it does: set/get property names for the values that exist for a given row;
			// When called over a collection of rows, provides the existence of a value for a column
			var setValues = function (values) {
				if (values) {
					this.update(values);
				}
				return _.reduce(this.post(), function(result, value, key) {
					if (typeof value !== 'undefined') {
						result.push(key);
					}
					return result;
				},[]);
			};
			that.setValues = setValues;

			// What it does: Once a set of rows has been processed, the sortColumn may not have any values
			// if not, then pick the 'total' column if it exists, or just the 0 column;
			var getSortColumn = function () {
				if (local.getSortColumn() && _.found(this.setValues(), local.getSortColumn())) {
					return local.column2Index(local.getSortColumn());
				}
				if (_.found(this.setValues(), 'total')) {
					return _.fetch(this.setValues(), 'total');
				}
				return 0;
			};
			that.getSortColumn = getSortColumn;
			return that;
		};
		that.collection = collection;
		
		// initialize the collection and map each row;
		that.visible = that.collection();
		
		// wrap each row in a row object and make the response object available to all methods
		if (response) {
			that.response = response;
			response.data.rows = _.map (response.data.rows, function (row) {
				return design.row(that, row);
			});			
		}
		
		// HELPERS
		// allow the caller to iterate using each or map;
		var each = function () {
			return this.data.rows;
		};
		that.each = each;
		
		var offset = function () {
			return this.data.offset;
		};
		that.offset = offset;
		
		var first = function () {
			return this.data.rows[0];
		};
		that.first = first;

		var last = function () {
			return this.data.rows[this.data.rows.length-1];
		};
		that.last = last;
		
		// return the row record at the given index. return the first or last if no index or the
		// index given is out of bounds.
		var getRow = function(index) {
			if (index > -1) {
				if (index < this.getLength()) {
					return this.data.rows[index];
				} 
				return this.last();
			}
			return this.first(); 
		};
		that.getRow = getRow;
		
		var total_rows = function () {
			return (this.data && this.data.total_rows) || this.first().getValue();
		};
		that.total_rows = total_rows;
		
		var getLength = function () {
			return this.data.rows.length;
		};
		that.getLength = getLength;
		
		// What it does: returns the list of unique values for a key 'facet' over the set of rows
		var facets = function (name) {	
			return _.compact(_.uniq(_.sortBy(_.map(this.each(), function(row) {
			//	console.log('selecting', name, row.select(name));
				var s = row.select(name);
				return (s && s.toString());
			}), _.item)), true);
		};
		that.facets = facets;

		var sortByValue = function (iterator) {
			var compare = iterator || function (row) { return -(row.getValue()); };

			// for each pages, sort
			_.sortBy(this.each(), compare);
			return this;
		};
		that.sortByValue = sortByValue;

		// helper: called on a 'reduce': true view to get the first and last keys of an
		// index. knows nothing about the type, so range can be anything.
		var range = function () {
			return({ 'start': this.first().getKey(), 'end': this.last().getKey() });
		};
		that.range = range;

		var getSortColumn = function (c) {
			if (c) {
				this.sortColumn = c;
			}
			return this.sortColumn;
		};
		that.getSortColumn = getSortColumn;

		// setter/getter for modifying the list of columns to display;
		var getDisplayColumns = function(d) {
			if (d) {
				this.displayColumns = _.isArray(d) && d;
			}
			return (((this.displayColumns).length && this.displayColumns) || this.columns);
		};
		that.getDisplayColumns = getDisplayColumns;
		
		// setter/getter for indicating a list of rows is 'selected'
		var getSelected = function (selectedRows) {
			var selectedRowData = _.clone(response)
			, selectedRowList = []
			, local = this;
			
			// if argument supplied, update the selected list
			if (selectedRows) {
				thisSelected = selectedRows;
			}
			
			// if some have been marked selected, map those rows; else just return everything
			if (thisSelected.length > 0) {
				selectedRowList = _.map(thisSelected, function(index) {
					return local.getRow(index);
				});
				selectedRowData.data = selectedRowList;
			}
			// make a new rows object from this data and return it;
			return rows(selectedRowData, ddoc, design);
		};
		that.getSelected = getSelected;

		// What it does: returns the index of the column requested, 
		// or 'sortColumn', or 0 if not found
		var column2Index = function (c) {
			var column = c || this.getSortColumn()
			, activeColumns = this.columns2Display || this.columns;
			return	(_.found(activeColumns, column) ?
						_.fetch(activeColumns, column) : 0);
		};
		that.column2Index = column2Index;

		// What it does: converts an integer index into the column list and 
		// returns the name of the column
		var index2Column = function (i) {
			var index = _.isNumber(i) ? i : column2Index();
			return this.displayColumns[index] || this.columns[index];
		};
		that.index2Column = index2Column;

		// What this does: use the names of the columns to determine the 'type' 
		// of the column and sort based on that type
		var sortByColumn = function (reverse) {
			var direction = (reverse) ? -1 : 1
			, local = this;

			this.displayColumns = _.sortBy(this.columns, function (x) {

				if (_.isNumber(x) || !_.isNaN(_.toInt(x))) {
					return (_.toInt(x) * direction);
				}
				// else returns the position in the array
				return (_.fetch(local.columns, x) * direction);
			});

			return this;
		};
		that.sortByColumn = sortByColumn;
		return that;
	};
	global.rows = rows;
	
}(Boxspring));
/* ===================================================
 * row.js v0.01
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

	var row = function (owner, currentRow) {		
		// Object for creating a hash out of the row for accessing and manipulating it
		var that = _.extend({}, currentRow, this.UTIL.hash());
		that.columns = (owner && owner.columns) || [];
		that.keys = (owner && owner.keys) || [];
		that.visible = (owner && owner.visible) || this.UTIL.hash();
		that.cell = (owner && owner.cell);

		var getKey = function (index) {
			var key = _.isArray(this && this.key) ? this.key : [ this && this.key ];
			return typeof index !== 'undefined' ? key[index] : key;
		};
		that.getKey = getKey;

		var getValue = function () {
			return this && this.value;
		};
		that.getValue = getValue;

		// What it does: return the value of 'name' in this row
		var select = function (name) {
			return this.get(name);
		};
		that.select = select;

		// What it does: returns true if value of 'name' equals 'value'
		var selectFor = function (name, value) {
			var selected = _.isString(this.select(name)) 
				? this.select(name).toLowerCase() 
				: this.select(name)
			, val = _.isString(value) 
				? value.toLowerCase()
				: value;			
			return (selected === val);
		};
		that.selectFor = selectFor;

		// What this does: Used by filter routine to filter objects and array and dates types
		var compare =  function() {
			/*jslint unparam: true */
			return({
				'array': function(k, v1, value) {
					if (_.isArray(value)) {
						return _.reduce(value, function(found, x) { 
								if (x === v1) { 
									return found || x; 
								}
								return false;
							}, false);
					} 
					if (_.isString(value)) {
						return (v1 === value);
					}
					return false;
				},
				'object': function (key, v1, value) {
					if (_.isArray(value)) {
						return this.array(key, v1, value);
					}
					if (_.isObject(value)) {
						return this.array(key, v1, _.values(value));
					} 
					if (_.isString(value)) {
						return (v1 === value);
					}
					return false;
				},
				'date': function (key, date, value) {
					var len;

					if (key === 'year' && typeof value === 'number') {
						value = [ value ];
					}
					len = value.length;
					value = _.toDate(value);
					if (_.isArray(date)) {
						return value.eq(_.toDate(date.slice(0, len)));					
					} 
					if (_.isObject(date) && date.hasOwnProperty('start')) {
						if (date.hasOwnProperty('end')) {
							return (value.inRange(_.toDate(date.start.slice(0,len)), 
								_.toDate(date.end.slice(0,len))));
						}
						return(value.eq(date.start.slice(0,len)));
					}
				}	
			});
		};

		var filter = function (filterObject) {
			var local = this
			, outerFound = false
			, found
			, list = _.isArray(filterObject) ? filterObject : [ filterObject ];
			// execute until filter returns false or no more filters to run
			list.forEach(function(items) {
				found = true;	// must match every key/value for each sub-filter
				// run this only if we don't have a match yet
				if (outerFound === false) {
					_.each(items, function(value, key) {
						var type = (local.cell && local.cell.getType(key)) || 'string';

						if (_.isFunction(value)) {
							found = found && value.call(local, local.getKey(), local.getValue());
						} else if (type === 'string') {
							found = found && local.selectFor(key, value);
						} else if (type === 'number') {
							found = found && (value === _.coerce('number', local.select(key)));
						} else if (type === 'array' || type === 'object') {
							found = found && compare()[type](key, value, local.select(key));								
						} else {
							throw '[ row.js 296 ] - unsupported type: ' + type + ' ' + key;
						}
					});					
				}
				// must match 'any' key/value pair for each sub-filter
				outerFound = outerFound || found;
			});
			return (outerFound);
		};
		that.filter = filter;
		
		// What it does: given a row of data, uses the key/columns to create a hash of key/value pairs		
		(function(local) {
			var store = function(key, value) {
				local.set(key, value);
				// if this key is in our display list, then save it in the visible list
				if (_.found(local.columns, key)) {
					// owner.visible is for remembering keys having values for a collection of rows.
					// useful when displaying tables to hide columns which have no values;
					if (owner) {
						owner.visible.set(key, true);
					}
				}
			};					
			// create a new hash for each access; fetch key-values by position
			local.keys.forEach(function(val, index) {
				store(val, (local.getKey(index)));
			});
			// fetch value-values by lookup
			if (_.isObject(local.getValue())) {
				// only look for column values not found in keys()				
				_.difference(local.columns, local.keys).forEach(function(val) {
					if (typeof local.getValue()[val] !== 'undefined') {
						store(val, local.getValue()[val]);
					}
				});					
			} else {
				// grab the value from doc.value
				local.columns.forEach(function(val) {
					store(val, local.getValue());
				});
			}
		}(that));
				
		return that;
	};
	global.row = row;

}(Boxspring));
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
/*global _: true, Boxspring: true */

(function(global) {
	"use strict";

	// formats a cell value based on type information
	var cell = function (ownerTypes, formats) {
		var validTypes = ['string','number','boolean','date','datetime','timeofday','object','array']
		, that = {};
		
		that.builtInColumns = this.UTIL.hash({
			'year': ['number',1],
			'month': ['number',1],
			'country': ['string',2],
			'city': ['string',2],
			'state': ['string',2],
			'address': ['string',4],
			'count': ['number',1],
			'sum': ['number',1],
			'average': ['number',1],
			'keyword': ['string',1],
			'index': ['number',1],
			'values': ['object',2],
			'row total': ['number',1],
			'column total': ['number',1],
			'view': ['string', 1],
			'summary': ['object', 8] 
		});

		// if there is a format function for cells, then the caller passes it in from the design;
		that.formats = formats;
		
		var thisType = function (key) {
			return _.isArray(key) ? key[0] : 'string';
		};
		that.thisType = thisType;

		var thisWidth = function (key) {
			return _.isArray(key) && key.length > 1 ? key[1] : 2;
		};
		that.thisWidth = thisWidth;

		var hasType = function (key) {
			return this.builtInColumns.contains(key) ? true : false;
		};
		that.hasType = hasType;

		var getType = function (key) {
			return(this.thisType(this.builtInColumns.get(key)));
		};
		that.getType = getType;

		var columnWidth = function (key) {
			return (this.builtInColumns.contains(key) && thisWidth(this.builtInColumns.lookup(key))) || 1;			
		};
		that.columnWidth = columnWidth;
		
		// What it does: accepts name/type or object of names/types. Extends the types hash
		// by adding columnTypes to an object with optional width.		
		/*global log: true */
		var columnTypes = function (name, type, width) {
			var buffer = {}
			, local = this;

			// 'name' can be an individual name/type pair, or an object containing a set of name/types
			// if 'type' is not provided, then default to whatever type the 'name' is
			if (typeof name === 'string') {
				buffer[name] = [type || 'string', width || 2];
			} else if (typeof name === 'number') {
				buffer[name] = [type || 'number', width || 1];
			} else if (typeof name === 'object') {
				buffer = name;
			}

			// loop each element in the buffer, and update the builtInTypes hash
			_.each(buffer, function(item, key) {
				if (_.found(validTypes, local.thisType(item))) {
					local.builtInColumns.store(key, item);
				} else {
					throw new Error('[ cell.columnTypes ] - invalid type: ' + item);
				}
			});
			return this;	
		};
		that.columnTypes = columnTypes;
		// extend the builtInTypes hash with types passsed in by the owner
		that.columnTypes(ownerTypes);

		// What it does: Returns a 'cell' object with filled in missing pieces; Accepts either an object
		// or name, value, type arguments
		var newCell = function(name, value, type) {
			var formats = (this.formats && _.isFunction(this.formats)) 
				? this.formats 
				: function() { return {}; }
			, o = typeof name === 'object' ? name : {'name': name, 'value': value, 'type': type }
			, cell = {
				'name': o.name,
				'value': o.value,
				'type': this.getType(o.name),
				'format': o.format,
				'properties': o.properties
			};
			// if there is a formatter function, then call it and return
			if (formats && formats()[cell.name]) {
				cell.type = 'string';
				if (_.isString(cell.value)) {
					cell.format = this.formats()[cell.name](cell.value).toString();
				} else {
					cell.format = this.formats()[cell.name](cell.value).toString();					
					cell.value = _.map(cell.value, _.item).join(',');
				}
				return cell;
			}
			// generic formatter then
			if (cell.type === 'array') {
				cell.value = _.map(cell.value, _.item).join(',');				
				cell.type = 'string';
				return cell;					
			}
			if (cell.type === 'object'){
				cell.value = (cell && cell.value && JSON.stringify(cell.value)) || '';
				cell.type = 'string';
				return cell;
			}
			// otherwise, coerce this value to its type, if you can and return;
			cell.value = _.coerce(cell.type, cell.value);
			return cell;
		};
		that.newCell = newCell;
		that.newColumn = newCell;
		return that;
	};
	global.cell = cell;

}(Boxspring));
/* ===================================================
 * query.js v0.01
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
/*global _: true, boxspring: true */

(function(global) {
	"use strict";
		
	// What it does: Query / Result Objects
	var query = function (options) {
		var queryParameters = ['reduce',
							'limit',
							'startkey',
							'endkey',
							'group_level',
							'descending',
							'key',
							'keys']
							
		// give this object some events	
		, that = _.extend({'db': this }, this && this.events());
		
		// create a query id for this, mostly for debugging 
		that.qid = _.uniqueId('q');
		
		// extend it with these options.	
		that = _.extend(that, _.defaults(options || {}, {
			// query parameters
			'reduce': false,
			'limit': undefined,
			'startkey': undefined,
			'endkey': undefined,
			'group_level': undefined,
			'descending': false,
			'key': undefined,
			'keys': undefined
// list function			'filter': {},
// list function			'pivot': false,
		}));

		// inherit the system cache from the owner
		that.system = this.system;

		// if system control parameters (page-size, cache-size, ...) were passed in,
		// update them 
		if (options && options.system) {
			that.system.update(options.system);
		}
				
		// Response Wrapper: wraps the response object with methods and helpers to manage 
		// the flow of data from the server to the application
		var result = function () {					
			var owner = this || {} 
			, queryPages = { 'pages': [] }
			, current_chunk = 0
			, current_page = 0;	// zero-based


			// wraps the response.data object with some helper methods
			var data = function (response) {
				// helpers						
				response.query = owner;
				response.rid = _.uniqueId('r');

				var pages = function () {
					return _.clone(queryPages.pages);
				};

				var page = function () {
					if (current_chunk > 0) {
						// does not create a new 'pages', returns to tha caller the cached
						// response object from the server
						return queryPages.pages[current_chunk];						
					}
					return this;
				};

				// return a paginated query as though it was captured in one block 
				var unPaginate = function () {
					var allPages = { 'data': {
						'rows': []	
					}};

					// copy the first page as template to allPages
					allPages = _.extend({}, pages.apply(this)[0], allPages);
					pages.apply(this).forEach(function(page) {
						allPages.data.rows = 
							allPages.data.rows.concat(page.data.rows || []);
					});
					return allPages;
				};
				response.unPaginate = unPaginate;

				var pageInfo = function () {
					var local = this;

					return ({ 
						'completed': (local.total_rows() === (local.offset() + local.getLength())),
						'totalRows': local.total_rows(),
						'pageSize': (owner.system.get('page-size') || this.totalRows),
						'cachedPages': queryPages.pages.length, 
						'page': current_page         ,
						'next': function() {
							if ((current_page * this.pageSize) < this.totalRows) {
								current_page += 1;								
							}
							return this;
						},
						'prev': function() {
							if (current_page > 0) {
								current_page -= 1;								
							}
							return this;
						},
						'pages': function() { 
							return Math.ceil(this.totalRows / this.pageSize); 
						},
						'lastPage': function() { 
							return queryPages.pages.length; 
						} 
					});
				};
				response.pageInfo = pageInfo;

				// What it does: caller supplied or callback from menus to render rows and 
				// update the browser with spinning wheel and alerts
				var nextPrev = function (arg) {
					var direction = ( (arg && typeof arg === 'string') ? arg : arg && arg.text );

					if (direction) {
						direction = direction.toLowerCase().split(' ');
					}
					if (!direction) {
						current_chunk = 0;
						this.query.trigger('result', page.apply(this));
						return this;	
					} 

					if (_.found(direction, 'next')) {
						current_chunk += (current_chunk < queryPages.pages.length-1) ? 1 : 0;
						this.pageInfo().next();	
						this.query.trigger('result', page.apply(this));
						// if we haven't cached all the pages, and we have one more page in
						// cache before we run out, then cache another page from the server 
						if (!this.pageInfo().completed && 
							(this.pageInfo().page) === (this.pageInfo().lastPage()-1)) {
								// moreData is a closure with all information needed for the 
								// next chunk of data
								page.apply(this).moreData();
						}
					} else if (_.found(direction, 'previous')) {
						current_chunk -= (current_chunk > 0) ? 1 : 0;
						this.pageInfo().prev();	
						this.query.trigger('result', page.apply(this));									
					}
				};
				response.nextPrev = nextPrev;

				// updates the pages cache
				queryPages.pages.push(response);	
				// accumulates the rest of the pages for this result, if 'asynch'
				//console.log(response.query.qid, owner.system.get('asynch'), queryPages.pages.length);
				// when asynch=true, relay the data to the listener
				if (owner.system.get('asynch') === true && 
					queryPages.pages.length > 1) {
			
					if (response.pageInfo().completed) {
						owner.trigger('completed', response);																
					} else {
						owner.trigger('more-data', response);																
					}
				}
				return response;
			};
			queryPages.data = data;
			return data;
		};

		// What it does: fetches data from the server
		// NOTE: RESULT is a Result() object
		var fetch = function () {	
			var local = this;

			this.db.fetch(_.pick(this, queryParameters), function(err, result) {
				if (err) {
					console.log(err);
				}	
				// set result and call down to nextPrev with this result and no argument
				local.trigger('result', result);		
			}, result.apply(local));
			return this;						
		};
		that.server = fetch;
		that.fetch = fetch;
		
		// What it does: executes a client callback on a display event
		var relay = function(context, eventStr, callback) {
			this.on(eventStr, function() {
				if (_.isFunction(callback)) {
					callback.apply(context, [ eventStr ].concat(_.toArray(arguments)));
				}
			});
		};
		
		var addEventListener = function (eventStr, callback) {
			var context = this
			, supportedEvents = ['result', 'more-data', 'completed', 'onPage', 'onSelection'];
			if (_.found(supportedEvents, eventStr)) {
				relay.call(this, context, eventStr, callback);	
			} else {
				throw new Error('[ display ] Unrecognized event - ' + eventStr);
			}
		};
		that.addEventListener = addEventListener;
		return that;		
	};
	global.query = query;
}(Boxspring));	


/* ===================================================
 * boxspring-models.js v0.01
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
/*global _: true, Boxspring: true, Backbone: true, $: true */
"use strict";

(function (global) {
	
	var Db = Backbone.Model.extend({
		'db': new Boxspring,
		'initialize': function(options) {
			var model = this;
			model.set('options', options);
			
			// if there is a design name, then create the object with the design
			if (options.hasOwnProperty('designName')) {
				model.db = model.db(options).design()
			}
		}
	});
	
	// What it does: Provides methods to 'fetch' from the server and relay 'completed', 'result', 
	// and 'more-data' events to clients. 
	var Query = Backbone.Model.extend({
		'defaults': {
			'data': undefined
		},
		'initialize': function (query) {
			this.query = query;
		}, 
		'fetch': function() {
			var model = this;
			
			// when we see an event on the query, propagate a change event on the model.
			['result', 'more-data', 'completed'].forEach(function(tag) {
				model.query.on(tag, function(result) {
					model.set('data', result);
					model.set(tag, result);
				});				
			});
			this.query.server();
		}
	});
	global.Query = Query;
	
	// What it does: Methods for asynchronous Queries and separating page-previous/page-next from the
	// browser and the server.
	// Invoke with: ( new Query(), { 'type': 'chart' or 'table', 'targetDiv': 'id' })
	var Display = Backbone.Model.extend({
		'defaults': {
			'type': 'Table',
			'targetDiv': 'on-display',
			'result': undefined,
			'render': undefined,
			'selected': []
		},
		// provides the 'View' a method to initiate paging mechanism. 
		// direction is 'next' or 'previous' 
		'nextPrev': function(direction) {
			this.query.get('data').nextPrev(direction);			
		},
		'fetch': function () {
			// apply the fetch from the higher level query Model
			this.query.fetch.apply(this.query, arguments);
		},
		'initialize': function(query, options) {
			var display = this;
			
			// inherit the Query model
			query = new Query(query);
			this.query = query;
			
			if (options) {
				this.set('type', (options.type || this.get('type')));
				this.set('targetDiv', options.targetDiv || this.get('targetDiv'));
				
			} else {
				options = this.defaults;
			}
						
			// instantiate the vis in this model
			display.vis = $.googleVis({
				'type': this.get('type'), 'targetDiv': this.get('targetDiv')});
			
			// events from the vis or browser are triggered on the 'result' object of our query.
			query.on('change:result', function() {
				// when new data is set on result, call the render function for the vis
				display.vis.render(query.get('data'));

				// page next/previous can come from the vis, or from the 'View', 
				// so delegate to 'nextPrev'
				// "result" object from query is stored in the 'data' attribute of the query
				query.get('data').on('onPage', function() {
					display.nextPrev.apply(display, arguments);					
				});
				// row selections come from the vis; Views should watch for changes on 'onSelection'
				query.get('data').on('onSelection', function(selected) {
					display.set('selected', selected);
				});
			});
		}	
	});
	global.Display = Display;
	
	// helper function to form db object
	var dbhelper = function(name, auth) {
		return({'name': name, 'auth': auth });
	};
		
	var Users = Backbone.Model.extend({
		defaults: {
			'name': '',
			'password': '',
			'db_name': '',
			'roles': [],
			'userDb': {},
			'loggedIn': false,
			'error': {}
		},
		initialize: function (db) {
			this.owner = db;
		},
		auth: function() {
			return ({'auth': {
				'name': this.get('name'), 'password': this.get('password') }});
		},
		error: function(err, response) {
			return this.set('error', {'err': err, 'response': response });			
		},
		signup: function() {
			var mydb = this.owner.users(this.get('name'))
			, model = this;
			
			mydb.signUp(this.get('password'), this.get('roles'), function(err, response, userDb) {
				if (err) {
					return model.error(err, response);
				}
				model.set('userDb', userDb);
				model.set('loggedIn', true);
			});
		},
		login: function() {
			var model = this;
			
			this.set('userDb', 
				this.owner.db(_.extend({ 'name': this.get('db_name') }, this.auth()))()
				.users(this.get('name')));
			
			this.get('userDb').login(function(err, response) {
				if (err) {
					return model.error(err, response);
				}
				model.set('loggedIn', response.code === 200);
			});
		},
		logout: function() {
			var model = this;
			
			// only if we're already logged in. otherwise do nothing.
			if (this.get('loggedIn')) {
				this.get('userDb').logout(function(err, response) {
					if (err) {
						model.error(err, response);
					}
					model.set('loggedIn', (response.code !== 200));
				});				
			}
		},
		update: function(newPassword) {
			var model = this
			, db = this.owner.db(dbhelper(this.get('name'), this.auth()))().users(this.get('name'));
			
			if (this.get('loggedIn')) {	
				db.update(newPassword, [], function(err, res) {
					if (err) {
						return (model.error(err, res));
					}
					model.logout();
				});					
			} else {
				console.log('you must be logged in!');
			}
		},
		remove: function(userName) {
			var model = this 
			, db = this.db(_.extend({
				'name': this.get('db_name') }, this.auth()))().users(userName); 
			
			db.remove(function(err, res) {
				// this operation doesn't change the login status of the administrator
				// set the variable and let the application decide what to do with the results.
				model.set('removed', {'err': err, 'response': res });
			});
		}
	});
	// make this Model visible to the outside world
	global.Users = Users;
	
}(Boxspring));
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
/*global Boxspring: true, UTIL: true, _: true */

if (typeof UTIL === 'undefined') {
	throw new Error('Boxspring.js must define a UTIL variable.');
}

// Inherit the UTIL objects 
Boxspring.UTIL = UTIL;

(function(template) {
	"use strict";
		
	// Current version.
	template.VERSION = '0.0.1';
	// add 'boxspring' to the template
	template.Boxspring = template;	
		
	var Boxspring = function () {
		return this;
	}
	
	Boxspring.prototype.create = function () {
		var object = new Boxspring();
		object = _.extend(object, template);
			
		// db.apply returns a new database object with the supplied arguments
		return template.createdb.apply(object, arguments);
	};
	
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = new Boxspring().create;
	} else {
		this.Boxspring = new Boxspring().create;
	}

}).call(this, Boxspring);
