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
/*global $: true, jQuery: true, bx: true, _: true, window: true */

/*global google: true, document: true, $:true */
(function(Local) {
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
	Local['google-vis'] = function (context) {
		var vis = {
			'types': ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday']
		};		
		
		var dataSource = (function () {
			var local = this || vis
			, data;
			
			/*
			type - A string describing the column data type. Same values as type above.
			label - [Optional, string] A label for the column.
			id - [Optional, string] An ID for the column.
			role - [Optional, string] A role for the column.
			pattern - [Optional, string] A number (or date) format string to display column value.
			*/
			var googleColumn = function (label, index, id) {
				var cell = local.query.newColumn({ 'name': label });

				// don't allow ineligible column types. 
				// or else google vis will throw an error if an object passes through		
				if (!_.arrayFound(cell.type, vis.types)) {
					cell.type = 'string';
				}			
				// 'chart' require their columns, except the 0 column to be 'number'
				if (local.vis === 'chart' && typeof index === 'number') {
					cell.type = index > 0 ? 'number' : cell.type;
				}
				return({
					'label': cell.name,
					'type': cell.type || 'string',
					'id': id || _.uniqueId(label),
					'role': undefined,
					'pattern': undefined
				});
			};
			local.googleColumn = googleColumn;

			// use the column definition to check the type of the value
			var googleCell = function (row, cell) {
				if (!_.arrayFound(cell.type, vis.types)) {
					bx.logm('google-type-error',500,'[ googleCell ] '+cell.name);
					bx.logm('google-type-error',500,'[ googleCell ] converting value to string.');
					cell.value = 
						(cell && cell.value && cell.value.toString && cell.value.toString()) || '';
				}
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
				return ({
					'v': cell.value || null,
					'f': cell.format,
					'p': cell.properties
				});
			};
			local.googleCell = googleCell;
			
			var addRow = function (row, cols) {
				var local = this;

				data.addRow(_.map(cols, function(key, i) {
					var val = local.query.access(row).select(key);
					return(local.googleCell(row, 
						local.query.newCell({
							'name': key, 
							'value': val
						})));
				}));
			};
			local.addRow = addRow;
			
			var Table = function () {
				// cols describes the incoming table columns. reset() the visibleColumns
				var i, j
				, cols = this.query.columnReset().all();
console.log('Table', cols);				
				// create the DataTable. 'data' is visible only in this context
				data = new google.visualization.DataTable();

				if (!cols || !cols.length){
					bx.alert('google-vis-error',500,'[ google-vis.render()] bad column definition');
					return;				
				}		
				// formats a column definition for google.vis
				cols.forEach(function(label, index) {
					data.addColumn(local.googleColumn(label, index));				
				});	
				// formats each row in this view
				this.result.each(function(row) {
					local.addRow(row, cols);
				});
				return local.style(data);
			};
			local.Table = Table;
			
			var result2Array = function() {
				// cols describes the incoming table columns. reset() the visibleColumns
				var cols = this.query.get('columns').slice(1)
				, target = []
				, hdrHolder = []
				, rowHolder = []
				, pivotRow = this.query.get('pivot-row');

				// make a header column; for chart, each row's key is the header for a "series"
				local.result.each(function(row) {
					hdrHolder.push(local.query.access(row).select(pivotRow));
				});
				target.push([this.query.get('pivot-column')].concat(_.sortBy(hdrHolder, _.item)));

				// initialize our matrix
				hdrHolder.forEach(function(item) { rowHolder.push(0); });
				cols.forEach(function(col) {
					target.push([ col ].concat(rowHolder));
				});
				// now process each row and populate the N (x-axis) x M (series) matrix
				local.result.each(function(row) {
					// find 'y's position in the target array
					var y = _.arrayFind(local.query.access(row).select(pivotRow), target[0]);
					if (y === -1) { throw 'fatal, could not find item in target'; }
					_.keys(row.value).forEach(function(c) {
						var val = local.query.access(row).select(c)
						, x = local.query.column2Index(c);

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
			local.LineChart = result2Array;
			return local;
		}());
		
		var visibleColumns = function() {
			return _.map(this.query.get('visibleColumns'), function(index) {
				return vis.query.index2Column.call(vis.query, index); });
		};
		vis.visibleColumns = visibleColumns;
		
		// Routines to format and style the Table
		var googleStyle = function (data) {
			var i, j
			, cols = this.visibleColumns()
			, formatter_long
			, classNameBase = 'googleCell ' + (this.query.get('pivot') ? 'trialio_pivot' : '');
						
			// Create a formatter and apply to 'date' columns.
			formatter_long = new google.visualization.DateFormat({formatType: 'long'});
			for (j = data.getNumberOfColumns()-1; j > -1; j -= 1) {
				// Reformat 'date' columns.
				if (data.getColumnType(j) === 'date') {
					formatter_long.format(data, j);						
				}
			}
			
			// What it does: 
			// a) Adds a varying width style to every cell in the table
			// b) text-align: center
			// do this here instead of .css to allow for widths based on the data
			for (i = data.getNumberOfRows()-1; i > -1; i -= 1) {				
				for (j = data.getNumberOfColumns()-1; j > -1; j -= 1) {
					data.setProperties(i, j, {
						'className': classNameBase +' trialio_' + data.getColumnLabel(j)
					});
				}
			}
			return data;				
		};
		vis.style = googleStyle;
		
		var googleView = function (o) {
			var that = {}
			, local = this || vis
			, data = dataSource[(o && o.type) || 'Table'].apply(vis)
			, target = document.getElementById(o && o.div.substr(1)) 
			// displayTable sets up the DOM; view controls the display but not the underlying table
			, displayTable = new google.visualization[(o && o.type) || 'Table'](target)
			, view = new google.visualization.DataView(data);
			
			// give this object access to query
			that.query = local.query;
			that.data = data;
			that.display = displayTable;
			that.view = view;
									
			// give this object all the google methods; some may get re-defined 
			_.functions(view).forEach(function(fn) {
				that[fn] = function () {
					view[fn].apply(view, arguments);
				};
			});

			// process the 'events' arguments and set up listeners
			['sort', 'select', 'page'].forEach(function(e) {
				if (o.events.hasOwnProperty(e)) {
					google.visualization.events.addListener(displayTable, e, function() {
						o.events[e].apply(local, [that].concat(_.toArray(arguments)));
					});					
				}
			});
			
			var draw = function () {
				// update the options dyanmically from the hashes. o.options is passed as a fixed 
				// object or dynamic function
				var options = _.isFunction(o.options) ? o.options.apply(this) : o.options;
				// sort option driven by data not available at time the function/object was created
				options.sort = this.hasColumnTotalRow() ? 'event' : 'enable';
				
				try {
					displayTable.draw(view, options);
				} catch (e) {
					bx.alert('google-vis-error', 500, e + ', ' + local.query.get('visibleColumns'));
				}
			};
			that.draw = draw;
			
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
					view.setColumns(columns);
					this.query.set('visibleColumns', columns);
				} else {
					view.setColumns(this.query.get('visibleColumns')  ||
						getRowOrColumn('getNumberOfColumns'));					
				}
				return this;
			};
			that.setColumns = setColumns;
			
			var getColumns = function () {
				return (this.query.get('visibleColumns') || getRowOrColumn('getNumberOfColumns'));
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
				return data.getSortedRows(c || this.query.column2Index());
			};
			that.getSortedRows = getSortedRows;
			
			// What it does: implements sort of underlying data table. uses column # or defaults
			// from the application. use the 'sortAscending' and update the 'visibleRows'
			var sort = function (ascending, column) {
				var index = _.isNumber(column) ? column : this.query.column2Index();
				data.sort([{'column': index, 'desc': !ascending }]);
				return this;
			};
			that.sort = sort;
			// What it does: sum the values of a numeric column for the array set of rows provided 
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
			that.sort().setRows(true, that.getRows(that.query.column2Index())).setColumns();
			o.options.sort = that.hasColumnTotalRow() ? 'event' : 'enable';
			return that;
		};
		
		var googleTable = function (options) {
			var onSelection = this.onSelection
			, sortColumn = vis.query.column2Index(vis.query.get('sortColumn'))
			, visibleColumns = vis.visibleColumns()
			, sortAscending = vis.query.get('sortAscending') 
			, view = googleView({ 
				'type': 'Table',
				'div': this.query.tags.get('onDisplay'), 
				'options': function() {
					// toggle this
					sortAscending = !sortAscending;
					return({
						'showRowNumber': !this.query.get('pivot'),
						'allowHtml': true,
					//	'width': $(this.query.tags.get('onDisplay')).css('width') || '1200px',
						'firstRowNumber': vis.result.offset,
						'page': 'enable',
						'pageSize': ((vis.query.get('pivot') && vis.query.get('page_size')) ||
							vis.result.rows.length),
						'startPage': vis.query.get('startPage') || 0,
						'sort': 'enable',
						// need to be sure the requested sortColumn exists in the available table
						'sortColumn': _.intersection(sortColumn, visibleColumns).length === 1 
							? sortColumn
							: undefined,
						'sortAscending': sortAscending						
					});
				},
				'events': {
					'sort': function (caller, o) {						
						// map the selected column to the underlying column
						var column = caller.getColumns()[o.column];
						// if there is no 'column total' row, then this is a no-op
						if (!caller.hasColumnTotalRow()) { return ; }
						// if column changes, set sortColumn and sort the column
						if (o.column !== caller.query.column2Index()) {
							// NB: getSortedRows sorts ascending
							caller.query.set('sortColumn', caller.query.index2Column(o.column));
							caller.setRows(true, caller.getSortedRows(column));
						}
						// now update the sort direction, set the rows and redraw
						caller.query.set('sortAscending', o.ascending);
						caller.setRows(o.ascending, caller.getRows(column)).draw();
					},
					// Purpose: install event handler for 'select'
					'select': function (caller) {
						var Rows = []
						, Selected
						, local = this
						, cols = this.visibleColumns();
						
						// get the integer selected rows
						Selected = _.map(caller.display.getSelection(), function (s) {
							return s.row;
						});
						// for each selected row, fetch the values of the key fields
						Selected.forEach(function(s) {
							var Keys = [];
//							local.query.get('keys').forEach(function(k, index) {
							cols.forEach(function(k, index) {
								Keys.push(caller.view.getValue(s, index));
							});
							Rows.push(Keys);							
						});
						local.query.trigger(onSelection, { 
							'data': this, 'rowIndices': Selected, 'selectedKeys': Rows });
					},
					'page': function (caller, o) {
						var startPage = this.query.get('startPage')
						, pivot = this.query.get('pivot');

						// relay the next/prev to the jQuery event
						if (o.page > startPage) {
							((pivot && this.result.pageInfo().next()) || 
								$('#result-next').trigger('click'));
						} else if (o.page < startPage) {
							((pivot && this.result.pageInfo().prev()) ||
								$('#result-prev').trigger('click'));
						}
					}				
				}
			});
			
			// load this event; application may trigger it for next/prev
			this.query.off('onPagination').on('onPagination', function() {
				view.draw();
			});

			view.draw();
			return this;			
		};
		vis.table = googleTable;
		
		var googleChart = function () {
			var view = googleView({
				'type': 'LineChart',
				'div': this.onDisplay,
				'options': {
					'title': 'Line Chart',
					'focusTarget': 'category',
					'theme': 'maximized',
					'chartArea': {	
						'height': '3000px;'
					}
	//				'chartArea':{left:20,top:40,width:"70%",height:"500%"}
				},
				'events': {
					'select': function(caller) {
						console.log('select', this, caller, arguments);
						
						console.log('selected', caller.display.getSelection());			
					}
				}
			});
			view.draw();
		};
		vis.chart = googleChart;
		
		var display = function(o) {
			// add 'result', 'query', 'tags', and 'onSelection' properties to this object
			_.extend(this, _.defaults(o, {
				'onSelection': 'onSelection'
			}));
			// fetch the onDisplay off the 'tags' object; for convenience.
			this.onDisplay = this.tags.get('onDisplay');			
			$(this.onDisplay).empty();
			// generate output according to the value of 'vis'. Default is 'table'
			this[(this.query && this.query.get('vis')) || 'table']();
			return this;
		};
		vis.display = display;
		return vis;
	};

}(bx));

(function (Local) {
	"use strict";
	
	// What it does: provides an interface layer between the application and the rendering 
	// library used to display tables and graphs, such as Google visualization or d3. 
	// For now, only Google is supported.
	var renderLib = function (vis, ctx) {
		var context = ctx || bx;

		if (vis && vis.toLowerCase() === 'google') {
			return(bx['google-vis'](context));
		}
		bx.alert(bx.messages('google-only-supported'));
	};
	Local.renderLib = renderLib;
	
	var bootstrap = function (owner, target) {
		var that = {}
		, local = this;
		
		that.id = target || _.uniqueId('cloned-');
		that.$id = $('#'+that.id);
		
		var append = function (id, text) {
			$(owner).append($(id).bx('cloneHTML', this.id, text));
		};
		that.append = append;
		that.print = function (text) {
			console.log(text || '', this.id, $(owner).html());
		};
		that.listItem = function (text) {
			append.call(this, '#reference-list-item', text);
			return local;
		};
		that.breadCrumbItem = function (text) {
			append.call(this, '#reference-breadcrumb-item', text);
			return local;
		};
		that.label = function (forInput, text) {
			append.call(this, '#reference-label', text);
			this.$id.attr({'for': forInput });
			return local;
		};
		that.radio = function (text, question, checked) {					
			append.call(this, '#reference-radio', text);
			$('#'+this.id+' input', $(owner)).attr({
				'id': question + '-' + text,
				'name': question || 'default',
				'value': text || 'default',
				'checked': checked || undefined });
			return local;
		};
		that.popover = function (id, linkOptions) {
			var link = _.defaults(linkOptions || {}, {
				'data-toggle': 'popover',
				'data-placement': 'right',
				'title': '',
				'html': true,
				'data-original-title': '',
				'data-content': ''
			});
			
			$('#'+id).bind('mouseover', function() {
				$('#'+id).attr(link).popover('show');				
			});
			
			$('#'+id).bind('mouseout', function() {
				$('#'+id).attr(link).popover('hide');				
			});
			
			return this;
		};
		that.popoverDestroy = function(id) {
			$('#'+id).popover('destroy');
			return this;
		};
		that.displayAlert = function(text, type, duration) {
			var types = { 
				'alert-info': 'alert-info', 
				'alert-error': 'alert-error', 
				'alert-success': 'alert-success', 
				'show': 'alert-info fade in', 
				'hide': 'hide' };
			return({
				'text': text,
				'duration': duration && _.isNumber(duration) ? duration : 3000,
				'type': (type && types.hasOwnProperty(type)) ? types[type] : 'alert-info' 
			});
		};
		return that;
	};
	Local.bootstrap = bootstrap;
	
	if (typeof jQuery !== 'undefined') {
		(function ($) {
			var methods = {
				exists: function () {
					return this.length;
				},
				parentActive: function () {
					this.parent().addClass('active').removeClass('disabled');				
					return this;
				},
				parentSibsInactive: function () {
					($(this).parent().siblings()).removeClass('active');
					return this;
				},
				// enables active/disable menu and set of siblings
				activateMenuItem: function () {
					$(this).bx('parentActive').bx('parentSibsInactive');
					return this;
				},
				enableDisableMenu: function (menuText) {
					// toggle ON/OFF behavior
					if ($(this).attr('class') === 'active') {
						$(this).text(menuText)
							.parent()
							.removeClass('active')
							.addClass('disabled');
					} else {
						$(this).text(menuText)
							.parent()
							.addClass('active')
							.removeClass('disabled');
					}
					// be sure tag is not disabled
					$(this).parent().removeClass('disabled');
					return this;			
				},
				selected: function () {
					return $(this).get(0);
				},
				tagName: function () {
					return $(this).selected().tagName;
				},
				Id: function () {
					return $(this).attr('id');
				},
				extend: function (newMethods) {
					methods = _.extend(methods, newMethods);
				},
				// What it does: clones a fragment of html with an id, appends it to the DOM 'hidden' and returns it
				cloneHTML: function (targetId, text) {
					var id =  targetId || _.uniqueId('clone-')
				
					return ($(this).clone().html()
						.replace($(this).bx('Id')+'-id', id)
						.replace($(this).bx('Id')+'-text', text || ''));
				},
				// invokes bootstrap-typeahead.js
				typeahead: function (o) {
					$(this).typeahead(o);
					return this;
				}
			};
				
			$.fn.bx = function( method ) {

			    // Method calling logic
			    if ( methods[method] ) {
			      	return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
			    } else if ( typeof method === 'object' || ! method ) {
			      	return methods.init.apply( this, arguments );
			    } else {
			      	$.error( 'Method ' +  method + ' does not exist on jQuery.bx' );
			    }
			};
		}(jQuery));
	}
	
	var clickEvent = function (e, options) {
		var evt = _.extend({}, options);
		
		evt.checked = function () {
			return (e && e.currentTarget.checked);					
		};
		evt.text = function () {
			return (e && e.currentTarget.text);
		};
		evt.defaultValue = function () {
			return (e && e.currentTarget.defaultValue);
		};
		evt.date = function () {
			return e && e.date;
		};
		evt.Id = function () {
			return (e && e.currentTarget.id);
		};
		return evt;
	};
	Local.clickEvent = clickEvent;
	
	Local.pageInfo = function (context, tags) {
		var targets = _.defaults(tags || {}, {
			'showPage': '#showPage',
			'showTotalPages': '#showTotalPages',
			'showRow': '#showRow',
			'showLastRow': '#showLastRow',
			'showTotalRows': '#showTotalRows',
			'showVisibleRows': '#showVisibleRows'
		});
		
		var refresh = function (pageInfo) {
			if (pageInfo.visibleRows < pageInfo.totalRows) {
				$(targets.showPage).html(pageInfo.page+1);
				$(targets.showTotalPages).html(pageInfo.pages());	
				$(targets.showRow)
					.html(((pageInfo.page+1) * pageInfo.pageSize) - (pageInfo.pageSize-1));
				$(targets.showLastRow)
					.html((((pageInfo.page+1) * pageInfo.pageSize) > pageInfo.visibleRows) 
					? pageInfo.visibleRows
					: ((pageInfo.page+1) * pageInfo.pageSize));
				$(targets.showTotalRows).html(pageInfo.visibleRows);
				$(targets.showVisibleRows).html(pageInfo.visibleRows);						
			} else {
				$(targets.showPage).html(pageInfo.page+1);
				$(targets.showTotalPages).html(pageInfo.pages());	
				$(targets.showRow)
					.html(((pageInfo.page+1) * pageInfo.pageSize) - (pageInfo.pageSize-1));
				$(targets.showLastRow)
					.html((((pageInfo.page+1) * pageInfo.pageSize) > pageInfo.totalRows) 
					? pageInfo.totalRows 
					: ((pageInfo.page+1) * pageInfo.pageSize));
				$(targets.showTotalRows).html(pageInfo.totalRows);
				$(targets.showVisibleRows).html(pageInfo.visibleRows);						
			}
		
		};
		targets.refresh = refresh;
		return targets;				
	};
	
	Local.pagination = function (context, tags) {
		var pager = function (pageInfo) {
			var buffer = {}
			, update = bx.pageInfo(tags);

			// if we are at the last-page disable next, or at first-page
			// disable previous. then run the supplied fn if provided.
			if (pageInfo.page > 0) {
				$('#result-prev').parent().removeClass('disabled').addClass('active');
				$('.pager').children('.previous').removeClass('disabled');
				$('.pager').children('.previous').addClass('active');
			} else {
				$('#result-prev').parent().removeClass('active').addClass('disabled');
				$('.pager').children('.previous').removeClass('active');
				$('.pager').children('.previous').addClass('disabled');
			}

			if ((pageInfo.page+1) < pageInfo.pages()) {
				$('#result-next').parent().removeClass('disabled').addClass('active');
				$('.pager').children('.next').removeClass('disabled');
				$('.pager').children('.next').addClass('active');
			} else {
				$('#result-next').parent().removeClass('active').addClass('disabled');
				$('.pager').children('.next').removeClass('active');
				$('.pager').children('.next').addClass('disabled');
			}
			update.refresh(pageInfo);
		};
		// typically 'onResult' tag
		context.on(tags.onResult, function (result) {
			var nextPrev = function (arg) {
				result.nextPrev(arg);
				// update the pager element with the page info
				pager(result.pageInfo());
			};
			$('#result-prev,#result-next')
				.off()
				.on('click', function(e) {
					if ($('#'+bx.clickEvent(e).Id()).parent().hasClass('active')) {
						nextPrev(bx.clickEvent(e).text());						
					}
			});
			pager(result.pageInfo());
		});
		// if there is asynchronous loading/caching, update the pages counter.
		// result is the object retrieved from the server when the server encounters 'onMoreData'
		context.on('onMoreData', function(result) {
			pager(result.pageInfo());
		});
		return this;		
	};
	
	var dateHandler = function (o) {
		var options = _.defaults(o, { 'div': _.uniqueId('#date-') });

		options = _.extend({}, options, _.defaults(o || {}, {
			'target': _.uniqueId('date-'),
			'format': 'yyyy mm dd',
			'dateIn': undefined,
			'viewMode': 0,
			'minViewMode': 0
		}));
		// extend this object with all the methods from the master date() object
		options = _.extend(options, bx.date(options));
		// What it does: creates an "end" date, this object is the "start". Start date of this
		// object can't be later than "end". Likewise start date of "end" can't come before this.
		var range = function (opts) {
			this.end = dateHandler(opts);
			this.end.minStart = this;
			this.maxEnd = this.end;
			return this; 
		};
		options.range = range;

		var refresh = function () {
			$(this.target).datepicker('setValue', this.valueOf());
			if (this.end) {
				if (this.end === this) { throw '[ dateHandler ] malformed date objects'; };
				this.end.refresh();
			}
			return this;					
		};
		options.refresh = refresh;
		// enable/disable control the datePicker widget
		var enable = function () {
			$(this.target).removeAttr('readOnly');
			if (this.end) { 
				this.end.enable();
			}
			return this;
		};
		options.enable = enable;

		var disable = function () {
			$(this.target).attr('readOnly', 'true');
			if (this.end) {
				this.end.disable(); 
			}
			return this;
		};
		options.disable = disable;

		var setYears = function (start, end) {
			this.setTime(start);
			if (this.end && _.isNumber(end)) {
				this.end.setTime(end);
			}
			return this;
		};
		options.setYears = setYears;

		// set the event handler for the .datepicker and call the widget
		$('#'+options.target).
			datepicker(_.defaults(_.pick(options, 'format', 'weekStart', 'viewMode', 'minViewMode'), {
				'format': 'mm dd yyyy',
				'weekStart': 0,		// sunday=0, saturday=6
				'viewMode': 0,		// days=0, 1=months, 2=years
				'minViewMode': 0	// days=0 ...
			}))
			.bind('changeDate', function (e) {
			var value = bx.date({
				'dateIn': bx.event(e.date())	// e.date converts jQuery date to an array for date object
			});

			// if we're in readOnly state, don't update any user clicks
			if ($(options.target).attr('readOnly')) {
				$(options.target).datepicker('setValue', options.valueOf());
				return;
			}

			if (options.absoluteMin && options.absoluteMax &&
				!value.inRange(options.absoluteMin, options.absoluteMax)) {
				$(options.target).datepicker('setValue', options.valueOf());
				bx.alert('invalid-date', 600, 'date exceeds range allowed.');
				return;						
			}

			if ((options.minStart && value.lt(options.minStart)) ||
				(options.maxEnd && value.gt(options.maxEnd))) {
				$(options.target).datepicker('setValue', options.valueOf());
				bx.alert('invalid-date', 600, 'date overlaps than start/end.');
				return;							
			}
			options.setTime(value);
			$(options.target).datepicker('setValue', value);
		});
		// install the date for this object on the datepicker
		refresh.call(options);

		var earliest = function () {
			return options.key().slice(0,2);
		};
		options.earliest = earliest;

		var latest = function () {
			return options.end.key().slice(0,2);
		};
		options.latest = latest;

		var poke = function () {
			$(this.div).val(this.print(this.format));
		};
		options.poke = poke;

		var peek = function () {
			return dateHandler({ 'dateIn': $(this.div).val().split(' ') });
		};
		options.peek = peek;

		// What it does: modifies a date object adding/subtracting the years
		var diff = function (years) {
			return dateHandler({ 'dateIn': [ this.getYear()+years, this.getMonth() ]});
		};
		options.diff = diff;
		return options;
	};
	Local.dateHandler = dateHandler;
	
	var datepickerHandler = function (start, end, changeEvents, fn) {
		var that = {} 
		// load the array of divs and activate the first one
		, earliest = dateHandler({'div': start }).peek()
		, refYear = dateHandler({'div': end }).peek()
		, datePickerOptions = {
			'viewMode': 2,
			'minViewMode': 1
		}
		, pastYears = {
			// bound the year
			'past-year': refYear.diff(-1),
			'past-2-years': refYear.diff(-2),
			'past-5-years': refYear.diff(-5),
			'past-10-years': refYear.diff(-10)
		}
		// 'range' object handles start-end date synchronization
		// default date range is -10 years to now
		that = dateHandler(_.extend({}, datePickerOptions, {
			'target': 'date-start1',
			'dateIn': [ pastYears['past-5-years'].getYear(), pastYears['past-5-years'].getMonth() ],
			'absoluteMax': refYear || undefined,
			'absoluteMin': earliest || undefined
		// range method sets latest time of start date; keeps them in synch
		})).range(_.extend({}, datePickerOptions, {
			'target': 'date-end1',
			'dateIn': [ refYear.getYear(), refYear.getMonth() ],
			'absoluteMin': earliest || undefined,
			'absoluteMax': refYear || undefined
		}));
		
		console.log('datepicker', that, that.end);
		
		// change events on these divs activate the dateRangeHelper
		$(changeEvents).on('click', function (e) {
			if (pastYears[$(e.currentTarget).attr('id')]) {				
				that.setYears(pastYears[$(e.currentTarget).attr('id')]
					.valueOf(), refYear.valueOf()).refresh().disable();
			} else {
				that.refresh().enable();
			}
			if (_.isFunction(fn)) { fn(e); }
		});
		// helper: returns an object with 'format' and 'filter' to be used by the application
		var startEnd = function () {
			var toStr = function (x) { return x.toString(); };
			
			return({
				'format': {
					'start': _.toDate(this.earliest()).print('yyyy'),
					'end': _.toDate(this.latest()).print('yyyy') 
				},
				'filter': {
					'start': _.toDate(this.earliest()).print('yyyy'),
					'end': _.toDate(this.latest()).print('yyyy') 
				}
			});
		};
		that.startEnd = startEnd;
		return that;							
	};
	Local.datepickerHandler = datepickerHandler;
		
	Local.Browser = function () {
		var that = {}
			, List = bx.List();
			
		// initialize these handlers()
		if ($ && !$.handler) {
			$.handler = bx.Handler();
		}	
		
		var element = function(obj, owner) {
			// NB: 'id' gets replaced with id() method during its creation so that the object
			// can be referenced off of the hash. original 'id' is in the 'selector' variable
			// NB: this is confusing. to be fixed. rr: 4/2/2013
			var that = bx.List({}, { 'id': (obj && obj.id) || _.uniqueId('element-') }, obj || {});
			that.tag = (obj && obj.tag) || 'div';
			that.elementText = (obj && obj.elementText) || '';
			that.fn = (obj && obj.fn) || undefined;
			that.data = '';
			
			var attributes = function (attr) {
				this.attrs = _.extend({}, (this && this.attrs) || {}, attr || {});
				return this;				
			};
			that.attributes = attributes;
			that.attributes(_.extend({ 'id': that.id }, _.pick(obj || {}, 'type', 'class')));
			
			var elementCreate = function (tag) {
				var args = _.isString(tag) ? {'tag': tag } : tag;
				
				return element.call(this, {
					'tag': args && args.tag,
					'elementText': (args && args.text) || '',
					'fn': args && args.fn,
					'type': args && args.type,
					'id': (args && args.id)
				}, this).attributes(args && args.attrs);
			};
			that.elementCreate = elementCreate;

			// wrapper for insertChild method. provides for insertion of child element to wrap elements
			var el = function () {
				var child = elementCreate.apply(this, arguments);
				this.insertChild(child);
				return child;
			};
			that.el = el;
			
			var a = function (text, attr, fn) {
				var attrs = _.isObject(attr) ? attr : {};
				
				if (_.isFunction(fn)) {
					attrs = _.defaults(attr, { 'href': '#' });
				}
				
				this.insertChild(this.el({
					'tag': 'a',
					'text': text || '',
					'attrs': _.isObject(attrs) ? attrs : {}
				}));
								
				if (_.isFunction(fn)) {
					$bx(attr && attr.id).bind('click', function(e) {
						fn.apply(this.lastChild(), e);
					});
				}
				return this;
			};
			that.a = a;
						
			var li = function (text, attr) {
				this.insertChild(this.el({
					'tag': 'li',
					'text': text || '',
					'attrs': _.isObject(attr) ? attr : {} 
				}));
				return this.lastChild();
			};
			that.li = li;
						
			// What it does: link items 'a' wrapped in list items 'li'.
			that.linkList = function(list) {
				var listItem = this.el();
				
				list.forEach(function(item) {
					listItem
					.insertChild(listItem
						.li()
						.a(item.text, item.attrs));
				});
				return this;
			};
			
			var button = function (text, attrs, fn) {
				this.el('div')
					.el({
						'tag': 'button', 
						'text': text,
						'attrs': attrs,
						'fn': fn, 
						'type': 'button'});
				return this;
			};
			that.button = button;
			
			// generates 'ul' elements
			var unorderedList = function (labels, attrs, fn) {				
				this.el('ul')
						.linkList(_.arrayMap(labels, function(item) {
							return ({ 'text': item, 'attrs': attrs, 'fn': fn });
						}));						
							
				return this;
			};
			that.unorderedList = unorderedList;
			
			var table = function (headers, rows, title) {
				var tableMaker = {}
					, newTable = this.el('table');
				
				var addRow = function (values) {
					var data = newTable.el('tr');
					values.forEach(function(item) {
						data.el({'tag': 'td', 'text': (item && item.toString()) || '' });												
					});		
				};
				tableMaker.addRow = addRow;
				
				var addColumn = function (headings) {
					var buf = {};
					
					headings.forEach(function(k) {
						buf[k] = k;
					});
					addRow(headings, buf);
				};
				tableMaker.addColumn = addColumn;
							
				addColumn(headers);
				rows.forEach(function(row) {
					addRow(row);
				});
				
				this.tableMaker = tableMaker;
				return this;
			};
			that.table = table;
						
			var html = function (data) {
				var html = (_.isString(data) && data) || (data && data.data) || (this && this.data);
				$(this.target).html(html);
				this.data = html;
				return this;
			};
			that.html = html;
			
			var append = function (data) {
				var html = (_.isString(data) && data) || (data && data.data) || (this && this.data);
				$(this.target).append(html);
				this.data = $(this.target).html();
				return this;
			};
			that.append = append;
			
			// recursive function to traverse child/sibling objects and return the templated .html			
			var build = function () {
				var local = this;
				this.data = '';
				
				if (_.isFunction(this.fn)) {
					$bx(this.divId()).bind('click', this.fn);
				}
				
				if (this.firstChild()) {
					// this element has a child
					if (this.sibling) {
						// and a sibling
						this.data = 
							_.buildHTML(this.tag, this.elementText + this.firstChild().build(), this.attrs) +
								this.sibling.build();
					} else {
						// only a child
						this.data = _.buildHTML(this.tag, this.elementText + this.firstChild().build(), this.attrs);
					}
				} else if (this.sibling) {
					// only a sibling
					this.data = _.buildHTML(this.tag, this.elementText, this.attrs) + 
						this.sibling.build();					
				} else {
					// only itself
					this.data = _.buildHTML(this.tag, this.elementText, this.attrs);
				}
				return this.data;
			};
			that.build = build;
			
			var display = function () {
				this.build();
				return this;
			};
			that.display = display;
			return that;	
		};
		that.element = element;
	

		// Purpose: Create a URL link
		var link = function(text, a, fn) {
			return element().link(text, a, fn).build().data;
		};
		that.link = link;

		// What this does: Creates a checkbox element
		var multiEvent = function (text, fn) {
			var that = element();
			
			return that.checkbox(text, {}, fn).build();
		};
		that.multiEvent = multiEvent;
				
		// Purpose: Create a URL link in inline form
		var linkEvent = function(tag, text, fn) {
//			var that = formEvent()
				
			that.attrs.href = '#';
			that.attrs.target = '_self';
			that.data = _.buildHTML(tag, text, that.attrs);
			return that;
		};
		that.linkEvent = linkEvent;
		
		// Purpose: Create a Button 'input' event
		var buttonEvent = function(text, fn) {
//			var that = formEvent('button');

			return _.buildHTML('div', _.buildHTML('input', text, that.attrs));
		};
		that.buttonEvent = buttonEvent;
		
		// What it does: returns a formed HTML form for a textarea block; includes the callback
		// TBD: on first entry of the textarea, may want to clear the text
		var textArea = function (text, callback, cols, rows) {
			var id = _.uniqueId('textArea-')
				;
			
			return(
				_.buildHTML('div',
					_.buildHTML('form',
						_.buildHTML('textarea', text, { 
							'id': id, 'cols': cols || "45", 'rows': rows || "20" }) +
						buttonEvent('submit', function () {
							if (callback && typeof callback === 'function') {
								callback($('#'+id).val());
							}
				})))
			);
		};
		that.textArea = textArea;
		
		// What it does: displays a varbiable size textArea and accepts user input
		var pasteBox = function (div, text, callback, cols, rows) {
			$(div).empty()
				// accept user input from the div area of the screen
				.html(textArea(text, function(response) {
					if (callback && typeof callback === 'function') {
						callback(response);
					}
				}, cols, rows));
		};
		that.pasteBox = pasteBox;
		return that;
	};
}(bx));

