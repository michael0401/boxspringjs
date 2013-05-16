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
/*global _: true, bx: true */

(function(global) {
	"use strict";
		
	// What it does: Query / Result Objects
	var query = function (db, options) {
		var queryParameters = ['reduce',
							'limit',
							'startkey',
							'endkey',
							'group_level',
							'descending',
							'key',
							'keys']
							
		// give this object some events			
		, that = _.extend(this, global.Events());
		
		// extend it with these options.	
		that = _.extend(that, _.defaults(options || {}, {
			// query parameters
			'reduce': false,
			'limit': 100,
			'startkey': undefined,
			'endkey': undefined,
			'group_level': undefined,
			'descending': false,
			'key': undefined,
			'keys': undefined,
			'filter': {},
			'pivot': false,
			'display': false,
			'vis': 'table'
		}));

		that.system = (db && db.system);

		var result = function () {					
			var owner = this 
			, queryPages = { 'pages': [] }
			, current_chunk = 0
			, current_page = 0;	// zero-based

			// wraps the response.data object with some helper methods
			var data = function (response) {
				// helpers						
				response.query = owner;	// owner
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
						'pageSize': (db.system.page_size || this.totalRows),
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
						this.query.trigger('on-display', page.apply(this));
						return this;	
					} 

					if (_.found(direction, 'next')) {
						current_chunk += (current_chunk < queryPages.pages.length-1) ? 1 : 0;
						this.pageInfo().next();					
						this.query.trigger('on-display', page.apply(this));
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
						this.query.trigger('on-display', page.apply(this));									
					}
				};
				response.nextPrev = nextPrev;

				// updates the pages cache
				queryPages.pages.push(response);	
				// accumulates the rest of the pages for this result, if 'asynch'
				//console.log('result', response.offset(), response.query.get('system'));
				if (db.system.asynch === true && 
					queryPages.pages.length > 1) {
					response.query.trigger('result-more-data', response);										
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

			// clear any events for this object
			//this.off();

			// when asynch=true, relay the data to the listener
			// NOTE: during testing when trigger 'more-data' from the result object, 
			// this object has expired so there seems to be no on listening?
			// include this listener here and relaying to the app seems to fix it. 
			this.on('result-more-data', function(response) {
				local.trigger('more-data', response);
			});

			db.get(_.pick(this, queryParameters), function(err, result) {
				if (err) {
					console.log(err);
				}	
				// set result and call down to nextPrev with this result and no argument
				local.trigger('result', result);		
			}, result.call(this));
			return this;						
		};
		that.server = get;
		return that;		
	};
	global.query = query;
}(boxspring));	


