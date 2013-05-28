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
/*global bx: true, _: true, emit: true, toJSON: true, window: true */

if (typeof bx === 'undefined') {
	bx = {};
}

/*global window: true, alert: true, confirm: true */
(function(Local) {
	"use strict";
	
	Local['log-events'] = function (owner) {		
		var that = owner || {}
			, format = bx.Format();

		if (!that.hasOwnProperty('trigger')) {
			that = bx.Events(that);
		}

		var messages = function (id, code, param) {	
			var errorTable = {
				'progress': '',
				'http-error': '',
				'http-response': '',
				'no-dbId': 'application must supply a dbId',
				'no-user-id': 'no userId for authorize method ',
				'login-succeeded': 'user authentication succeeded ', 
				'login-failed': 'user authentication failed ', 
				'invalid-delimiter': 'invalid delimiter in sourcefile on line ',
				'bad-view-function': 'map object is not a function',
				'missing-view': 'missing map function for view',
				'missing-cols': 'no column declaration with view definition',
				'bad-input-value': 'expected row- or col-',
				'bad-pivot': 'pivot column or row not found in table values',
				'bad-view': 'unable to access view',
				'bad-CSV-file': 'could not read CSV file ', 
				'bad-include': 'could not read include file ',
				'invalid-json': 'check for valid json format',
				'invalid-txt': 'check for valid text file format',
				'invalid-query': '',
				'invalid-url': '',
				'annotation-complete': 'completed bulk annotation of trial documents - ',
				'missing-study': 'no clinical trial XML found for trial - ',
				'design-updated': 'couchDB design document successfully updated - ',
				'design-update-failed': 'couchDB design document update failed - ',
				'view-request-error': '',
				'caught-error': 'caught-error',
				'regress-did-not-complete': '',
				'regress-completed': '',
				'test-completed': '',
				'test-false': '',
				'bulk-programmer-error': 'bulk requires doclist Array object and db object parameters',
				'annotation-completed': '',
				'mesh-updated': 'updated NLM mesh tree file.',
				'trials-banner': 'Clinical Trials Crawler version: ',
				'trials-commit': '',
				'update-committed': '',
				'google-only-supported': '',
				'google-type-error': 'unrecognized type',
				'config-error': 'no label for columnType check',
				'application-error': '',
				'invalid-date': '',
				'pivot-error': '',
				'warning': ''
			};
			return({
				'id': id || 'none-provided', 
				'code': code || 0,
				'description': param + ' ' + (errorTable.hasOwnProperty(id) ? errorTable[id] : '')
			});
		};
		that.messages = messages;
		
		var log = function (s) {			
			that.trigger('console', s);
		};
		that.log = log;
		
		// works like 'C' printf
		var logf = function (f) {
			var arg = _.toArray(arguments);
			if (bx.COUCH) {
				log(format.vsprintf(f, arg.slice(1)));
				return;
			}
			that.trigger('console', format.vsprintf(f, arg.slice(1)));
			return this;
		};
		that.logf = logf;
		
		// 
		var logm = function(id, code, param) {
			var m = messages(id, code, param);
			logf(format.sprintf('%s %s %s', m.id, m.code, m.description));
			return this;
		};
		that.logm = logm;

		// Purpose: Stub function in case we're not running in the browser
		var logAlert = function (id, code, param) {
			var m = messages(id, code, param);
			logm(id, code, param);
			if (bx && bx.BROWSER && bx.BROWSER === true) {
				m = format.sprintf('%s %s %s', m.id, m.code, m.description);
				if (!confirm(m + ' Proceed?')) {
					console.trace();
				}
			}
		};
		that.alert = logAlert;
		
		var event = function (dbname, logname) {
			var log = bx.db.create({ 'name': dbname, 'id': 'log-db' })
				, doc = log.doc(logname).docinfo({ 
					'type': 'log', 
					'date-time': bx.date().docId() 
				})
				, that = bx.Events();				
			
			var commit = function (data) {
				log.design.commit(logname, 'in-place', data, function(response) {
					if (response.ok()) {
						that.trigger('log-updated', response);											
					} else {
						logm('http-error', response.code, response.reason());
					}
				});
				return this;
			};
			that.commit = commit;

			doc.save(function(response) {
				if (response.ok()) {
					that.trigger('ready', response);					
				} else {
					console.log(response.request);
					console.trace();
					throw 'could not create log file - ' + logname + '. Aborting...';					
				}
			});
			return that;
		};
		that.event = event;

		var memprof = function () {
			if (bx.BROWSER === false) {
				return(process.memoryUsage().rss/1024000);				
			}
			return(0);
		};
		that.memprof = memprof;
		return that;
	};

}(bx));
