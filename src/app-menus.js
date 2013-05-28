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

/*jslint newcap: false, vars: true, white: true, nomen: true  */
/*global bx: true, _: true, window: true, $: true, console: true  */

(function (Local) {
	"use strict";
	
	Local.pageMaker = function(options) {
		return _.defaults(options || {}, {
			'id': _.uniqueId('page-'),
			'type': 'page',
			'fireOnReady': true					
		});
	};
	
	Local.confirmMenuConfig = function (expected, selector) {
		// fetch classes and get their ID's
		$(selector).each(function() {
			if (!_.has(expected, $(this).attr('id'))) {
				throw 'fatal - Class id found in source not expected - ' + $(this).attr('id');
			} else {
				expected[$(this).attr('id')] = true;
			}
		});
		// confirm we got them all, and there are no extra's in the HTML
		_.each(expected, function(v, k) { 
			if (v===false) { throw 'fatal - Class id expected but not found in HTML - ' + k; } 
		});
		return true;
	};
	
	Local.Wrappers = function (system) {
		var qW = {}
		, root;
		
		/*
			Wrapper for setting id, target, context and options for form, 
			and query objects associated with div elements on the page.
		*/	
		var viewWrapper = function (options) {
			var that = bx.List(bx.Events());
			
			// specified options over-ride the defaults
			that = _.extend(that, _.defaults(options || {}, { 
				'id': _.uniqueId('viewWrapper-'), 'fireOnReady': false }));
				
			// if no root yet, make this object the root. all children will point back to it
			if (!root) {
				// place to keep items Global to all pages
				root = that;
				root.hash = _.options();
			}
			that.root = root;

			// create an object for managing filters used by the query objects. the 'value' filter is used
			// to remove 'null' values from expanded listings when multiple keys are generated for a document for 
			// reduce functions, we don't want to map those documents more than once.
			var filter = (function () {
				var that = {}
				, options = _.options()
				, value = function() {
					if (this.value === null) {
						return false;
					}
					return (true);
				};
				that = _.extend(that, options);

				that.set = function () {
					options.set.apply(this, arguments);
				};
				that.get = function () {
					options.set.apply(this, arguments);
				};
				that.reset = function () {
					this.each(function(v, k) { options.set(k, undefined); });
					options.set('value', value);
				};
				
				that.create = function () {
					return _.options({
						'value': value
					});
				};
				options.set('value', value);
				return that;
			}());
			that.filter = filter;
			
			// What it does: sets events on DOM elements of a given className and updates
			// a structure 'inputState' whenever a change happens on that event.
			var inputStateHandler = function (className, context) {
				var inputState = {}
				, id = function ($obj) {
					if (!$obj.attr('id')) {
						$obj.attr('id', _.uniqueId('inputState-'));
					}
					return ($obj.attr('id') || $obj.attr('name'));
				};
				
				var lastClick = function (id) {
					if (id) {
						inputState.lastId = id;
					}
					return inputState.lastId;
				};
				// any time an .className changes, update the inputState
				$(className).change(function(e) {
					//e.stopPropagation();
					$(className).each(function() {
						inputState[id($(this))] = {};
						inputState[id($(this))][$(this).attr('name')] = $(this).attr('value');
						inputState[id($(this))].checked = this.checked;
						inputState[id($(this))].type = ($(this).attr('type'));
					});
				});
				
				$(className).click(function(e) {
					//e.stopPropagation();
					lastClick(($(this).attr('id')));
					$('#'+lastClick()).bx('activateMenuItem');
					if (context) { 
						context.trigger(context.id, bx.clickEvent(e, {
							'page': context.id, 
							'target': inputState.lastId,  
							'targetText': $(e.target).text() })); 
					}
				});

				var isChecked = function (selector) {
					var found;
					_.each(inputState, function (item) {
						if (item[selector] && item.type === 'radio' && item.checked === true) {
							found = item[selector];
						}
					});
					return found;
				};
				$(className).trigger('change');
				this.inputState = inputState;
				this.isChecked = isChecked;
				this.lastClick = lastClick;
				return this;
			};
			that.inputStateHandler = inputStateHandler;
			
			// What it does: returns the id of the active tab
			// jQuery equivalent using attribute: 
			//		$('#ondisplay-tabs > li.active').attr('ondisplay')
			var activeTabId = function () {
				return (root.hash.get('active-tab-id'));
			};
			that.activeTabId = activeTabId;
			
			var activeTabPage = function () {
				return root.Id(activeTabId());
			};
			that.activeTabPage = activeTabPage;
			
			// What it does: returns the object holding the active tab
			var activeTabOwner = function () {
				return (this.activeTabPage() && this.activeTabPage().parent());
			};
			that.activeTabOwner = activeTabOwner;
			
			var activeQuery = function () {
				return this.root.activeTabOwner() && this.root.activeTabOwner().query;
			};
			that.activeQuery = activeQuery;

			// helper functions to confirm the tab holding this object is the active one
			var setActiveTab = function (id) {
				this.root.hash.set('active-tab-id', id);					
			};
			that.setActiveTab = setActiveTab;
			
			var isActiveTab = function (id) {
				return (this.root.hash.get('active-tab-id') === id);					
			};
			that.isActiveTab = isActiveTab;
						
			// What this does: if this page has a #target, show it. And, mark this page as active
			// and mark its siblings as not active. do the same recursively for the parents.
			var activate = function () {
				if (this && this.target) {
					$(this.target).show();
				}				
				root.hash.set('active-page', this.id);
				return this;
			};
			that.activate = activate;
					
			// visit siblings of first child; then close the first child; then splice out
			var onClose = function () {
				if (this.firstChild()) {
					if (this.firstChild().nextSibling()) {
						this.firstChild().nextSibling().onClose();						
					}
					this.firstChild().onClose();
				}
				return this.spliceOut();
			};
			that.onClose = onClose;
			
			var create = function (options) {
				return viewWrapper.call(this, options);
			};
			that.create = create;
						
			var addChild = function (options) {
				var child = this.create(options);
				this.insertChild(child);
				// call the form builder, if supplied
				if (options) {
					if (options.hasOwnProperty('form') && _.isFunction(options.form)) {
						child.form = options.form;
						child.form.call(child, child.id, child.target);
					}
					// if an 'event' is specified, then create a jQuery event handler for it
					if (options.hasOwnProperty('event')) {
						var selector = options.event === 'link' ? 'a#'+child.id : '#'+child.id;
						$(selector).bind('click', function(e) {
							child.trigger(child.id, bx.clickEvent(e, {
								'target': child.id,  
								'targetText': $(e.target).text() }));							
						});
					}
					// 'whenActive' method is triggered by the 'id' of this part of the page
					if (options.hasOwnProperty('whenActive') && _.isFunction(options.whenActive)) {				
						child.on(child.id, function () {
							// when triggered, calls the query method 
							// arguments: supplied by caller
							child.activate();
							child.whenActive.apply(child, [child.id].concat(_.toArray(arguments)));
						});
					}
					// onClose has to do the work of this object, and whatever else the application
					// needs closed.
					if (options.hasOwnProperty('onClose') && _.isFunction(options.onClose)) {
						child.onClose = function() {
							options.onClose.apply(child, arguments);
							return onClose.apply(child);
						};
					}
					// onInput is a class selector. Attach an instance of 'inputStateHandler' here
					if (options.hasOwnProperty('onInput') && _.isString(options.onInput)) {
						inputStateHandler.call(child, child.onInput, child);
					}
				}

				if (child.hasOwnProperty('fireOnReady') && child.fireOnReady === true) {
					// execute the 'whenActive'
					child.fire();				
				}
				return this;
			};
			that.addChild = addChild;
			
			var fire = function () {
				this.trigger.apply(this, [this.id].concat(_.toArray(arguments)));
				return this;
			};
			that.fire = fire;
			
			var makeIds = function (id) {
				return({
					'page': id,
					'onDisplay': id+'-onDisplay',
					'$onDisplay': '#'+id+'-onDisplay',
					'tab': id+'-onDisplay-tab',
					'$tab': '#'+id+'-onDisplay-tab'
				});
			};
			
			// What this does: takes a (page) context, an id and creates a tab with its child
			var tab = function (context, id, title, fn) {
				var that = {}
				, local = this
				, ids = makeIds(id)
				, func = _.isFunction(fn) ? fn : function() { return ; };
				
				that.make = function (target) {
					// when clicked, a tab is defined to 'fire' its first child.
					context.addChild({
						'id': ids.tab,
						'event': 'link',
						'target': target || '#ondisplay-tabs',
						'type': 'tab',
						'fireOnReady': true,
						'form': function () {
							// add a tab to the #ondisplay-tabs div on the main page
							// add a tab using the reference markup; add link and list attributes
							$(this.target)
								.removeClass('hidden');
							// creates a listItem from the reference-list-item
							bx.bootstrap(this.target, ids.tab)
								.append('#reference-list-item', title || context.id+'/'+ids.onDisplay);
							// list attributes
							$(this.target+' .template').attr({'class': 'active' });
						},
						'whenActive': function() {
							// HTML fragment from template may be hidden on load so remove 'hidden' class		
							$(ids.$onDisplay).removeClass('hidden');
							// show this div, hide the others
							$(ids.$onDisplay).show();
							$(ids.$onDisplay).siblings().hide();
							// activateMenuItem enables this tab and disables its siblings
							$(ids.$tab).bx('activateMenuItem');
							// activate this page, 
							context.activate();
							// register this page as the active query
							context.setActiveTab(ids.tab);
							$('#active-tab').text(ids.tab);
							// relay the event to our internal page events; display is the parent id
							context.trigger(ids.onDisplay, ids.tab);
						}
					});
					// Query triggers this event when display is ready.
					context.on(ids.onDisplay, function() {
						// give 'func' access to the ids variables
						local.ids = ids;
						func.apply(local, arguments);
					});
					return this;
				};
				that.ids = ids;
				
				var superOnClose = context.onClose;
				context.onClose = function () {
					// remove elements from the DOM
					if ($(ids.$onDisplay).bx('exists')) {
						$(ids.$onDisplay).remove();
						$(ids.$tab).remove();
					}
					superOnClose.call(context);
				};
				return that;
			};
			that.tab = tab;

			var pageInfo = function (pageContext, id) {
				var query = this
				, ids = makeIds(id)
				, moreLess = pageContext.create({'id': 'more-less' })
				, current_level
				, max_level;

				query.on(bx.onDisplayStart, function () {
					pageContext.root.Id('loading').fire('show');
				});

				query.on(bx.onDisplayEnd, function () {
					pageContext.root.Id('loading').fire('hide');
				});
				
				pageContext.on(ids.onDisplay, function() {
					// show the .page-info headers
					$('.page-info').show();
					$('.dropdown-toggle').dropdown();
					
					// if pivot is enabled for this, then disable it in the menus
					if (query.get('pivot')) {
						$('#pivot-submenu').addClass('disable');
					} else {
						$('#pivot-submenu').removeClass('disable');						
					}

					$('.trialio_popover').each(function() {
						// generate an id and give it to this instance and install the popover event
						var id = _.uniqueId('trialio-popover-');
						$(this).attr('id', id);
						bx.bootstrap().popover(id, {
							'data-placement': 'left',
							'data-original-title': $(this).attr('title'),
							'data-content': _.map($(this).attr('value').split('|'), function(x) {
								return _.buildHTML('p', x);
							}).join('')
						});
					});

				});
				
				// updates the title block portion of the display
				pageContext.on(ids.onDisplay, function() {
					if (query.get('title') && pageContext.isActiveTab(ids.tab)) {
						$(query.tags.get('showTitle')).html(query.get('title'));
					}
				});
				// updates the dates portion of the display
				pageContext.on(ids.onDisplay, function() {
					var range = pageContext.root.Id('date-object').range.startEnd().format;
					
					// in order for dateFilter to work, there must be a field for it to match
					if (range) {
						$('#date-range-info').text(range.start + ' to ' + range.end);
					} else {
						$('#date-range-info').text('-- no range --');
					}
					return this;
				});
				// updates the Breadcrumb portion of the display
				pageContext.on(ids.onDisplay, function() {
					var viewType = query.get('pivot') === true ? 'Pivot' : 'Spreadsheet'
					, items = viewType === 'Pivot' 
						? [ 'Rows: '+query.get('pivot-row'), 'Columns: '+query.get('pivot-column')]
						: query.get('referenceKey');
					
					if (pageContext.isActiveTab(ids.tab)) {
						$('#view-type').html(viewType);
						$('#breadcrumb').empty();
						items.forEach(function(key, i) {
							var id = _.uniqueId(key)
							, onClickFunction = _.enclose(function(level) {
								// regardless of context, local.fire will have access to level=i+1 
								// at the time it was instantiated. only 'Spreadsheet' is clickable
								if (viewType === 'Spreadsheet') {
									query.fire({ 'group_level': level, 'reduce': true }); 
								}}, i+1);
								
							// dim the 'active' item in 'Spreadsheet' mode
							if (viewType === 'Spreadsheet' && i === query.get('group_level')-1) {
								bx.bootstrap('#breadcrumb', id)
									.append('#reference-breadcrumb-active-item', key.toUpperCase());
							} else {
								// event the other links to summarize/expand the detail
								bx.bootstrap('#breadcrumb', id)
									.breadCrumbItem(key.toUpperCase());
								$('#'+id).on('click', function() {
									onClickFunction();
								});
							}
							bx.bootstrap().popover(id, {
								'data-original-title': 'Aggregate The Table',
								'data-content': 'Select this link to summarize the table by ' + 
										key.toUpperCase()	
							});
						});
						
						if (viewType === 'Spreadsheet' && query.get('reduce')) {
							// add in the UNGROUP / REGROUP link
							bx.bootstrap('#breadcrumb', 'breadcrumb-grouped')
								.breadCrumbItem('EXPAND');
							$('#breadcrumb-grouped').on('click', function() {
								query.fire({
									'reduce': false, 
									'group_level': undefined }); 
							});							
						}
						bx.bootstrap().popover('breadcrumb-grouped', {
							'data-original-title': 'Return To Listing',
							'data-content': 'Select this link to return to individual trial records'	
						});
					}
					return this;
				});
				// this refreshes the divs posting data to the display	
				pageContext.on(ids.onDisplay, function() {
					if (query && query.contains('result')) {
						bx.pageInfo().refresh(query.get('result').pageInfo());						
					}
				});
				// build a tab element for this query
				tab.call(this, pageContext, id, query.get('title')).make();
				
				// when Query triggers event 'onDisplay', trigger the page event 'onDisplay'
				query.on(query.tags.get('onDisplay'), function () {
					pageContext.trigger(ids.onDisplay);
				});		
				return query;		
			};
			
			var queryWrapper = function (pageid, source) {
				var local = this
				, ids = makeIds(pageid)
				, query
				, container = (this && this.target) || '#onDisplay'
				, buffer = {};
				
				// verify and create the existence of the target div for onDisplay, if needed
				if (!$(ids.$onDisplay).bx('exists')) {
					$(container).append(_.buildHTML('div', '&nbsp;', {
						'id': ids.onDisplay, 'class': 'ondisplay-container' }));
				}
				// create the query; query.context is where the application listeners are waiting
				query = _.extend(_.clone(source || {}), { 'id': pageid });
				query.tags = 
					_.extend((source && source.tags) || {}, {'onDisplay': ids.$onDisplay });
				query.context = this;
				query = bx.Query(query);				
				
				// make this query object visible to its page owner
				local.query = query;
				
				// business logic and house keeping for the tab
				var pageDisplay = (function (query, page, localids) {
					return function () {
						pageInfo.call(query, page, ids.page);
						return page;						
					};
				}(query, local, ids));
			
				// if display, then add this query as a child of this page and fire
				if (query.get('display') === true) {
					// just execute pageDisplay()
					pageDisplay();
					local.display = function () { return local; };
				} else {
					// otherwise, provide a 'display' method to the caller
					query.set('display', false);
					local.display = pageDisplay;
				}
				
				// onSelection and onResult are waiting on results from queries or to be 
				// called on user input
				['onSelection', 'onResult'].forEach(function(item) {
					if (source.hasOwnProperty(item)) {
						local.on(item, function() {
							if (_.isFunction(source[item])) {
								source[item].apply(query, 
									[pageid].concat(_.toArray(arguments)));							
							}
						});
					}					
				});
				return query;
			};
			that.queryWrap = queryWrapper;
			
			var onLoad = function (params) {
				var id = _.uniqueId(this.id+'-page-');
				try {
					this.queryWrap(((params && params.id) || id), _.defaults(params, {'id': id }));
				} catch (e) {
					throw e + ' - could not create query '+this.id;
				}
				return this;
			};
			that.onLoad = onLoad;
			
			var onQuery = function (params) {
				this.onLoad(params).query.fire();
				return this;
			};
			that.onQuery = onQuery;
			
			var onDisplay = function (p) {
				var params = p;
				params.display = true;
				this.onQuery(params);
				return this;
			};
			that.onDisplay = onDisplay;
			return that;
		};
		qW.viewWrapper = viewWrapper;
		
		bx.on(bx.httpRequestStart, function () {
			$('#loading').show();
		});

		bx.on(bx.httpRequestEnd, function () {	
			$('#loading').hide();
		});
		return qW;
	};

}($));

/*

// enable the 'more-less' buttons by creating a containing element
(function (ctx) {
	current_level = ctx.get('level');
	max_level = ctx.get('level');

	return function () {
		// initialize the bootstrap 'li' elements
		$('#more').parent().addClass('disabled').removeClass('active');
		$('#less').parent().addClass('active');
		['#more', '#less'].forEach(function(item) {
			moreLess.Id('more-less').addChild({
				'id': item,
				'whenActive': function($Id, e) {
					if (pageContext.isActiveTab(ids.tab)) {
						if ($Id === '#more' && current_level < max_level) {
							current_level += 1;
							$('#less')
								.parent()
								.addClass('active').removeClass('disabled');
							ctx.fire({'group_level': current_level });
						} else if ($Id === '#less' && current_level > 0) {
							current_level -= 1;
							$('#more')
								.parent()
								.addClass('active').removeClass('disabled');
							ctx.fire({'group_level': current_level });
						}
						ctx.updateMoreLess();
					}
				}				
			});
		});						
	};
}(query))();

*/