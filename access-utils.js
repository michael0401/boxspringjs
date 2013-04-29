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
	
	var Keys = function (owner) {
		var that = owner || {};
		
		// What it does: setter/getter the keys portion of the supplied columns array
		var localkeys = function () {
			if (this.contains('group_level')) {
				return this.get('keys').slice(0, this.get('group_level'));				
			}
			return this.get('keys');
		};
		that.keys = localkeys;
		
		// What it does: setter/getter column portion of the supplied columns array
		var localcolumns = function () {
			return(this.get('columns'));
		};
		that.columns = localcolumns;
		
		var referenceKey = function () {
			return(this.get('referenceKey'));
		};
		that.referenceKey = referenceKey;
		
		// What it does: returns all keys+columns
		var all = function () {
			return (this.get('displayColumns') || 
				_.uniq(localkeys.apply(this)
					.concat(localcolumns.apply(this)
					.concat(referenceKey.apply(this)))));
		};
		that.all = all;
		
		var displayColumns = function () {
			if (this.contains('group_level')) {
				return this.all().slice(0, this.get('group_level'));
			} 
			return this.all();
		};
		that.displayColumns = displayColumns;
		
		// What it does: returns keys sliced to group_level and summarized keys
		var summary = function (group_level, items) {
			return(this.get('keys').slice(0,group_level).concat(items));
		};
		//that.summary = summary;
		
		// What it does: given a keys Array and a group level, returns the key slices and count column
		var group = function (group_level) {
			return(summary(group_level, ['Count']));
		};
		that.group = group;
		
		/*
		trial.unGroup(
			[	trial.conditions(),
				[ trial.sponsor() ], 
				trial.year() ], function(keys, index) {
					emit(keys, trial.values('Index'));
			});
		*/
		var emitGroups = function (args, fn) {
			var items = args
			, local = this;
			/*global log: true */
			if (!_.isFunction(fn)) { if (log) { log('fatal [ emitGroups ] - no emit function.'); }}
			if (!_.isArray(args)) { items = [ args ]; }
			
			// execute the method to fetch the value for the key; if it doesn't return an array,
			// coerce it to an array.
			items = _.map(items, function (key) { return _.coerce('array', local[key]()); });
			this.unGroup.call(this, items, function(row, i) {				
				fn(row, i);
			});
		};
		that.emitGroups = emitGroups;
		
		// What this does: Used by 'map' functions, opposite of _.flatten, 
		// takes an array of arrays and returns multi-dimensional array. 
		// [[1, 2], [a, b]] produces -> [[1a], [1b], [2a], [2b]] 
		var unGroup = function (v, fn) {
			var r1 = ''
			, r2 = ''
			, i;
			
			var zip = function (a, b) {
				var result = ''
				, v1 = a.length > 0 ? a : ['']
				, v2 = b.length > 0 ? b : [''];

				if (_.isArray(v1) && _.isArray(v2)) {
					_.each(v1, function(a) {
						_.each(v2, function(b) {
							result += a + '|' + b + '&';
						});
					});
				}
				result = result.substr(0,result.length-1).split('&');
				return result;
			};
			
			if (_.isArray(v) && v.length > 1 && _.isArray(v[0]) && _.isArray(v[1])) {
				r1 = v[v.length-1];
				for (i=v.length; i>1; i-=1) {
					r1 = zip(v[i-2], r1);
				}
				r2 = _.map(r1, function(r) {
					return r.split('|');
				});					
			} else if (_.isArray(v) && v.length > 0 && _.isArray(v[0])) {
				r2 = _.map(v[0], function (x) { return [x]; });
			} else if (_.isArray(v)) {
				r2 = _.map(v, function (x) { return [x]; });
			} else {
				r2 = [];
			}
			if (fn && _.isFunction(fn)) {
				r2.forEach(function(row, i) {
					fn(row, i);
				});
			}
			return r2;
		};
		that.unGroup = unGroup;
		return that;
	};
	Local.Keys = Keys;
	
	var Filter = function (owner) {
		var that = owner || {};
		
		var compare =  function() {
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
		
		var filter = function (keyValues) {
			var local = this
			, outerFound = false
			, found
			, list = _.isArray(keyValues) ? keyValues : [ keyValues ];
			// execute until filter returns false or no more filters to run
			list.forEach(function(items) {
				found = true;	// must match every key/value for each sub-filter
				// run this only if we don't have a match yet
				if (outerFound === false) {
					_.each(items, function(value, key) {
						var type = local.hasType(key);

						if (_.isFunction(value)) {
							found = found && value.call(local, local.key, local.value);
						} else if (type === 'string') {
							found = found && local.selectFor(key, value);
						} else if (type === 'number') {
							found = found && (value === _.coerce('number', local.select(key)));
						} else if (type === 'array' || type === 'object') {
							found = found && compare()[type](key, value, local.select(key));								
						} else {
							throw '[ base-utils 958 ] - unsupported type: ' + type;
						}
					});					
				}
				// must match 'any' key/value pair for each sub-filter
				outerFound = outerFound || found;
			});
			return (outerFound);
		};
		that.filter = filter;
		return that;
	};
	Local.Filter = Filter;
	
	var Rows = function (owner) {		
		var buffer = bx.Keys(_.clone(owner || {}))
		, visible = [];

		// What it does: given a row of data, uses the key/columns to create a hash of key/value pairs
		var access = function (d) {
			var store = function(key, value) {
				buffer.hash.set(key, value);
				// if this key is in our display list, then save it in the visible list
				if (_.arrayFound(key, buffer.all())) {
					visible.push(_.arrayFind(key, buffer.all()));					
					visible = _.sortBy(_.uniq(visible), _.item);
				}
			}
			, doc = _.clone(d);							
			// create a new hash for each access; fetch key-values by position
			buffer.hash = bx.Hash();
			buffer.keys().forEach(function(val, index) {
				store(val, (doc && doc.key && doc.key[index]));
			});
			// fetch value-values by lookup
			if (_.isObject(doc.value)) {
				// only look for column values not found in keys()				
				_.difference(buffer.columns(), buffer.keys()).forEach(function(val) {
					if (typeof doc.value[val] !== 'undefined') {
						store(val, doc.value[val]);
					}
				});					
			} else {
				// grab the value from doc.value
				_.difference(buffer.columns(), buffer.referenceKey()).forEach(function(val) {
					store(val, doc.value);
				});
			}
			this.set('visibleColumns', visible);
			return this;
		};
		buffer.access = access;
		
		var columnReset = function () {
			visible = [];
			this.set('visibleColumns', []);
			buffer.hash = bx.Hash();
			return this;
		};
		buffer.columnReset = columnReset;
		
		// What it does: returns the index of the column requested, or 'sortColumn', or 0 if not found
		var column2Index = function (c) {
			var column = c || this.get('sortColumn')
			, activeColumns = this.get('displayColumns') || this.get('columns');
			return	(_.arrayFound(column, activeColumns) ?
						_.arrayFind(column, activeColumns) : 0);
		};
		buffer.column2Index = column2Index;
		
		// What it does: returns the name of the column requested, or the 'sortColumn', or undefined
		var index2Column = function (i) {
			var index = _.isNumber(i) ? i : column2Index();
			return this.get('displayColumns')[index] || this.get('columns')[index];
		};
		buffer.index2Column = index2Column;
		
		var valuesExist = function () {
			// BEWARE: Hash 'keys' method is over-written by local 'keys' method; use _.keys
			return _.keys(buffer.hash.post());
		};
		buffer.valuesExist = valuesExist;
		
		var getSortColumn = function () {
			if (_.arrayFound(this.get('sortColumn'), this.valuesExist())) {
				return(_.arrayFind(this.get('sortColumn'), this.valuesExist()));
			}
			if (_.arrayFound('total', this.valuesExist())) {
				return(_.arrayFind('total', this.valuesExist()));					
			}
			return 0;
		};
		buffer.sortColumn = getSortColumn;
		
		// What this does: given a new set of columns, use the keys to determine the 'type'
		// of the column and sort based on that type
		var columnSort = function (reverse) {
			var direction = (reverse) ? -1 : 1
			, cols = buffer.get('columns');

			buffer.set('columns', _.sortBy(cols, function (x) {
				if (_.isNumber(x) || _.isNumber(_.toInt(x))) {
					return (_.toInt(x) * direction);
				}
				// else returns the position in the array
				return (_.arrayFind(x, cols) * direction);
			}));
			return this;
		};
		buffer.columnSort = columnSort;

		var getKey = function (row) {
			var local = row || this;
			return local && local.key;
		};
		buffer.getKey = getKey;
		
		var getValue = function (row) {
			var local = row || this;
			return local && local.value;
		};
		buffer.getValue = getValue;
		
		// What it does: return the value of 'name' in this row
		var select = function (name) {
			var summary = {};
			if (name === 'summary') {
				summary = buffer.hash.post();
				summary.total = buffer.hash.get('summary') && buffer.hash.get('summary').total;
				return summary;
			} 
			if (name === 'total') {
				return buffer.hash.contains('summary') && buffer.hash.get('summary').total; 
			}
			return buffer.hash.get(name);
		};
		buffer.select = select;

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
		buffer.selectFor = selectFor;

		// initialize the 'visibleColumns' to be all columns
		buffer.set('visibleColumns', _.map(buffer.columns(), function (x, i) { return i; }));
		return buffer;
	};
	Local.Rows = Rows;
	
	// formats a cell value for google.vis
	/*jslint unparam: true */
	var Cell = function (target) {
		var that = target || {}
		, types = ['string','number','boolean','date','datetime','timeofday','object','array']
		, builtInColumns = _.options({
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
				
		// What it does: methods for adding columnTypes to an object.
		var columnTypes = (function () {
			var that = {};

			/*global log: true */
			// What it does: accepts name/type or object of names/types. Extends the types hash
			var extend = function (name, type, width) {
				var buffer = {};

				if (typeof name === 'string') {
					buffer[name] = [type || 'string', width || 2];
				} else if (typeof name === 'number') {
					buffer[name] = [type || 'number', width || 1];
				} else if (typeof name === 'object') {
					buffer = name;
				}
				
				_.options(buffer).each(function(item, key) {
					if (_.arrayFound(item[0], types)) {
						builtInColumns.store(key, item);
					} else if (bx.COUCH) {
						log('[ base-utils.js line 932 ] - invalid type: ' + item);
					} else {
						bx.logm('invalid-type', 500, '[ columnTypes().extend ] - ' + item);								
					}
				});				
			};
			that.extend = extend;
			return that;
		}());
		that.columnTypes = columnTypes.extend;

		that.hasType = function (key) {
			return builtInColumns.lookup(key) && builtInColumns.lookup(key)[0];
		};
		
		that.columnWidth = function (key) {
			return (builtInColumns.lookup(key) && builtInColumns.lookup(key)[1]) || 1;			
		};
		
		var newCell = function(o) {
			var owner = this
			, buf = {}
			, cell = {
				'name': o.name,
				'value': o.value,
				'type': owner.hasType(o.name),
				'format': o.format,
				'properties': o.properties
			};
			// for now, only allow number values for 'pivot'; in the future, we will pivot on objects
			if (this.get('pivot') && typeof o.value === 'object') {
				cell.value = o.value[this.get('pivot-summary')];
				cell.type = 'number';
			}
			// if there is a formatter function, then call it and return
			if (this.formats()[cell.name]) {
				cell.type = 'string';
				if (_.isString(cell.value)) {
					cell.format = this.formats()[cell.name](cell.value).toString();
				} else {
					cell.format = this.formats()[cell.name](cell.value).toString();					
					cell.value = _.map(cell.value, _.item).join(',');
				}
				return cell;
			}
			// call the generic formatter then
			if (cell.type === 'array') {
				cell.format = this.formats()['array'](cell.value).toString();
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
			// built in array and object processing
			if (cell.type === 'array') {
				// the object is re-formated to a list
				if (cell.value && _.isArray(cell.value) && cell.value.length > 0) {
					cell.value = bx.Browser().element().unorderedList(cell.value, {})
						.display().data;						
				} else {
					cell.value = '';						
				}
				cell.type = 'string';
				return cell;
			}
			if (cell.type === 'object') {
				// the group_leveld object is reformatted to a table
				if (cell.value && _.isObject(cell.value)) {
					// map only the properties with values, to save space:
					buf = _.reduce(_.map(_.keys(cell.value), function(name, value) {
						return [ name, cell.value[name] ]; }), function (x, y) {
							if (y[0] && (_.isNumber(y[1] || _.isString(y[1])))) { 
								x.push(y); 
							}
						return x; 
					}, []);
					// format this object using the html table tags				
					cell.value = bx.Browser().element()
						.table(buf.slice(0,1), buf.slice(1)).display().data;
				} else {
					cell.value = (cell.value && cell.value.toString()) || '';
				}
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
	Local.Cell = Cell;
	
	// What this does: methods for describing and manipulating the key/columns for a document
	var Access = function (query) {
		// add Rows and Keys (inherited from Rows) methods to this object, and Cell
		var that = query || {};
		
		// if this object doesn't already have Hash, give it one
		if (!that.hasOwnProperty('hashValues')) {
			that = _.extend({}, that, bx.Hash());
		}
		that = _.extend({}, bx.Rows(that), bx.Cell(), bx.Filter(that));		
		// store the document
		that.set('docRef', query);
		
		// What it does: used by map functions to assert the validity of the input
		var assert = function (type) {
			return((this && this.Id() && this.get('docRef').type===type) && this);
		};
		that.assert = assert;
		
		var Id = function () {
			return this.get('docRef')._id;
		};
		that.Id = Id;

		// What it does: accesses the source document.
		// uses an Array or variable length list of properties and returns the first matching property
		var fetch = function (items) {
			var local = this
				, args = _.isArray(items) ? items : _.toArray(arguments)
				, results = [];

			args.forEach(function(item) {
				results.push(_.hfetch(local.get('docRef'), item));					
			});
			return args.length > 0 && results[0];
		};
		that.fetch = fetch;		
		return that;
	};
	Local.Access = Access;
}(bx));
