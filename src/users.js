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
"use strict";

(function(global) {
	
	var users = function (name) {
		var that = _.extend({}, this)
		, userdb = this.db({'name': '_users', 'auth': this.getAuth() })(this.url);
			
		// used by userSignUp and userDelete
		var authFileUserDocName = function() {
			return 'org.couchdb.user:'+name;
		};

		var get = function (handler) {
			var doc = userdb.doc(authFileUserDocName()).retrieve(function(err, response) {
				handler(err, response, doc);
			});
		};
		that.get = get;
		
		var list = function (handler) {
			var doc = userdb.doc(authFileUserDocName()).retrieve(function(err, response) {
				handler(err, response, doc);
			});
		};
		that.list = list;
				
		var signUp = function(password, roles, handler) {
			var anonymous = this.db('_users')(this.url)
			, newUser = this.db({'name': this.name,
				'auth': {'name': name, 'password': password }})(this.url);
					
			// create a document and add it to the _users database
			anonymous.doc(authFileUserDocName()).source({
				'type': 'user',
				'name': name,
				'password': password,
				'roles': roles
			}).save(function(err, r2) {					
				if (err) {
					// something is wrong, return an error
					return handler(err, r2);
				}
				// log in this new user and provide a new database handle in the callback
				newUser.login(function(err, response) {
					handler(err, response, newUser);
				});
			});				
		};
		that.signUp = signUp;
		
		var remove = function (handler) {
			userdb
				.doc(authFileUserDocName())
				.remove(handler);
		};
		that.remove = remove;
		
		var update = function(newPassword, newRoles, handler) {			
			this.get(function(err, response, doc) {
				if (err) {
					return handler(err, response);
				}
				// update the document.
				doc.source(_.extend({
					'type': 'user',
					'name': name,
					'password': newPassword,
					'roles': newRoles
				}, doc.source())).update(handler);
			});
		};
		that.update = update;
		return that;
	};
	
	global.users = users;
}(Boxspring));
