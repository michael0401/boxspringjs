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
	
	var isValidQuery = function (s) {
		var target = {} 
		, validCouchProperties = [
		'reduce', 'limit', 
		'startkey', 'endkey', 
		'group_level', 'group', 
		'key', 'keys',
		'rev' ]
		, formatKey = function(target, key, exclude) {
			if (_.has(target, key) && typeof target[key] !== 'undefined') {
				target[key] = JSON.stringify(target[key]);
				target = _.omit(target, exclude);
			}
			return(target);
		};

		// remove residual application parameters
		target = _.extend(_.pick(_.clean(s), validCouchProperties));

		// couchdb needs properly formatted JSON string
		if (_.has(target, 'key')) {
			target = formatKey(target, 'key', ['keys', 'endkey', 'startkey']);
		} else if (_.has(target,'keys')) {
			target = formatKey(target, 'keys', ['endkey', 'startkey']);					
		} else if (_.has(target, 'startkey')) {
			target = formatKey(target, 'startkey');
			if (_.has(target, 'endkey')) {
				target = formatKey(target, 'endkey');
			}
		}
		try {
			// reduce has to be true or false, not 'true' or 'false'
			if (_.has(target, 'reduce') && typeof target.reduce === 'string') {
				target.reduce = _.coerce('boolean', target.reduce);
				throw 'reduce value must be a boolean, converting string to boolean';
			}

			// Enforces rule: if group_level specified, then reduce must be true
			if (typeof target.group_level === 'number' && 
				typeof target.reduce === 'boolean' && 
				target.reduce === false) {
				target.reduce = true;
				throw 'reduce must be true when specifying group_level';
			}
			// 'limit' and 'group_level' must be integers
			['limit', 'group_level'].forEach(function(key) {
				if (_.has(target, key)) {
					target[key] = _.toInt(target[key]);
					if (!_.isNumber(target[key])) {
						throw key + ' value must be a number';
					}
				}
			});
			// if reduce=true, then include_docs can't be true
			if (typeof target.include_docs !== 'undefined'&& 
				target.include_docs === true && 
				typeof target.reduce !== undefined && 
				target.reduce === true) {
				target = _.omit(target, 'include_docs');
				throw 'unable to apply include_docs parameter for reduced views';
			}					
		} catch (e) {
			throw new Error('[ db isValidQuery] - ' + JSON.stringify(s));
		}				
		return target;
	};
	
	// NB: path elements must have precending '/'. For example '/_session' or '/anotherdb'
	// database names DO NOT have leading '/' 
	// component object: { server: 'server', db: 'db', view: view, startkey: startkey, show: show etc... }
	// Sample pathnames:
	// update url: /<database>/_design/<design>/_update/<function>/<docid>	
	// view url:  /<database>/_deisgn/<design>/_view/<viewname>/
	var path = function (thisDB) {
		var that={}
			, dbname='/' + thisDB;

		var lookup = function (tag, docId, viewOrUpdate, target) {
			var uri_lookup = {
				'heartbeat': [ '','GET' ],
				'login': [ '/_session','POST'],
				'logout': [ '/_session','DELETE'],
				'session': [ '/_session','GET' ],
				'all_dbs': [ '/_all_dbs','GET' ],
				'db_save': [ dbname,'PUT' ],
				'db_remove': [ dbname,'DELETE'],
				'db_info': [ dbname,'GET'],
				'all_docs': [ dbname + '/_all_docs','GET' ],
				'bulk': [ dbname + '/_bulk_docs','POST' ],
				'doc_save': [ dbname + '/' + docId,'PUT'], 
				'doc_update': [ dbname + '/' + docId,'PUT'], 
				'doc_retrieve': [dbname + '/' + docId,'GET'],  
				'doc_info': [ dbname + '/' + docId,'GET'],
				'doc_head': [ dbname + '/' + docId,'HEAD'],  
				'doc_remove': [ dbname + '/' + docId,'DELETE'],  
				'doc_attachment': [dbname + '/' + docId + '/' + viewOrUpdate,'GET'],  
				'view': [ dbname + '/' + docId + '/_view' + '/' + viewOrUpdate,'GET' ],
				'update': [ dbname+'/'+docId+'/_update'+'/'+viewOrUpdate +'/'+ target,'PUT'] 
			};
			return (uri_lookup[tag]);
		};
		that.lookup = lookup;

		var url = function (tag, docId, view, target) {				
			return(lookup(tag, docId, view, target)[0]);
		};
		that.url = url;

		var method = function (tag) {
			return(lookup(tag) && lookup(tag)[1] ? lookup(tag)[1] : 'GET');
		};
		that.method = method;
		
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
	
	var db = function (name) {
		var user
		, options
		, that;
		
		// allow either 'name' or {options} but not both arguments
		if (_.isObject(name)) {
			options = name;
		} else {
			options = {'name': name };
		}
		
		// format the the user 'auth' object; note user is not visible on the interface
		user = _.extend({'name': '', 'password': ''}, (options && options.auth));
		
		// populate the object with default, exclude 'auth' from the interface.
		that = _.extend({}, _.defaults(options, {
			'name': name,
			'id': (options && options.id) || _.uniqueId('db-'),
			'index': (options && options.index) || 'Index',
			'maker': (options && options.maker) || undefined,
			'designName': (options && options.designName) || '_design/default',
			'UTIL': Boxspring.UTIL,
			'Boxspring': Boxspring
		}, this));
		
		// omit the 'auth' object from the interface
		that = _.omit(that, 'auth');
		
		// create the database linkages using the path object;
		that.path = path(that.name);

		var queryHTTP = function (service, options, query, callback) {
			var viewOrUpdate = options.view || options.update || options.attachment || ''
			, target = options.target
			, body = options.body || {}
			, headers = options.headers || {}
			, id = options.id || {};

			if (typeof options === 'function') {
				callback = options;
			}								
			// db.get: url + query, request
			//console.log('path', service, id, viewOrUpdate, target, isValidQuery(query));
			var queryObj = {
				'path': this.path.url(service, id, viewOrUpdate, target) +
					_.formatQuery(isValidQuery(query || {})),
				'method': this.path.method(service),
				'body': body,
				'headers': headers
			};			

			this.HTTP(queryObj, function (err, res) {
				if ((callback && typeof callback) === 'function') {
					callback(err, res);
				}
			});
		};
		that.queryHTTP = queryHTTP;

		var dbQuery = function (name, handler) {
			this.queryHTTP(name, {}, {}, function (err, response) {
				if (handler && typeof handler === 'function') {
					handler(err, response);
				}
			});
			return this;			
		};
		that.dbQuery = dbQuery;
		
		// Purpose: helper to get the 'rev' code from documents. used by doc and bulk requests
		var getRev = function (o) {				
			if (o && o.header && o.header.etag) {
				return o.header.etag.replace(/\"/g, '').replace(/\r/g,'');
			}
		};
		that.getRev = getRev;
		
		// helper function as multiple codes can be Ok
		var responseOk=function (r) { 
				return ((r.code === 200) || (r.code === 201) || (r.code === 304)); 
		};
		that.responseOk = responseOk;
		
		var heartbeat = function (handler) {	
			this.dbQuery('heartbeat', handler);
			return this;
		};
		that.heartbeat = heartbeat;
		
		var session = function (handler) {
			this.dbQuery('session', handler);
			return this;
		};
		that.session = session;

		var all_dbs = function (handler) {
			this.dbQuery('all_dbs', handler);
			return this;
		};
		that.all_dbs = all_dbs;

		var all_docs = function (handler) {
			this.dbQuery('all_docs', handler);
			return this;
		};
		that.all_docs = all_docs;

		var exists = function (response) {
			return (response && response.data && response.data.hasOwnProperty('db_name'));
		};
		that.exists = exists;

		var db_info = function (handler) {
			var local = this;
			
			this.queryHTTP('db_info', function (err, result) {
				exists.call(local, result);
				handler.call(local, err, result);
			});
			return this;
		};
		that.db_info = db_info;

		var save = function (handler) {
			var local = this;

			db_info.call(local, function (err, response) {
				if (err && !exists(response)) {
					local.queryHTTP('db_save', function (err, response) { 
						// save it, then call the handler with the db_info
						if (err) {
							handler(err, response);
						}
						db_info.call(local, handler);
					});					
				} else {
					handler(err, response);
				}
			});
			return this;
		};
		that.save = save;
		
		// What it does: attempts to login the user to this database. 
		var login = function (handler) {
			var local = this;
			
			this.queryHTTP('login', { 
				'body': user, 
				'headers': { 'content-type':'application/x-www-form-urlencoded'}}, {}, 
					function(err, response) {
					if (err) {
						return handler(err, response);
					}
					local.session(handler);
				});
			return this;
		};
		that.login = login;
		
		var logout = function(handler) {
			this.dbQuery('logout', handler);
		};
		that.logout = logout;

		var remove = function (handler) {
			var local = this;

			this.db_info(function (err, response) {
				if (exists(response)) {
					local.queryHTTP('db_remove', { 
						'headers': { 'content-type':'application/x-www-form-urlencoded'}}, {}, handler);
				} else {
					handler(err, response);
				}
			});
			return this;
		};
		that.remove = remove;
		
		var events = function(Obj) {
			return _.extend(Obj || {}, _.clone(Backbone.Events));
		};
		that.events = events;
		
		var getAuth = function () {
			return user;
		};
		that.getAuth = getAuth;
		return that;		
	};

	global.db = function(options) {
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
