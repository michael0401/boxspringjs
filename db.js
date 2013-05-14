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
/*global bx: true */

(function(global) {
	"use strict";
	var db = global.db = {};
	
	var isValidQuery = function (s) {
		var validCouchProperties = [
		'reduce', 'limit', 
		'startkey', 'endkey', 
		'group_level', 'group', 
		'key', 'keys',
		'rev' ];
		
		// remove 'page_size'; this is an application parameter, not a couch parameter
		var target = _.pick(_.clean(s), validCouchProperties)
		, formatKey = function(target, key, exclude) {
			if (_.has(target, key) && typeof target[key] !== 'undefined') {
				target[key] = JSON.stringify(target[key]);
				target = _.omit(target, exclude);
			}
			return(target);
		};
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
				'login': [ '/_session','POST'],
				'session': [ '/_session','GET' ],
				'all_dbs': [ '/_all_dbs','GET' ],
				'heartbeat': [ '','GET' ],
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
		return that;
	};
			
	db.construct = function (config) {
		var user = {};
			
		_.extend(this, _.defaults(config || {}, {
			'name': config && config.name,
			'id': _.uniqueId('db-'),
			'index': 'Index',
			'designName': '_design/default'
		}));

		// create the database;
		this.path = path(this.name);		
		this.db_exists = false;
		this.HTTP = boxspring.fileUtils.HTTP(boxspring.auth.authorize.server, {}).get;
							
		// make it visible privately to this object
		var authorize = function (auth, callback) {
			var local = this
			, userId=(auth && auth.authorize && auth.authorize.credentials) || { 
				'name': '', 'password': '' 
			};

			user.name = userId.name;
			user.password = userId.password;
			user.data = { name: userId.name, password: userId.password };			
			this.HTTP = boxspring.fileUtils.HTTP(auth.authorize.server, user).get;
			this.HTTP({ 
				'path':'/_session', 
				'method': 'POST', 
				'body': user.data, 
				'headers': { 'Content-Type':'application/x-www-form-urlencoded'}
				}, function (result) {
					if (result.code !== 200) {
						throw new Error('[ db ] login-failed - ' + result.reason() + ', ' + result.path);
					} else {
						if (_.isFunction(callback)) {
							callback.call(this, result);
						}
					}
				});
			return this;
		}
		this.authorize = authorize;
	};
		
	var queryHTTP = function (service, options, query, callback) {
		var viewOrUpdate = options.view || options.update || ''
		, target = options.target
		, body = options.body || {}
		, headers = options.headers || {}
		, id = options.id || {};

		if (typeof options === 'function') {
			callback = options;
		}								
		// db.get: url + query, request
	//	console.log('path', this.path, this);
		var queryObj = {
			'path': this.path.url(service, id, viewOrUpdate, target) +
			 	_.formatQuery(isValidQuery(query || {})),
			'method': this.path.method(service),
			'body': body,
			'headers': headers
		};
		//console.log('doHTTP');
		this.HTTP(queryObj, function (res) {
			//console.log('didHTTP');
			if ((callback && typeof callback) === 'function') {
				callback(res);
			}
		});
	};
	db.queryHTTP = queryHTTP;

	var dbQuery = function (name, handler) {
		this.queryHTTP(name, {}, {}, function (result) {
			if (handler && typeof handler === 'function') {
				handler(result);					
			}
		});
		return this;			
	};
	db.dbQuery = dbQuery;

	var heartbeat = function (handler) {	
		this.dbQuery('heartbeat', handler);
		return this;
	};
	db.heartbeat = heartbeat;

	var session = function (handler) {
		this.dbQuery('session', handler);
		return this;
	};
	db.session = session;

	var all_dbs = function (handler) {
		this.dbQuery('all_dbs', handler);
		return this;
	};
	db.all_dbs = all_dbs;

	var all_docs = function (handler) {
		this.dbQuery('all_docs', handler);
		return this;
	};
	db.all_docs = all_docs;

	var exists = function (response) {
		if (response && response.data && response.data.hasOwnProperty('db_name')) {
			this.db_exists = true;
		}
		return this.db_exists;
	};
	db.exists = exists;

	var db_info = function (handler) {
		this.queryHTTP('db_info', function (result) {
			exists.call(db, result);
			handler.call(db, result);
		});
		return this;
	};
	db.db_info = db_info;

	var save = function (handler) {
		var local = this;
					
		db_info(function (response) {					
			if (!exists(response)) {
				local.queryHTTP('db_save', function () { // save it, then call the handler with the db_info
					db_info(handler);
				});					
			} else {
				handler(response);
			}
		});
		return this;
	};
	db.save = save;

	var remove = function (handler) {
		var local = this;
		
		db_info(function (response) {									
			if ((response.code === 200 || response.code === 201 || response.code === 304)) {
				local.queryHTTP('db_remove', function () {
					db_info(handler);
				});					
			} else {
				handler(response);
			}
		});
		return this;
	};
	db.remove = remove;
	
})(boxspring);
