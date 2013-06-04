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
/*global _: true, bx: true */

(function(global) {
	"use strict";
	
	var rows = function (response, ddoc, design) {		
		// Object for adding methods and data to rows of a 
		// response data object based on information about the design
		var that = _.extend({}, response)
		// initialize 'selected' rows
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
		that.cell = boxspring.cell(design && design.types, design && design.formats);

		// What it does: Provides methods for updating the state of a collection of rows;
		var collection = function () {
			var that = boxspring.UTIL.hash()
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
				return boxspring.row(that, row, design);
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
				} else {
					return this.last();
				}
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
			, local = this
			, selectedRowsIndexes;
			
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

		// What it does: returns the index of the column requested, or 'sortColumn', or 0 if not found
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
	
}(boxspring));
