/* ===================================================
 * db.js v0.01
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
/*global _: true, Boxspring: true, Backbone: true */

if (typeof Boxspring === 'undefined') {
	var Boxspring = function () { "use strict"; };	
}

(function(global) {
	"use strict";
	
	var db = function (options) {
		var user
		, that = {};
		
		// allow either 'name' or {options} but not both arguments
		if (_.isString(options)) {
			options = { 'name': options };
		}
		
		// format the the user 'auth' object; note user is not visible on the interface
		user = _.extend({'name': '', 'password': ''}, (options && options.auth));
		
		// populate the object with default, exclude 'auth' from the interface.
		that = _.extend(that, _.defaults(options, {
			'name': options.name,
			'id': (options && options.id) || _.uniqueId('db-'),
			'index': (options && options.index) || 'Index',
			'maker': (options && options.maker) || undefined,
			'designName': (options && options.designName) || '_design/default',
			'UTIL': Boxspring.UTIL,
			'Boxspring': Boxspring
		}, this));
		
		// omit the 'auth' object from the interface
		that = _.omit(that, 'auth');

		/*
		var lookup = function (tag, docId, viewOrUpdate, target) {
			var uri_lookup = {
				'heartbeat': [ '','GET' ],
				'login': [ '/_session','POST'],
				'logout': [ '/_session','DELETE'],
				'session': [ '/_session','GET' ],
				'all_dbs': [ '/_all_dbs','GET' ],

				'db_save': [ '/' + dbname,'PUT' ],
				'doc_save': [ '/' + dbname + '/' + docId,'PUT'], 
				'db_remove': [ '/' + dbname,'DELETE'],
				'db_info': [ '/' + dbname,'GET'],
				'all_docs': [ '/' + dbname + '/_all_docs','GET' ],
				'bulk': [ '/' + dbname + '/_bulk_docs','POST' ],
				'doc_retrieve': ['/' + dbname + '/' + docId,'GET'],  
				'doc_info': [ '/' + dbname + '/' + docId,'GET'],
				'doc_head': [ '/' + dbname + '/' + docId,'HEAD'],  
				'doc_remove': [ '/' + dbname + '/' + docId,'DELETE'],  
				'doc_attachment': [ '/' + dbname + '/' + docId + '/' + viewOrUpdate,'GET'],  
				'view': [ '/' + dbname + '/' + docId + '/_view' + '/' + viewOrUpdate,'GET' ],
				'update': [ '/' + dbname+'/'+docId+'/_update'+'/'+viewOrUpdate +'/'+ target,'PUT'] 
			};	
		*/
		var queryHTTP = function (options, callback) {
			this.HTTP({
				'path': ((options && options.url) || '') + _.formatQuery((options && options.query) || {}),
				'method': ((options && options.method) || 'GET'),
				'body': ((options && options.body) || {}),
				'headers': ((options && options.headers) || {})
			}, function (err, res) {
				if ((callback && typeof callback) === 'function') {
					callback(err, res);
				}
			});
		};
		that.queryHTTP = queryHTTP;
		
		var heartbeat = function (handler) {	
			this.queryHTTP({ 'url': '' }, handler);
			return this;
		};
		that.heartbeat = heartbeat;
		
		var session = function (handler) {
			this.queryHTTP({'url': '/_session'}, handler);
			return this;
		};
		that.session = session;

		var all_dbs = function (handler) {
			this.queryHTTP({'url': '/_all_dbs'}, handler);
			return this;
		};
		that.all_dbs = all_dbs;
		
		// What it does: attempts to login the user to this database. 
		var login = function (handler) {
			var local = this;
			this.queryHTTP({
				'url': '/_session',
				'method': 'POST',
				'headers': {'content-type': 'application/x-www-form-urlencoded'},
				'body': user }, function(err, response) {
					if (err) {
						return handler(err, response);
					}
					local.session(handler);					
				});
		};
		that.login = login;
		
		var logout = function(handler) {
			this.queryHTTP({
				'url': '/_session',
				'method': 'DELETE'
			}, handler);
			return this;
		};
		that.logout = logout;
		
		var all_docs = function (handler) {
			this.doc('_all_docs').read(handler);
			return this;
		};
		that.all_docs = all_docs;

		var db_info = function (handler) {
			this.doc().read(handler);
			return this;
		};
		that.db_info = db_info;
		
		var events = function(Obj) {
			return _.extend(Obj || {}, _.clone(Backbone.Events));
		};
		that.events = events;
		
		var getAuth = function () {
			return user;
		};
		that.getAuth = getAuth;
		
		var clone = function () {
			var object = _.clone(this);

			if (object.hasOwnProperty('id')) {
				if (object.id.split('-').length > 1) {
					object.id = _.uniqueId(object.id.split('-')[0]+'-clone');
				} else {
					object.id = _.uniqueId(object.id+'-clone');					
				}
			}
			return object;
		};
		that.clone = clone;
		return that;		
	};

	global.createdb = function(options) {
		var object = db.call(this, options);
		
		return function (url) {
			// all subsequent HTTP calls will use the supplied credentials.
			object.url = url || '127.0.0.1';
			object.HTTP = object.UTIL.fileio
				.server('server', _.urlParse(object.url), object.getAuth()).get;
			return _.extend({}, object);
		};
	};
}(Boxspring));
