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
/*global _: true */

(function(global) {
	"use strict";
	
	var display = function(options) {
		var target
		, supportedEvents = ['result', 'more-data', 'completed', 'onPage', 'onSelection'];
		
		// this model requires a query object 
		target = _.extend({}, { 'query': options.query });
		
		if (!target.query.on || !target.query.trigger) {
			throw new Error('[ display ] You must supply a query object with events.');
		}
		

/*		
		var TabularDisplay = Backbone.Model.extend({
			initialize: function () {
				var table = global.googleVis({})
			}
			onDisplay: function() {
				
				, page = ;
			this.set()   
			var cssColor = prompt("Please enter a CSS color:");
			    this.set({color: cssColor});
			}
		});

			window.sidebar = new Sidebar;

			sidebar.on('change:color', function(model, color) {
			  $('#sidebar').css({background: color});
			});

			sidebar.set({color: 'white'});

			sidebar.promptColor();
		}
		
*/		
		return target;
	};
	global.display = display;

}(boxspring));	

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

