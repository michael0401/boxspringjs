/* ===================================================
 * display.js v0.01
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
	var model = function (query) {
		
		// onDisplay is triggered when the first chunk of data is ready from the server
		this.events.on(this.get('onDisplay'), function (result, onPagination) {
			var onSelectionId = _.uniqueId('onSelection-');
			// executes the google-vis to render the table to the onDisplay div
			// onSelection gives a tag to the vis to call when rows are selected
			// only trigger if query.display is true

			if (local.get('display') === true) {
				if (onPagination) {
					local.query.events.trigger(local.get('onPagination'));
				} else {
					var renderOptions = {
						'query': result.query,
						'result': result,
						'tags': result.query.post(),
						'onSelection': onSelectionId
					};
					// install the selection handler
					local.events.on(onSelectionId, function (tableData) {
						// update the hash of filtered items
						local.events.trigger(local.get('onSelection'),
							local.handleSelections(tableData));
					});
					// fire the meters, the render, and make sure listeners are evented
					local.events.trigger(local.get('onDisplayStart'));				
					bx.renderLib('google').display(renderOptions);
					local.events.trigger(local.get('onDisplayEnd'));					
				}
			}
		});
		// keep feeding the vis with more data
		this.events.on('onMoreData', function (data) {			
			local.events.trigger(local.get('onDisplay'), data.unPaginate());
		});
	};

	// What it does: maintains a hash of selected keys
	var handleSelections = function (tableData) {
		var local = this
		, that = {}
		, pageInfo = tableData.data.result.pageInfo();				

		that.query = this;
		that.reference = tableData.data;
		that.selectedKeys = tableData.selectedKeys;
		that.rowIndices = tableData.rowIndices;

		// remove any previous selections on this page before starting
		// hash is as follows: hash[id] = page#
		if (local.selected) {
			local.selected.each(function(pageNo, id) {
				if (pageNo === (pageInfo && pageInfo.page)) {
					local.selected.remove(id);
				}
			});
		}
		// install these keys into the 'selected' hash, associated with this page
		that.selectedKeys.forEach(function(key) {
			local.selected.store(key, pageInfo.page);
		});

		that.listEnd = function () {
			var startkey
			, endkey;

			if (this.selectedKeys.length > 0) {
				startkey = this.selectedKeys[this.selectedKeys.length-1];
				endkey = this.selectedKeys[this.selectedKeys.length-1].concat({});
			}

			return({
				'reduce': false,
				'startkey': _.map(startkey, function(x) { 
					return x.toString(); }),
				'endkey': _.map(endkey, function(x) { 
					return (_.isObject(x) ? {} : x.toString()); })
			});			
		};
		return that;
	};
	query.handleSelections = handleSelections;

	// What it does: refreshes the display. if query is a 'pivot', it recalculates the result
	// but, only if the application does not say 'displayOnly'
	var refresh = function () {
		this.events.trigger(this.get('onDisplay'), this.result);
		return this;
	};
	query.refresh = refresh;


	global.model = model;
}(boxspring));	
		


(function(global) {
	"use strict";	
	
	var model = function(options) {
		var target = boxspring.googleVis(_.defaults(options, {
			'type': 'table-chart',
			'targetDiv': 'on-display',
			'onSelection': 'onSelection',
			'onPage': 'onPage'
		}));
		
		// this model inherits the query object. 
		_.extend(target, { 'query': options.query });
		
		// events from the data model
		target.query.on('result', function(result) {
			target.render(result);
		});
		
		target.query.on('more-data', function(result) {
			console.log('got more data!');
		});
		
		target.query.on('completed', function(result) {
			console.log('completed data!');			
		});
		
		// events from the display model
		target.query.on('onPage', function(result, direction) {
			result.nextPrev(direction);
		});
		
		target.query.on('onSelection', function(result, data) {
			this.onSelection = data;
		});
		return target;
	};
	global.model = model;

}(this));	

/*

// What it does: maintains a hash of selected keys
var handleSelections = function (result, tableData) {
	var local = result
	, that = {}
	, pageInfo = tableData.data.result.pageInfo();				
	
	that.query = this;
	that.reference = tableData.data;
	that.selectedKeys = tableData.selectedKeys;
	that.rowIndices = tableData.rowIndices;

	// remove any previous selections on this page before starting
	// hash is as follows: hash[id] = page#
	if (local.selected) {
		local.selected.each(function(pageNo, id) {
			if (pageNo === (pageInfo && pageInfo.page)) {
				local.selected.remove(id);
			}
		});
	}
	// install these keys into the 'selected' hash, associated with this page
	that.selectedKeys.forEach(function(key) {
		local.selected.store(key, pageInfo.page);
	});
	
	that.listEnd = function () {
		var startkey
		, endkey;
		
		if (this.selectedKeys.length > 0) {
			startkey = this.selectedKeys[this.selectedKeys.length-1];
			endkey = this.selectedKeys[this.selectedKeys.length-1].concat({});
		}
		
		return({
			'reduce': false,
			'startkey': _.map(startkey, function(x) { 
				return x.toString(); }),
			'endkey': _.map(endkey, function(x) { 
				return (_.isObject(x) ? {} : x.toString()); })
		});			
	};
	return that;
};
query.handleSelections = handleSelections;

// What it does: refreshes the display. if query is a 'pivot', it recalculates the result
// but, only if the application does not say 'displayOnly'
var refresh = function () {
	this.events.trigger(this.get('onDisplay'), this.result);
	return this;
};
query.refresh = refresh;


	
};
query.server = get;


// incremental adds keys for keyed searches
var selectKeys = function (k) {
	var local = this;
				
	if (k && k.length > 0 ) {
		k.forEach(function(key) {
			local.selected.store(key, 1);
		});	
	}
	return(_.reduce(_.map(this.selected.keys(), function (x) { 
		return x.split(','); 
		}), function (x, y) {
				x.push(y);
				return x;
			}, []));
};
query.selectKeys = selectKeys;
*/

