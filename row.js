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
/*global _: true, bx: true */

(function(global) {
	"use strict";
	var row;
	
	if (typeof exports !== 'undefined') {
		row = exports;
	} else {
		row = global.row = {};
	}

	// Constructor for creating a hash out of the row for accessing and manipulating it
	row.construct = function (owner, currentRow) {
		_.extend(this, currentRow, bx.Lookup.Hash());
		this.columns = owner.columns;
		this.keys = owner.keys;
		this.visible = owner.visible;
		this.cell = owner.cell;
		// buffer and visible provide 'state' for selecting key/values for a single row, and for 
		// remembering which keys had values for a collection of rows. useful when displaying tables
		// to hide columns which have no values;

		// What it does: given a row of data, uses the key/columns to create a hash of key/value pairs		
		(function(local) {
			var store = function(key, value) {
				local.set(key, value);
				// if this key is in our display list, then save it in the visible list
				if (_.found(local.columns, key)) {
					owner.visible.set(key, true);
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
		}(this));
	};
	
	var getKey = function (index) {
		var key = _.isArray(this && this.key) ? this.key : [ this && this.key ];
		return key[index || 0];
	};
	row.getKey = getKey;
	
	var getValue = function () {
		return this && this.value;
	};
	row.getValue = getValue;
	
	// What it does: return the value of 'name' in this row
	var select = function (name) {
		var summary = {};
		if (name === 'summary') {
			summary = this.post();
			summary.total = this.get('summary') && this.get('summary').total;
			return summary;
		} 
		if (name === 'total') {
			return this.contains('summary') && this.get('summary').total; 
		}
		return this.get(name);
	};
	row.select = select;

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
	row.selectFor = selectFor;
	
	// What this does: Used by the filter routine to handle filtering objects and array and dates types
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
	
	row.filter = function (filterObject) {
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
					var type = local.cell.getType(key);

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
}(this));
