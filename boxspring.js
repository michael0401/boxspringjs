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
/*global bx: true, _: true, emit: true, toJSON: true */

(function(Local) {
	"use strict";
	
	Local.httpRequestStart = 'httpStart';
	Local.httpRequestEnd = 'httpEnd';
	Local.onDisplayStart = 'ondisplaystart';
	Local.onDisplayEnd = 'ondisplayend';
	Local.computeStart = 'computestart';
	Local.computeEnd = 'computeend';
	
	Local['system-utils'] = function () {
		var System = {}
			, Db = bx.boxspring();
		
		// add the base utilities to _
		_.mixin(bx['base-utils']());

		// imbue the system with events, logging
		bx.Events(bx);
		bx['log-events'](bx);
				
		// initialize the db pointer with the Db maker
		bx.db = bx.Extend(bx.Db);
		bx.Id = bx.db.Id;
		
		// install the 'system' database
		bx.db.create({'name': 'systemdb', 'id': 'system' });
		
		// initialize the logging utilities		
		bx.on('console', function(m) {
				console.log(m);
		});

		// asynchronous load the javascript libraries; so we don't have to deal with this later;
		(function () {
			var fileIo = bx.boxspring().file()
				,includes = [
					{ 'name': 'underscore', 'path': bx.Paths[0]+'/underscore.js', 'src': '' },
					{ 'name': 'base-utils', 'path': bx.Paths[1]+'/base-utils.js', 'src': '' }
				]
				,count = _.toArray(includes).length;

			_.each(includes, function(item) {
				fileIo.get(item.path, function (response) {
					if (response.code !== 200) {
						bx.logf('%s: %s\t%s', 'bad-include', response.code,  item.location);										
					}
					_.each(includes, function (lib) {
						if (response.request.path.indexOf(lib.path) !== -1) {
							lib.src = response.data;
							count -= 1;
						}
					});
					if (count === 0) {
						bx.libs = {};
						_.each(includes, function(lib) {
							bx.libs[lib.name] = lib.src; 
						});
						bx.trigger('ready');
					}
				});			
			});
		}());
		
		
		
		// initialize the SYS variable with 'services'
		var start = function (url) {
			var module = url.pathname.split('/')[1]
				, method = url.pathname.split('/')[2]
				, query = _.parseQuery(url.query || '');

			// trigger the 'start' web service for this 'module'
			if (module && method) {
				bx.logf('Application - module: %s method: %s query: %s', module, method, JSON.stringify(query));
				bx.trigger(System[module][module][method].href, query);				
			} else {
				console.trace();
				throw 'fatal: missing service query - ' + module + ', ' + query;
			}
		};
		bx.start = start;
		
		var init = function(module) {
			// get the Web Services
			System[module] = bx[module](bx).init();
		};
		bx.init = init;
		
		var initall = function(modules) {
			modules.forEach(function(module) {
				init(module);
			});
		};
		bx.initall = initall;
		return System;
	};
	return Local;
}(bx));


(function (Local) {
	"use strict";
	
	// What it does: Templated data structure for a CouchDB design document
	Local.defaultDesign = function (owner) {
		var that = owner || {}
		, toJSON = function(o) {
			return(JSON.stringify(o));
		};
		
		if (typeof exports === 'undefined') {
			var exports = {};
		}

		var template = function () {
			return({
				'language': 'javascript',
				'updates': {
					// want to force all my documents to have a created_at, size, last_updated;
					// able to pass in additional key-values to the in-place method
					// applications should use this method to enforce their 'type'-ing
					"in-place" : function (doc, req) {
						var i;

						if (req && req.query) {
							for (i in req.query) {
								if (req.query.hasOwnProperty(i)) {
									doc[i] = req.query[i];										
								}
							}		
						}
						doc['last-updated'] = Date();
						doc['in-place-succeeded'] = true;
						doc.size = JSON.stringify(doc).length;
						return [doc, toJSON(doc) ];
					}				
				},
				'views': {
					'lib': {
						'base-utils': exports.fn = function() { _.mixin(bx['base-utils']()); },
						'underscore': exports.val = ";",
						'view-info': exports.fn = function() {
							return({
								'Index': {
									'keys': ['year', 'month', 'day', 'time', 'type', '_id', 'size'],
									'columns': [ 'total', 'count', 'average']
								}
							});
						}
					},
					'Index': {
						'map': function (doc) {
							var dV
							, newDv;
							require('views/lib/base-utils').fn();
							
							if (doc && doc._id) {
								dV = doc.last_updated.split(' ');
								newDv = new Date(dV[3], dV[2], dV[1]);
								
								emit(bx.date({ 'dateIn': newDv }).key(true)
									.concat([(doc && doc.type) || 'mark-for-delete'])
									.concat([ doc._id ]), JSON.stringify(doc).length);
							}
						},
						'reduce': function (keys, values, rereduce) {
							var item = 0
								,reTotal = 0
								,reCount = 0
								,avg = function (tot, ct) { 
									return( ((Math.floor(tot/ct) * 1000)/1000) ); 
								};

							if (rereduce === false) {
								values.forEach(function (val) {
									item +=  val;
								});
								return ({ 'total': item, 'count': values.length, 'average': avg(item, values.length) });
							}
							values.forEach (function (val) {
								reTotal +=  val.total;
								reCount +=  val.count;
							});
							return ({ 'total': reTotal, 'count': reCount, 'average': avg(reTotal, reCount) });
						}
					}				
				},
				'shows': {},
				'lists': {}
			});
		};
		that.template = template;
		return that;
	};	

	Local.boxspring = function (owner) {
		var boxspring = owner || bx
			, fileio = bx['file-io']();
						
		var DATABASE = function (dbName) {
			var db = bx.Events()
				, db_exists = false;

			// give it its own name; 
			db.dbName = dbName || ''; 

			// function requires dbName
			if (typeof dbName !== 'string') {
				dbName = '';
			}
			
			// What it does: convert a URL into a valid docId
			var url2Id = function (host, reverse) {

				if (reverse && typeof host === 'string') {
					return(host.replace(/-/g, '.'));
				}
				if (host.indexOf('http://') === -1) {				
					return(_.urlParse('http://' + host).host.replace(/\./g, '-'));
				}
				return(_.urlParse(host).host.replace(/\./g, '-'));
			};
			db.url2Id = url2Id;

			var isValidQuery = function (s) {
				// remove 'page_size'; this is an application parameter, not a couch parameter
				var target = _.exclude(_.clean(s), 'page_size')
				, formatKey = function(target, key, exclude) {
					if (_.has(target, key) && typeof target[key] !== 'undefined') {
						target[key] = JSON.stringify(target[key]);
						target = _.exclude(target, exclude);
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
						target = _.exclude(target, 'include_docs');
						throw 'unable to apply include_docs parameter for reduced views';
					}					
				} catch (e) {
					bx.alert('programmer-error', 500, e);
				}
				return target;
			};
			db.isValidQuery = isValidQuery;

		// update url: /<database>/_design/<design>/_update/<function>/<docid>	
		// view url:  /<database>/_deisgn/<design>/_view/<viewname>/

			// NB: path elements must have precending '/'. For example '/_session' or '/anotherdb'
			// DATABASE names DO NOT have leading '/' 
			// component object: { server: 'server', db: 'db', view: view, startkey: startkey, show: show etc... }
			var path = (function (thisDB) {
				var that={}
					, dbname='/' + (thisDB || dbName);

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
			}(dbName));
			db.path = path;
			
			var query = function (service, options, query, callback) {
				var viewOrUpdate=options.view || options.update || ''
					, target=options.target
					, body=options.body || {}
					, headers=options.headers || {}
					, id=options.id || {};


				if (typeof options === 'function') {
					callback = options;
				}								
				// db.get: url + query, request
				var queryObj = {
					'path': 
						db.path.url(service, id, viewOrUpdate, target) +
						_.formatQuery(isValidQuery(query)),
					'method': db.path.method(service),
					'body': body,
					'headers': headers
				};
				
				db.ajax(queryObj, function (res) {
					if ((callback && typeof callback) === 'function') {
						callback(res);
					}
				});
			};
			db.query = query;

			var authorize = function (auth) {
				var userId=(auth && auth.credentials) || { 'name': '', 'password': '' }
					, user={};

				if (userId) {
					user.name = userId.name;
					user.password = userId.password;
					user.data = { name: userId.name, password: userId.password };			
					this.ajax = fileio.Ajax(auth.server, user).get;			

					// make it visible privately to this object
					this.user = user;
					this.ajax({ 'path':'/_session', 
								'method': 'POST', 
								'body': user.data, 
								'headers': { 'Content-Type':'application/x-www-form-urlencoded'}}, 
						function (result) {
							if (result.code !== 200) {
								boxspring.logm('login-failed', result.reason(), result.path);
								if (result.code === 'ECONNRESET') {
									console.log('ECONNRESET', result.path);
								}
							}
					});			
				} else {
					boxspring.log('no-user-id', 400, dbName);
				}
				return this;
			};
			db.authorize = authorize;

			var dbQuery = function (name, handler) {
				query(name, {}, {}, function (result) {
					if (handler && typeof handler === 'function') {
						handler(result);					
					}
				});
				return this;			
			};
			db.dbQuery = dbQuery;

			var heartbeat = function (handler) {	
				dbQuery('heartbeat', handler);
				return this;
			};
			db.heartbeat = heartbeat;

			var session = function (handler) {
				dbQuery('session', handler);
				return this;
			};
			db.session = session;

			var all_dbs = function (handler) {
				dbQuery('all_dbs', handler);
				return this;
			};
			db.all_dbs = all_dbs;

			var all_docs = function (handler) {
				dbQuery('all_docs', handler);
				return this;
			};
			db.all_docs = all_docs;

			var exists = function (response) {
				if (response && response.data && response.data.hasOwnProperty('db_name')) {
					db_exists = true;
				}
				return db_exists;
			};
			db.exists = exists;

			var db_info = function (handler) {
				query('db_info', function (result) {
					exists(result);
					handler(result);
				});
				return this;
			};
			db.db_info = db_info;

			var save = function (handler) {			
				db_info(function (response) {					
					if (!exists(response)) {
						query('db_save', function () { // save it, then call the handler with the db_info
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
				db_info(function (response) {									
					if ((response.code === 200 || response.code === 201 || response.code === 304)) {
						query('db_remove', function () {
							db_info(handler);
						});					
					} else {
						handler(response);
					}
				});
				return this;
			};
			db.remove = remove;
			return db;
		};

		// Purpose: routines for bulk saving and removing
		var BULK = function (doclist, db, updates) {
			var Docs = { 'docs': doclist }
				, Max
				, fC = { 'X-Couch-Full-Commit': false }
				, query={ 'batch': 'ok' }
				, that = db;

			if (!_.isArray(doclist)) {
				boxspring.log('bulk-programmer-error', 500);
			}

			var fullCommit = function () {
				fC['X-Couch-Full-Commit'] = true;
				query = {};
			};
			that.fullCommit = fullCommit;

			var exec = function (DocsObj, callback) {
				var conflicts = function (response) { // some posts may fail, captures Ok and NotOk posts
						response.conflicts = false;
						(response && response.data).forEach(function(doc) {
							if (doc.error === 'conflict') {
								response.conflicts = true;
							}
						});
					return(response);
				};
				that.query('bulk', { 
					'body': DocsObj,
					'headers': fC }, query, function (response) {
					if (callback && typeof callback === 'function') { 
						callback(conflicts(response)); 
					} 
				});				
			};
			that.exec = exec;

			// this function works for Save and Remove operations. 
			// does no checking for update conflicts. saving or removing docs without their _rev will fail
			var throttle = function (handler) {
				var doclist=_.clone(Docs.docs)
					, Queue= bx.Queue();

				// Create a Queue to hold the slices of our list of docs
				var doclistSlice = function (data) {
					exec({ docs: data }, function (response) {
						handler(response);							
						Queue.finish();
					});						
				};
				// submit to the queue until there are no more
				if (Max && (doclist.length > Max)) {		
					while (doclist.length > Max) {
						Queue.submit(doclistSlice, doclist.slice(0,Max));
						doclist = doclist.slice(Max);
					}
				}

				// Submit a final job of remaining docs
				Queue.submit(doclistSlice, doclist);
				Queue.run();
			};

			var save = function (handler) {

				// updates is the design document with 
				// update functions to run before posting
				if (updates) {
					var funcs = updates().updates;
					_.each(Docs.docs, function (doc) { 
						_.each(funcs, function (update_method) {
							update_method(doc);
						});
					});				
				}
				throttle(handler);
				return this;
			};
			that.save = save;

			var remove = function (handler) {
				var thisdb = this
					, doclist={ docs: [] }
					, buffer=[]
					, eachDoc = function (headinfo) {
						if (headinfo.data !== 'error') {

							var path = _.fetch(headinfo, [ 'path', 'url', 'request']);
							buffer = path.split('/');
							doclist.docs.push({ _id: buffer[buffer.length-1], _rev: headinfo.rev });
							if (doclist.docs.length === Docs.docs.length) {
								// do this when all the _revs have been found
								Docs.docs = doclist.docs;
								Docs.docs.forEach(function(nextDoc) {
									nextDoc._deleted = true;
								});
								exec(Docs, function (response) {								
									handler(response);
								});								
							}							
						}
					};

				// use the HEAD method to quickly get the _revs for each document
				Docs.docs.forEach(function(nextDoc) {
					thisdb.doc(nextDoc._id).head(function(headinfo) {
						eachDoc(headinfo);
					});
				});
			};
			that.remove = remove;

			var max = function (max) {
				Max=_.toInt(max);
				return this;
			};
			that.max = max;

			var push = function (item, handler) {
				if (item) {
					Docs.docs.push(item);
					if (handler && _.isFunction(handler) && Docs.docs.length===Max) {
						save.call(this, handler);
						Docs.docs = [];
					}
				}
				return Docs.docs.length;
			};
			that.push = push;
			return that;
		};

		// Purpose: Constructor for DOCUMENTs
		// Note: Imbue this object with all of the properties of the DATABASE object that owns it
		var DOCUMENT = function (spec) {
			var doc=spec || DATABASE('')
				, updated_docinfo = {}
				, changed=true
				, responseOk=function (r) { return ((r.code === 200) || (r.code === 201) || (r.code === 304)); };

			// Purpose: internal function to make sure docinfo is upto date after retrive/head calls
			var sync = function (response) {
				// if a doc, then update all fields
				if (response && response.data && responseOk(response)) {
					updated_docinfo = _.extend(updated_docinfo, response.data);
				}

				return(response);			
			};

			// Purpose: helper function used by most methods
			var docId = function () {
				return({ 'id': updated_docinfo._id });
			};
			doc.docId = docId;

			var docRev = function () {
				return(updated_docinfo._rev ? { 'rev': updated_docinfo._rev } : {});
			};
			doc.docRev = docRev;

			var docHdr = function (name, value) {
				var hdr = {};
				return((name && value) ? { 'headers': hdr[name] = value } : {});
			};
			doc.docHdr = docHdr;

			// Purpose: Method for saving to the database
			// Arguments: { docinfo: document object, oncompletion: string or function }
			var save = function (handler) {
				doc.query('doc_save', _.extend(docId(), docHdr('X-Couch-Full-Commit', true), {
					'body': updated_docinfo }), {}, function (response) {
					sync(response);
					if (handler && typeof handler === 'function') {
						handler(response);						
					}
				});
				return this;
			};
			doc.save = save;

			var retrieve = function (handler) {
				doc.query('doc_retrieve', docId(), {}, function (response) {
					sync(response);
					if (handler && typeof handler === 'function') {
						handler(response);						
					}
				});
				return this;
			};
			doc.retrieve = retrieve;

			var head = function (handler) {
				doc.query('doc_head', _.extend(docId(), docHdr('X-Couch-Full-Commit', true)), {}, function (response) {
					//console.log('head:', responseOk(response), response.header);
					if (responseOk(response)) {
						_.extend(updated_docinfo, { '_rev': response.rev });
					}
					if (handler && typeof handler === 'function') {
						handler(response);						
					}
				});
				return this;
			};
			doc.head = head;

			// if data is provided, add it to the current document over-writing 
			// existing key-values; otherwise just save the current state of the doc in memory
			var update = function (data, handler) {
				var local = this;

				if (!_.isFunction(data)) {
					// if we have data to add, get it from server, add it to docinfo() and update it.
					retrieve.call(local, function() {
						local.docinfo(data);
						save.call(local, handler);
					});
				} else {
					// head main job is to get the _rev; we're updating with the content from .docinfo()			
					head.call(local, function () {
						save.call(local, data);
					});					
				}
				return this;
			};
			doc.update = update;

			var remove = function (handler) {
				head.call(this, function () {				
					doc.query('doc_remove', docId(), docRev(), function (rmRes) {
						handler(rmRes);
					});				
				});
				return this;
			};
			doc.remove = remove;

			var info = function (handler) {
				retrieve(handler, { 'revs_info': true });
				return this;
			};
			doc.info = info;

			var exists = function () {
				return (_.has(updated_docinfo, '_rev'));
			};
			doc.exists = exists;

			// Purpose: Constructor takes a document object as input, or returns an existing document object.
			var docinfo = function (docinfo) {
				if (docinfo) {
					_.extend(updated_docinfo, docinfo);
					changed = true;
					return this;
				}
				return(updated_docinfo);
			};
			doc.docinfo = docinfo;
			return doc;

		};

		// Purpose: Constructor for emulating CouchDB view/emit functions on the "client", 
		// When running in node.js, calling functions need to find 'emit' in its scope 
		// On server side, will use couchdb's built-in emit()
		var emitter = function(viewfunc) {
			var tree = bx.Btree()
				, map = (viewfunc && viewfunc.map)
				, reduce = (viewfunc && viewfunc.reduce);

			var emit = function (key, value) {
				tree.store(JSON.stringify(key), value);
			};
			tree.emit = emit;
			tree.map = map;
			tree.reduce = reduce;
			return tree;
		};

		// What this does: Serializes its map/reduce functions; extends the _design/ document 
		// A VIEW is a property of a DESIGN document.
		// addView method extends the 'views' object with the supplied map/reduce functions;
		/*jslint unparam: true */	
		var DESIGN = function (doc, custom) {
			var emit
			, libSrc = ''
			, views
			, fullCommit = false
			, ddoc = _.extend(_.clone(doc), {
				'ddoc': {
					'language': 'javascript',
					'updates': {},
					'views': {}
				}
			});

			// What it does: returns the maker function for this design, either provided by the 
			// application or defaulted from bx.
			var maker = function () {
				return(custom || Local.defaultDesign().template);
			};
			ddoc.maker = maker;
			ddoc.views = maker()().views;
			views = maker()().views;
			
			// What it does: provides the first map view as the default
			var designInfo = function () {
				return({
					'get': function (k) { return (this && this[k]); },
					'default-index': (views && views.lib && views.lib['default-index']) || 'Index',
					'dateFilter': (views && views.lib && views.lib.dateFilter),
					'views': views,
					'lib': (views && views.lib),
					'doc': (views && views.lib && views.lib.doc) || bx.doc,
					'view-info': (views && views.lib && views.lib['view-info']) || function(v) { 
						return({ 'Index': {'keys': [], 'columns': [] }}); },
					'types': (views && views.lib && views.lib.types) || function (t) { return (t); }
				});
			};
			ddoc.designInfo = designInfo;
			
			/* Note: DESIGN update() method will over-write the DOCUMENT update() methods
			*  so assign it to ddocUdpate and use it to actully update the design document. 
			*/
			doc.ddocUpdate = doc.update;
			var post = function (handler) {
				doc.docinfo(ddoc.docinfo()).ddocUpdate(function (res) {
					handler(res);
				});	
				return this;
			};
			ddoc.update = post;
			
			var emulate = function (name) {
				var e = emitter((this.maker())().views[name]);
				emit = e.emit;
				return(e);
			};
			ddoc.emulate = emulate;

			// this update takes advantage of CouchDB 'updates' handlers. The design document function 
			// specified in 'updateName' will execute on the server, saving the round-trip to the client a
			// enforcing consistent attributing of the documents on the server for a corpus.
			
			var full = function (fc) {
				fullCommit = fc;
				return this;
			};
			ddoc.full = full;
			
			var commit = function (targetId, updateName, newProperties, handler) {
				var properties = _.extend({}, { 'batch': 'ok' }, newProperties);
				doc.query('update', _.extend(this.docId(), {
					'update': updateName, 
					'target': targetId,
					'headers': { 'X-Couch-Full-Commit': fullCommit }}), properties, handler);
				return this;			
			};
			ddoc.commit = commit;

			// let the libs property tell us which libs to pre-pend to the map function
			libSrc = 'var bx = { "COUCH": true };\n';
			if (views && views.hasOwnProperty('lib')) {
				_.each(views.lib, function(lib, name) {
					if (!bx.hasOwnProperty('libs')) {
						bx.log('warning', 500, 'libraries not loaded');
					} else if (bx.libs.hasOwnProperty(name)) {
						libSrc += bx.libs[name] + '\n';						
					}
				});
			}

			// add the application views and the template views from the default design template object	
			_.each((maker())().views, function (views, name) { 
				var mapFunc = views.map
					, reduceFunc = views && views.reduce;
						
				if (name === 'lib') {
					ddoc.ddoc.views.lib = {};
					_.each(views, function (value, key) {
						var fn = bx.Format().Serialize(value)
							, prePend = fn.indexOf('function') !== -1 ? 'exports.fn = ' : 'exports.val = ';
						ddoc.ddoc.views.lib[key] = {};
						ddoc.ddoc.views.lib[key] = prePend + bx.Format().Serialize(value); 
					});
				} else {
					if (!mapFunc) {
						bx.alert('missing-view', 500, name);
						return ;
					}
					ddoc.ddoc.views[name] = {};
					_.extend(ddoc.ddoc.views[name], {
						'map': libSrc + bx.Format().Serialize(mapFunc), 
						'reduce': (reduceFunc && bx.Format().Serialize(reduceFunc)) || '_count' 
					});					
				}
			});
			
			_.each((maker())().updates, function (updates, name) { 
				ddoc.ddoc.updates[name] = {};
				ddoc.ddoc.updates[name] = bx.Format().Serialize(updates);
			});
			
			doc.docinfo(ddoc.ddoc);
			return ddoc;
		};
		
		/*
		// What it does: Master lookup routine. If no 'id' provided, gets the ID of this object
		var id = function(id) {	
			return (this.lookup(id || ID));
		};
		that.id = id;
		
		*/
		
		var DB = function (c) {			
			var config = _.isString(c) ? { 'name': c, 'id': c } : c
				, NAME = (config && config.name) || _.uniqueId('dbname')
				, ID = (config && config.id) || NAME
				, auth = bx.auth()
				, defaults = _.defaults(config || {}, {
					'name': NAME,
					'id': ID,
					'designName': 'default',
					'index' : 'Index',
					'server': 'couch',
					'platform': 'couch',
					'vis': 'google' })
				, that = _.extend(defaults, DATABASE(NAME).authorize(auth))
				;
			
			// What it does: creates a new document object, inheriting methods from its
			// database owner.
			var doc = function (docId) {
				return DOCUMENT(DATABASE(NAME).authorize(auth)).docinfo({ '_id': docId });
			};
			that.doc = doc;
				
			// What it does: Returns a design document for the named design
			var design = function (d, maker) {				
				return(DESIGN(doc('_design/'+d), maker));
			};
			// design dependent properties: design, maker, and default Index
			that.design = design(defaults.designName, defaults.maker);		
			that.maker = design(defaults.designName, defaults.maker).maker(); 
			that.info = design(defaults.designName, defaults.maker).designInfo();

			var view = function (index, callback) {
				var name = index || this.index
					, views = this.maker() && this.maker().views
					, qry = {}
					, system = { 'asynch': false, 'page_size': 0, 'cache_size': undefined }
					, req = bx.Events()
					, db = this
					// wrap the design document with an 'emit'-er
					, emitter_view = db.design.emulate(name);

				// check to see if this view says include_docs
				if (views[name] && views[name].include_docs && views[name].include_docs === true) {
					qry = _.extend(qry, { 'include_docs': true });
				}
				
				var fetch = function (events, query, server) {
					var cache = {}
					, tRows = 0;

					var nextQuery = function(query, startkey) {
						// only called with a startkey by 'chunk' on subsequent invokations
						// thus, will only happen when 'asynch===true'
						if (startkey) {
							return(_.extend(query, {
								'startkey_docid': startkey.id, 
								'startkey': startkey.key }));
						}
						return query;
					};

					var nextLimit = function(query, size) {					
						if (system.asynch && _.isNumber(size) && size > 0) {
							return(_.extend(query, { 'limit': system.page_size+1 }));
						}
						return query;
					};

					var chunk = function (e, qry, startkey) {
						var queryMethod = (name === 'all_docs') ? 'all_docs' : 'view'
						, query = qry;

						// remaining cache_size get smaller on each successive fetch
						system.cache_size = _.isNumber(system.cache_size) 
							? system.cache_size-1 
							: undefined;

						query = nextQuery(query, startkey);
						query = nextLimit(query, system.page_size);

						// execute the query and process the response
						db.design.query(queryMethod, 
							_.extend(db.design.docId(), {'view': name }), query,
							function (response) {
								var stubRow;
							if (response.code === 200) {
								if (system.asynch && response.data && _.has(response.data, 'rows')) {	
									response.data.nextkey = 
										response.data.rows[response.data.rows.length-1];
									response.query = query;									

									// trim the rows, because we got page_size+1
									if ((system.page_size > 0) && 
										(response.data.rows.length > system.page_size)) { 
											response.data.rows = 
											response.data.rows.slice(0,response.data.rows.length-1);
									}
									
									if (!_.has(response.data, 'total_rows')){
										// reduce fetches don't produce offset/total_rows
										// for now, there is no paging reduced views from the server;
										response.data.offset = 0;
										response.data.total_rows = response.data.rows.length;
									} 
									tRows += response.data.rows.length; 
								}
								e.trigger('chunk-data', response);
							} else {
								e.trigger('view-error', response);
							}				
						});
					};

					events.on('chunk-data', function (res) {
						var total_rows;
							
						// if I've got less than the full index; and asynchronous request
						if ((res.data.rows.length > 0 && tRows < res.data.total_rows) && 
							(system.asynch === true) && system.cache_size > 0) {
							chunk(events, query, res.data.nextkey);	
						} else {
							// if we're building the index internally, call it here. the prefetch is 
							// 'all_docs' with 'include_docs' = true
							if (server === 'node' && emitter_view) {
								_.map(res.data.rows, function(item) {
									return emitter_view.map.call(this, (item && item.doc) || item);
								});
								emitter_view.getRows(res.data);
								tRows = res.data.total_rows;					
								events.trigger('chunk-finished', res);
							}
						}
					});
					
					events.on('get-more-data', function (nextkey) {
						system.cache_size += 1;
						console.log('get-more-data', events, query, nextkey);
						chunk(events, query, nextkey);
					});
					chunk(events, query);		
					return that;
				};

				// if 'node' server is requested, then built-in server side view will be used.
				// generate the list of docs for this db
				var node = function (events, qry) {
					var query = _.extend({}, qry, { 'include_docs': true });

					events.on('chunk-finished', function (res) {
						events.trigger('view-data',  res);
					});
					fetch(events, query, 'node');

				};
				req.node = node;

				var couch = function (events, query) {
					events.on('chunk-data', function (res) {
						events.trigger('view-data', res);
					});
					fetch(events, query);
				};
				req.couch = couch;					

				var query = function (queryParams, systemParams) {
					if (_.isObject (queryParams)) {
						qry = _.extend(qry, queryParams);
					}
					// rule: if reduce=true then page_size=0;
					if (_.has(qry, 'reduce') && qry.reduce === true) {
						system.page_size = 0;
						system.asynch = false;
					} else if (systemParams.asynch === true) {
						system.page_size = systemParams.page_size;
						system.cache_size = systemParams.cache_size;
					}
					return qry;
				};
				req.query = query;

				var end = function (config) {
					var server=(config && config.server) || 'couch'
					, lastResponse
					, res = bx.Events()
					, local = this;

					// check to make sure we have a proper map functino
					if (server === 'node' && views && (views[name] && views[name].map &&
						typeof views[name].map) !== 'function') {
						req.trigger('error', 'bad-view-function');
						return;
					}

					// Note: Responses from this method are evented. 
					// This paves the way for future parallel view exec
					// old version: imbue it with the log function (now commented), so caller can 
					// decide to ask for status on long running jobs
					// callback(log((res = bx.Events()),query().limit || 0));
					callback(res);

					// execute the view by calling the requested server function
					local[server](res, qry);

					res.on('view-data', function (response) {
						lastResponse = response;
						if (response.code === 200) { 
							res.trigger('data', response);										
						} else {
							res.trigger('view-error', response);
						}
					});

					res.on('view-error', function (response) {	
						boxspring.logm('bad-view', index, response.reason());
						req.trigger('error', 'bad-view', index, response.reason());
					});
					return this;					
				};
				req.end = end;
				return req;
			};
			that.view = view;
			
			// Purpose: wrapper for evented .view function. 
			// Default behavior 'asynch: true'  to execute callback only on the first 
			// delivery of data from the server. 
			// 'asynch: false' (or undefined) executes the callback each time and the 
			// application has to manage the data
			var get = function (o, callback, callerDataCatcher) {
				var req
				, opts = _.isObject(o) ? _.clean(o) : {}
				, triggered = false
				, index = _.isObject(opts) ? opts.index : opts
				, caller = callerDataCatcher || bx.Query().Result(ID)
				, translateQuery = function (source) {
					var target = _.clean(source)
					, selector
					, value
					, validQueries = {
						'group': {
							1: ['group', 'reduce', 'descending'],
							0: ['reduce', 'descending']
						},
						'reduce': {
							1: ['reduce', 'group_level', 'startkey', 'endkey', 
							'key', 'keys', 'descending'],
							0: ['reduce', 'limit', 'startkey', 'endkey', 
							'key', 'keys', 'include_docs', 'descending']
						}
					};
					
					if (_.has(target, 'group')) {
						selector = 'group';
					} else {
						selector = 'reduce';
						target.reduce = target.reduce || false;
					}
					value = target[selector] ? 1 : 0;
					try {
						target = _.pick(target, validQueries[selector][value]);
					} catch (e) {
						throw '[translateQuery] - ' + e; 
					}
					return target;
				};
				
				if (arguments.length < 2 || (!_.isFunction(callback))) {
					console.trace();
					throw '[ get ] - missing callback to get function';
				}
				
				req = view.call(this, index, function(res) {
					res.on('data', function (r) {
						r.events = res;
						if (callback && _.isFunction(callback)) {
							if (opts && opts.asynch === false) {
								// just write data to the calling program. 
								// asynch===false should not allow limit= requests.
								callback(caller.data(r));
							} else if ((opts && opts.asynch === true) && triggered === false) {
								// let the calling program continue, while we continue to write data
								callback(caller.data(r));
								triggered = true;								
							} else {
								// add data to Result object of the caller
								caller.data(r);
							}
						}
					});
				});
				req.query(translateQuery(opts), {
					'page_size': o && o.query && o.query.get('page_size'),
					'asynch': (o && o.query && o.query.get('asynch')) || false,
					'cache_size': o && o.query && o.query.get('cache_size')
				});
				req.on('error', function (err, code, param) {
					bx.alert(err, code, param);
				});
				req.end();
			};
			that.get = get;
			
			// What it does: Creates a bulk object for the current database
			var bulk = function (doclist) {
				return(BULK(doclist || [], this));
			};
			that.bulk = bulk;
			
			var clone = function () {
				return(_.clone(this));
			};
			that.clone = clone;
			return that;			
		};
		boxspring.Db = DB;
		
		var file = function () {
			return (bx['file-io']().Ajax(bx.auth().file));
		};
		boxspring.file = file;

		var site = function (url, spec) {
			var parsed = _.urlParse(url).hasOwnProperty('hostname') 
							? _.urlParse(url)
							: _.urlParse('http://' + url);
			return bx['file-io']().Ajax(parsed).Xml(spec);
		};
		boxspring.site = site;
		return boxspring;
	};
	
	// What it does: Query / Result Objects
	Local.Query = function (Config) {
		var dbId = (Config && Config.dbId) || 'system' 
		, query = _.options(Config || {}, {
			'dbId': 'system',
			'context': bx,
			'selected': bx.Hash(),
			'pivot': false,
			'page_size': 100,
			'asynch': false,
			'cache_size': 10,
			'vis': 'table',
			'db': bx.Id(dbId),
			'design-info': bx.Id(dbId).design.designInfo(),
			'index': (Config && Config.index) ||
			 	bx.Id(dbId).design.designInfo()['default-index'],
			'default-index': bx.Id(dbId).design.designInfo()['default-index'],
			'filter': {},
			'group_level': undefined,
			'sortAscending': undefined,
			'descending': false,
			'reduce': false,
			'group': undefined
		})
		, browser = bx.Browser()
		, viewInfo
		, queryOptions =  [
			'index', 
			'reduce', 'group',
			'group_level',
			'startkey', 'endkey',						
//			'key', 'keys',	 
			'limit',
			'pivot',
			'descending',
			'page_size',
			'asynch',
			'cache_size',
			'query' ];

		query.tags = _.options((Config && Config.tags) || {}, {	
			'onDisplay':'#onDisplay', 
			'onResult':'onResult', 
			'onMoreData':'onMoreData',
			'onSelection': 'onSelection',
			'onPagination': 'onPagination',
			'showTitle': '#showTitle',
			'showPage': '#showPage',
			'showTotalPages': '#showTotalPages',
			'showRow': '#showRow',
			'showLastRow': '#showLastRow',
			'showTotalRows': '#showTotalRows'
		});
		
		try {
			// get the details from the design document and set the parameters for this view
			viewInfo = query.get('design-info')['view-info']()[query.get('index')];
			// set the document methods for this view; doc(query) inherits Rows and Keys
			query = _.extend(query, query.get('design-info') &&
									query.get('design-info').doc &&
									query.get('design-info').doc(query));			
		} catch (e) {
			bx.alert('caught-error', 600, '[ bx.Query - missing view-info] - ' + e);		
		}

		var reset = function (o) {
			var target = _.extend({}, this.source, o);

			this.set('sortColumn', viewInfo.sortColumn);
			this.set('sortAscending', viewInfo.sortAscending || this.get('descending'));
			this.set('dateFilter', viewInfo.dateFilter || this.get('design-info')['dateFilter']);
			this.set('startPage', 0);
			this.set('limit', undefined);
			this.set('query', query);

			// I'm using view collation. So, get the keys from viewInfo.keyOrder[view] if 'view' is provided
			this.set('keys', viewInfo.keys);
			this.set('referenceKey', viewInfo.keys);
			if ((Config && Config.view) && 
				(viewInfo && viewInfo.keyOrder && viewInfo.keyOrder[Config.view])) {
				this.set('keys', this.get('keys').concat(viewInfo.keyOrder[Config.view]));
				this.set('referenceKey', this.get('keys'));
			}
			// concatenate the keys+columns and remove redundant to finalize the column heads
			this.set('columns', 
				_.uniq(this.get('keys').concat((target && target.columns) || (viewInfo && viewInfo.columns))));
			this.source.columns = _.clone(this.get('columns'));
			if (o) { this.update(o); }
			return this;
		};
		query.reset = reset;
		query.source = _.clone(Config);
		query.reset();
							
		// give it some Events
		query = bx.Events(query);
		// if we're inthe browser, set pagination using
		// the built-in onResult tag for updating the next/prev
		if (bx.BROWSER === true) {
			bx.pagination(query, query.tags.post());
		}
		// onDisplay is triggered when the first chunk of data is ready from the server
		query.on(query.tags.get('onDisplay'), function (result) {
			var onSelectionId = _.uniqueId('onSelection-');
			// executes the google-vis to render the table to the onDisplay div
			// onSelection gives a tag to the vis to call when rows are selected
			// only trigger if query.display is true
			if (query.get('display') === true) {
				var renderOptions = {
					'query': result.query,
					'result': result,
					'tags': result.query.tags,
					'onSelection': onSelectionId
				};
				// install the selection handler
				query.on(onSelectionId, function (tableData) {
					// update the hash of filtered items
					query.trigger(query.tags.get('onSelection'), query.handleSelections(tableData));
				});
				// fire the meters, the render, and make sure listeners are evented
				query.trigger(bx.onDisplayStart);				
				bx.renderLib('google').display(renderOptions);
				query.trigger(bx.onDisplayEnd);
			}
		});
		// keep feeding the vis with more data
		query.on('onMoreData', function (data) {			
			query.trigger(query.tags.get('onDisplay'), (data.query.get('pivot') === true)
				? data.unPaginate().pivot() 
				: data.unPaginate());
		});
		// whenever there is an event in this context, trigger the same event in the callers context
		query.tags.each(function(value, tag) {
			query.relay(tag, query, query.get('context'));
		});	
		
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
			if (local.get('selected')) {
				local.get('selected').each(function(pageNo, id) {
					if (pageNo === (pageInfo && pageInfo.page)) {
						local.get('selected').remove(id);
					}
				});
			}
			// install these keys into the 'selected' hash, associated with this page
			that.selectedKeys.forEach(function(key) {
				local.get('selected').store(key, pageInfo.page);
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
					'startkey': _.map(startkey, function(x) { return x.toString(); }),
					'endkey': _.map(endkey, function(x) { return (_.isObject(x) ? {} : x.toString()); })
				});			
			};
			return that;
		};
		query.handleSelections = handleSelections;

		if (query.pivot) {
			throw 'fatal re-defining pivot!';
		}
		
		var pivot = function () {
			this.get('result').display(this.get('pivot'));
			return this;
		};
		query.pivot = pivot;

		// What it does: refreshes the display. if query is a 'pivot', it recalculates the result
		// but, only if the application does not say 'displayOnly'
		var refresh = function () {
			this.trigger(this.tags.get('onDisplay'), this.get('result'));
			return this;
		};
		query.refresh = refresh;
		
		// What it does: calls the database with the supplied options and executes the call
		// -back with the wrapped result.
		var sget = function (callback) {
			var local = this
			, opts = this.pick(queryOptions);

			// 'page_size' disallow for browsing, reduce=false and no group_level
			if ((this.get('reduce') === false && !this.contains('group_level')) || 
				(this.get('group') === false)) {
				this.set('asynch', false);
				this.set('cache_size', undefined);
			}
			// passing 'this.Result()' allows 'get' to route the results back to this object.			
			this.get('db').get(opts, function(result) {
				if (callback && _.isFunction(callback)) {
					// assign the result to this object
					callback(result);
				}
			}, this.Result());
			return this;
		};
		query.sget = sget;
		
		// What it does: fetches data from the server, then renders optionally pivot the result
		// NOTE: 'result' is a Result() object
		var browse = function () {
			var local = this;
							
			local.sget(function(result) {
				console.log('result:', _.clone(result.rows), result.response.request.url);
				if (result.code === 200) {
					// set result and call down to display with this result
					local.set('serverResult', result);
					result.display();
					local.trigger(local.tags.get('onResult'), result);
				}
			});
			return this;						
		};
		query.browse = browse;
		
		var fire = function (options) {
			this.update(options).browse();				
			return this;
		};
		query.fire = fire;

		var Result = function (dbId) {					
			var Pages = { 'pages': [] }
				, db = bx.Id(dbId || (query && query.dbId))
				, current_chunk = 0
				, current_page = 0;	// zero-based

			// wraps the response.data object with some helper methods
			var data = function (response) {
				var responseData = response.data || response
					, that = {}
					, divTag
					, system;

				// helpers						
				that.response = response || {};
				that.query = query;	// owner
				that.ok = response && response.ok;
				that.reason = response && response.reason;
				that.code = response.code;
				that.rows = (responseData && responseData.rows) || [];
				that.offset = (responseData && responseData.offset) || 0;
				that.total_rows = (responseData && responseData.total_rows) || that.rows.length;
				that.rid = _.uniqueId('result-');
				that.events = (response && response.events);
				that.nextkey = (responseData && responseData.nextkey);
				that.visibleRows = _.map(that.rows, function(v, i) { return that.offset + i; });
				
				var wrap = function (r) {
					return (_.extend(r, this.query.access(r)));
				};
				that.wrap = wrap;
				
				// helpher to iterate each logical "row" of the result of the query
				var each = function (func) {
					var local = this
					, visibleRows = [];
					
					_.each(local.rows, function (row, i) {
						if (local.wrap(row).filter(local.query.get('filter'))) {
							visibleRows.push(local.offset + i);
							func(row, (local.offset+i) === (local.total_rows-1));										
						}
					});
					local.visibleRows = visibleRows;
					return this;
				};
				that.each = each;

				var pages = function () {
					return _.clone(Pages.pages);
				};
				that.pages = pages;

				var page = function () {
					if (current_chunk > 0) {
						// does not create a new 'pages', returns to tha caller the cached
						// response object from the server
						return Pages.pages[current_chunk];						
					}
					return this;
				};
				that.page = page;

				// return a paginated query as though it was captured in one block 
				var unPaginate = function () {
					var allPages = { 'rows': [] };

					// copy the first page as template to allPages
					allPages = _.extend({}, this.pages()[0], allPages);
					this.pages().forEach(function(page) {
						allPages.rows = 
							allPages.rows.concat(page.rows || []);
					});
					return allPages;
				};
				that.unPaginate = unPaginate;

				var pageInfo = function () {
					var local = this;
					
					//console.log('pageInfo completed', local.total_rows, local.offset, local.rows.length);
					
					return ({ 
						'completed': (local.total_rows === (local.offset + local.rows.length)),
						'totalRows': local.total_rows,
						'visibleRows': local.visibleRows.length,
						'rows': local.rows,
						'pageSize': (local.query.get('page_size') || local.total_rows),
						'cachedPages': Pages.pages.length, 
						'page': current_page,
						'next': function() {
							if ((current_page * this.pageSize) < this.visibleRows) {
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
							return Math.ceil(this.visibleRows / this.pageSize); 
						},
						'lastPage': function() { 
							return Pages.pages.length; 
						} 
					});
				};
				that.pageInfo = pageInfo;
				
				var render = function () {
					// update the startPage
					this.query.set('startPage', this.pageInfo().page);
					// default delegates pagination to the rendering object
					if (query.tags.get('onPagination') === 'onPagination') {
						query.trigger('onPagination');
					} else {
						// send the data to the listener; 
						query.trigger(query.tags.get('onDisplay'), this.page());
					}
				};
				// What it does: caller supplied or callback from menus to render rows and 
				// update the browser with spinning wheel and alerts
				var nextPrev = function (arg) {
					var direction = ( (arg && typeof arg === 'string') ? arg : arg && arg.text );
					
					if (direction) {
						direction = direction.toLowerCase().split(' ');
					}
					query.trigger(bx.onDisplayStart);
					if (!direction) {
						query.trigger(query.tags.get('onDisplay'), this.page());
					} else if (_.arrayFound('next', direction)) {
						current_chunk += (current_chunk < Pages.pages.length-1) ? 1 : 0;
						this.pageInfo().next();					
						render.apply(this);
						// if we haven't cached all the pages, and we have one more page in
						// cache before we run out, then cache another page from the server 
						if (!this.pageInfo().completed && 
							(this.pageInfo().page) === (this.pageInfo().lastPage()-1)) {
								console.log('triggering get-more-data!', this.pageInfo());
							this.page().events.trigger('get-more-data', this.page().nextkey);
						}
					} else if (_.arrayFound('previous', direction)) {
						current_chunk -= (current_chunk > 0) ? 1 : 0;
						this.pageInfo().prev();					
						render.apply(this);
					}
					// trigger format the #loading and #status div area
					query.trigger(bx.onDisplayEnd);						
				};
				that.nextPrev = nextPrev;

				// helper to get the next N rows
				var display = function () {
					var pivot = this.query.get('pivot') 
					, data;
					// global to this object
					current_chunk = 0;
					// call pivot, which only runs if this result has been grouped
					if (pivot && pivot === true) {
						data = this.pivot();
						console.log('pivot data!', data);
					} else {
						data = this;
					}
					// What it does: caller supplies this listener for where to post results
					this.query.set('result', data);
					nextPrev.call(data);
					return data;
				};
				that.display = display;

				// What it does: Swaps two indices in place. Effect is to switch axes
				var reverse = function (i1, i2) {
					var tmp;

					this.each(function(item) {
						tmp = item.key[i1];
						item.key[i1] = item.key[i2];
						item.key[i2] = tmp;
					});
					return this;
				};
				that.reverse = reverse;

				// provide a method to group the table on keys excluding the pivot key
				var group = function (key, rows, doc) {
					var local = this;
					return _.sortBy(_.uniq(_.map(rows, function(row) { 
						return local.query.Row().getKey(row);
					}), false), function (x) { return x; });
				};
				that.group = group;

				// adds methods to result object to enable 'pivot' on keys
				// Note: this object relies on a view result that is reduced 'reduce=true' 
				// adds methods to result object to enable 'pivot' on keys
				// Note: this object relies on a view result that is reduced 'reduce=true' 
				var pivot = function () {
					var local = this
					, columns = _.clone(local.query.all())
					, hash = bx.Hash()
					, pivotRow = local.query.get('pivot-row')
					, pivotColumn = local.query.get('pivot-column')
					, map = []
					, newPivotResult = function(c, s, a) {
						var that = {'count': c || 0, 'sum': s || 0, 'average': a || 0 };
						that.add = function(b) {
							this.count += b.count;
							this.sum += b.sum;
							this.average = (this.sum / this.count);
							return this;
						};
						return that;
					};
					
					// check the configuration to be sure the pivotRow and Columns exist
					if (!_.arrayFound(pivotRow, columns) ||
						!_.arrayFound(pivotColumn, local.query.get('referenceKey'))) {
							bx.alert('bad-pivot', 500, pivotRow + ', ' + pivotColumn);
							return this;
					}
	
					// step 1: calculate the unique columns [pivot-key-values]
					// start by getting the filtered rows; use them to build the new hash
					local.each(function(row) { map.push(row); });
					columns = _.sortBy(_.uniq(_.map(map, /*local.rows,*/ function(row) { 
						return (local.query.access(row).select(pivotColumn)).toString();
					}), false), function (x) { return x; });
					// add the row total column to the end
					columns = columns.concat(['row total']);
					// reset the access cache
					local.query.columnReset();
					// step 2: iterate over all rows, and produce a hash of values
					// since we're clipping from the key length, the hash will have to 
					// update, not just store
					this.each(function(row) {	
						var newRow = { 
							'key': [ local.query.access(row).select(pivotRow) ],
							'value': {}
						}
						, colHdr = (local.query.access(row).select(pivotColumn)).toString()
						// check for an existing entry at this address
						, lastValue = hash.find(newRow.key)
						, pivotValue = local.query.access(row).getValue(row)
						, template = newPivotResult(1, (_.isNumber(pivotValue) && pivotValue) || 1);

						if (lastValue) {
							newRow.value = lastValue.value;
							if (lastValue.value[colHdr]) {
								template.count = lastValue.value[colHdr].count + 1;
								template.sum += lastValue.value[colHdr].sum;
							}
							template.average = (template.sum / template.count);
						}
						newRow.value[colHdr] = template;			
						// store the newRow
						hash.store(newRow.key, newRow);
					});
					// step 1a: update the query object based on the new column values
					local.query.set('keys', [ pivotRow ]);
					local.query.set('columns', [ pivotRow ].concat(columns));
					local.query.set('displayColumns', [ pivotRow ].concat(columns));
					local.query.set('sortColumn', pivotRow);
					local.query.set('sortAscending', true);
					// new column defs for pivot table. first column string, rest numbers
					local.query.columnTypes(pivotRow, 'string');
					columns.forEach(function(c) {
						if (!local.query.hasType(c)) {
							local.query.columnTypes(c, 'number', 1);							
						}
					});
					
					// new 'each' method; called by rendering function ie., googleVis
					var each = function(fn) {
						var that = {}
						, func = _.isFunction(fn) ? fn : function() { return ; }

						that.total_rows = hash.length();
						that.totals = (function () {
							var totals = {
								'cT': {
									'key': ['column total'],
									'value': _.reduce(columns, function (x, col) {
										x[col] = newPivotResult();
										return x;
									}, {})
								}
							};
							
							totals.rowTotal = function (row) {						
								if (!row.value.hasOwnProperty('row total')) {
									// sum across the row values
									row.value['row total'] = _.reduce(row.value, function(x, y, z) {
										totals.cT.value[z].add(y);
										return x.add(y);
									}, newPivotResult());
									// sum the row total for all the columns
									this.cT.value['row total'].add(row.value['row total']);
								}
								return row;
							};
							totals.columnTotal = function () {
								return _.extend(this.cT, local.wrap(this.cT));
							};			
							return totals;
						}()); 

						hash.each(function(row, key, current_row) {							
							that.current_row = current_row
							// extend this row record with 'access'
							func(that.totals.rowTotal(local.wrap(row)), 
								that.total_rows === current_row);
							if (that.total_rows === current_row) {
								func(that.totals.columnTotal(), true);
							}
						});
						return that;
					};
					local.each = each;

					// update the pageInfo for this result
					local.total_rows = hash.keys().length;
					local.offset = 0;
					local.rows = hash.keys();					
					return local;
				};			
				that.pivot = pivot;

				// What it does: returns the view reduced to its group_level keys, the 'facets'
				var facets = function (name) {
					var local = this;
					
					return _.compact(_.uniq(_.sortBy(_.map(this.rows, function(row) {
						var s = local.wrap(row).select(name);
						return (s && s.toString());
					}), _.item)), true);
				};
				that.facets = facets;

				var sortByVal = function (iterator) {
					var compare = iterator || function (row) { return -(row.value); };

					// for each pages, sort
					Pages.pages.forEach(function(chunk) {
						chunk.data.rows = _.sortBy(chunk.rows, compare);
					});
					return this;
				};
				that.sortByVal = sortByVal;

				// helper: called on a 'reduce': true view to get the first and last keys of an
				// index. knows nothing about the type, so range can be anything.
				var range = function () {
					return({ 'start': this.rows[0].key, 'end': this.rows[this.rows.length-1].key });
				};
				that.range = range;
				
				var first = function () {
					return this.rows[0];
				};
				that.first = first;
				
				var last = function () {
					return this.rows[this.rows.length-1];
				};
				that.last = last;

				// helper to just give the raw Couch response back to the caller
				var bulk = function () {
					return responseData;
				};
				that.bulk = bulk;
				// updates the pages cache
				Pages.pages.push(that);	
				// accumulates the rest of the pages for this result, if 'asynch'
				if (that.query.get('asynch') === true && Pages.pages.length > 1) {
					that.query.trigger('onMoreData', that);										
				}

				return that;
			};
			Pages.data = data;
			return Pages;
		};
		query.Result = Result;
		return query;
	};

}(bx));	

/*
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

/*jslint newcap: false, node: true, vars: true, white: true, nomen: true  */
/*global bx: true, _: true, $: true, XML: true */

(function(Local) {
	"use strict";
	var http
		, fs;
		
	if (typeof exports !== 'undefined') {
		http = module.require('http');
		fs = module.require('fs');
	}
	
	Local['file-io'] = function (owner) {
		var fileio = owner || {};
		
		// Purpose: helper to interpret the http status code
		var reason = function (o) {
				var codes = {};

				codes['200'] = 'OK';
				codes['201'] = 'CREATED';
				codes['300'] = 'ACCEPTED';
				codes['304'] = 'NOT MODIFIED'; 
				codes['400'] = 'BAD REQUEST'; 
				codes['404'] = 'NOT FOUND'; 
				codes['405'] = 'METHOD NOT ALLOWED';
				codes['409'] = 'CONFLICT';
				codes['412'] = 'PRECONDITION FAILED';
				codes['500'] = 'INTERNAL SERVER ERROR';
				codes['600'] = 'PROGRAM ERROR';
				codes.ECONNRESET = 'CONNECTION RESET';
				return(codes[o && o.code]);					
		};
		fileio.reason = reason;
		
		// Purpose: helper to add the 'rev' code to io requests
		var result = function (o) {
			var that = o || {};
			if (o && o.header && o.header.etag) {
				_.extend(o, { 'rev': o.header.etag.replace(/\"/g, '').replace(/\r/g,'') });
			}
			
			o.ok = function () {
				return (o.code === 200 || o.code === 201); 
			};
			
			o.reason = function () {
				if (!o.ok() && o.error) {
					return reason(o) + ': ' + o.error;					
				} 
				if (!o.ok() && o && o.data && o.data.reason) {
					return reason(o) + ': ' + (o && o.data && o.data.reason.slice(0,50)) || '';										
				} 
				return reason(o);
			};
			return that;
		};

		var writeFile = function(f, data, handler) {		
			fs.writeFile(f, data, function (err) {
				if (handler && typeof handler === 'function') {
					handler(err);
				}
			});
		};

		var readFile = function(root, f, myhandler) {
			var handler = (myhandler && myhandler.fn) || myhandler
				, request = { 'path': f, 'root': root };

			if (bx && bx.BROWSER === true) {
				$.ajax({
					'url': root+f,
					'type': 'GET',
					'dataType': 'text',
					'success': function(data, err) {
						if (handler && typeof handler === 'function') {
							handler({
								'request': request,
								'code': err === 'success' ? 200 : err,
								'data': data
							});
						}
					},
					'error': function() {
						this.success.apply(this, arguments);
					}
				});
			} else {
				//console.log('get:', root+f);
				fs.readFile(root+f, 'ascii', function (err, data) {
					if (handler && typeof handler === 'function') {
						handler(result({
							'request': request,
							'code': (err && err.code) || 200,
							'data': data
						}));
					}
				});			
			}	
		};

		var readCSV = function (sourceFile, delimit, handler) {
			var that = {}
				, delimiter = delimit || ',';
			
			var process = function (arg) {
				var data = sourceFile || arg
					, lines = []
					, header = []
					, nextLine = function () {
						return({});
					}
					, thisLine
					, line
					, currentLine
					, j;

				try {
					// parsing a delimter separated file. Consider first line as header,
					// use the tokens as keys for each remaining line.
					lines = data.split('\n');
					header = lines[0].split(delimiter);

					// for each line, beginning with line 1 (line 0 is the header)
					for (currentLine = 1; currentLine < lines.length; currentLine += 1) {
						line = lines[currentLine].split(delimiter);
						if (line.length !== header.length) {
							bx.log('invalid-delimiter', 500, currentLine);
						} else {
							// for each field, generate an entry name: field
							thisLine = nextLine();
							for (j = 0; j < header.length; j += 1) {
								thisLine[header[j]] = line[j]; 
							}
							// call the handler with an object for each line
							if (handler && typeof handler === 'function') {
								handler(header, thisLine, currentLine===(lines.length-1));
							}
						}
					} 
				} catch (e) {
					//throw ('json parse error', e);
					throw 'error: processing CSV file, ' + e;
				}				
			};
			that.process = process;

			var read = function () {
				readFile(sourceFile, function(err, data) {
					if (err !== null) {
						bx.logm('bad-CSV-file', 500, sourceFile);
					} else {
						process(data);
					}
				});				
			};
			that.read = read;
			return that;
		};

		// Purpose: Standardized JSON config file reader
		var getConfig = function(path, handler) {
			readFile(path, function(err, res) {
				handler(err, res, res);
	//			handler(err, fileio.parse(res), res);
			});
		};

		// Purpose: Listen for REST API requests on the provided port
		var server = function (port, serviceFunc) {
			var http = require("http");

			http.createServer(function(request, response) {

				var result = serviceFunc(request);

			  response.writeHead((result && result.code) || 500, {"Content-Type": "text/plain"});
			  response.write((result && result.body) || '');
			  response.end();
			}).listen(port);

		};
		fileio.server = server;

		// Purpose: parses a JSON object with 'catch' to just return the input if the parse fails.
		var parse = function (s, ctype) {
			var parsed = {}
				,contentType = (typeof ctype !== 'undefined') ? ctype.split(';')[0] : undefined;
			if (s === '') {
				return '';
			} 

			if (contentType === 'application/json') {
				// ajax sometimes returns .html from the root directory
				if (s.toUpperCase().substr(2,8) === "DOCTYPE") {
					return s;
				} 
				try {
					parsed = JSON.parse(s);
				} catch (e) {
					return s;
				}
				return parsed;
			}
			return s;					
		};

		var Ajax = function(server, user) {
			var	Basic
				,Cookie
				,auth = (user && (user.name + ':' + user.password)) || ''
				,host = (server && server.host) || server.hostname
				,port = server && server.port
				,that = {};	

			if (server && !_.has(server, 'file') && !(_.has(server, 'hostname') || _.has(server, 'host'))) {
				console.trace();
				throw 'error: missing hostname or port required for Ajax calls - ' + JSON.stringify(server);
			}	

			if (user && user.auth) {
				Basic = "Basic " + new Buffer(user.auth, "ascii").toString("base64");
			}

			that.writeFile = writeFile;
			that.readFile = readFile;
			that.readCSV = readCSV;
			that.getConfig = getConfig;
			that.server = server;

			var nodeGet = function (opts, callback) {
				var stream = ''		// node.js ajax request function		
					,req;
				req = http.request(opts, function(res) {
					res.setEncoding('ascii');
					res.on('data', function (chunk) {
						stream = stream + chunk;
					});
					res.on('end', function() {
						// callback pattern
						if (callback && typeof callback === 'function') {
							callback(result({
								request: _.exclude(opts, 'agent'),
								code: res.statusCode,
								header: res.headers,
								data: parse(stream, res.headers['content-type'])								
							}), res);
						}

						if (_.has(res.headers, 'set-cookie')) {
							Cookie = res.headers['set-cookie'];
						}
					});			
				});

	//			if (Basic) {
	//				req.setHeader('Authorization', Basic);
	//			}

				req.setHeader('Connection', 'keep-alive');
				req.setHeader('Content-type', 'application/json');													
				req.setHeader('Accept', 'application/json');

				req.on('error', function(e) {	
					if (callback && typeof callback === 'function') {
						callback(result({
							'path': opts.path,
							'code': e.code || e,
							'error': e
						}));
					}
				});

				if ((opts.body !== '') && (opts.method === 'PUT' || opts.method === 'POST')) {
					req.write(opts.body);
				}
				req.end();
			};

			// Purpose: jQuery ajax call returns header string. 
			// Parse it into an object, remove leading spaces from key/value
			var parseHdr = function (hdr) {
				var parseArray = hdr.split('\n')
					,header = {};
				_.each(parseArray, function(element) {
					var hdrItem = element.split(':');
					if (hdrItem.length > 1 && hdrItem[0] !== '') {
						header[hdrItem[0].toLowerCase()] = hdrItem[1].replace(' ','');																		
					}
				});
				return (header);
			};

			if (bx && bx.BROWSER) {
				// won't change from call to call
				$.ajaxSetup({
					'accepts': {'json': 'application/json' },
					'dataType': "json",
					'username': user && user.name,
					'password': user && user.password,
					'converters': {
						"text json": function( stream ) {
							parse(stream, 'application/json');
						}
					}
				});
			}

	/*
	processData: false _config, {dbname}, 
	save: before send fullcommit options
	*/	
			var jqueryGet = function (opts, callback) {
				var defaultAjaxOpts = { // can change from call to call
						'contentType': "application/json",
						'headers': {
							"Accept": "application/json"
						}
					};

				// extend the options with the defaults, and the ajax logic
				opts = _.extend(defaultAjaxOpts, opts, {	
					beforeSend: function(xhr) {
						_.each(opts.headers, function(item, index) {
							xhr.setRequestHeader(index, item);						
						});
						// toggle the spinning wheel event, if its listening
						bx.trigger(bx.httpRequestStart);
			        },
			        complete: function(jqXHR) {
						//var resp = httpData(req, "json");
						//console.log(jqXHR.responseText);
						bx.trigger(bx.httpRequestEnd);
						if (callback && typeof callback === 'function') {
							callback(result({
								request: _.exclude(opts, 'agent'),
								method: opts.type,
								code: jqXHR.status,
								header: parseHdr(jqXHR.getAllResponseHeaders()),
								data: parse(jqXHR.responseText, this.contentType)
							}));
						}
					}
				});
				$.ajax(_.extend(opts));
			};

			// Purpose: manages parameters for differing ajax interfaces, such as node.js and jquery
			var get = function(opts, callback) {
				// if the object is set with a 'file' path, instead of a 'host' or 'hostname', 
				// then just read the file keeps the interface the same for http or file requests			
				if ((server && server.file) || (server && server['server-root'])) {
					opts = typeof opts === 'string' ? opts : ((opts && opts.path) || '');
					if (bx && bx.BROWSER === true) {
						readFile(server['server-root'], opts, callback);					
					} else {
						readFile(server.file, opts, callback);					
					}
					return;
				}	

				if (bx && bx.BROWSER === true) {
					// data objects are strings for PUT. 
					if (opts.method && (opts.method==='PUT' || opts.method==='POST')) {	
						// check the content type first
						if (_.fetch(opts, 'Content-Type') === 'application/x-www-form-urlencoded') {
							_.extend(opts, { 'data': opts.body || {}, 'processData': false });
						} else {
							_.extend(opts, { 'data': (JSON.stringify(opts.body || {})).replace(/\r/g, '') });
						}	
					} 
					jqueryGet({
						'url': typeof opts==='string' ? opts : (_.has(opts, 'path') ? opts.path : ''),
						'type': opts.method,
						'contentType': _.fetch(opts, 'Content-Type') || 'application/json',
						'headers': opts.headers,
						'data': opts.data }, callback);
				} else {
					nodeGet({ 
						'hostname': host, 
						'port': port, 
						'path': opts === '' ? '' : opts && opts.path,
						'method': (opts && opts.method) || 'GET',
						'body': (opts && opts.body && JSON.stringify(opts.body)) || {},
						'auth': auth }, callback);
				}				
			};
			that.get = get;

			var Xml = function(Spec) {
				var that = Spec || {}
					, xotree = bx.ObjTree();
					
				var force_array = function(opts) {
					if (_.isArray(opts)) {
						xotree.force_array = opts;									
					} else {
						console.trace();
						throw 'force_array arguments must be an array';
					}
					return this;
				};
				that.force_array = force_array;

				var xml2json = function (xmlstr, fn) {
					var tree = {};

					try {
					    tree = xotree.parseXML(xmlstr);				
					} catch (e) {
						tree = { 'error (XML2JSON)': e };				
					}

		            if (fn && typeof fn === 'function') {
		                fn(tree, JSON.stringify(tree), xmlstr);
		            }
					return this;
				};
				that.xml2json = xml2json;

				var url2json = function (url, func) {					
					if (get && typeof get === 'function') {
						get(url, function(result) {
							if (result && result.code === 200) {
								xml2json(result.data, function(tree, json, xml) {
									_.extend(result, { 'tree': tree, 'json': json, 'xml': xml });
									func(result);
								});							
							} else {
								func(result);
							}
						});
					}
					return this;
				};
				that.url2json = url2json;
				return that;
			};
			that.Xml = Xml;
			return that;
		};
		fileio.Ajax = Ajax;
		return fileio;	
	};
}(bx));

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

// ========================================================================
//  XML.ObjTree -- XML source code from/to JavaScript object like E4X
// ========================================================================

//if ( typeof(XML) === 'undefined' ) XML = function() {};

// Augmentation: If running in Node.js, need this package library 'xmldom'. 
// Provides the DOMParser object. Everything else stays the same!
if (typeof window === 'undefined') {
	var DOMParser = require('xmldom').DOMParser;	

	var window = {};
	window.DOMParser = true;
}

(function (Local) {
	"use strict";
	
	var ObjTree = function () {
		var XML = {};
		
		//  constructor
//		XML.ObjTree = function () {
//		    return this;
//		};

		//  class variables

		XML.VERSION = "0.24";

		//  object prototype

		XML.xmlDecl = '<?xml version="1.0" encoding="UTF-8" ?>\n';
		XML.attr_prefix = '-';
		XML.overrideMimeType = 'text/xml';

		//  method: parseXML( xmlsource )

		XML.parseXML = function ( xml ) {
		    var root;
		    if ( window.DOMParser ) {
		        var xmldom = new DOMParser();
		//      xmldom.async = false;           // DOMParser is always sync-mode
		        var dom = xmldom.parseFromString( xml, "application/xml" );
		        if ( ! dom ) return;
		        root = dom.documentElement;
		    } else if ( window.ActiveXObject ) {
		        xmldom = new ActiveXObject('Microsoft.XMLDOM');
		        xmldom.async = false;
		        xmldom.loadXML( xml );
		        root = xmldom.documentElement;
		    }
		    if ( ! root ) return;
		    return this.parseDOM( root );
		};

		//  method: parseHTTP( url, options, callback )

		XML.parseHTTP = function ( url, options, callback ) {
		    var myopt = {};
		    for( var key in options ) {
		        myopt[key] = options[key];                  // copy object
		    }
		    if ( ! myopt.method ) {
		        if ( typeof(myopt.postBody) == "undefined" &&
		             typeof(myopt.postbody) == "undefined" &&
		             typeof(myopt.parameters) == "undefined" ) {
		            myopt.method = "get";
		        } else {
		            myopt.method = "post";
		        }
		    }
		    if ( callback ) {
		        myopt.asynchronous = true;                  // async-mode
		        var __this = this;
		        var __func = callback;
		        var __save = myopt.onComplete;
		        myopt.onComplete = function ( trans ) {
		            var tree;
		            if ( trans && trans.responseXML && trans.responseXML.documentElement ) {
		                tree = __this.parseDOM( trans.responseXML.documentElement );
		            } else if ( trans && trans.responseText ) {
		                tree = __this.parseXML( trans.responseText );
		            }
		            __func( tree, trans );
		            if ( __save ) __save( trans );
		        };
		    } else {
		        myopt.asynchronous = false;                 // sync-mode
		    }
		    var trans;
		    if ( typeof(HTTP) != "undefined" && HTTP.Request ) {
		        myopt.uri = url;
		        var req = new HTTP.Request( myopt );        // JSAN
		        if ( req ) trans = req.transport;
		    } else if ( typeof(Ajax) != "undefined" && Ajax.Request ) {
		        var req = new Ajax.Request( url, myopt );   // ptorotype.js
		        if ( req ) trans = req.transport;
		    }
		//  if ( trans && typeof(trans.overrideMimeType) != "undefined" ) {
		//      trans.overrideMimeType( this.overrideMimeType );
		//  }
		    if ( callback ) return trans;
		    if ( trans && trans.responseXML && trans.responseXML.documentElement ) {
		        return this.parseDOM( trans.responseXML.documentElement );
		    } else if ( trans && trans.responseText ) {
		        return this.parseXML( trans.responseText );
		    }
		}

		//  method: parseDOM( documentroot )

		XML.parseDOM = function ( root ) {
		    if ( ! root ) return;

		    this.__force_array = {};
		    if ( this.force_array ) {
		        for( var i=0; i<this.force_array.length; i++ ) {
		            this.__force_array[this.force_array[i]] = 1;
		        }
		    }

		    var json = this.parseElement( root );   // parse root node
		    if ( this.__force_array[root.nodeName] ) {
		        json = [ json ];
		    }
		    if ( root.nodeType != 11 ) {            // DOCUMENT_FRAGMENT_NODE
		        var tmp = {};
		        tmp[root.nodeName] = json;          // root nodeName
		        json = tmp;
		    }
		    return json;
		};

		//  method: parseElement( element )

		XML.parseElement = function ( elem ) {
		    //  COMMENT_NODE
		    if ( elem.nodeType == 7 ) {
		        return;
		    }

		    //  TEXT_NODE CDATA_SECTION_NODE
		    if ( elem.nodeType == 3 || elem.nodeType == 4 ) {
		        var bool = elem.nodeValue.match( /[^\x00-\x20]/ );
		        if ( bool == null ) return;     // ignore white spaces
		        return elem.nodeValue;
		    }

		    var retval;
		    var cnt = {};

		    //  parse attributes
		    if ( elem.attributes && elem.attributes.length ) {
		        retval = {};
		        for ( var i=0; i<elem.attributes.length; i++ ) {
		            var key = elem.attributes[i].nodeName;
		            if ( typeof(key) != "string" ) continue;
		            var val = elem.attributes[i].nodeValue;
		            if ( ! val ) continue;
		            key = this.attr_prefix + key;
		            if ( typeof(cnt[key]) == "undefined" ) cnt[key] = 0;
		            cnt[key] ++;
		            this.addNode( retval, key, cnt[key], val );
		        }
		    }

		    //  parse child nodes (recursive)
		    if ( elem.childNodes && elem.childNodes.length ) {
		        var textonly = true;
		        if ( retval ) textonly = false;        // some attributes exists
		        for ( var i=0; i<elem.childNodes.length && textonly; i++ ) {
		            var ntype = elem.childNodes[i].nodeType;
		            if ( ntype == 3 || ntype == 4 ) continue;
		            textonly = false;
		        }
		        if ( textonly ) {
		            if ( ! retval ) retval = "";
		            for ( var i=0; i<elem.childNodes.length; i++ ) {
		                retval += elem.childNodes[i].nodeValue;
		            }
		        } else {
		            if ( ! retval ) retval = {};
		            for ( var i=0; i<elem.childNodes.length; i++ ) {
		                var key = elem.childNodes[i].nodeName;
		                if ( typeof(key) != "string" ) continue;
		                var val = this.parseElement( elem.childNodes[i] );
		                if ( ! val ) continue;
		                if ( typeof(cnt[key]) == "undefined" ) cnt[key] = 0;
		                cnt[key] ++;
		                this.addNode( retval, key, cnt[key], val );
		            }
		        }
		    }
		    return retval;
		};

		//  method: addNode( hash, key, count, value )

		XML.addNode = function ( hash, key, cnts, val ) {
		    if ( this.__force_array[key] ) {
		        if ( cnts == 1 ) hash[key] = [];
		        hash[key][hash[key].length] = val;      // push
		    } else if ( cnts == 1 ) {                   // 1st sibling
		        hash[key] = val;
		    } else if ( cnts == 2 ) {                   // 2nd sibling
		        hash[key] = [ hash[key], val ];
		    } else {                                    // 3rd sibling and more
		        hash[key][hash[key].length] = val;
		    }
		};

		//  method: writeXML( tree )

		XML.writeXML = function ( tree ) {
		    var xml = this.hash_to_xml( null, tree );
		    return this.xmlDecl + xml;
		};

		//  method: hash_to_xml( tagName, tree )

		XML.hash_to_xml = function ( name, tree ) {
		    var elem = [];
		    var attr = [];
		    for( var key in tree ) {
		        if ( ! tree.hasOwnProperty(key) ) continue;
		        var val = tree[key];
		        if ( key.charAt(0) != this.attr_prefix ) {
		            if ( typeof(val) == "undefined" || val == null ) {
		                elem[elem.length] = "<"+key+" />";
		            } else if ( typeof(val) == "object" && val.constructor == Array ) {
		                elem[elem.length] = this.array_to_xml( key, val );
		            } else if ( typeof(val) == "object" ) {
		                elem[elem.length] = this.hash_to_xml( key, val );
		            } else {
		                elem[elem.length] = this.scalar_to_xml( key, val );
		            }
		        } else {
		            attr[attr.length] = " "+(key.substring(1))+'="'+(this.xml_escape( val ))+'"';
		        }
		    }
		    var jattr = attr.join("");
		    var jelem = elem.join("");
		    if ( typeof(name) == "undefined" || name == null ) {
		        // no tag
		    } else if ( elem.length > 0 ) {
		        if ( jelem.match( /\n/ )) {
		            jelem = "<"+name+jattr+">\n"+jelem+"</"+name+">\n";
		        } else {
		            jelem = "<"+name+jattr+">"  +jelem+"</"+name+">\n";
		        }
		    } else {
		        jelem = "<"+name+jattr+" />\n";
		    }
		    return jelem;
		};

		//  method: array_to_xml( tagName, array )

		XML.array_to_xml = function ( name, array ) {
		    var out = [];
		    for( var i=0; i<array.length; i++ ) {
		        var val = array[i];
		        if ( typeof(val) == "undefined" || val == null ) {
		            out[out.length] = "<"+name+" />";
		        } else if ( typeof(val) == "object" && val.constructor == Array ) {
		            out[out.length] = this.array_to_xml( name, val );
		        } else if ( typeof(val) == "object" ) {
		            out[out.length] = this.hash_to_xml( name, val );
		        } else {
		            out[out.length] = this.scalar_to_xml( name, val );
		        }
		    }
		    return out.join("");
		};

		//  method: scalar_to_xml( tagName, text )

		XML.scalar_to_xml = function ( name, text ) {
		    if ( name == "#text" ) {
		        return this.xml_escape(text);
		    } else {
		        return "<"+name+">"+this.xml_escape(text)+"</"+name+">\n";
		    }
		};

		//  method: xml_escape( text )

		XML.xml_escape = function ( text ) {
		    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
		};
		return XML;
	};
	Local.ObjTree = ObjTree;
		
})(bx);



/*
// ========================================================================

=head1 NAME

XML.ObjTree -- XML source code from/to JavaScript object like E4X

=head1 SYNOPSIS

    var xotree = new XML.ObjTree();
    var tree1 = {
        root: {
            node: "Hello, World!"
        }
    };
    var xml1 = xotree.writeXML( tree1 );        // object tree to XML source
    alert( "xml1: "+xml1 );

    var xml2 = '<?xml version="1.0"?><response><error>0</error></response>';
    var tree2 = xotree.parseXML( xml2 );        // XML source to object tree
    alert( "error: "+tree2.response.error );

=head1 DESCRIPTION

XML.ObjTree class is a parser/generater between XML source code
and JavaScript object like E4X, ECMAScript for XML.
This is a JavaScript version of the XML::TreePP module for Perl.
This also works as a wrapper for XMLHTTPRequest and successor to JKL.ParseXML class
when this is used with prototype.js or JSAN's HTTP.Request class.

=head2 JavaScript object tree format

A sample XML source:

    <?xml version="1.0" encoding="UTF-8"?>
    <family name="Kawasaki">
        <father>Yasuhisa</father>
        <mother>Chizuko</mother>
        <children>
            <girl>Shiori</girl>
            <boy>Yusuke</boy>
            <boy>Kairi</boy>
        </children>
    </family>

Its JavaScript object tree like JSON/E4X:

    {
        'family': {
            '-name':    'Kawasaki',
            'father':   'Yasuhisa',
            'mother':   'Chizuko',
            'children': {
                'girl': 'Shiori'
                'boy': [
                    'Yusuke',
                    'Kairi'
                ]
            }
        }
    };

Each elements are parsed into objects:

    tree.family.father;             # the father's given name.

Prefix '-' is inserted before every attributes' name.

    tree.family["-name"];           # this family's family name

A array is used because this family has two boys.

    tree.family.children.boy[0];    # first boy's name
    tree.family.children.boy[1];    # second boy's name
    tree.family.children.girl;      # (girl has no other sisiters)

=head1 METHODS

=head2 xotree = new XML.ObjTree()

This constructor method returns a new XML.ObjTree object.

=head2 xotree.force_array = [ "rdf:li", "item", "-xmlns" ];

This property allows you to specify a list of element names
which should always be forced into an array representation.
The default value is null, it means that context of the elements
will determine to make array or to keep it scalar.

=head2 xotree.attr_prefix = '@';

This property allows you to specify a prefix character which is
inserted before each attribute names.
Instead of default prefix '-', E4X-style prefix '@' is also available.
The default character is '-'.
Or set '@' to access attribute values like E4X, ECMAScript for XML.
The length of attr_prefix must be just one character and not be empty.

=head2 xotree.xmlDecl = '';

This library generates an XML declaration on writing an XML code per default.
This property forces to change or leave it empty.

=head2 tree = xotree.parseXML( xmlsrc );

This method loads an XML document using the supplied string
and returns its JavaScript object converted.

=head2 tree = xotree.parseDOM( domnode );

This method parses a DOM tree (ex. responseXML.documentElement)
and returns its JavaScript object converted.

=head2 tree = xotree.parseHTTP( url, options );

This method loads a XML file from remote web server
and returns its JavaScript object converted.
XMLHTTPRequest's synchronous mode is always used.
This mode blocks the process until the response is completed.

First argument is a XML file's URL
which must exist in the same domain as parent HTML file's.
Cross-domain loading is not available for security reasons.

Second argument is options' object which can contains some parameters:
method, postBody, parameters, onLoading, etc.

This method requires JSAN's L<HTTP.Request> class or prototype.js's Ajax.Request class.

=head2 xotree.parseHTTP( url, options, callback );

If a callback function is set as third argument,
XMLHTTPRequest's asynchronous mode is used.

This mode calls a callback function with XML file's JavaScript object converted
after the response is completed.

=head2 xmlsrc = xotree.writeXML( tree );

This method parses a JavaScript object tree
and returns its XML source generated.

=head1 EXAMPLES

=head2 Text node and attributes

If a element has both of a text node and attributes
or both of a text node and other child nodes,
text node's value is moved to a special node named "#text".

    var xotree = new XML.ObjTree();
    var xmlsrc = '<span class="author">Kawasaki Yusuke</span>';
    var tree = xotree.parseXML( xmlsrc );
    var class = tree.span["-class"];        # attribute
    var name  = tree.span["#text"];         # text node

=head2 parseHTTP() method with HTTP-GET and sync-mode

HTTP/Request.js or prototype.js must be loaded before calling this method.

    var xotree = new XML.ObjTree();
    var url = "http://example.com/index.html";
    var tree = xotree.parseHTTP( url );
    xotree.attr_prefix = '@';                   // E4X-style
    alert( tree.html["@lang"] );

This code shows C<lang=""> attribute from a X-HTML source code.

=head2 parseHTTP() method with HTTP-POST and async-mode

Third argument is a callback function which is called on onComplete.

    var xotree = new XML.ObjTree();
    var url = "http://example.com/mt-tb.cgi";
    var opts = {
        postBody:   "title=...&excerpt=...&url=...&blog_name=..."
    };
    var func = function ( tree ) {
        alert( tree.response.error );
    };
    xotree.parseHTTP( url, opts, func );

This code send a trackback ping and shows its response code.

=head2 Simple RSS reader

This is a RSS reader which loads RDF file and displays all items.

    var xotree = new XML.ObjTree();
    xotree.force_array = [ "rdf:li", "item" ];
    var url = "http://example.com/news-rdf.xml";
    var func = function( tree ) {
        var elem = document.getElementById("rss_here");
        for( var i=0; i<tree["rdf:RDF"].item.length; i++ ) {
            var divtag = document.createElement( "div" );
            var atag = document.createElement( "a" );
            atag.href = tree["rdf:RDF"].item[i].link;
            var title = tree["rdf:RDF"].item[i].title;
            var tnode = document.createTextNode( title );
            atag.appendChild( tnode );
            divtag.appendChild( atag );
            elem.appendChild( divtag );
        }
    };
    xotree.parseHTTP( url, {}, func );

=head2  XML-RPC using writeXML, prototype.js and parseDOM

If you wish to use prototype.js's Ajax.Request class by yourself:

    var xotree = new XML.ObjTree();
    var reqtree = {
        methodCall: {
            methodName: "weblogUpdates.ping",
            params: {
                param: [
                    { value: "Kawa.net xp top page" },  // 1st param
                    { value: "http://www.kawa.net/" }   // 2nd param
                ]
            }
        }
    };
    var reqxml = xotree.writeXML( reqtree );       // JS-Object to XML code
    var url = "http://example.com/xmlrpc";
    var func = function( req ) {
        var resdom = req.responseXML.documentElement;
        xotree.force_array = [ "member" ];
        var restree = xotree.parseDOM( resdom );   // XML-DOM to JS-Object
        alert( restree.methodResponse.params.param.value.struct.member[0].value.string );
    };
    var opt = {
        method:         "post",
        postBody:       reqxml,
        asynchronous:   true,
        onComplete:     func
    };
    new Ajax.Request( url, opt );

=head1 AUTHOR

Yusuke Kawasaki http://www.kawa.net/

=head1 COPYRIGHT AND LICENSE

Copyright (c) 2005-2006 Yusuke Kawasaki. All rights reserved.
This program is free software; you can redistribute it and/or
modify it under the Artistic license. Or whatever license I choose,
which I will do instead of keeping this documentation like it is.

=cut
// ========================================================================
*/



(function (Local) {
	"use strict";

	Local.Format = function (owner) {
		var that = owner || {};
		
		// Borrowed: http://blog.stchur.com/2007/04/06/serializing-objects-in-javascript/
		// works differently than JSON.stringify. Why? JSON.stringify won't convert functions.
		var Serialize = function (thsobj) {
			var result;

			var serialize = function () {
				switch (typeof thsobj) {
					// numbers, booleans, and functions are trivial:
					// just return the object itself since its default .toString()
					// gives us exactly what we want
					case 'number':
					case 'boolean':
					case 'function':
						return thsobj;

					// for JSON format, strings need to be wrapped in quotes
					case 'string':
						return '\'' + thsobj + '\'';

					case 'object':
					var str;
					if (thsobj.constructor === Array || typeof thsobj.callee !== 'undefined')
					{
						str = '[';
						var i, len = thsobj.length;
						for (i = 0; i < len-1; i+=1) { str += serialize(thsobj[i]) + ','; }
						str += serialize(thsobj[i]) + ']';
					}
					else
					{
						str = '{';
						var key;
						for (key in thsobj) { 
							if (thsobj.hasOwnProperty(key)) {
								str += key + ':' + serialize(thsobj[key]) + ',';
							}
						}
						str = str.replace(/\,$/, '') + '}';
					}
					return str;

					default:
						return 'UNKNOWN';
				}
			};
			result = serialize();
			return result.toString();

		};
		that.Serialize = Serialize;

		var formatJson = function (val) {
			var retval = ''
				, str = val
				, pos = 0
				, strLen = str && str.length
				, indentStr = '&nbsp;&nbsp;&nbsp;&nbsp;'
				, newLine = '<br />'
				, char = ''
				, i
				, k
				, j;

			for (i=0; i<strLen; i+=1) {
				char = str.substring(i,i+1);

				if (char === '}' || char === ']') {
					retval = retval + newLine;
					pos = pos - 1;
					for (j=0; j<pos; j+=1) {
						retval = retval + indentStr;
					}
				}
				retval = retval + char;
				if (char === '{' || char === '[' || char === ',') {
					retval = retval + newLine;
					if (char === '{' || char === '[') {
						pos = pos + 1;
					}
					for (k=0; k<pos; k+=1) {
						retval = retval + indentStr;
					}
				}
			}
			return retval;
		};
		that.formatJson = formatJson;
		
		/**
		sprintf() for JavaScript 0.7-beta1
		http://www.diveintojavascript.com/projects/javascript-sprintf

		Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
		All rights reserved.

		Redistribution and use in source and binary forms, with or without
		modification, are permitted provided that the following conditions are met:
		    * Redistributions of source code must retain the above copyright
		      notice, this list of conditions and the following disclaimer.
		    * Redistributions in binary form must reproduce the above copyright
		      notice, this list of conditions and the following disclaimer in the
		      documentation and/or other materials provided with the distribution.
		    * Neither the name of sprintf() for JavaScript nor the
		      names of its contributors may be used to endorse or promote products
		      derived from this software without specific prior written permission.

		THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
		ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
		WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
		DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
		DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
		(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
		LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
		ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
		(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
		SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


		Changelog:
		2010.09.06 - 0.7-beta1
		  - features: vsprintf, support for named placeholders
		  - enhancements: format cache, reduced global namespace pollution

		2010.05.22 - 0.6:
		 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
		 Note:
		 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
		 who warned me about a bug in 0.5, I discovered that the last update was
		 a regress. I appologize for that.

		2010.05.09 - 0.5:
		 - bug fix: 0 is now preceeded with a + sign
		 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
		 - switched from GPL to BSD license

		2007.10.21 - 0.4:
		 - unit test and patch (David Baird)

		2007.09.17 - 0.3:
		 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

		2007.09.11 - 0.2:
		 - feature: added argument swapping

		2007.04.03 - 0.1:
		 - initial release
		**/

		var sprintf = (function() {
			function get_type(variable) {
				return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
			}
			function str_repeat(input, multiplier) {
				var output;
				for (output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
				return output.join('');
			}

			var str_format = function() {
				if (!str_format.cache.hasOwnProperty(arguments[0])) {
					str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
				}
				return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
			};

			str_format.format = function(parse_tree, argv) {
				var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
				for (i = 0; i < tree_length; i++) {
					node_type = get_type(parse_tree[i]);
					if (node_type === 'string') {
						output.push(parse_tree[i]);
					}
					else if (node_type === 'array') {
						match = parse_tree[i]; // convenience purposes only
						if (match[2]) { // keyword argument
							arg = argv[cursor];
							for (k = 0; k < match[2].length; k++) {
								if (!arg.hasOwnProperty(match[2][k])) {
									throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
								}
								arg = arg[match[2][k]];
							}
						}
						else if (match[1]) { // positional argument (explicit)
							arg = argv[match[1]];
						}
						else { // positional argument (implicit)
							arg = argv[cursor++];
						}

						if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
							throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
						}
						switch (match[8]) {
							case 'b': arg = arg.toString(2); break;
							case 'c': arg = String.fromCharCode(arg); break;
							case 'd': arg = parseInt(arg, 10); break;
							case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
							case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
							case 'o': arg = arg.toString(8); break;
							case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
							case 'u': arg = Math.abs(arg); break;
							case 'x': arg = arg.toString(16); break;
							case 'X': arg = arg.toString(16).toUpperCase(); break;
						}
						arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
						pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
						pad_length = match[6] - String(arg).length;
						pad = match[6] ? str_repeat(pad_character, pad_length) : '';
						output.push(match[5] ? arg + pad : pad + arg);
					}
				}
				return output.join('');
			};

			str_format.cache = {};

			str_format.parse = function(fmt) {
				var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
				while (_fmt) {
					if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
						parse_tree.push(match[0]);
					}
					else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
						parse_tree.push('%');
					}
					else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
						if (match[2]) {
							arg_names |= 1;
							var field_list = [], replacement_field = match[2], field_match = [];
							if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
								while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
									if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
										field_list.push(field_match[1]);
									}
									else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
										field_list.push(field_match[1]);
									}
									else {
										throw('[sprintf] huh?');
									}
								}
							}
							else {
								throw('[sprintf] huh?');
							}
							match[2] = field_list;
						}
						else {
							arg_names |= 2;
						}
						if (arg_names === 3) {
							throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
						}
						parse_tree.push(match);
					}
					else {
						throw('[sprintf] huh?');
					}
					_fmt = _fmt.substring(match[0].length);
				}
				return parse_tree;
			};

			return str_format;
		})();
		that.sprintf = sprintf;

		var vsprintf = function(fmt, argv) {
			argv.unshift(fmt);
			return sprintf.apply(null, argv);
		};
		that.vsprintf = vsprintf;
		return that;
	};
}(bx));
