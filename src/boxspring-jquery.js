/* ===================================================
 * boxspring-jquery.js v0.01
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

(function () {
	"use strict";
	
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
				// What it does: clones a fragment of html with an id, appends it to the 
				// DOM 'hidden' and returns it
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
}());

