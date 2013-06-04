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
		that.qid = _.uniqueId('query-');
		
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
//move			'display': false,
//move			'vis': 'table'
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
			var queryPages = { 'pages': [] }
			, current_chunk = 0
			, current_page = 0;	// zero-based

			// wraps the response.data object with some helper methods
			var data = function (response) {
				// helpers						
				response.query = that;						// owner
				response.system = response.query.system;	// access to page-size downstream
				response.rid = _.uniqueId('result-');

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
						'pageSize': (response.system.get('page-size') || this.totalRows),
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
				//console.log('result', response.offset(), response.query.get('system'));
				// when asynch=true, relay the data to the listener
				if (response.system.get('asynch') === true && 
					queryPages.pages.length > 1) {
			
					if (response.pageInfo().completed) {
						response.query.trigger('completed', response);																
					} else {
						response.query.trigger('more-data', response);																
					}
				}
				return response;
			};
			queryPages.data = data;
			return data;
		};

		// What it does: fetches data from the server
		// NOTE: RESULT is a Result() object
		var get = function () {	
			var local = this;

			this.db.get(_.pick(this, queryParameters), function(err, result) {
				if (err) {
					console.log(err);
				}	
				// set result and call down to nextPrev with this result and no argument
				local.trigger('result', result);		
			}, result());
			return this;						
		};
		that.server = get;
		return that;		
	};
	global.query = query;
}(boxspring));	


