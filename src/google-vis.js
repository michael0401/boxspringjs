/* ===================================================
 * google-vis.js v0.01
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
/*global $: true, jQuery: true, Boxspring: true, _: true, window: true */

/*global google: true, document: true, $:true */
(function(global) {
	"use strict";
	
	// What this does: takes a wrapped response.data object and makes it ready for a google table
	// Purpose: takes a 'result' object and generates a form of the object compatible with Google
	// visualization tables result: a wrapped response from a CouchDB view
	// cols: an Array of Properties to serve as Column ids
	// Example format:
	/*
	var dt = new google.visualization.DataTable(
	     {
	       cols: [{id: 'task', label: 'Task', type: 'string'},
	                {id: 'hours', label: 'Hours per Day', type: 'number'}],
	       rows: [{c:[{v: 'Work'}, {v: 11}]},
	              {c:[{v: 'Eat'}, {v: 2}]},
	              {c:[{v: 'Commute'}, {v: 2}]},
	              {c:[{v: 'Watch TV'}, {v:2}]},
	              {c:[{v: 'Sleep'}, {v:7, f:'7.000'}]}
	             ]
	     },
	   0.6
	);
	*/
	/*
	'query': result.query,
	'result': result,
	'tags': result.query.post(),
	'onSelection': onSelectionId
	
	*/
	
	var googleVis = function (options) {
		var type = (options && options.type) || 'Table'
		, targetDiv = (options && options.targetDiv) || 'on-display'
		, onSelection = 'onSelection'
		, onPage = 'onPage';
		
		var vis = {
			'types': ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday']
		};
		
		var dataSource = (function () {
			var local = this
			, data;
			
			/*
			type - A string describing the column data type. Same values as type above.
			label - [Optional, string] A label for the column.
			id - [Optional, string] An ID for the column.
			role - [Optional, string] A role for the column.
			pattern - [Optional, string] A number (or date) format string to display column value.
			*/
			// Routines to format and style the Table
			var googleStyle = function (data) {
				var i, j
				, cols = this.getDisplayColumns()
				, formatter_long;
				
				// Create a formatter and apply to 'date' columns.
				formatter_long = new google.visualization.DateFormat({formatType: 'long'});
				for (j = data.getNumberOfColumns()-1; j > -1; j -= 1) {
					// Reformat 'date' columns.
					if (data.getColumnType(j) === 'date') {
						formatter_long.format(data, j);						
					}
				}

				// What it does: 
				// Adds a classname corresponding to width style cell in the table
				for (i = data.getNumberOfRows()-1; i > -1; i -= 1) {				
					for (j = data.getNumberOfColumns()-1; j > -1; j -= 1) {
						data.setProperties(i, j, {
							'className': 'googleCell' + this.cell.columnWidth(cols[j])
						});
					}
				}
				return data;				
			};
			
			var googleColumn = function (chartType, cell, index, id) {

				// don't allow ineligible column types. 
				// or else google vis will throw an error if an object passes through		
				if (!_.found(vis.types, cell.type)) {
					cell.type = 'string';
				}			
				// 'chart' require their columns, except the 0 column to be 'number'
				if (chartType === 'LineChart' && typeof index === 'number') {
					cell.type = index > 0 ? 'number' : cell.type;
				}
				return({
					'label': cell.name,
					'type': cell.type || 'string',
					'id': id || _.uniqueId(cell.name),
					'role': undefined,
					'pattern': undefined
				});
			};
			local.googleColumn = googleColumn;

			// What it does: format a boxspringJS cell as a google cell
			var googleCell = function (cell) {
				return ({
					'v': typeof cell.value !== 'undefined' ? cell.value : null,
					'f': cell.format,
					'p': cell.properties
				});
			};
			
			var addRow = function (cols) {
				var row = this;

				data.addRow(_.map(cols, function(key, i) {
					var val = row.select(key);
					return(googleCell.call(row, row.cell.newCell(key, val)));
				}));
			};
			local.addRow = addRow;
			
			var Table = function () {
				// get column labels and the first row; we can use that to setup the columns
				var cols = this.getDisplayColumns()
				, first = this.first();

				// create the DataTable. 'data' is visible only in this context
				data = new google.visualization.DataTable();

				if (!cols || !cols.length){
					throw new Error('[ googleVis.Table ] - bad column definition');
				}		

				// formats a column definition for google.vis
				cols.forEach(function(label, index) {
					data.addColumn(local.googleColumn(first.cell.newCell(label), index));							
				});	
				// formats each row in this view
				_.each(this.each(), function(row) {
					local.addRow.call(row, cols);
				});
				return googleStyle.call(this, data);
			};
			local['Table'] = Table;
			
			var result2Array = function() {
				// cols describes the incoming table columns. reset() the visibleColumns
				var local = this
				, cols = this.getDisplayColumns().slice(1)
				, target = []
				, hdrHolder = []
				, rowHolder = []
				, pivotRow = this['pivot-row']
				, pivotColumn = this['pivot-column'];

				// make a header column; for chart, each row's key is the header for a "series"
				_.each(this.each(), function(row) {
					hdrHolder.push(row.select(pivotRow));
				});
				target.push([ pivotColumn ].concat(_.sortBy(hdrHolder, _.item)));

				// initialize our matrix
				hdrHolder.forEach(function(item) { rowHolder.push(0); });
				cols.forEach(function(col) {
					target.push([ col ].concat(rowHolder));
				});
				
				// now process each row and populate the N (x-axis) x M (series) matrix
				_.each(this.each(), function(row) {
					// find 'y's position in the target array
					var y = _.find(target[0], row.select(pivotRow));
					if (y === -1) { 
						throw new Error('fatal, could not find item in target'); 
					}
					
					_.keys(row.getValue()).forEach(function(c) {
						var val = row.select(c)
						, x = local.column2Index(c);

						if (x === 0 && y===5) {
							console.log('target[0]', row, c, x, y, val && val.sum);
						}

						if (typeof val !== 'undefined') {
							target[x][y] = val.sum; 
						}
					});
				});
				data = google.visualization.arrayToDataTable(target);		
				return data;
			};
			local['LineChart'] = result2Array;
			return local;
		}.call(vis));
		
		var visibleColumns = function() {
			var rowdata = this.visible.setValues();
			
			return _.map(this.query.get('visibleColumns'), function(index) {
				return vis.query.index2Column.call(vis.query, index); });
		};
		
		var app = function(data) {
			return new google.visualization.DataView(data);
		};
		
		var display = function(type, target) {
			return new google.visualization[type](target);
		};
		
		var googleView = function (o) {
			var local = this
			, data = dataSource['Table'].apply(this)
			, target = document.getElementById(targetDiv) 
			// displayTable sets up the DOM; 
			, displayTable = display(o.type, target)
			// view controls the display but not the underlying table
			, view = app(data); 
			
			// make these resources are visible to the event listeners off of first argument 
			local.display = displayTable;
			local.view = view;

			// process the 'events' arguments and set up listeners
			['select', 'page'].forEach(function(e) {
				if (o.events.hasOwnProperty(e)) {
					google.visualization.events.addListener(displayTable, e, function() {
						o.events[e].apply(null, [local].concat(_.toArray(arguments)));
					});					
				}
			});
			
			var draw = function () {				
				try {
					displayTable.draw(view, o.options);
				} catch (e) {
					throw new Error('google-vis-error - ' + e);
				}
			};
			local.draw = draw;
			return local;
		};
		
		var googleTable = function (result) {
			var sortColumn = result.getSortColumn()
			, visibleColumns = result.getDisplayColumns();
			
			// Set up the table and draw it.
			googleView.call(result, { 
				'type': 'Table',
				'options': {
					'showRowNumber': true,
					'allowHtml': true,
					'firstRowNumber': result.offset(),
					'page': 'enable',
					'pageSize': (result.pageInfo().pageSize || result.getLength()),
					'startPage': result.pageInfo().page || 0,
					// delegating column sorting to the table, for now;
					'sort': 'enable',
					// requested sortColumn exists in the available table
					'sortColumn': _.intersection(sortColumn, visibleColumns).length === 1 
						? sortColumn
						: undefined,
					'sortAscending': true						
				},
				'events': {
					// Purpose: install event handler for 'select'
					'select': function (caller) {						
						// get the integer selected rows
						var Selected = _.map(caller.display.getSelection(), function (s) {
							return s.row;
						});
						result.trigger(onSelection, Selected);						
					},
					// Purpose: event handler for 'next' / 'previous' page
					'page': function (caller, o) {
						var startPage = result.pageInfo().page;
						
						// relay the next/prev to the jQuery event
						result.trigger(onPage, result, (o.page > startPage) 
							? 'next' 
							: 'previous');
					}
				}
			}).draw();
			return this;			
		};
		
		var googleChart = function (result) {
			googleView({
				'type': 'LineChart',
				'options': {
					'title': 'Line Chart',
					'focusTarget': 'category',
					'theme': 'maximized',
					'chartArea': {	
						'height': '3000px;'
					}
				},
				'events': {
					'select': function(caller) {
						console.log('select', this, caller, arguments);
						console.log('selected', caller.display.getSelection());			
					}
				}
			}).draw();
		};

		// now return the render function to the caller
		if (type === 'LineChart') {
			vis.render = googleChart;
		} else {
			vis.render = googleTable;
		}
		return vis;
	};
	global.googleVis = googleVis;
}(jQuery));

/*
used by googleCell:
ugliness used for sorting pivot tables with builtin column/row totals
// What this does: we want the 'column total' row to ALWAYS be at the bottom, regardless
// of what column is sorted. So, we adjust the values and apply the value to the 'format'
if (row.getKey()[0] === 'column total') {
	if (_.isString(cell.value) && cell.value.indexOf('column total') !== -1) {
		cell.format = 'column total';
		cell.value = local.query.get('sortAscending') ? 'zzzzz' : 'AAAAA';
		// set this property of the 'data' in case its needed later
		data.hasColumnTotal = true;
	} else if (_.isNumber(cell.value)) {
		cell.format = cell.value.toString();
		cell.value = local.query.get('sortAscending') 
			? (Number.MAX_VALUE) 
			: (Number.MAX_VALUE * -1);
	}
} else if (!cell.format && typeof cell.value !== 'undefined') {
	cell.format = cell.value.toString();
}


var hasColumnTotalRow = function () {
	return (data && data.hasColumnTotal === true);
};
that.hasColumnTotalRow = hasColumnTotalRow;

var getRowOrColumn = function (type) {
	var i, rows = [];
	for (i=0; i < data[type](); i += 1) {
		rows.push(i);
	}
	return rows;
};

var setColumns = function (columns) {
	if (columns) {
		view.setColumns(this.getDisplayColumns(columns));
	} else {
		view.setColumns(this.getDisplayColumns()  ||
			getRowOrColumn('getNumberOfColumns'));			
	}
	return this;
};
that.setColumns = setColumns;

var getColumns = function () {
	return (this.getDisplayColumns() || getRowOrColumn('getNumberOfColumns'));
};
that.getColumns = getColumns;

var getRows = function (column) {
	return this.getSortedRows(column);
};
that.getRows = getRows;

var setRows = function (ascending, r) {
	var rows = r || getRowOrColumn('getNumberOfRows');

	if (!ascending) {
		rows = _.reverse(rows, _.item); 
		// special case when maintaining 'column total'. if not ascending, then 
		// place 'column totals' at the bottom of the list
		if (this.hasColumnTotalRow()) {
			rows.push(rows[0]);
			rows = rows.slice(1);		
		}
	}			
	view.setRows(rows);
	return this;
};
that.setRows = setRows;

var getSortedRows = function (c) {
	return data.getSortedRows(c || this.column2Index(c));
};
that.getSortedRows = getSortedRows;

// What it does: implements sort of underlying data table. 
// uses column # or defaults from the application. 
// use the 'sortAscending' and update the 'visibleRows'
var sort = function (ascending, column) {
	var index = _.isNumber(column) ? column : this.column2Index(column);
	data.sort([{'column': index, 'desc': !ascending }]);
	return this;
};
that.sort = sort;
// What it does: 
// sum the values of a numeric column for the array set of rows provided 
var sum = function (rows, column) {
	var local = this;

	return _.reduce(rows, function(x, y) {
		return (_.isNumber(data.getValue(y, column)) 
			? x + data.getValue(y, column)
			: x); }, 0);
};
that.sum = sum;



var sortByColumn = function () {
	var columns = this.getColumns().slice(1)
	, totalRow = this.getSortedRows(0)[this.getSortedRows(0).length-1];

	if (this.hasColumnTotalRow()) {
		// _.map returns an Array of 'column totals' 
		// zip the two arrays [[1, 2], [11, 7]] ... --> [[1,11], [2, 7]]
		columns = _.zip(columns, _.map(columns, function(c) {
			return _.toInt(data.getFormattedValue(totalRow, c));
		}));
		// sort the zipped arrays by value --> [2,7], [1,11] 
		// _.map to fetch the column
		columns = _.map(_.sortBy(columns, function(item) { return item[1]; }), function(x) {
			return x[0]; 
		});
		columns.unshift(totalRow);
	}
	this.setColumns(columns);
	return this;
};
that.sortByColumn = sortByColumn;

// initialize the sort; and update the options to enable the sort event, if needed
that.sort().setRows(true, that.getRows(this.column2Index())).setColumns();
o.options.sort = that.hasColumnTotalRow() ? 'event' : 'enable';

'sort': function (caller, o) {						
	// map the selected column to the underlying column
	var column = caller.getColumns()[o.column];
	// if there is no 'column total' row, then this is a no-op;
	// sorting is delegated to google-vis
	if (!caller.hasColumnTotalRow()) { return ; }
	// if column changes, set sortColumn and sort the column
	// NB: column2Index returns the index of the sorted column if no arg
	if (o.column !== result.column2Index()) {
		// NB: getSortedRows sorts ascending
		sortColumn = o.column
		caller.setRows(true, caller.getSortedRows(column));
	}
	// now update the sort direction, set the rows and redraw
	caller.setRows(o.ascending, caller.getRows(column)).draw();
},

'select': function (caller) {
	var Rows = []
	, Selected
	, cols = result.getDisplayColumns();
	
	// get the integer selected rows
	Selected = _.map(caller.display.getSelection(), function (s) {
		return s.row;
	});
	// for each selected row, fetch the values of the key fields
	Selected.forEach(function(s) {
		var Keys = [];
		cols.forEach(function(k, index) {
			Keys.push(caller.view.getValue(s, index));
		});
		Rows.push(Keys);							
	});
	result.trigger(onSelection, caller, { 
		'selected': Selected, 'rows': Rows });
},

*/

