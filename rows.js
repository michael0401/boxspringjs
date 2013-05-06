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
	var rows;
	
	if (typeof exports !== 'undefined') {
		rows = exports;
	} else {
		rows = global.rows = {};
	}

	// Constructor for adding methods and data to a response data object based on information
	// about the design
	rows.construct = function (response, ddoc, design) {
		var local = _.extend(this, response, bx.Lookup.Hash());
				
		if (ddoc && ddoc.views && ddoc.views[design.index]) {
			this.set('sortColumn', _.fetch(ddoc.views[design.index], 'sortColumn') || []); 
			this.columns = _.fetch(ddoc.views[design.index], 'columns') || [];
			this.keys = _.fetch(ddoc.views[design.index], 'keys') || [];
		} else {
			this.columns = [];
			this.keys = [];
		}
		// initialize 'displayColumns'.
		this.set('displayColumns', this.columns);
		
		// initialize the 'cell' object methods to allow typing and formatting individual cells
		this.cell = _.create(bx.cell, design.types, design.formats);

		// initialize the collection and map each row;
		this.visible = this.collection();
		response.data.rows = _.map (response.data.rows, function (row) {
			return _.create(bx.row, local, row, design);
		});

		// allow the caller to iterate using each or map;
		this.each = function () {
			return response.data.rows;
		};
	};
	
	rows.sortColumn = function (c) {
		if (c) {
			this.set('sortColumn', c);
		}
		return this.get('sortColumn');
	};
	
	// setter/getter for modifying the list of columns to display;
	rows.displayColumns = function(d) {
		if (d) {
			this.set('displayColumns', _.isArray(d) && d);			
		}
		return (((this.get('displayColumns')).length && this.get('displayColumns')) || this.columns);
	};
	
	// What it does: returns the index of the column requested, or 'sortColumn', or 0 if not found
	var column2Index = function (c) {
		var column = c || this.sortColumn
		, activeColumns = this.columns2Display || this.columns;
		return	(_.found(activeColumns, column) ?
					_.fetch(activeColumns, column) : 0);
	};
	rows.column2Index = column2Index;
	
	// What it does: converts an integer index into the column list and 
	// returns the name of the column
	var index2Column = function (i) {
		var index = _.isNumber(i) ? i : column2Index();
		return this.get('displayColumns')[index] || this.columns[index];
	};
	rows.index2Column = index2Column;
	
	// What this does: use the names of the columns to determine the 'type' 
	// of the column and sort based on that type
	var columnSort = function (reverse) {
		var direction = (reverse) ? -1 : 1
		, local = this;
		
		this.set('displayColumns', _.sortBy(this.columns, function (x) {

			if (_.isNumber(x) || !_.isNaN(_.toInt(x))) {
				return (_.toInt(x) * direction);
			}
			// else returns the position in the array
			return (_.fetch(local.columns, x) * direction);
		}));
		
		return this;
	};
	rows.columnSort = columnSort;
	
	// What it does: Provides methods for updating the state of a collection of rows;
	rows.collection = function () {
		var that = bx.Lookup.Hash()
		, local = this;	
		// What it does: set/get property names for the values that exist for a given row;
		// When called over a collection of rows, provides the existence of a value for a column
		var setValues = function (values) {
			if (values) {
				this.update(values);
			}
			return this.keys();
		};
		that.setValues = setValues;

		// What it does: Once a set of rows has been processed, the sortColumn may not have any values
		// if not, then pick the 'total' column if it exists, or just the 0 column;
		var getSortColumn = function () {
			if (local.sortColumn() && _.found(this.setValues(), local.sortColumn())) {
				return local.column2Index(local.sortColumn());
			}
			if (_.found(this.setValues(), 'total')) {
				return _.fetch(this.setValues(), 'total');
			}
			return 0;
		};
		that.getSortColumn = getSortColumn;
		return that;
	};
	
}(this));
