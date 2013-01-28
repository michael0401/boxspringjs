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
/*global $: true, bx: true, _: true, window: true */

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
		var vis = {};
		
		var bind = function (divElement, tag, opts) {
			var table
				, local = this
				, doc = this.doc;

			// create a TableView class and instantiate the Data in Google
			var view = new google.visualization.DataView(this.data);
			view.setColumns(this.visibleColumns());
			console.log('settingvisible', this.visibleColumns());

			// prepare the DOM to get the Data from Google;
			table = new google.visualization.Table(document.getElementById(divElement.substr(1)));
			
			// fill the DOM table with the data
			try {
				table.draw(view, {
					'showRowNumber': true,
					'allowHtml': true,
					'firstRowNumber': this.offset,
					'page': 'enable',
					'pageSize': this.rows.length > 500 ? 500 : this.rows.length,
					'startPage': 0,
					'sortColumn': doc.sortColumn(),
					'sortAscending': doc.sortAscending()
				});
			} catch (e) {
				bx.alert('google-vis-error', 500, e);
			}
			
			// Purpose: install event handler for 'select'
			// TBD: selection only returns 'row', not sure how to get 'col' data
			google.visualization.events.addListener(table, 'select', function () {
				var Rows = []
					, Selected;
					
				// get the integer selected rows
				Selected = _.map(table.getSelection(), function (s) {
					return s.row;
				});
				// for each selected row, fetch the values of the key fields
				Selected.forEach(function(s) {
					var Keys = [];
					doc.keys().forEach(function(k, index) {
						Keys.push(view.getValue(s, index));
					});
					Rows.push(Keys);							
				});
				context.trigger(tag, { 'data': local, 'rowsIndices': Selected, 'selectedKeys': Rows });
			});
			
			google.visualization.events.addListener(table, 'page', function (page) {
				console.log('page selected', page);
			});
			return this;			
		};
		vis.bind = bind;			

		vis.types = ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday'];

		/*
		type - A string describing the column data type. Same values as type above.
		label - [Optional, string] A label for the column.
		id - [Optional, string] An ID for the column.
		role - [Optional, string] A role for the column.
		pattern - [Optional, string] A number (or date) format string specifying how to display the column value.
		*/
		var googleColumn = function (label, columnDef, id) {
			var cell = this.doc.newColumn(label);
		
			if (!_.arrayFound(cell.type, vis.types)) {
				bx.logm('google-type-error',500,'[ googleColumn ] '+cell.name+','+cell.type);
				bx.logm('google-type-error',500,'[ googleColumn ] converting type to \'string\'');
				cell.type = 'string';
			}
			return({
				'label': cell.name,
				'type': cell.type || 'string',
				'id': id || _.uniqueId(label)
			});
		};
		vis.googleColumn = googleColumn;
		
		// use the column definition to check the type of the value
		var googleCell = function (cell) {

			if (!_.arrayFound(cell.type, vis.types)) {
				bx.logm('google-type-error',500,'[ googleCell ] '+cell.name);
				bx.logm('google-type-error',500,'[ googleCell ] converting value to string.');
				cell.value = (cell && cell.value && cell.value.toString && cell.value.toString()) || '';
			}
			return ({
				'v': cell.value,
				'f': cell.format,
				'p': cell.properties
			});
		};
		vis.googleCell = googleCell;
		
		var render = function () {
			var local = this
				, query = this.doc.query()
				, cols = []
				, data = new google.visualization.DataTable();

			// what this does: converts all columns by name into position. then uses doc.query object
			// to confirm the existence of data in any row of this query. if so, then column is 'visible'
			this.visibleColumns = function () {
				return _.reduce(_.map(local.doc.all(), function(c, i) {
					return query.isVisible(c) ? i : undefined;
				}), function (x, y) { 
						if (_.isNumber(y)) { x.push(y); }
						return x; }, []);
			};

			try {
				cols = this.doc.all();
			} catch (e) {
				bx.alert('google-vis-error',500,'[ google-vis.render()] bad column definition');
				return;				
			}
			
			// cols describes the incoming table columns. morph it into Google vis format
			// formats a column definition for google.vis
			cols.forEach(function(label) {
				data.addColumn(local.googleColumn(label, cols));
			});
			// formats each row in this view
			this.each(function(row) {
				var thisRow = []
					, keyList = {}
					, made = query.get(row);

				cols.forEach(function(c) {
					thisRow.push(local.googleCell(local.doc.newCell(c, made[c])));
				});
				data.addRow(thisRow);
			});
			this.data = data;
			return this;			
		};
		vis.render = render;
		
		var table = function(o) {
			var options = _.defaults(o, {
				'onDisplay': '#onDisplay',
				'onSelection': 'onSelection',
				'pageSize': 10000
			});
			
			$(options.onDisplay).empty();
			_.extend(this, o.source)
				.render()
				.bind(options.onDisplay, options.onSelection, {showRowNumber: true});
			return this;
		};
		vis.table = table;
		return vis;
	};

}(bx));

(function (Local) {
	"use strict";
		
	Local.Browser = function () {
		var that = {}
			, List = bx.List();
			
		// initialize these handlers()
		if ($ && !$.handler) {
			$.handler = bx.Handler();
		}	
		
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
		that.renderLib = renderLib;
				
		// What it does: binds jQuery #id methods to an object and returns that object
		var bxQuery = function (d, my) {
			var mydiv = List.newItem(my || {})
				, div = (d && (d.charAt(0)==='#' ? d : '#'+d)) || _.uniqueId('#div-')
				, toggled = false;

			mydiv.div = function () {
				return div;
			};
			mydiv.divId = function () {
				return this.div().slice(1);
			};
			mydiv.nbsp = function () {
				this.html('&nbsp;');
				return this;
			};
			// hide, show, empty allow operations on 'groups'; 
			mydiv.hide = function () {
				$(this.div()).hide();					
				return this;
			};
			mydiv.show = function () {
				$(this.div()).show();					
				return this;
			};
			mydiv.empty = function () {
				$(this.div()).empty();					
				return this;
			};
			mydiv.exists = function () {
				return $(this.div()).length;
			};
			var event = function (e) {
				var evt = {};
				
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
					return (e && e.date);
				};
				evt.Id = function () {
					return (e && e.currentTarget.id);
				};
				evt.tagName = function () {
					return bxQuery(this.Id()).tagName();				
				};
				evt.fire = function (ctx) {
					// the Id() tag is the triggered. Note: event context provided is system, not browser
					ctx.trigger.apply(ctx, ['#'+this.Id()].concat(this.dispatch()));
				};
				evt.dispatch = function () {
					return({
						'$Id': '#'+this.Id(),
						'Id': this.Id(),
						'tagName': this.tagName(),
						'date': this.date(),
						'defaultValue': this.defaultValue(),
						'text': this.text(),
						'checked': this.checked()
					});
				};
				return evt;
			};
			mydiv.event = event;
			
			mydiv.bind = function (type, fn) {
				var local = this
					, func = (_.isFunction(type)) ? type : fn
					, change = _.isString(type) ? type : 'click';
				
				this.div().split(',').forEach(function(el) {
					$(el).on(change, function(e) {
						if (_.isFunction(func)) {
							local.e = event(e);
							func.call(local, local.e, e);
						}
					});					
				});
				return this;
			};
			mydiv.unbind = function (type) {
				this.div().split(',').forEach(function(el) {
					$(el).unbind(type);
				});
				return this;
			};
			mydiv.addClass = function(c) {
				$(this.div()).addClass(c);
				return this;
			};
			mydiv.removeClass = function(c) {
				$(this.div()).removeClass(c);
				return this;
			};
			mydiv.attr = function (name, value) {
				$(this.div()).attr(name, value);
				return this;
			};
			mydiv.removeAttr = function (name) {
				$(this.div()).removeAttr(name);
				return this;
			};
			mydiv.typeahead = function (o) {
				$(this.div()).typeahead(o);
				return this;
			};
			mydiv.parentActive = function () {
				$(this.div()).parent().addClass('active').removeClass('disabled');				
				return this;
			};
			mydiv.parentSibsInactive = function () {
				($(this.div()).parent().siblings()).removeClass('active').addClass('disabled');
				return this;
			};
			// enables active/disable menu and set of siblings
			mydiv.activateMenuItem = function () {
				this.parentActive().parentSibsInactive();
				//$(this.Id()).parent().addClass('active');
				//($(this.Id()).parent().siblings()).removeClass('active').addClass('disabled');
			};
			mydiv.tagName = function () {
				return $(this.div()).get(0).tagName;
			};
			mydiv.datepicker = function (o) {
				$(this.div()).datepicker(_.defaults(o || {}, {
					'format': 'dd-mm-yyyy',
					'weekStart': 0,		// sunday=0, saturday=6
					'viewMode': 0,		// days=0, 1=months, 2=years
					'minViewMode': 0	// days=0 ...
				}));
				return this;
			};
			var date = function (o) {
				var options = {};
				
				_.extend(options, _.defaults(o || {}, {
					'target': _.uniqueId('date-'),
					'format': 'mm-yyyy',
					'dateIn': undefined,
					'viewMode': 0,
					'minViewMode': 0
				}));
				// extend this object with all the methods from the master date() object
				options = _.extend(options, bx.date(options));
				// What it does: creates an "end" date, this object is the "start". Start date of this
				// object can't be later than "end". Likewise start date of "end" can't come before this.
				var range = function (opts) {
					var local = this;
					this.end = date(opts);
					this.end.minStart = this;
					this.maxEnd = this.end;
					return this; 
				};
				options.range = range;
				
				var refresh = function () {
					$(this.target).datepicker('setValue', this.valueOf());
					if (this.end) {
						this.end.refresh();
					}
					return this;					
				};
				options.refresh = refresh;
				
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
					this.setYear(start);
					if (this.end && _.isNumber(end)) {
						this.end.setYear(end);
					}
					return this;
				};
				options.setYears = setYears;
				
				// set the event handler for the .datepicker
				bxQuery(options.target)
					.datepicker(_.pick(options, 
						'format', 'weekStart', 'viewMode', 'minViewMode'))
					.bind('changeDate', function (e) {
						var value = bx.date({
							'format': 'mm dd yyyy',	// jQuery date format
							'dateIn': e.date()
						}).valueOf();

						// if we're in readOnly state, don't update any user clicks
						if ($(options.target).attr('readOnly')) {
							$(options.target).datepicker('setValue', options.valueOf());
							return;
						}
						
						if ((options.maxEnd && (value < options.maxEnd.valueOf())) ||
							(options.minStart && (value > options.minStart.valueOf())) ||
							(!options.maxEnd && !options.minStart)) {
								options.setTime(value);
								$(options.target).datepicker('setValue', value);

						} else {
							bx.alert('date out of range - ' + value);
							options.setTime((options.maxEnd && options.maxEnd.valueOf()) ||
											(options.minStart && options.minStart.valueOf()));
							$(options.target).datepicker('setValue', options.maxEnd || options.minStart);
						}
				});
				// install the date for this object on the datepicker
				refresh.call(options);
				return options;
			};
			mydiv.date = date;
			
			mydiv.pagination = function (context, tags) {
				var pager = function (page, pages, tags) {
					var targets = _.defaults(tags || {}, {
						'showPage': '#showPage',
						'showTotalPages': '#showTotalPages'
					});

					// if we are at the last-page disable next, or at first-page
					// disable previous. then run the supplied fn if provided.
					if (page > 1) {
						$('.pager').children('.previous').removeClass('disabled');
						$('.pager').children('.previous').addClass('active');
					} else {
						$('.pager').children('.previous').removeClass('active');
						$('.pager').children('.previous').addClass('disabled');
					}

					if (page < pages) {
						$('.pager').children('.next').removeClass('disabled');
						$('.pager').children('.next').addClass('active');
					} else {
						$('.pager').children('.next').removeClass('active');
						$('.pager').children('.next').addClass('disabled');
						}
					$(targets.showPage).html(page);
					$(targets.showTotalPages).html(pages);	
				};
				context.on(this.div(), function (result) {
					var nextPrev = function (arg) {
						result.nextPrev(arg);
						// update the pager element with the page info
						pager(result.page().pageInfo().page, result.page().pageInfo().pages);
					}
					, resultNextPrev = bxQuery('#result-prev, #result-next')
						.unbind()
						.bind('click', function(e) {
							nextPrev(e.text());
					});
					pager(result.pageInfo().page, result.pageInfo().pages);
				});
				// if there is asynchronous loading/caching, update the pages counter.
				context.on('onMoreData', function(result) {
					pager(result.pageInfo().page, result.pageInfo().pages);
				});
				return this;		
			};
			return mydiv;
		};
		that.bxQuery = bxQuery;
		
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
		that.buildHTML = buildHTML;
		
		var element = function(obj, owner) {
			// NB: 'id' gets replaced with id() method during its creation so that the object
			// can be referenced off of the hash. original 'id' is in the 'selector' variable
			var that = bxQuery((obj && obj.id) || _.uniqueId('element-'), obj || {});
			that.tag = (obj && obj.tag) || 'div';
			that.elementText = (obj && obj.elementText) || '';
			that.fn = (obj && obj.fn) || undefined;
			that.data = '';
			
			var attributes = function (attr) {
				this.attrs = _.extend({}, (this && this.attrs) || {}, attr || {});
				return this;				
			};
			that.attributes = attributes;
			that.attributes(_.extend({ 'id': that.divId() }, _.pick(obj || {}, 'type', 'class')));
			
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
					bxQuery(attr && attr.id).bind('click', function(e) {
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
					bxQuery(this.divId()).bind('click', this.fn);
				}
				
				if (this.firstChild()) {
					// this element has a child
					if (this.sibling) {
						// and a sibling
						this.data = 
							buildHTML(this.tag, this.elementText + this.firstChild().build(), this.attrs) +
								this.sibling.build();
					} else {
						// only a child
						this.data = buildHTML(this.tag, this.elementText + this.firstChild().build(), this.attrs);
					}
				} else if (this.sibling) {
					// only a sibling
					this.data = buildHTML(this.tag, this.elementText, this.attrs) + 
						this.sibling.build();					
				} else {
					// only itself
					this.data = buildHTML(this.tag, this.elementText, this.attrs);
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
			that.data = buildHTML(tag, text, that.attrs);
			return that;
		};
		that.linkEvent = linkEvent;
		
		// Purpose: Create a Button 'input' event
		var buttonEvent = function(text, fn) {
//			var that = formEvent('button');

			return buildHTML('div', buildHTML('input', text, that.attrs));
		};
		that.buttonEvent = buttonEvent;
		
		// What it does: returns a formed HTML form for a textarea block; includes the callback
		// TBD: on first entry of the textarea, may want to clear the text
		var textArea = function (text, callback, cols, rows) {
			var id = _.uniqueId('textArea-')
				;
			
			return(
				buildHTML('div',
					buildHTML('form',
						buildHTML('textarea', text, { 
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

/*

// What this does: installs default 'click' event behavior for a list of divs.
// nb: divs are grouped by hierarchy, so active/disabled uses parent/sibling, not based on divs.
mydiv.load = function (system, list) {
	var $this = bxQuery(list || this.div())
		.bind('click', function (e) {
			$this.activate(e.Id());
			e.fire(system);
		});
};
// What this does: This Group: first one is to be shown, rest are hidden.
mydiv.activate = function (active) {				
	this.div().split(',').forEach(function(el, index) {
		$(el).parent().removeClass('active');
	});
	$('#'+active).parent().addClass('active');
	return this;
};

// What this does: This Group: first one is to be shown, rest are hidden.
mydiv.toggle = function (target) {
	
	if (toggled===false) {
		this.div().split(',').forEach(function(el, index) {
			$(el).addClass('active');
			$(el).show();
		});
		target.split(',').forEach(function(el) {
			$(el).removeClass('active');
			$(el).hide();
		});
	} else {
		bxQuery(target).toggle(this.div());
	}
	toggled = !toggled;
	return this;
};

	// What this does: Takes a variable number of arguments, Clear their contents.
	var clearDiv = function () {
		if (arguments.length > 0) {
			_.each(arguments, function(item) {
				$.handler.broadcast(item, { 'clear': true });				
			});
		}
	};
	that.clearDiv = clearDiv;
	
	// Purpose: Allows communication of results to the browser. 
	// Note1: Main .html page must have a corresponding div element for this to work.
	// Note2: Programmer can register additional functions to listen for updates using these tags with: 
	// $.handler.register('#tag', func);
	var divRegistry = function (divs) {

		_.each(divs, function (item) {
			// callback supplies an object with instructions how to proceed: clear, html, append
			$.handler.register(item, function (htmlObject) {
				if (_.has(htmlObject, 'clear') && htmlObject.clear === true) {
					$(item).empty();
				}
				if (_.has(htmlObject, 'html')) {
					$(item).html(htmlObject.html);
				}
			});			
		});
		return divs;
	};
	that.divRegistry = divRegistry;
	return that;
};

		var element = function(obj, owner) {
			// NB: 'id' gets replaced with id() method during its creation so that the object
			// can be referenced off of the hash. original 'id' is in the 'selector' variable
			var that = bxQuery((obj && obj.Id) || _.uniqueId('element-'), obj || {});
			that.tag = (obj && obj.tag) || 'div';
			that.elementText = (obj && obj.elementText) || '';
			that.fn = (obj && obj.fn) || undefined;
			that.data = '';
			
			var attributes = function (attr) {
				this.attrs = _.extend({}, (this && this.attrs) || {}, attr || {});
				return this;				
			};
			that.attributes = attributes;
			that.attributes(_.extend({ 'id': that.divId() }, _.pick(obj || {}, 'type', 'class')));
			
			var elementCreate = function (tag) {
				var args = _.isString(tag) ? {'tag': tag } : tag;
				
				return element.call(this, {
					'tag': args && args.tag,
					'elementText': args && args.text,
					'fn': args && args.fn,
					'type': args && args.type,
					'id': (this && this.id)
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
						
			// What it does: link items 'a' wrapped in list items 'li'. Adjusts for hierarchy
			// on selection since 'a' is child of 'li' when indicating 'active' / 'disabled'
			that.linkList = function(list) {
				var local = this
					, listItem = local.elementCreate('li');
				this.insertChild(listItem);

				list.forEach(function(item, index) {
					// a linkItem is a list-link with the link a child of the list element. 
					// so the siblings owner is a level up from the link element itself
					var linkItemFn = function (arg) {
						// reset 'class': 'active' and add to current item
						arg.context.parent().siblings(function(sib) {
							if (sib.firstChild() !== arg.context) {
								sib.removeClass('active');							
							} else {
								sib.addClass('active');
							}
						});
						if (_.isFunction(item.fn)) {
							item.fn.apply(arg.local, arguments);
						}
					};
					// create a list element, with a link element child
					listItem.insertChild(listItem.elementCreate({ 
						'tag':'a', 
						'text': item.elementText, 
						'attrs': item.attrs, 
						'fn': linkItemFn }));
					if (index < list.length-1) {
						local.insertChild(local.elementCreate('li'));
						listItem = local.lastChild();						
					}
				});
				return this;
			};
			
			// loads events into a DOM object
			var load = function (id, a) {
				var local = this
					, firstChild;
				
				local.attrs = _.extend({
					'id': id,
					'label': local.elementText,
					'val': false,
					'onclick': '$.handler.broadcast(id, this)'}, a);

				$.handler.register(id, function() {
					local.attrs.val = !(local.attrs.val);

					if (typeof that.fn === 'function') {
						return (that.fn({
							'id': id,
							'label': local.attrs.label,
							'value': local.attrs.val,
							'attrs': local.attrs,
							'context': local
						}));
					}
					if (typeof that.fn === 'string') {
						window.open(that.fn);
					}
				});
			};
			
			// recursive function to traverse child/sibling objects and return the templated .html			
			var build = function () {
				this.data = '';			

				if (_.isFunction(this.fn)) {
					load.call(this, this.divId(), this.attrs);
				}
				if (this.firstChild()) {
					// this element has a child
					if (this.sibling) {
						// and a sibling
						this.data = 
							buildHTML(this.tag, this.elementText + this.firstChild().build(), this.attrs) +
								this.sibling.build();
					} else {
						// only a child
						this.data = buildHTML(this.tag, this.elementText + this.firstChild().build(), this.attrs);
					}
				} else if (this.sibling) {
					// only a sibling
					this.data = buildHTML(this.tag, this.elementText, this.attrs) + 
						this.sibling.build();					
				} else {
					// only itself
					this.data = buildHTML(this.tag, this.elementText, this.attrs);
				}
				return this.data;
			};
			that.build = build;
			
			var display = function () {
				this.build();
				return this;
			};
			that.display = display;
			
			var iterate = function(method, items, attrs, fn) {
				var local = this;
				items.forEach(function(item) {
					try {
						local[method](item, attrs, fn);						
					} catch (e) {
						alert('somethings wrong! - '+e);
					}
				});
				return this;
			};
			that.iterate = iterate;
			
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
			// return ({ 'elementText': item, 'attrs': attrs, 'fn': fn });						
			
			var unorderedList = function (labels, attrs, fn) {				
				this.el('ul')
						.linkList(_.arrayMap(labels, function(item) {
							return ({ 'elementText': item, 'attrs': attrs, 'fn': fn });
						}));						
							
				return this;
			};
			that.unorderedList = unorderedList;

			var bind = function () {
				bxQuery(this.target).bind.apply(this, arguments);
			};
			that.bind = bind;
			
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
			return that;	
		};
		that.element = element;
		
		var bootstWrap = function (obj) {
			var that = element(_.extend({'tag': 'div', 'id': _.uniqueId('bts-style-') }, obj))
				, bS = {
					'btn-primary': { 'class': 'btn btn-primary' },
					'control-group': { 'class': 'control-group' },
					'nav': { 'class': 'nav' },
					'nav-tabs': { 'class': 'nav nav-tabs' },
					'nav-bar': { 'class': 'navbar' },
					'nav-bar-inner': {'class': 'navbar-inner'},
					'nav-link-text': { 'class': 'brand' },
					'active': {'class': 'active'},
					'disabled': {'class': 'disabled'},
					'caret': {'class':'caret'},
					'dropdown-menu': { 
						'class':'dropdown-menu', 'role': 'menu', 'aria-labelledby': 'dLabel' },
					'dropdown-toggle-text': 	{ 
						'class': 'dropdown-toggle', 'data-toggle':'dropdown', 'href':'#' },
					'dropdown-link': { 'tabindex': '-1', 'href': '#' },
					'pagination-large-centered': {
						'class': 'pagination pagination-large pagination-centered' 
					},
					'type-ahead': { 'data-provide':'typeahead', 'data-items': '8' }
				};
				
			var textTypeAhead = function (attrs) {
				var local = this
					, div = this.el({ 'tag': 'input', 'type':'text' })
					.attributes(bS['type-ahead'])
					.attributes(attrs)
					, x;
				
				this.typeahead = function (facets, options) {
					var itemValue
						, fn = _.isFunction(options) ? options : (options && options.updater)
						, typeaheadMethods = {
							'source': facets || [],
							'minLength': 1,
							// refer to twitter bootstrap for details
							'updater': function(item) {
								x = this;
								$(div.div()).val(item);
								$(div.div()).attr('placeholder', item);
								if (fn && _.isFunction(fn)) {
									fn(item);
								}
								console.log('updater', item, $(div.div()).attr('placeholder'));
								return item;
							}
						};
					
					// if typeahead is called more than once over the same session, want to empty it
					// and update it with the new contents
					$(div.div()).empty();
					$(div.div()).typeahead(typeaheadMethods);
					return this;			
				};
				return this;
			};
			that.textTypeAhead = textTypeAhead;
				
			var basicButton = function (text, attrs, fn) {
				this.button.apply(this, arguments).each(function(el) {
					if (el && el.hasOwnProperty('type') && el.type === 'button') {
						el.attributes(bS['btn-primary']);
					}
				});
				return this;
			};
			that.basicButton = basicButton;
			
			that.buttonGroup = function (itemText, fn) {
				this.el('div').attributes(bS['control-group'])
					.el('fieldset')
						.iterate('button', itemText, bS['btn-primary'], fn);
				return this;
			};
			
			that.navTabs = function (labels, attrs, fn) {
				this.unorderedList.apply(this, arguments)
					.each(function(el) {
						if (el.tag === 'ul') {
							el.attributes(bS['nav-tabs']);
							el.firstChild().attributes(bS['active']);
						}
					});
				return this;
			};

			that.navBar = function (itemText, attrs, fn) {
				var ul = _.clone(this).el().unorderedList(itemText, attrs, fn)
					.firstChild();				
				ul.each(function(el) {
					if (el.tag === 'ul') {
						el.attributes(bS['nav']);
						el.firstChild().attributes(bS['active']);
					}
				});
					
				this.attributes(bS['nav-bar'])
					.el({'tag': 'div', 'attrs': bS['nav-bar-inner']})
					.el({'tag': 'a', 'text': 'Choose', 'attrs': bS['nav-link-text']})
					.spliceIn(ul);
				return this;

			};
			
			var pagination = function (fn) {
				var ul
					, buttons = {}
					
				// if we are at the last-page disable next, or at first-page
				// disable previous. then run the supplied fn if provided.
				, enableDisable = function (page, pages) {
					if (page > 1) {
						buttons.previous.removeClass('disabled');
						buttons.previous.addClass('active');
					} else {
						buttons.previous.removeClass('active');
						buttons.previous.addClass('disabled');
					}
					
					if (page < pages) {
						buttons.next.removeClass('disabled');
						buttons.next.addClass('active');
					} else {
						buttons.next.removeClass('active');
						buttons.next.addClass('disabled');
					}
				};

				// build the unordered list 'a' links
				ul = this.unorderedList(['Previous', 'Next'], {'href': '#'}, function(arg) {
					arg.context.enableDisable = enableDisable;
					fn.apply(arg.context, arguments);					
				})
					.attributes(bS['pagination-large-centered'])
					.firstChild();
					
				// disable the previous link 
				buttons.previous = ul.firstChild();
				buttons.next = ul.lastChild();
				// NB: must set the attributes before using the jQuery wrapper, 
				// because until we run .html() the element is not yet part of the DOM
				buttons.previous.attributes(bS['disabled']);
				return this;
			};
			that.pagination = pagination;
			
			// twitter.bootstrap requires this javascript code to activate the dropdown	
			that.dropdown = function () { $('.dropdown-toggle').dropdown(); return this; };
			var dropdownToggle = function (toggleText, links, fn) {
				var caret = buildHTML('b', ' ', bS['caret'])
					, toggle = this.elementCreate({
						'tag': 'a',  
						'text': toggleText + caret, 
						'attrs': bS['dropdown-toggle-text'] });

				var pageSizeFn = function (arg) {
					toggle.data = buildHTML('a', toggleText + 
						' - ' + arg.label + ' ' + caret, bS['dropdown-toggle-text']);
					toggle.html();
					if (_.isFunction(fn)) {
						fn.apply(this, arguments);
					}
				};
				// build the unordered list of 'a' links
				this.unorderedList(links, bS['dropdown-link'], pageSizeFn)
					.firstChild()
					// skip over the first 'div' and add attributes to the 'ul'
					.attributes(bS['dropdown-menu'])
					// insert the toggleText item as its first child of the parent
					.insertFirstSibling(toggle);
				return this;
			};
			that.dropdownToggle = dropdownToggle;
			return that;
		};
		that.bootstWrap = bootstWrap;
	
		// Purpose: Create a URL link
		var link = function(text, a, fn) {
			return element().link(text, a, fn).build().data;
		};
		that.link = link;
		
		
		// Creates a pick menu of a given width 'charsWidth
		var buildMenu = function(charsWidth) {
			var options = ''
				, that = {};

			var build = function (name, cb, menu) {
				var local = this
					,id = $.handler.uniqueId('select')
					, formId = $.handler.uniqueId('form')
					, optionText
					, callback
					, menuOptions
					, attrs = {
						'id': id
					};
					
				if (_.isString(name)) {
					_.extend(attrs, {'name': name});
					optionText = name;
					callback = cb;
					menuOptions = menu;
				} else if (_.isFunction(name)) {
					_.extend(attrs, {'name': 'name'+formId });
					callback = name;
					menuOptions = cb;
				} 
					
				if (menuOptions) {
					_.extend(attrs, menuOptions);
				}
				
				// if this is a fixed menu, then fire on click; else fire onchange
				if (attrs.size) {
					// make sure size is an integer
					attrs.size = _.toInt(attrs.size);
					_.extend(attrs, {
						'onclick':'$.handler.broadcast(id, document.getElementById(id))'
					});						
				} else {
					_.extend(attrs, {
						'onchange':'$.handler.broadcast(id, document.getElementById(id))'
					});
				}

				// register the callback
				$.handler.register(id, function(id) {
					local.val = $('#'+id).val();
					if (typeof callback === 'function') {
						callback(id, local.val);
					}
				});
		
				if (!optionText) {
					this.data = (buildHTML('form',
						buildHTML('select', options, attrs), { 'id': formId }));
				} else {
					this.data = buildHTML('text', optionText) + 
						buildHTML('form', buildHTML('select', options, attrs), { 'id': formId });
				}
				return this;
			};
			that.build = build;

			// title (label to use for the pick)
			var addOption = function (title, selected) {
				var i
					, attrs = { 'value': title };

				if ((title && title.length) > charsWidth || 65) {
					title = title.slice(0,charsWidth || 65);
				} else if (title){
					for (i=(charsWidth-title.length); i > 0; i-=1) {
						title += '&nbsp;&nbsp;';
					}
				} else {
					title = '';
				}
				
				if (selected) {
					attrs = _.extend(attrs, { 'selected': 'selected' });
				}

				// build the option strng
				options += buildHTML('option', title, attrs);	
				
			};
			that.addOption = addOption;

			//function addGroup(label) {
			//	group += buildHTML('optgroup', options, { 'label': label });
			//	options = '';
			//}
			return that;
		};
		that.buildMenu = buildMenu;

		// What this does: Creates a checkbox element
		var multiEvent = function (text, fn) {
			var that = element();
			
			return that.checkbox(text, {}, fn).build();
		};
		that.multiEvent = multiEvent;
				
		
		// What this does: Creates a checkbox element
		var multiEvent = function (text, fn) {
			var that = form().event('checkbox');
			that.val = false;
			$.handler.register(that.id, function() {
				that.val = !(that.val);
				if (typeof fn === 'function') {
					return (fn({
						id: that.id,
						text: text,
						context: this
					}));
				}
			});
			that.data = buildHTML('input', text, that.attrs);
			return that;		
		};
		that.multiEvent = multiEvent;
		
		// Purpose: Create a URL link in inline form
		var linkEvent = function(tag, text, fn) {
			var that = formEvent()
				; 
			that.attrs.href = '#';
			that.attrs.target = '_self';
//			that.attrs['class'] = 'link-event';
						
			$.handler.register(that.id, function() {
				if (typeof fn === 'function') {
					return (fn({
						id: that.id,
						text: text,
						context: this
					}));
				}
				if (typeof fn === 'string') {
					window.open(fn);
				}
			});
			that.data = buildHTML(tag, text, that.attrs);
			return that;
		};
		that.linkEvent = linkEvent;
		
		// Purpose: Create a collection of listEvents grouped as an unordered list
		var linkForm = function(formId, formStyle) {
			var that = {}
				, output = ''
				, id = _.isString(formId) ? formId : _.uniqueId('linkForm-')
				, style = _.isObject(formStyle) ? formStyle : (_.isObject(formId) && formId);

			// style applies to all links in this group. Could be 'block' or 'inline'
			var addLink = function (text, fn, linkStyle) {
				output += listEvent(text, fn, linkStyle).data;
			};
			that.addLink = addLink;

			// optional list style for CSS styling
			var html = function (listStyle) {
				return buildHTML('ul', output, style);
			};
			that.html = html;
			
			//
			//	var items = [ { 'text': txt, 'func': fn } ... ]
			//
			var build = function (items, linkStyle) {
				var style = linkStyle || {};
				items.forEach(function(item) {
					if (item.hasOwnProperty('active')) {
						style.active = item.active;
					}
					addLink(item.text, item.func, style);
				});
				return html();
			};
			that.build = build;
			that.id = id;
			return that;
		};
		that.linkForm = linkForm;
		
		// Purpose: Create a Button 'input' event
		var buttonEvent = function(text, fn) {
			var that = formEvent('button');

			$.handler.register(that.id, function() {
				if (typeof fn === 'function') {
					return (fn({
						id: that.id,
						text: text,
						context: this
					}));
				}
			});
			return buildHTML('div', buildHTML('input', text, that.attrs));
		};
		that.buttonEvent = buttonEvent;

*/
