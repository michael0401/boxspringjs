/* ===================================================
 * boxspring.js v0.01
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
/*global bx: true, Backbone: true, alert: true, window: true, _: true, toJSON: true */

(function (Local) {
	"use strict";
	
	if (typeof window !== 'undefined') {
		Local.BROWSER = true;
		Local.NODEJS = false;
		Local.COUCH = false;
	} else {
		// couchdb
		if (typeof exports === 'undefined') {
			Local.COUCH = true;
		} else {
			// node.js
			Local.NODEJS = true;
		}
		Local.BROWSER = false;
	}

	Local['base-utils'] = function () {	
		return({
			objectLength: function (o) {
				return (o && Object.keys(o).length);
			},

			// Purpose: finds the index of a value in an Array
			arrayFind: function (k, a) {
				var index
					, key = k
					, items = a;
					
				// if the programmer is forgetful, switch the order of the arguments
				if (_.isArray(key) && typeof items === 'string') {
					key = a;
					items = k;
				}

				if ((_.isString(key) || _.isNumber(key)) && items.length > 0) {
					for (index=0;index<items.length;index+=1) {
						if (items[index] === key) {
							return index;
						}			
					}				
				}
				return(-1);
			},
			
			// What it does: returns true if all the members of k1 are present in k2
			arrayCompare: function (k1, k2) {
				return _.all(k1, function(v){
				    return _.contains(k2, v);
				});					
			},
			
			arrayMap: function (items, fn) {
				return(items.map(function(item) {
					if (_.isFunction(fn)) {
						return(fn(item));
					}
				}));
			},
			
			// What it does: returns true k1 and k2 have the same members in same order
			arrayIdentical: function (k1, k2) {
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
			},
			
			// recursive find function requires a sorted list
			// Specifying 'it' function allows access to array of object properties for 
			// comparison to 'k'
			arrayBfind: function (k, a, it) {
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
						return(_.arrayBfind(k, a.slice(0, end)));
					} 
					start = Math.ceil(a.length / 2);
					return(_.arrayBfind(k, a.slice(start, a.length)));				
				}
			},
			
			forceToArray: function (l) {
				if (typeof l === 'string') {
					return [ l ];
				}
				if (_.isArray(l)) {
					return l;
				} 
				return _.toArray(l);
			},
			
			arrayFound: function() {
				return (_.arrayFind.apply(null, arguments) !== -1);
			},

			// copies members of an object ot the new object, except the names in items
			exclude: function(src, args) {
				var target = {}
					, source = src
					, items = []
					, key;

				if (_.isArray(args)) {
					items = args;
				} else {
					for (key=1;key<arguments.length;key+=1) { items.push(arguments[key]);}
				}

				for (key in source) {
					if (source.hasOwnProperty(key)) {
						if (_.arrayFind(key, items) === -1) {
							target[key] = source[key];
						}				
					}
				}
				return target;
			},
			
			coerce: function(expectedType, value) {
				var types = {
					'string': '',
					'number': 0,
					'boolean': false
				};
				if (_.isDate(value)) {
					return value;
				}
				if (expectedType !== typeof value) {
					return types[expectedType];
				}
				return value;
			},
			
			filterUnknown: function(source) {
				var tofilter = [];
				
				_.each(source, function(item, name) { 
					if (typeof item === 'undefined') { 
						return tofilter.push(name); } });
				return(_.exclude(source, tofilter));
			},


			// What it does: extracts the property names to an Array
			names: function(o) {
				var result = []
					, i;

				for (i in o) {
					if (o.hasOwnProperty(i)) {
						result.push(i);				
					}
				}
				return result;
			},

			// What it does: extracts the properties from the first object based on the 
			// properties in the from array or list of argument strings.
			select: function(source, from) {
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
			},

			// converts a string to a decimal integer
			toInt: function(s) {
				return _.isString(s) ? parseInt(s, 10) : s;
			},

			// remove multiple, leading or trailing spaces
			trim: function (s) {
				if (s) {
					s = s.replace(/(^\s*)|(\s*$)/gi,"");
					s = s.replace(/[ ]{2,}/gi," ");
					s = s.replace(/\n /,"\n");
					return s;				
				}
			},
			
			// What it does: follows an object until it finds a matching tag, 
			// then returns the value of it
			pfetch: function (o, p) {
				var found
					, k;

				if (typeof o==='object' && o[p]) {
					return o[p];
				} 
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						if (typeof o[k]==='object') {
							if (typeof found ==='undefined') {
								found = _.pfetch.call(this, o[k], p);						
							}
						}				
					}
				}			
				return found;
			},

			// What it does: given a property, or list of property, return the value of the first hit
			// note: owner flag suppresses return of #text value and just give the owning object to caller
			fetch: function (o, p, owner) {
				var i
					, keys = []
					, value;

				if (!o || o === null) {
					return;
				}

				if (_.isArray(p)) {
					keys = p;
				} else {
					for (i=1; i<arguments.length;i+=1) { keys.push(arguments[i]); }
				}
				for (i=0; i<keys.length; i += 1) {
					value = _.pfetch(o, keys[i]);
					if (typeof value !== 'undefined' && owner === true) {
						return value;
					} 
					if (typeof value !== 'undefined') {
						return ((value && _.isObject(value) && value['#text']) || value) ;
					}
				}
			},

			// What it does: takes item 'p1/p2/../pN' and searches for occurence of pN in pN-1
			hfetch: function (o, item) {
				var items = item.split('/')
					, found = o;
				if (items.length > 1) {
					items.forEach(function(tag) {
						found = _.fetch(found, tag);
					});
					return found;					
				}
				return _.fetch(o, item);
			},
			
			urlFormat: function (source) {
				var target = '';

				if (source) {
					target = source.protocol ? source.protocol + '//' : '';
					target = target + (source.auth ? source.auth + '@' : '');
					target = target + (source.host || (source.hostname || ''));
					target = target + (source.path || '');
					target = target + (source.hash || '');
				}
				return target;
			},

			formatQuery: function (source) {
				var target = '?';

				_.each(source, function(value, name) {
					target += name + '=' + value + '&';
				});

				// clip the trailing '&'
				return (target.slice(0,target.length-1));
			},

			parseQuery: function (queryString) {
				var qs = queryString;

				var tmp = qs.charAt(0) === '?' ? qs.slice(1).toLowerCase() : qs.toLowerCase()
					, qryobj = {};			

				tmp.split('&').forEach(function(pair) {
					if (pair.split('=').length > 1) {
						qryobj[pair.split('=')[0]] = pair.split('=')[1] || '';					
					}
				});
				return qryobj;	
			},

			urlParse: function (url, query, slashes) {
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
					thisurl['query'] = _.parseQuery(thisurl['search']);
				} else {
					if (thisurl.hasOwnProperty('search')) {
						thisurl['query'] = thisurl['search'].slice(1);					
					}
				}
				if (slashes && slashes === true) {
					throw 'slashes is not supported in url() object.';
				}
				return thisurl;
			},
			// Purpose: Iterator for traversing abstract JSON objects
			walk: function(obj, action, d) {
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
			},
			// Purpose: execute a function afer a set time
			wait: function (seconds, func) {
				var ms = seconds * 1000;	// converting to milli seconds
				setTimeout(function() {
					if (func && typeof func === 'function') {
						func();
					}
				}, ms);
			}
		});
	};

	// Date() wrapper
	/*
	 months = [
		'January', 'Feburary', 'March', 'April', 'May', 'June', 
		'July', 'August', 'September', 'October', 'November', 'December']
	*/
	var date = function(o) {
		var that = _.extend({}, o || {}, _.defaults(o || {}, {
			'format': 'dd/mm/yyyy',
			'now': new Date(),
			'today': [ '', '', '' ],
			'separator': ' '
		}))
		, map = {
			'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
			'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
		}
		, formats = [
			'dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy/mm/dd', 'yyyy/dd/mm',
			'dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd', 'yyyy-dd-mm',
			'mm-yyyy', 'mm yyyy', 'mm/yyyy', 'mm dd yyyy', 'yyyy mm dd' ]
		, timeNow = (that.now.toString()).split(' ')[4]
		, template = [];		
		
		// check that application supplied a valid date
		if (_.arrayFind(that.format, formats) === -1) {
			throw '[ date ] - unrecognized date format ' + that.format;
		}		
		// get the separator for the date format
		that.separator = (function (f) {
			var separator
				, temp = [];
			[ '/', '-', ' '].forEach(function(sep) {
				if (temp.length < 2) {
					separator = sep;
					temp = f.split(separator);
				}
			});
			return separator;				
		}(that.format));
		that.format.split(that.separator).forEach(function(item, i) {
			template[i] = item;
		});
		that.template = template;
		
		// what it does: returns the 'today' value using the place in template for date 'part' 
		var getPart = function (part) {
			if ((_.arrayFind(part, template) !== -1)) {
				return(_.isArray(that.today) && that.today[_.arrayFind(part, template)]);
			}
		};
		that.getPart = getPart;
		
		var hasPart = function (part) {
			return(typeof getPart(part) !== 'undefined');
		};
		
		var setPart = function (part, val) {				
			if (typeof val !== 'undefined' && hasPart(part)) {
				this.today[_.arrayFind(part, template)] = val;				
			}
			return this;
		};
		that.setPart = setPart;
		
		var valueOf = function () {
			return this.now.valueOf();
		};
		that.valueOf = valueOf;
		
		var getYear = function () {
			return this.getPart('yyyy');
		};
		that.getYear = getYear;
		
		var getMonth = function () {
			return this.getPart('mm') + 1;
		};
		that.getMonth = getMonth;
		
		var getDate = function () {
			return this.getPart('dd');
		};
		that.getDate = getDate;
		
		var setYear = function (val) {
			this.setPart('yyyy', _.toInt(val));
			this.now.setFullYear(_.toInt(val));
			return this;
		};
		that.setYear = setYear;
		
		var setMonth = function (val) {
			this.setPart('mm', _.toInt(val));
			this.now.setMonth(_.toInt(val));
			return this;
		};
		that.setMonth = setMonth;
		
		var setDate = function (val) {
			this.setPart('dd', _.toInt(val));
			this.now.setDate(_.toInt(val));
			return this;
		};
		that.setDate = setDate;
		
		var setTime = function(v) {
			this.now = new Date();
			this.now.setTime(v);
			return this;
		};
		that.setTime = setTime;
				
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
				, targetMonth = monthNo || (hasPart('mm') && getPart('mm'));
			
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
		
		// if the application provided 'dateIn', use the format to parse it
		if (that.hasOwnProperty('dateIn') && typeof that.dateIn !== 'undefined') {
			// if 'dateIn' is a Date() object, convert it to string to get mm dd yyyy
			// 'Fri Dec 28 2012 00:00:00 GMT-0500 (EST)'
			if (_.isObject(that.dateIn)) {
				that.dateIn = that.dateIn.toString().split(' ').slice(1).join(' ');
			}
			// initialize 'today' with the date provided by the application using
			// position in the template
			that.dateIn.split(that.separator).slice(0,template.length).forEach(function(item, i) {
				that.today[i] = item.replace(',','');
				// if 'mm' is a name not a number, convert it to a number
				if (template[i] === 'mm') {
					if (_.isNumber(m2n(that.today[i]))) {
						that.today[i] = m2n(that.today[i]);
					} else if (_.isNumber(_.toInt(that.today[i]))) {
						that.today[i] -= 1;
					}
				} else {
					// otherwise, just convert and store as a number
					that.today[i] = _.toInt(that.today[i]);
				}
			});
			
			that.now = new Date();
			if (hasPart('yyyy')) {
				that.now.setFullYear(getPart('yyyy'));
			}
			if (hasPart('mm')) {
				that.now.setMonth(getPart('mm'));
			}
			if (hasPart('dd')) {
				that.now.setDate(getPart('dd'));
			}
		} 

		// initialize 'today' with the date parts from the current date
		// based on their position in 'template'
		setPart.call(that, 'yyyy', that.now.getFullYear());
		setPart.call(that, 'mm', that.now.getMonth());
		if (template.length === 3) {
			setPart.call(that, 'dd', that.now.getDate());				
		} else {
			['dd'].concat(template);
			setPart.call(that, 'dd', 1);
		}		

		// What it does: method to return a date as an array [yyyy, mm, dd ] .concat([ time ])
		var key = function (includeTime) {
//			console.log('that.today', this.today, template, this.format);
			if (includeTime) {
				return ([ getPart('yyyy'), getPart('mm'), getPart('dd')]
					.slice(0,template.length).concat([ timeNow ]));
			}
			return ([ getPart('yyyy'), getPart('mm'), getPart('dd') ]
				.slice(0,template.length));
		};
		that.key = key;

		var docId = function () {
			return ([ timeNow,
				this.getPart('yyyy'), 
				this.getPart('mm'), 
				this.getPart('dd')].join('-') );
		};
		that.docId = docId;
		
		// What it does: Joins the value of 'today' using deciphered 'separator' to form
		// the date format string. And, reformats numeric 'mm' to string
		var print = function (format) {
			var local = this
				, outputTpl = format ? date({'format': format || this.format }).template : this.template
				, sepchar = format ? date({'format': format || this.format }).separator : this.separator;
			return(_.reduce(
				_.map(outputTpl, function(part, i) {
					var v = '';
					if (part === 'mm') {
						v = local.getMonth();
					}
					if (part === 'dd') {
						v = getPart(part) || 1;
					} else {
						v = getPart(part);
					}
					return (v + (i<outputTpl.length-1 ? sepchar : ''));
				}), function (x, y) { return x + y; }));
		};
		that.print = print;		
		return that;		
	};
	Local.date = date;

	// What this does: methods for describing and manipulating the key/columns for a document
	var doc = function (o) {
		var that = {}
			, keys = (o && o.keys) || []
			, referencekey = (o && o.keys) || []
			, columns = (o && o.columns) || []
			, sortColumn
			, sortDirection
			, viewInfo = {}
			, keyOffset = 0
			, level
			, builtInColumns = {
				'year': 'number',
				'month': 'number',
				'country': 'string',
				'city': 'string',
				'state': 'string',
				'address': 'string',
				'count': 'number',
				'keyword': 'string',
				'index': 'number',
				'category': 'string',
				'locations': 'string',
				'facility': 'string',
				'values': 'object' 
			};
			
		// What it does: setter/getter the keys portion of the supplied columns array
		var localkeys = function () {
			if (_.isNumber(level)) {
				return keys.slice(0,level);				
			}
			return keys;
		};
		that.keys = localkeys;
		
		// What it does: setter/getter column portion of the supplied columns array
		var localcolumns = function (c) {
			if (c) {
				columns = c;
			}
			return(columns || []);
		};
		that.columns = localcolumns;
		
		// What it does: returns all keys+columns
		var all = function () {
			return _.uniq(keys.concat(columns));
		};
		that.all = all;
		
		var indexInfo = function (index) {
			if (this && this.hasOwnProperty('view-info') && this.hasOwnProperty(index)) {
				return(this['view-info']()[this[index]]);
			}
		};
		
		var setViewInfo = function (v) {
			if (v && _.isObject(v)) {
				viewInfo = _.extend(viewInfo || {}, v);
			}
			// if this call has the view-info, then initialize the keys/columns
			keyOffset = viewInfo.keyOffset || 0;
			keys = viewInfo.keys.slice(keyOffset);
			referencekey = viewInfo.keys.slice(keyOffset);
			level = viewInfo.level || keys.length;
			columns = viewInfo.columns;
			sortColumn = viewInfo.sortColumn;
			sortDirection = viewInfo.sortDirection || 'descending';
			return viewInfo;
		};
		that.setViewInfo = setViewInfo;
		
		// if this call has the view-info, then initialize the keys/columns
		if (indexInfo.call(this, 'default-index')) {
			setViewInfo(indexInfo.call(this, 'default-index'));
		}
		
		var referenceKey = function () {
			return(referencekey);
		};
		that.referenceKey = referenceKey;
		
		var setLevel = function (l) {
			if (_.isNumber(l)) {
				level = l;
			}
			return (level);
		};
		that.setLevel = setLevel;
		
		var options = function (o) {
			if (o && _.has(o, 'aggregate') && _.isNumber(o.aggregate)) {
				return _.extend({}, o, { 'aggregate': o.aggregate + keyOffset });
			}
			return o;
		};
		that.options = options;
		
		var isReduced = function () {
			return (this.setLevel() < referenceKey().length);
		};
		that.isReduced = isReduced;
		
		var docRef = function() {
			return (o.doc || o) || {};
		};
		that.docRef = docRef;

		// What it does: used by map functions to assert the validity of the input
		var assert = function (type) {
			return((this && this.Id() && this.docRef().type===type) && this);
		};
		that.assert = assert;
		
		var Id = function () {
			return this.docRef()._id;
		};
		that.Id = Id;
		
		// What this does: given a new set of columns, use the keys to determine the 'type'
		// of the column and sort based on that type
		var pivot = function (newColumns, keyIndex, type, reverse) {
			var direction = (reverse) ? -1 : 1
				, template = keys[keyIndex || keys.length]
				, mo = [ 'mm', 'mo', 'month' ]
				, newColumnTypes = {};

			columns = _.sortBy(newColumns, function (x) {
				if (_.isNumber(x) || _.isNumber(_.toInt(x))) {
					return (_.toInt(x) * direction);
				}
				if (_.arrayFound(template.toLowerCase(), mo)) {
					return (bx.date().m2n(x)*direction);
				}
				// else returns the position in the array
				return (_.arrayFind(x, newColumns) * direction);
			});
			
			if (type) {
				columns.forEach(function(c) {
					newColumnTypes[c] = type;
				});
				this.columnTypes(newColumnTypes).extend();
			}
			// sort also changes the index of the last key, so update it
			return this;
		};
		that.pivot = pivot;

		var query = function () {
			var local = this
				, valuesExist = [];
				
			// What it does: given a row of data, uses the key/columns to
			// return an object of key/value pairs
			var get = function (row) {
				var doc = (row || this)
					, buffer = {};

				// fetch key-values by position
				this.keys().forEach(function(val, index) {
					buffer[val] = (doc && doc.key && doc.key[index+keyOffset]);
				});
				// fetch value-values by lookup
				this.columns().forEach(function(val) {
					if (typeof doc.value[val] !== 'undefined') {
						buffer[val] = doc.value[val];					
					}
				});
				valuesExist = _.uniq(valuesExist.concat(_.keys(buffer)));
				return buffer;
			};
			local.get = get;
			
			var getKey = function (row) {
				return row.key.slice(keyOffset);
			};
			local.getKey = getKey;
			
			var getAbsoluteKey = function (row) {
				return row.key;
			};
			local.getAbsoluteKey = getAbsoluteKey;
			
			var getValue = function (row) {
				return row.value;
			};
			local.getValue = getValue;
			
			var getSortColumn = function () {
				if (_.arrayFound(sortColumn, valuesExist)) {
					return(_.arrayFind(sortColumn, valuesExist));
				}
				if (_.arrayFound('total', valuesExist)) {
					return(_.arrayFind('total', valuesExist));					
				}
				return 0;
			};
			local.sortColumn = getSortColumn;
			
			var sortAscending = function () {
				return (viewInfo && viewInfo.sortAscending);
			};
			local.sortAscending = sortAscending;
			
			var isVisible = function (c) {
				return _.arrayFound(c, valuesExist);
			};
			local.isVisible = isVisible;
			return local;
		};
		that.query = query;
		
		// What it does: return the value of 'name' in this row
		var select = function (row, name) {
			return this.get(row)[name];
		};
		that.select = select;

		// What it does: returns true if value of 'name' equals 'value'
		var selectFor = function (row, name, value) {
			return (!value || (value === '') ||
				this.select(row, name).toLowerCase() === value.toLowerCase());
		};
		that.selectFor = selectFor;

		// What it does: accesses the source document.
		// uses an Array or variable length list of properties and returns the first matching property
		var fetch = function (items) {
			var local = this
				, args = _.isArray(items) ? items : _.toArray(arguments)
				, results = [];

			args.forEach(function(item) {
				results.push(_.hfetch(local.docRef(), item));					
			});
			return args.length > 0 && results[0];
		};
		that.fetch = fetch;

		// What it does: returns keys sliced to group_level and summarized keys
		var summary = function (group_level, items) {
			return(keys.slice(0,group_level).concat(items));
		};
		that.summary = summary;
		
		// What it does: given a keys Array and a group level, returns the key slices and count column
		var group = function (group_level) {
			return(summary(group_level, ['Count']));
		};
		that.group = group;
		
		// What it does: setter/getter for adding columnTypes to this object.
		var columnTypes = function (moreTypes) {
			var that = {}
				, types = ['string','number','boolean','date','datetime','timeofday','object','array'];
			
			/*global log: true */
			var extend = function (t) {
				var item;
				
				if (t && _.isObject(t)) {
					builtInColumns = _.extend(builtInColumns, t);
					// see to it that columns are of known 'type'
					for (item in builtInColumns) {
						if (builtInColumns.hasOwnProperty(item)) {
							if (!(_.arrayFound(builtInColumns[item.toLowerCase()], types))) {
								if (bx.COUCH) {
									log('[ doc.columnTypes() ] - invalid type: ' + item);
								} else {
									bx.logm('invalid-type', 500, '[ doc.columnTypes() ] - ' + item);								
								}
							}
						}
					}
				}				
			};
			// on creation, caller can supply more types
			extend(moreTypes);
			that.extend = extend;

			// What it does: takes a label and a value and checks against columnType to determine its type
			// then coerces the value into integer or string if required.
			var check = function (nam, value) {
				var name = (_.isString(nam) && nam.toLowerCase()) || nam
					, columnType = builtInColumns[name] || 'string';

				if (!builtInColumns[name]) {
					if (bx.COUCH) {
						log('[ base-utils.js - typeCheck() ]: '+name);
					} else {
						bx.logm('config-error', 500, '[ base-utils.js - typeCheck() ]: '+name);					
					}
				}
				if (columnType === 'number') {
					if (_.isNumber(value)) {
						return (value);
					} 
					return (_.isNaN(_.toInt(value)) ? undefined : _.toInt(value));					
				} 
				if (columnType === 'date') {
					if (value && value !== '') {
						return new Date (value);
//						return (bx.date({'dateIn': value, 'format': 'mm yyyy'}).print('dd/mm/yyyy'));
					}
					return undefined;
				}
				if (columnType === 'string') {
					if (value && !_.isString(value)) {
						return JSON.stringify(value).toLowerCase();
					}
				}
				return (value);
			};
			that.check = check;

			var hasType = function (name) {
				return builtInColumns[name];
			};
			that.hasType = hasType;			
			return that;
		};
		that.columnTypes = columnTypes;
		
		// formats a cell value for google.vis
		/*jslint unparam: true */
		var newCell = function(o, types) {
			var owner = this
			, cell = {
				'name': o.name,
				'value': this.columnTypes(types).check(o.name, o && o.value),
				'type': this.columnTypes(types).hasType(o.name) || 'string',
				'format': o.format,
				'properties': o.properties
			};
			cell.toType = function () {
				var buf = {}, buf1 = []
					, local = this;
								
				if (this.type === 'array') {
					if (this && this.value && _.isArray(this.value) && this.value.length > 0) {
						this.value = bx.Browser().element().unorderedList(this.value, {})
							.display().data;						
					} else {
						this.value = '';						
					}
					this.type = 'string';
				} else if (this.type === 'object') {
					// object in the non-reduced view, we just want the value
					if (!owner.isReduced() && _.isObject(this && this.value)) {
						_.each(this.value, function(item, index) {
							if (item !== 0) {
								if (!_.isString(index)) {
									throw 'index must be a string!' + index;
								}
								local.value = index.toString();
							}
						});
					// the aggregated object is a table
					} else if (_.keys(this.value).length > 0) {
						// map the properties with values, to save space:
						buf = _.map(_.keys(this.value), function(name, value) {
							return [ name, local.value[name] ];
						});
						
						buf = _.reduce(buf, function (x, y) {
							if (y[0] && (_.isNumber(y[1] || _.isString(y[1])))) { 
								x.push(y); 
							}
							return x; 
						}, []);								
						this.value = bx.Browser().element()
							.table(buf.slice(0,1), buf.slice(1)).display().data;
					} else {
						this.value = '';
					}
					this.type = 'string';
				}
				this.value = _.coerce(this.type, this.value);
				return this;
			};
			return cell;
		};
		that.newCell = newCell;
		that.newColumn = newCell;
		return that;
	};
	Local.doc = doc;
	
	Local.Events = function(Obj) {
		var e = _.extend(Obj || {}, _.clone(Backbone.Events));
		var relay = function (tag, ctx1, ctx2) {
			var local = this;
			ctx1.on(tag, function () {
				// make the 'tag' the first argument
				ctx2.trigger.apply(ctx2, [tag].concat(_.toArray(arguments)));
			});
		};
		e.relay = relay;
		return e;
	};
	
	// Purpose: Routines to build and traverse binary-tree data structure
	// this object sorts by 'name'
	Local.Btree = function (nm, dt) {
		var that = {}
			, name = nm || 'root'
			, data = dt || '|';

		that.tag = name;
		that[name] = data;

		var getData = function(nd) {
			var node = nd || this;

			return node[node.tag];
		};
		that.getData = getData;
		that.get = getData;

		var getName = function(nd) {
			var node = nd || this;

			return node.tag;
		};
		that.getName = getName;

		var compare = function (a, b) { 
			//console.log('compare:', a[a['tag']], b[b['tag']]);
			return ((a === b) || (a < b) ? 'left' : 'right'); 
		};
		that.compare = compare;

		var set = function (v) {
			this[this.tag] = v;
			return this;
		};
		that.set = set;

		var insert = function (n2) {
			var n1 = this
				, result = n1.compare(getName(n1), getName(n2));

			n1[result] = _.extend({}, n2);
			return this;
		};
		that.insert = insert;

		var store = function(name, data) {
			var n1 = this
				,n2 = Local.Btree(name, data)
				,result = compare(getName(n1), getName(n2));
			if (((result === 'left') && !n1.left) || ((result === 'right') && !n1.right)) {
				n1.insert(n2);
				return;
			}
			n1[result].store(name, data);
			return this;
		};
		that.store = store;

		var inorder = function (action) {
			var root = this;

			if (root && root.right) {
				root.right.inorder(action);
			}
			if (name !== 'root') {
				if ((action(name, root[name], root) === false)) {
					return ;
				}
			}
			if (root && root.left) {
				root.left.inorder(action);
			}
			return this;
		};
		that.inorder = inorder;
		that.each = inorder;

		var getRows = function (res) {
			var obj = res || {};
			obj.rows = [];
			this.inorder(function(name, value) {
				obj.rows.push({ 'id': name, 'key': name, 'value': value });
			});

			obj.Btree = this;
			obj.offset = 0;
			obj.total_rows = obj.rows.length;				
			return obj;
		};
		that.getRows = getRows;

		var length = function() {
			var len = 0;
			this.inorder(function() { 
				len += 1; 
			});
			return len;
		};
		that.length = length;

		var find = function(name) {
			var root = this
				, result = compare(name, root.getName()) === 'left' ? 'right' : 'left';

			if (name === root.getName()) {
				return this;
			}

			if (root[result]) {
				return root[result].find(name);
			} 
		};
		that.find = find;

		var findall = function (name, fnc) {
			var found = this.find(name)
				,items = []
				,func = typeof fnc === 'function' ? fnc :  function() { return; };

			if (found) {
				/*jslint unparam: true */
				found.inorder(function(a, b, next) {
					if (next.getName() === name) {
						func(next.getName(), next.getData(), next);
						items.push({ 'name': next.getName(), 'value': next.getData(), 'next': next });	
					}
				});
			}
			return items;
		};
		that.findall = findall;

		var hash = {};
		var reverseLookup = function (dataMatch) {
			var matchItem;

			// check the hash first to avoid traversing the tree every time.
			if (hash[dataMatch]) {
				return(hash[dataMatch].getName());
			} 
			/*jslint unparam: true */
			this.inorder(function(name, data, node) {
				// this will only match the first instance of 'dataMatch', so data will have to be unique
				// or else the results will be random.
				if (!matchItem && dataMatch === data) {
					matchItem = node;
					hash[dataMatch] = node;
					return false;
				}
			});				
			return matchItem.getName();
		};
		that.reverseLookup = reverseLookup; 
		return that;
	};
	
	Local.Queue = function() {
		var Pending = []
			,Running = []
			,cleared = false
			,hold = false
			,that = {}
			,afterFunc = function () { return; }
			,afterFuncArgs = []
			,Depth = 1;

		var max = function (depth) {
			if (depth) {
				Depth = _.toInt(depth);
			}
			return this;
		};
		that.max = max;

		var after = function (func, args) {
			if (func && typeof func === 'function') {
				afterFunc = func;
				afterFuncArgs = args;
			}
			return this;
		};
		that.after = after;

		var run = function () {
			var nextJob = {};

			if (hold === true) { return; }
			if ((Pending.length > 0) // remaining jobs
					&& (Running.length < Depth)) { // more capacity available
				Running.push({});
				this.cycle();
				nextJob = Pending.shift();
				try {
					nextJob.func.apply(this, nextJob.args);
				} catch (e) {
					throw e;
				}
			} 
			return this;
		};
		that.run = run;

		var cycle = function () {
			var local = this;

			_.wait(1/10, function () {
				run.apply(local);
				if (Pending.length > 0) { cycle.apply(local); }
			});
		};
		that.cycle = cycle;

		var finish = function () {
			Running.pop();
			if (Pending.length === 0 && Running.length === 0) {
				afterFunc.apply(this, afterFuncArgs);
			}
			return this;
		};
		that.finish = finish;

		var submit = function(func) {
			Pending.push({ 'func': func, 'args': _.toArray(arguments).slice(1) });
			return this;
		};
		that.submit = submit;

		var suspend = function() {
			hold = true;
			return this;
		};
		that.suspend = suspend;

		var resume = function() {
			hold = false;
			that.run();
			return this;
		};
		that.resume = resume;

		var pending = function() {
			return Pending.length;
		};
		that.pending = pending;

		var running = function() {
			return Running.length;
		};
		that.running = running;

		var clear = function() {
			while (Pending.length > 0) {
				Pending.pop();
			}
			cleared = true;
			afterFunc(afterFuncArgs);
			return this;
		};
		that.clear = clear;
		return that;
	};
	
	Local.Hash = function (valueObj) {
		var that = {
			hashValues: valueObj || {}
		}
		, stemmer = bx.stemmer;

		var length = function () {
			return(_.keys(that.hashValues).length);
		};
		that.length = length;
		
		var post = function (v) {
			if (v) {
				this.hashValues = v;
			}
			return this.hashValues;
		};
		that.post = post;

		var besthits = function (bh) {
			if (bh) {
				this.bh = bh;
			}
			return this.bh;
		};
		that.besthits = besthits;

		var store = function (name, value) {							
			if (name && name !== '') {
				that.hashValues[name] = value;
			}
			return this;
		};
		that.store = store;

		var lookup = function (n) {
			var name = n || (this && this.name);
			
			return name && (that.hashValues[name] || that.hashValues[stemmer(name)]);
		};
		that.lookup = lookup;
		that.find = lookup;

		var contains = function (name) {
			return typeof lookup(name) !== 'undefined';
		};
		that.contains = contains;

		var remove = function (name) {
			if (this.hashValues[name]) {
				delete this.hashValues[name];
			} else if (this.hashValues[stemmer(name)]) {
				delete this.hashValues[stemmer(name)];
			}
			return this;
		};
		that.remove = remove;

		var each = function (action) {
			var local = this
				, i;

			for (i in local.hashValues) {
				if (local.hashValues.hasOwnProperty(i)) {
					if (action && typeof action === 'function') {
						action(local.hashValues[i], i);
					}					
				}
			}
			return this;
		};
		that.each = each;
		
		var keys = function () {
			return _.keys(this.hashValues);
		};
		that.keys = keys;
		
		var first = function () {
			return(this.lookup(this.keys()[0]));
		};
		that.first = first;

		// Purpose: retuns an object containing words common to both Dictionaries.
		// TBD: Optional merge function specifies how to combine hashValues from two into one; Defaults to value of this
		var intersects = function (v2) {
			return (_.names(_.select(this.hashValues, _.names(v2.hashValues))));
		};
		that.intersects = intersects;
		return that;
	};
	
	Local.List = function (obj) {
		var first = obj || {};
				
		first.child = undefined;
		first.sibling = undefined;
		first.owner = undefined;
		
		if (!first.id) {
			first.id = _.uniqueId('List-');
		}
		
		first.newItem = function (o) {
			return Local.List(o);
		};

		var firstChild = function() {
			return (this && this.child);
		};
		first.firstChild = firstChild;
		
		var lastChild = function () {
			if (this.child) {
				return this.child.lastSibling();
			}
			return this;
		};
		first.lastChild = lastChild;
		
		var parent = function () {
			return this && this.owner;
		};
		first.parent = parent;
		
		first.spliceIn = function (sib) {
			if (sib) {
				sib.sibling = this.sibling;
				this.sibling = sib;
				sib.owner = this.owner;
			}
			return sib;
		};
		
		first.spliceOut = function (s) {
			var sib = s || this
				, location = this.firstSibling();
			
			while (location.sibling !== sib) { location = location.sibling; }
			location.sibling = sib.sibling;
			sib.sibling = undefined;
			sib.owner = undefined;
			return location;
		};
		
		first.insertFirstChild = function (child) {
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
		
		var siblings = function (fn) {
			var next = this.owner.child;
			
			while (next) {
				if (_.isFunction(fn)) {
					fn.call(next, next);						
				}
				next = next.sibling;					
			}
			return this;
		};
		first.siblings = siblings;
		
		first.grandParent = function () {
			return (this.parent() && this.parent().parent());
		};
		
		first.lastSibling = function () {
			var sib = this.sibling || this
				, i = 0;
			while (sib && sib.sibling) {
				sib = sib.sibling;
				if ((i += 1) > 1000) {
					console.log('sibling cycle', this);
					throw 'cycle';
				}
			}
			return sib;
		};
		
		first.firstSibling = function () {
			return this.parent().firstChild();
		};
		
		// What it does: fetches the last sibling from the objects children and inserts child at the end.
		first.insertChild = function (child) {
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
		
		first.insertFirstSibling = function (sibling) {
			return this.owner.insertFirstChild(sibling);
		};
		
		first.insertLastSibling = function (sibling) {
			return this.owner.insertChild(sibling);
		};
		
		var walk = function(fn) {			
			if (!_.isFunction(fn)) {
				throw 'you must supply a function to the list walk method.';				
			}
			// visit this node
			fn.call(this, this);	
			if (this && this.child) {
				// its child
				walk.call(this.child, fn);
			}
			if (this && this.sibling) {
				walk.call(this.sibling, fn);
			}
		};
		first.each = walk;
		
		var find = function(id, fn) {
			var local = this
				, found;
			this.each(function(item) {
				if (item.id === id) {
					if (fn && _.isFunction(fn)) {
						fn.call(local, item);
					} else {
						found = item;
					}
				}
			});
			return found;
		};
		first.find = find;
		first.Id = find;
		return first;
	};
	
	// if the hash is not here, then create it.
	// What it does: Invokes Hash to add a hash and adds 'create' and 'Id' methods to this object.
	Local.Extend = function (maker) {
		var that = (maker && maker()) || {};
		
		if (!that.hasOwnProperty('hashValues')) {
			that = _.extend(that, Local.Hash());
		}
		
		// What it does: creates or updates a named object adds it to the hash
		that.create = function (instance) {
			var selector = _.isString(instance) ? instance  : 
				(instance && instance.id) || _.uniqueId('instance-');

			// pass descendents id, values and owner. all other properties supplied by 'instance'
			this.store(selector, maker(_.extend(instance, { 
				'hashValues': this.hashValues,
				'selector': selector,
				'id': this.id,
				'create': this.create,
				'owner': this })));
			return this.lookup(selector);
		};
		that.Id = function (name) {
			return ((name && that.lookup(name)) || (this && this.selector && that.lookup[this.selector]));
		};
		return that;
	};
	
	Local.Handler = function(spec) {
		var that = spec || {}
			, registry = [];

		that.uniqueId = function(s) {
			return _.uniqueId('Handler-'+s);
		};

		that.register = function(tag, fn) {
			var i = 0;
			registry.forEach(function(item, index) {
				if (item.tag === tag) {
					i = index;
				}
			});
			if (i === 0 || i === registry.length-1) {
				registry.push({ tag: tag, fn: fn });
			}
		};
		that.on = that.register;

		that.broadcast = function(tag, items) {
			var flag = 0;

			if (typeof tag !== 'string') {
				// nothing to broadcast;
				return;
			}
			registry.forEach(function(item, index) {
				if (item.tag === tag && typeof item.fn === 'function') {
					item.fn(tag, items);
					flag = index;
				}
			});
			if (flag === registry.length) {
				alert('Warning: No listener found for tag - ' + tag);
			}
		};

		that.trace = function() {
			return registry.slice(0);
		};

		return that;
	};
	
}(bx));

// Purpose: Routines to encapsulate JavaScripts math object. 
(function (Local) {
	"use strict";
	
	// Purpose: Routines to encapsulate JavaScripts math object. 
	// Isolating here may make it easier to optimize in the future.
	Local.arith = function (owner) {
		var mymath = owner || {};

		// sums the elements of an array
		var sum = function (a) {

			if (a.length === 0) {
				return 0;
			}
			return (_.reduce(a, function(memo, num){ return memo + num; }, 0));
		};
		mymath.sum = sum;		

		var pow = function (x, pwr) {

			return Math.pow(x, pwr);
		};
		mymath.pow = pow;

		var sumSq = function (vector) {			
			if (vector.length === 0) {
				return 0;
			}

			return ( sum(_.map(vector, function(item) {
				return pow(item, 2);
			})));
		};
		mymath.sumSq = sumSq;

		var sqrt = function (x) {
			if (typeof x !== 'number') {
				throw 'error: argument or object of square root must be a number - ' + typeof x;
			}

			return Math.sqrt(x);
		};
		mymath.sqrt = sqrt;

		var div = function (num, den) {			
			if (den === 0) {
				return 0;
			} 
			return (num / den);
		};
		mymath.div = div;

		var log10 = function (val) {
			return Math.log(val) / Math.log(10);
		};
		mymath.log10 = log10;

		var tfidf = function (count, words_in_doc, total_docs, docs_with_term) {
			var idf = function (num_docs, docs_with_term) { 
				try {
					return(1.0 + (log10(num_docs / docs_with_term)));
				}
				catch (e) {
					return 1.0;
				}
			};
			//console.log(count, words_in_doc, total_docs, docs_with_term, idf(total_docs, docs_with_term));			
			return((count / words_in_doc)*idf(total_docs, docs_with_term));	
		};
		mymath.tfidf = tfidf;
		
		var dotProduct = function(v1, v2, iterator) {
			var select = iterator || function(x) { return x; };

			return (_.reduce(_.map(_.intersection(_.keys(v1), _.keys(v2)), function(item) {
				return (select(v1[item]) * select(v2[item]));
			}), function(x, y) { return x + y; }, 0));
		};
		mymath.dotProduct = dotProduct;
		
		// Purpose: Constructor for scoring similarity of documents and clustering them.		
		var Cluster = function (Inherits) {
			var cluster = Inherits || {};

			// setter/getter. returns and object { left: itemI, right: itemJ }
			var best = function () {
				var best_score, left, right, that = {}, intersects;

				var score = function (l, r, score, X) {
					if (l && r) {
						if (typeof best_score === 'undefined' || score > best_score) {
							best_score = score;
							left = l;
							right = r;
							intersects = X || {};
						}						
					}
					return {
						'left': left,
						'right': right,
						'score': best_score,
						'intersects': intersects
					};				
				};
				that.score = score;
				return that;
			};
			cluster.best = best;

			// v1, v2 are objects { 'word':tfidf, ...} { ... }
			var euclid = function (v1, v2) {				
				// Nothing to correlate
				if (_.isEmpty(v1)) {
					return 0;
				}
				var shared = _.intersects(v1, v2)
					,sumSq = 0;

				// calculate the square of the difference for each shared item	
				_.each(shared, function(item) {
					sumSq += pow((v1[item] - v2[item]), 2);
				});

				// return the square root of the sum.
				return sqrt(sumSq);
			};
			cluster.euclid = euclid;
			cluster.euclid.score = best().score;

			// v1, v2 are [] Arrays
			var pearson = function (vectors) {
				var v1 = vectors.v1
					,v2 = vectors.v2;

				// Nothing to correlate
				if (_.isEmpty(v1)) {
					return 0;
				}
				var	// Simple sums
					len = _.objectLength(v1)
					,sum1 = sum(v1)		
					,sum2 = sum(v2)
					// Sum of squares
					,sum1Sq	= sumSq(v1)		
					,sum2Sq = sumSq(v2)
					// Sum of products
					,pSum = sum(_.map(v1, function(item, i) {
						return (v2[i] ? item*v2[i] : 0);
					}))
					,num
					,score;

				// Calculate the Pearson score
				num = pSum - div((sum1*sum2), len);			
				score = sqrt((sum1Sq-div(pow(sum1,2), len)) * (sum2Sq-div(pow(sum2,2), len)));

				//console.log('num, score', num, score);						
				return (score === 0 ? 0 : div(num, score));
			};
			cluster.pearson = pearson;
			return cluster;
		};
		mymath.Cluster = Cluster;
		return mymath;
	};

}(bx));

// Porter stemmer in Javascript. Few comments, but it's easy to follow against
// the rules in the original paper, in
//
//  Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14, no. 3,
//  pp 130-137,
//
// see also http://www.tartarus.org/~martin/PorterStemmer

// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009
//
// CommonJS tweak by jedp

// RR: modified for node.js calling pattern April 2012
/*jslint newcap: false, node: true, vars: true, white: true, nomen: true  */
/*global bx: true */

(function (Local) {
	"use strict";

	var porter = (function (owner) {
		var that = owner || {};
		
		var step2list = {
		    "ational" : "ate",
		    "tional" : "tion",
		    "enci" : "ence",
		    "anci" : "ance",
		    "izer" : "ize",
		    "bli" : "ble",
		    "alli" : "al",
		    "entli" : "ent",
		    "eli" : "e",
		    "ousli" : "ous",
		    "ization" : "ize",
		    "ation" : "ate",
		    "ator" : "ate",
		    "alism" : "al",
		    "iveness" : "ive",
		    "fulness" : "ful",
		    "ousness" : "ous",
		    "aliti" : "al",
		    "iviti" : "ive",
		    "biliti" : "ble",
		    "logi" : "log"
		  };

		var step3list = {
		    "icate" : "ic",
		    "ative" : "",
		    "alize" : "al",
		    "iciti" : "ic",
		    "ical" : "ic",
		    "ful" : "",
		    "ness" : ""
		  };

		var c = "[^aeiou]";          // consonant
		var v = "[aeiouy]";          // vowel
		var C = c + "[^aeiouy]*";    // consonant sequence
		var V = v + "[aeiou]*";      // vowel sequence

		var mgr0 = "^(" + C + ")?" + V + C;               // [C]VC... is m>0
		var meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$";  // [C]VC[V] is m=1
		var mgr1 = "^(" + C + ")?" + V + C + V + C;       // [C]VCVC... is m>1
		var s_v = "^(" + C + ")?" + v;                   // vowel in stem

		var stemmer = function (w) {
		  var stem;
		  var suffix;
		  var firstch;
		  var re;
		  var re2;
		  var re3;
		  var re4;
		  var origword = w;

		  if (w.length < 3) { return w; }

		  firstch = w.substr(0,1);
		  if (firstch === "y") {
		    w = firstch.toUpperCase() + w.substr(1);
		  }

		  // Step 1a
		  re = /^(.+?)(ss|i)es$/;
		  re2 = /^(.+?)([^s])s$/;

		  if (re.test(w)) { w = w.replace(re,"$1$2"); }
		  else if (re2.test(w)) {  w = w.replace(re2,"$1$2"); }

		  // Step 1b
		  re = /^(.+?)eed$/;
		  re2 = /^(.+?)(ed|ing)$/;
		  if (re.test(w)) {
		    var fp = re.exec(w);
		    re = new RegExp(mgr0);
		    if (re.test(fp[1])) {
		      re = /.$/;
		      w = w.replace(re,"");
		    }
		  } else if (re2.test(w)) {
		    var fp = re2.exec(w);
		    stem = fp[1];
		    re2 = new RegExp(s_v);
		    if (re2.test(stem)) {
		      w = stem;
		      re2 = /(at|bl|iz)$/;
		      re3 = new RegExp("([^aeiouylsz])\\1$");
		      re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
		      if (re2.test(w)) { w = w + "e"; }
		      else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
		      else if (re4.test(w)) { w = w + "e"; }
		    }
		  }

		  // Step 1c
		  re = /^(.+?)y$/;
		  if (re.test(w)) {
		    var fp = re.exec(w);
		    stem = fp[1];
		    re = new RegExp(s_v);
		    if (re.test(stem)) { w = stem + "i"; }
		  }

		  // Step 2
		  re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
		  if (re.test(w)) {
		    var fp = re.exec(w);
		    stem = fp[1];
		    suffix = fp[2];
		    re = new RegExp(mgr0);
		    if (re.test(stem)) {
		      w = stem + step2list[suffix];
		    }
		  }

		  // Step 3
		  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
		  if (re.test(w)) {
		    var fp = re.exec(w);
		    stem = fp[1];
		    suffix = fp[2];
		    re = new RegExp(mgr0);
		    if (re.test(stem)) {
		      w = stem + step3list[suffix];
		    }
		  }

		  // Step 4
		  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
		  re2 = /^(.+?)(s|t)(ion)$/;
		  if (re.test(w)) {
		    var fp = re.exec(w);
		    stem = fp[1];
		    re = new RegExp(mgr1);
		    if (re.test(stem)) {
		      w = stem;
		    }
		  } else if (re2.test(w)) {
		    var fp = re2.exec(w);
		    stem = fp[1] + fp[2];
		    re2 = new RegExp(mgr1);
		    if (re2.test(stem)) {
		      w = stem;
		    }
		  }

		  // Step 5
		  re = /^(.+?)e$/;
		  if (re.test(w)) {
		    var fp = re.exec(w);
		    stem = fp[1];
		    re = new RegExp(mgr1);
		    re2 = new RegExp(meq1);
		    re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
		    if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
		      w = stem;
		    }
		  }

		  re = /ll$/;
		  re2 = new RegExp(mgr1);
		  if (re.test(w) && re2.test(w)) {
		    re = /.$/;
		    w = w.replace(re,"");
		  }

		  // and turn initial Y back to y

		  if (firstch == "y") {
		    w = firstch.toLowerCase() + w.substr(1);
		  }

		  return w;
		}
		that.stemmer = stemmer;
		that.porter = stemmer;

		// memoize at the module level
		var memo = {};
		var memoizingStemmer = function(w) {
		  if (!memo[w]) {
		    memo[w] = stemmer(w);
		  }
		  return memo[w];
		}
		that.memoizingStemmer = memoizingStemmer;
		return that;
	}(Local));

}(bx));

(function(Local) {
	"use strict";
	
	// Web: http://norm.al/2009/04/14/list-of-english-stop-words/
	var stopwords = 'a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your';
	
	Local['text-utils'] = function (owner) {
		var that = owner || {};
				
		var Sentence = function (s) {
			var sentence = {}
				, sw = bx.Hash();

			// compile the stopwords into a hash
			stopwords.split(',').forEach(function( item ) {
				sw.store(item, 1);
			});

			sentence.sentence = s;
			// splits a string in to an array of keywords delimited by spaces;
			var tokenize = function (input) {
				return(input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' '));
			};
			sentence.tokenize = tokenize;

			// Removes stop words from input and returns a new object with the stopwords removed.
			var stopWords = function (input) {
				var words = input || this;
				/*jslint unparam: true */
				words.forEach(function(word, index) {
					if (sw.contains(word)) {
						delete words[index];
					}				
				});
				return _.compact(words);
			};
			sentence.stopWords = stopWords;

			// removes words shorter than 'min' from consideration. 
			// also removes numbers-only by default
			// accepts Optional 'max' parameter to filter long words
			// example: { num: true, min: 3 }
			var applyfilter = function(f, input) {			
				var num = (f && f.num) || true
					,max = (f && f.max) || undefined
					,min = (f && f.min) || 1
					, words = input || this;

				/*jslint unparam: true */
				words.forEach(function(word, index) {
					if (word.length < min || (max && word.length > max) ||
						(num === true && (word.replace(/[^a-z]+/g, '') === ''))) {
						delete words[index];
					}				
				});
				return _.compact(words);		
			};
			sentence.applyfilter = applyfilter;

			// Purpose: create DICTIONARY with stemmed words
			var stem = function (input) {
				var words = input || this
					, target = [];
				/*jslint unparam: true */
				words.forEach(function(word) {
					target.push(bx.stemmer(word));				
				});
				return target;
			};
			sentence.stem = stem;

			var toHash = function (input) {
				var words = input || this
					, hash = bx.Hash()
					, found;

				words.forEach(function(word) {
					found = hash.lookup(word);
					if (found) {
						found.count += 1;
						hash.store(word, found);
					} else {
						hash.store(word, { 'count': 1, 'tfidf': 0 });
					}
				});
				return hash;
			};
			sentence.toHash = toHash;

			if (_.isString(s)) {
				return(toHash(stem(applyfilter({'min': 3, 'max': 25}, stopWords(tokenize(s))))));
			}
			return sentence;
		};
		that.Sentence = Sentence;

		// Purpose: returns a DICTIONARY object with tokenized and stemmed words; provides a tfidf() method
		// for computing the selective value of a term in a document relative to a corpus.
		var text = function(s) {
			var that = s || bx.Hash()
				, id
				, sources = []
				, arith = bx.arith();
				;

			var objId = function (name) {
				var random = new Date();
				if (name) {
					id = name;
					return this;
				}
				if (!id) {
					id = _.uniqueId(random.getTime());
					return this;
				}
				return id;
			};
			that.id = objId;

			var insert = function (source) {
				sources.push(source);
			};
			that.insert = insert;

			var docs = function (list) {
				if (list) {
					sources = list;
				}
				return sources;
			};
			that.docs = docs;

			var stats = function (owner) {
				var local = owner || this
					, count = 0
					, uniq = 0;

				local.each(function(item) {
					count += item.count;
					uniq += 1;
				});

				return ({
					wordCount: count,
					uniqWords: uniq,
					total_docs: this.docs().length,
					words: that.values
				});
			};
			that.stats = stats;

			// merges the dictionary from 'words' into 'target' and keeps a count of the
			// number of documents containing a word
			var merge = function (source) {
				var target = this
					, found;
				/*jslint unparam: true */
				source.each(function(item, word) {
					found = target.lookup(word);
					if (found) {
						found.count += 1;
						target.store(word, found);
					} else {
						target.store(word, { 'count': 1, 'tfidf': 0 });					
					}
				});
				this.insert(source);
				return this;
			};
			that.merge = merge;

			var getCount = function (name, owner) {
				var local = owner || this;
				return ((local.lookup(name) && local.lookup(name).count) || 0);
			};
			that.getCount = getCount;


			// Purpose: compute the term-frequency, inverse document (tfidf) frequency for a
			// 'word' in a document relative to a 'corpus'
			var tfidf = function (word, corpus) {
				var doc = this
					, count = doc.getCount(word) || 0
					, words_in_doc = doc.stats().wordCount;

				if (count > 0) {
					return( arith.tfidf(count, words_in_doc, corpus.docs().length, corpus.getCount(word)) );				
				}
				return (0);
			};

			// updates the dictionary with tfidf values 
			var frequencies = function (corpus) {
				var doc = this;

				doc.each(function(entry, word) {
					doc.store(word, { 'count': entry.count, 'tfidf': tfidf.call(doc,word,corpus) });
				});
				return this;
			};
			that.frequencies = frequencies;

			var sentence = function () {
				return _.isString(s) && s;
			};
			that.sentence = sentence;

			var bestHits = function (query, corpus) {
				var subject = corpus || this
					, result = [];

				// for each document in the corpus
				subject.docs().forEach(function(doc) {
					// don't compare to itself
					if (doc.id() !== query.id()) {
						// get the intersection of its word vector with the query
						result.push([ doc.id(), arith.dotProduct(doc.values, query.values, function(x) {
							return x.tfidf;
						})]);
					}
				});			
				return (_.sortBy(result, function (x) { return -(x[1]); }));
			};
			that.bestHits = bestHits;
			
			// converts a 'dictionary' index to list of Text() object
			// generates a 'corpus'
			// view: key: [ 'word', 'doc._id' ], value: {} 
			var toText = function (result, iterator) {
				var docs = {}
					, corpus = text()
					, tmp
					, select = _.isFunction(iterator) ? iterator  : function (r) { 
							return ({'doc': r.key[1], 'word': r.key[0], 'value': r.value });
					};
				// for each row of the dictionary, get a word and optionally create a new doc
				result.each(function(row) {
					tmp = select(row);

					if (!docs[tmp.doc]) {
						docs[tmp.doc] = text();		// create the text object
						docs[tmp.doc].id(tmp.doc);		// give the text object an id
					}
					docs[tmp.doc].store(tmp.word, tmp.value);
				});
				// combine all the docs into a corpus
				_.each(docs, function(doc) {
					corpus.merge(doc);
				});
				return(corpus);
			};
			that.toText = toText;
			return that;
		};
		that.Text = text;
		return that;	
	};
	return Local;
}(bx));	




