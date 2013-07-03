---
layout: sidebar
---

### BoxspringJS API Reference

* [Initialize a database object](#create-db)

* [Database methods](#database-methods)

	* [heartbeat](#heartbeat) - verify the existence of the server
	* [session](#session) - authenticate a name/password for a session
	* [all_dbs](#all_dbs) - generate a list of available databases
	* [all_docs](#all_docs) - generate a list of documents for a given database
	* [db_info](#db_info) - return statistics and vital information about a database
	* [save](#save) - save a database definition to the server
	* [remove](#remove) - remove a database from the server
	* [doc](#doc) - instantiate a new document object
	* [bulk](#bulk) - instantiate a new bulk document object
	* [design](#design) - instantiate a new design document object
	* [login](#login) - authenticate a user and update the credentials
	* [logout](#login) - remove a user session

* [User account methods](#authentication-methods)
	* [fetch](#getUser) - determine if a `name` is already exists
	* [signUp](#signUp) - create a new user account
	* [update](#updateUser) - update the `password` for a user account
	* [delete](#deleteUser) - remove a user account from the system

* [Document methods](#document-methods)

	* [source](#source) *alias docinfo()* - setter/getter for document content
	* [save](#save) *alias create()* - save document to server
	* [retrieve](#retrieve) - fetch document from server
	* [update](#update) - create a new revision of document with updated content
	* [remove](#remove) *alias delete()* - remove the document from the server
	* [head](#head) - get the http request header for a document
	* [Helper functions](#helper-functions)
		* [info](#info) - get the revision information for a document
		* [exists](#exists) - returns true if the document exists on the server
		* [docId](#docId) - returns an object with the document identifier
		* [docRev](#docRev) - returns an object with the document revision
		* [docHdr](#docHdr) - returns an object with the identifier and revision
		* [url2Id](#url2Id) - formats a URL to a valid document identifier

* [Bulk methods](#bulk-methods)

	* [max](#max) - the maximum number of documents to save for any single http request
	* [push](#bulkpush) - add a document to the list of documents to save
	* [status](#bulkstatus) - returns an array with vitals on any document that failed to save
	* [save](#bulksave) - saves the list of documents to the server
	* [remove](#bulkremove) - removes the list of documents from the server
	* [getLength](#bulkgetlength) - returns the number of documents awaiting bulk save/remove
	* [fullCommit](#fullcommit) - tell server to verify the data before issues success

* [Design methods](#design-methods)

	* [Defining a design document](#custom)
	* [commit](#commit) - add properties to and update a document without fetching it from the server
	* [system](#design-system) - system properties to define asynchronous query behavior
	* [query](#design-query) - master query method
	* [fetch](#design-get) - lower-level query method

* [Query/Result methods](#query-result-methods)
	* [query events](#query-events)
	* [result helper methods](#result-helper-methods)

* [Rows/Row/Cell methods](#rows-methods)
	* [rows collection helper methods](#rows-collection-helper-methods)
	* [row helper methods](#row-helper-methods)
	* [cell helper methods](#cell-helper-methods)

* [Display methods](#display-methods)

<a name="create-db" style="padding-top:100px;"> </a>
####Boxspring([options])

Returns a function that takes a `url` string to produce a database object. 

Pass in a string `name` for the name of the database on the server, or supply an `object` with properties to define the object such as database `name`, `auth` credentials. Additional properties (see table below) include the `designName`, design document `maker` function, and the name of the view `index` to use for querying the database. 

To instantiate a new database, invoke these objects with the __url__ string describing your database server.

	Maker = Boxspring('mydb');
	mydb = Maker('http://www.some-url.com');

The `clone()` method generates create a copy of the object with a new `id`.  

> Note: Creating a database object does not create the database on the server. For that use the `save()` method of the database object.

		// create a new database template
        var Mydb = Boxspring({'name': 'my-db', 'auth': auth })
		, dblocal = Mydb('127.0.0.1)
		, dbpublic = Mydb('https://www.somwhere-out-there.com');
		
		// same database name, same authentication, different objects
		console.log(dblocal.name === dbpublic.name, dblocal === dbpublic);
		// -> true, false

Some built-in Boxspring properties are defined in the table below.
        
<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>id</td>
    <td>String</td>
    <td>System generated</td>
    <td>Unique id for this database object</td>
  </tr>
  <tr>
    <td>index</td>
    <td>String</td>
    <td>"Index"</td>
    <td>The default map/reduce view for this database</td>
  </tr>
  <tr>
    <td>designName</td>
    <td>String</td>
    <td>"_design/default"</td>
    <td>The name of the design document describing map/reduce views to use for this session. Note: If this design document is not already existing on the server, you will have to save it to the server first.</td>
  </tr>
  <tr>
    <td>maker</td>
    <td>Function</td>
    <td></td>
    <td>A function that returns a design document object</td>
  </tr>
  <tr>
    <td>auth</td>
    <td>object</td>
    <td></td>
    <td>{ auth: { name: "user-name", password: "secret-password" }}</td>
  </tr>
</table>

###Library Modules

- [Queue object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
- [Tree object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
- [Hash object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
- [File I/O object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
- [ObjTree object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
- [Utilities](https://github.com/rranauro/boxspringjs/blob/master/db.md)

###Dependencies

- [CouchDB]
- [Node.js]
- [Underscore]
- [Backbone]

<a name="database-methods"> </a>
###Database methods

The database API provides a uniform interface to CouchDB database services for server side access via Node.js using `require('http').request` and browser sessions via jQuery `$.ajax()`. 

> Please refer to [Complete HTTP API Reference](http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference) for details on CouchDB database service operations and return values.

####Summary

- [heartbeat](#heartbeat)
- [session](#session)
- [login](#login)
- [all_dbs](#all_dbs)
- [all_docs](#all_docs)
- [all_docs](#db_info)
- [save](#save)
- [remove](#remove)
- [doc](#doc)
- [bulk](#bulk)
- [design](#design)
- [Authentication](#authentication-methods)

####Methods

<a name="heartbeat"> </a>
#####heartbeat(callback)

Confirm the connection to the server with no authentication.

        mydb.heartbeat(function(err, response) {
        
            if (err) {
                return console.log('error connecting to the server', err);
            }
            
            // continue on with the application....
            
        }


> **Note about the <em>BoxspringJS Response Object</em>** 

> All BoxspringJS http request methods provide the callback two arguments: <code>err</code> and a <code>response</code> object. <code>err</code> is the <code>Error</code> object thrown by the request method if an unexpected http response is given, i.e., anything code greater than or equal to <code>400</code>. The <code>response</code> object will always have the following four properties, some of which may not be filled in:

<a name="response-object"> </a>
<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>code</td>
    <td>Number</td>
    <td>[http status codes](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)</td>
  </tr>
  <tr>
    <td>header</td>
    <td>Object</td>
    <td>The http request header</td>
  </tr>
  <tr>
    <td>request</td>
    <td>Object</td>
    <td>The request object, including <code>hostname, port, path, method, and body</code></td>
  </tr>
  <tr>
    <td>data</td>
    <td>Object</td>
    <td>The parsed result of the request.</td>
  </tr>
</table>

<a name="session"> </a>
#####session(callback)

Authenticate this user on the server.

<a name="login"> </a>
####login(callback)

Logs a user into the system and updates her credentials for subsequent document read/write activity. 

> Unless there is an `http` error, the `err` object in the callback will always be `null`. A successful login will return code `200`. A bad username or password will return code `409` in the response object.

<a name="all_dbs"> </a>
#####all_dbs(callback)

Return a list of all databases available on the server.

<a name="all_docs"> </a>
#####all_docs(callback)

Return a list of all documents contained in this database.

<a name="db_info"> </a>
#####db_info(callback)

Return an object with details of the database on the server.

    mydb.db_info(function(err, response) {
        
        if (err) {
            return console.log('error connecting to the server', err);
        }
            
        /* From http://wiki.apache.org/couchdb/HTTP_database_API#Database_Information
        {   "compact_running": false, 
            "db_name": "my-db", 
            "disk_format_version": 5, 
            "disk_size": 12377, 
            "doc_count": 1, 
            "doc_del_count": 1, 
            "instance_start_time": "1267612389906234", 
            "purge_seq": 0, 
            "update_seq": 4 }
        */
        
        // access from response.data
        console.log(response.data.db_name); // 'my-db'
    }    

<a name="save"> </a>
#####save(callback)

Create this database on the server. Server will return a 401 `UNAUTHORIZED` if the database is already existing or 409 `CONFLICT` if you do not have permission for this database.

<a name="remove"> </a>
#####remove(callback)

Remove this database from the server.

<a name="doc"> </a>
#####doc(id)

Create an object describing document with `id=id`.

> Note: Creating a document object does not create the document on the server. For that you must call the <code>save</code> method of the document object.

> If you do not provide an id for the document, one will be created for it.

	var mydoc = mydb.doc('my-doc);

	console.log(mydoc).source();
	// -> { '_id', 'my-doc' } );
	
*See [Document methods](doc-methods)*

<a name="bulk"> </a>
#####bulk([doclist])

Create an object for loading and removing lists of documents. `doclist` is a JavaScript array of JSON objects produced by calling the `source()` method of a document object without any arguments.

  	var mybulk = mydb.bulk([mydoc1.source(), mydoc2.source()])
		.save(function(err, response) {
			if (err) {
				// handle error and return;
			}
		
			// response object has status information for each save
			mybulk.status().forEach(function(doc) {
				if (doc) {
					// handle failed document save
				}
			})
	});

See [Bulk methods](#bulk-methods)
	
<a name="design"> </a>
#####design(name, maker, index)

Create a design document named `name`. `maker` defines a function that returns an object containing a [CouchDB design document][1]. `index` refers to a `map()/reduce()` function described by the design document.

See [Design methods](#design-methods)

[1] http://guide.couchdb.org/draft/design.html

<a name="authentication-methods"> </a>
####users(name, [adminDb])

Create a `users` object for signing up new users `signUp`, removing them `remove`, and updating their `name`, `pasword`, and optional `roles`. 

	// Example
	var Mydb = Boxspring('some-db')
	, mydb = Mydb('127.0.0.1').users('new-username');
	
	mydb.signUp('some-password', [ 'roles' ], function(err, response, newDb) {
		if (err) {
			// handle the error
		}
		// newDb is an object with the logged in user just created.
	});
	

__Overview__

Authentication methods are built-in to the database object. Access to all but the `login` method are restricted to database objects created with administrative privilege. The format of the `authentication` object is shown below:

> The `signUp` method can be run anonymously to allow users to create their own accounts. __Therefore there is no need for the application to store an administrative password that could be hacked__. The `fetch`, `update`, and `delete` methods require administrative privilege on the system to fulfill their requests.

<a name="authentication-object"> </a>

	// Authentication object
	{ 'name': 'some-name', 'password': 'secret-password' };
	
When a database object is created with an authentication object the authentication object remains hidden and available to the server for all subsequent requests. __There is no reason for the application to maintain the authorization object once a database object has been created.__ Once the `login` method is run the database object is updated with the users roles and access credentials. These credentials are used for controlling read/write access to documents on the system by various [update_handlers](http://wiki.apache.org/couchdb/Document_Update_Handlers).

When a new user account is created using `signUp` the server [hashes the password](http://wiki.apache.org/couchdb/Security_Features_Overview) and stores it with the user document. __Thus the original password cannot be recovered from the server and a user who forgets his password will have to be prompted by the application to create a new password.__ The `updateUser` account method updates user document on the server.

> When creating a new user account, `signUp` will fail if the requested `name` in the authentication object is already existing by some other user. To limit the likelihood of name clashes, it is recommended to require a valid email address as the `name` for all user accounts.

>When updating, `updateUser` by definition will update a user account with the new `password` and credentials. To confirm that the requesting user is the owner of the account, the application can check the existence of the old user account with `fetch`, update the user account with its own hashed `password` and email the new password to the user. Once the user re-enters the system with the hashed password he can change his password to his preference and the application can safely update the new `password` using `updateUser`.

The `deleteUser` method removes user accounts from the system. __This operation is not reversible.__

> __With the exception of `login` all authentication methods require administrative privilege.__ 

<a name="signUp"> </a>
####signUp(authObject, roles, callback)

Takes an [authorization object](#authentication-object) and an array of of application defined roles. Returns an error code `409` in the response object of the callback if the requested `name` is already taken. Otherwise proceeds to add the user to the system and returns the callback with the response and a database object.

	// Example
	mydb = Boxspring('mydb')().users('newuser');
	mydb.signUp('newuserpassword', [], function(err, response, newDb) {
		if (err) {
			if (response.code === 409) {
				// name 'some-user' is already taken.
			} else {
				// some other error
			}
		}
		// 'newDb' is a database object already logged in
		console.log(response.code);
		// -> 200
	});

<a name="getUser"> </a>
####getUser(name, callback)

Confirm the existence of `name` and returns the user document.

  	// Example
	mydb.get('some-user', function(err, response, doc) {
		if (err) {
			// 401 unauthorized
		}
		console.log(doc.source().type, doc.source().name);
		// -> 'user', 'some-user'
	});

<a name="updateUser"> </a>	
####update(newPassword, newRoles, callback)

Use this method to change the `password` or `roles` for a user. __Requires administrative privilege.__

<a name="delete"> </a>
####deleteUser(callback)

Use this method to remove a `name` from the system. __Requires administrative privilege.__

> Caution: This operation cannot be reversed.

<a name="document-methods"> </a>
###Document methods

The document object, invoked from a [database object](https://github.com/rranauro/boxspringjs/blob/master/db.md#doc)
provides methods to manage document creation, updating, and removal of documents. Once the document is retrieved from the server, the object maintains the [revision id](http://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields) freeing the programmer to focus on managing the actual content of the document.

Some helper functions are provided so that other object can access information about the document without needing to know too much about the internal structure of a document.

####Summary
- [source](#source) __alias docinfo()__
- [save](#save) __alias create()__
- [retrieve](#retrieve)
- [update](#update)
- [remove](#remove) __alias delete()__
- [info](#info)
- [head](#head)

<a name="helper-functions"> </a>
*Helper functions*

- [exists](#exists)
- [docId](#docId)
- [docRev](#docRev)
- [docHdr](#docHdr)
- [url2Id](#url2Id)

<a name="source"> </a>
#####source([json-object])

Set/get the contents of the document. If you supply a JSON object as an argument to `source()`, the contents of the object will be used to extend the document's contents. When used this way the document `save()` method can be chained to `source()` to populate the documents content and save it to the server:

	// Example: Adding content and updating a document
	var mydoc = mydb.doc('my-doc');
	mydoc.source({'content': 'some-data' }).update(function(err, response) {
		if (err) {
			// handle the error and return;
		}
		// calling mydoc.source() with no arguments shows that the document
		// revision _rev reflects the latest rev.
		console.log(mydoc.source());
		// ->
		{	'_id': 'my-doc', 
			'_rev': '1-3124e051ba16af0da859597e35dfa875',
			'content': 'some-data' }
	});

By persisting this information about the document you can use the same document object to simplify updating document contents and save the document repeatedly within a session.

> Note 1: You must supply a property owner for your new document content or else the `_id` and `_rev` information will be over-written and subsequent save requests will fail.

> Note 2: Calling `source(object)` to update the contents of a document does not save it to the server. For that you must call `doc.save()`

__Alias: docinfo()__

<a name="create"> </a>
#####save(callback)

Save the contents of a document object to the server.

Alias: save(callback)

<a name="read"> </a>
######retrieve(callback)

Read the contents of a document from the server, and update the document object with it.

	// Example: fetching a document from the server
	var mydoc = mydb.doc('my-doc').retrieve(function(err, response) {
		if (err) {
			// handle the error
		}
		console.log(mydoc.source());
		// -> contents document from the server, including _id and _rev information
	});

Alias: retrieve(callback)

<a name="update"> </a>
#####update(callback)

Use this method to update the contents of a document existing on the server.

> Note 1: If the document does not already exist on the server, then update will create it.

> Note 2: The document resulting on the server will be over-written with the contents of your document object, except the _id and _rev information.  If this is not what you want, then you should be sure to issue a `retrieve()` followed by `update()`.

	// Augmenting the contents of a document on the server.
	var mydoc1 = mydb.doc('mydoc1').source({'contents' : 'some-data' });
	
	mydoc1.save(function(err, response) {
		if (err) {
			// handle error
		}
		// add data to a property not already a part of the document
		mydoc1.source({'more-content': 'more-data' })
			.update(function(err, response) {
				if (err) {
					// handle error
				}
				console.log(mydoc1.source());
				/* ->
				{ 	'_id': ...,
					'_rev': ...,
					'contents': 'some-data',
					'more-content: 'more-data }
				*/ 
			});
	});
	
	>

		//Over-writing the contents of a document on the server.
		var mydoc2 = mydb.doc('mydoc1');
	
		mydoc2.read(function(err, response) {
			if (err) {
				// handle error
			}
			mydoc2.source({'contents': 'new-data' })
				.update(function(err, response) {
					if (err) {
						// handle error
					}
					console.log(mydoc2.post());
					/* ->
					{ 	'_id': ...,
						'_rev': ...,
						'contents': 'new-data' }
					*/ 
				});
		});  

<a name="delete"> </a>
#####remove(callback)

Remove a document from the database server.

Alias: remove(callback)

<a name="info"> </a>
#####info(callback)

Get the revision information for a document.

<a name="head"> </a>
#####head(callback)

Get the http request header for a document.

> Use head when you only need to test the existence of a document on the server. 

####Helper functions

#####Document Hash

Document content can be manipulated by the full set of [object hash functions](https://github.com/rranauro/js-hash/blob/master/README.md) available in `js-hash`. 

<a name="exists"> </a>
#####exists()

Helper function, returns true if the document exists on the server.

> Only useful after `head()` or `retrieve()` or `save()`

<a name="docId"> </a>
#####docId()

Helper function, returns an object containing the unique document identifier.

	var mydoc = mydb.doc('my-doc');
	
	console.log(mydoc.docId());
	// -> { '_id': 'my-doc' }

<a name="docRev"> </a>
#####docRev()

Helper function, returns an object containing the latest revision of the document on the server.

> Only useful after `head()` or `retrieve()` or `save()`

<a name="docHdr"> </a>
#####docHdr(object or name, value)

Set/get the header hash for a document object. If the argument is an object, it replaces the header with the object. Incrementally update the header by calling `docHdr` repeatedly with `name/value`. Returns an object with `headers` property whose value is the a collection of `name=value`.

<a name="url2Id"> </a>
#####url2Id(url, reverse)

Helper function, converts a `url` to a valid document identifier, or if `reverse=true` converts an id to a valid `url`.

<a name="bulk-methods"> </a>
###Bulk document methods

The bulk document object, invoked from a [database object](https://github.com/rranauro/boxspringjs/blob/master/db.md#bulk) wraps the [Couchdb bulk document API](http://wiki.apache.org/couchdb/HTTP_Bulk_Document_API) with methods for saving, modifying, and removing documents from the database in bulk. The `max()` method allows the programmer to supply a limit to the number of documents to include in any single `save()` request. When specified, any bulk request will be parceled out in `max()` size chunks until all requested documents have been saved. 

	// Example: Using bulk and max; checking with status
	var mybulk = mydb.bulk([{'_id': 'doc1'}, {'_id': 'doc1'}]);
	
	// save one at a time
	mybulk.max(1);
	
	// save the documents
	mybulk.save(function(err, response) {
		if (err) {
			// handle the error
		}
		response.status().forEach(function(failed) {
			if (failed) {
				console.log(failed);
				// -> {"id":"doc1","error":"conflict","reason":"Document update conflict."}
			}
		});
	});

> By default, Boxspring bulk processing methods will detect if a member of the list of documents is a document object and convert it to a document source as required by the databases bulk processor. Over-ride this behavior by setting the `prohibit` option when instantiating the bulk object.

	// Prohibit automatic conversion of doc objects to doc sources
	mydb.bulk([mydb.doc('some-doc').source({'some':'data'}), ...], true);
	mydb.save(function(err, response) {
		if (err) {
			console.log(err);
			// -> bad argument
		}
	})

####Summary
- [max](#max)
- [push](#bulkpush)
- [status](#bulkstatus)
- [save](#bulksave)
- [remove](#bulkremove)
- [getLength](#bulkgetlength)
- [fullCommit](#fullcommit)

<a name="max"> </a>
#####max(maximum)

Limit the maximum number of documents to include in any single bulk operation. For example, when saving a million documents, `max(10000)` would result in 100 discrete bulk http requests to complete the operation. The `save()` or `remove()` operation will issue its callback only after all requests have been completed. The success or failure of any individual document operation will be available by iterating over the output of `status()`.

<a name="bulkpush"> </a>
#####push(document, callback)

Adds another document to the list and issues a `save()` when the number of documents in the list equals the value set by `max()`. At the initiation of the `save()` the list is cleared and at the completion of the http request operation the callback is executed along with its error and response status.

> Used in combination with `max()`, a client application can continuously add documents for bulk processing while http requests are parceled out in even chunks, thereby keeping a lid on the total amount of memory consumed by the client and the traffic on the network.

<a name="status-example"> </a>
	// Example: Using status()
	var mybulk = mydb.bulk().max(1);
	
	[{'_id':'doc1'}, {'_id':'doc2'}].forEach(function(doc) {
		mybulk.push(doc, function(err, response) {
			console.log(response.status());
			// -> [false]
			// -> [false]
		});
	});

<a name="bulkstatus"> </a>
#####status()

Returns an array object with `false` at the index for any document that succeeded, and an `object` returned by the server describing an update conflict. See [status example](#status-example)
	

<a name="bulksave"> </a>
#####save(callback)

Initiates the bulk save (or update) operation.

> Note 1: If your database object specifies [design document](#design-methods), and your design document specifies an `updates()` function, then `save()` will attempt to apply that function to each document in the supplied array.  

> Note 2: If you are updating existing documents on the server, you will have to supply a revision number for the document. In practice you will have to [retrieve the documents in bulk](#all_docs) and [create a document object](#doc) prior to calling `bulk()`.  A better alternative to bulk saving existing documents may be to use the `updates()` mechanism available through the [design document](#design-methods) methods.

	// Example of bulk.push() in action
	var mydb = boxspring('my-db)
	, docs = [];
	
	mydb.all_docs(function(err, response) {
		if (err) {
			// handle error
		}
		// loop over the array of documents
		response.data.forEach(function(doc) {
			// update the content and push the content of the document, not the document object
			// onto the docs array
			docs.push(mydb.doc(doc._id).source({'content': 'some-new-content'}).source());
		});
		// update all documents on the server 
		mydb.bulk(docs).max(100).save();
	});
	
*See also [design updates](#design-methods)*

<a name="bulkremove"> </a>
#####remove(callback)

Removes a list of documents from the server. `remove()` will issue a [`doc.head()`](#head) request for each document to get its revision and to mark the document for deletion. There is no queueing for bulk `remove()` so you should be sure your client has enough memory to store the array of documents you are removing, bearing in mind all you need to provide to `remove()` is an object containing the document identifier as in `{ '_id': 'identifier' }`. You can get this by calling `doc.docId()` on any document object.

	var mybulk = mydb.bulk([{'_id': 'doc1'}, {'_id': 'doc2'}])
	, failed = 0;
	
	mybulk.remove(function(err, response) {
		if (err) {
			// handle the error
		}
		response.status().forEach(function(doc) {
			if (doc) {
				failed += 1;
			}
		})
		console.log(failed, response.status());
		// -> 0, [ false, false ]
		// response.status() entries only have data when something fails
	});
	

<a name="getLength"> </a>
#####getLength()

Returns the number of documents currently being processed.


<a name="fullcommit"> </a>
#####fullCommit(fullCommitObject)

Supply an object to update the `X-Couch-Full-Commit` request header. By default, `X-Couch-Full-Commit` is set to `false`. From what I can tell, this allows the server to issue a response to the client without verifying that every last bit of the files have been updated on disk. Presumably, setting `X-Couch-Full-Commit` to `true` will slow things down.

<a name="design-methods"> </a>
###Design document methods

The design document object, invoked from a [database object](#design) allows you to define and execute map/reduce functions in your client (Node.js or browser), and commit them to the server. The definition of a map/reduce view index on the design document is the natural place for describing your data. BoxspringJS uses the flexible design document structure to allow you to define a `header` where key/column labels are defined.


	//The default design document included in BoxspringJS is shown here:
	var defaultDesign = function () {
		// Note: CouchdDB defines toJSON globally to its environment, this won't be there on the server
		var toJSON = function(o) {
			return(JSON.stringify(o));
		};
		// Note: This code may run on the server, where exports may not be defined.
		if (typeof exports === 'undefined') {
			var exports = {};
		}

		// This is the part that get installed on the Server.
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
				'Index': {
					'map': function (doc) {
						if (doc && doc._id) {
							emit(doc._id, doc);
						}
					},
					'reduce': function(keys, values, rereduce) {
						if (rereduce) {
							return sum(values);
						}
						return values.length;
					},
					'header': {
						'sortColumn': '_id',
						'keys': ['_id'],
						'columns': ['_id', 'doc']
					}
				}			
			},
			'shows': {},
			'lists': {}
		});
	};

####Summary

- [Defining a design document](#custom)
- [commit](#commit)
- [system](#design-system)
- [query](#design-query)
- [fetch](#design-get)

#####Defining a design document

<a name="custom"> </a>
> BoxspringJS unobtrusively extends the design document with header, type, and formatting to simplify downstream view processing. There is no requirement that these data be provided, nor does the data interfere with any native database properties. There are three principal extensions:

__types: domain specific data types__

__formats: domain specific formatting methods__

__header: key/column labels__

*To define your own design document, do the following:*

__Step 1: Define a design document maker function__

	// Example design document maker function
	var ddoc = function () {
		return ({
			"updates": {
				"my-commit": function (doc, req) {
					doc['last-updated'] = Date();
					doc.size = JSON.stringify(doc).length;
					doc.junk = 'another-try';
					return [doc, JSON.stringify(doc) ];
				}
			},
			'types': {
				'_id': ['string', 1],
				'_rev': ['string', 1],
				'doc': ['object', 4],
				'content': ['string', 2],
				'more-content': ['string', 2]			
			},
			"views": {
				'lib': {
					// formats is used by the cell object to provide domain specific formatting
					// of data base on the data type.
					'formats': function() {
						var formatter = function(name) {
							return 'formatted: ' + name;
						}
						return({
							'_id': formatter,
							'_rev': formatter
						});
					}
				},
				'my-view': {
					'map': function (doc) {
						if (doc && doc._id) {
							emit(doc._id, doc);
						}
					},
					'header': {
						'sortColumn': 'doc',
						'keys': ['_id'],
						'columns': ['_id', 'doc', 'content', 'more-content', '_rev' ]
					}
				}
			}
		});
	}

__Step 2: Instantiate a design document object__

	// give it your design name, the maker function, and the view you want to use from this design
	var mydesign = mydb.design('my-design', ddoc, 'my-view');

__Step 3: Save the new design document to the server__

	// mydesign.ddoc is a document object. Its contents are the design document. 'update' is a
	// method of the document object
	mydesign.ddoc.update(function(err, response) {
		if (err) {
			// handle the error
		}
		// continue on with the application
	});

<a name="commit"> </a>
#####commit(id, updateName, documentProperties, callback)


Update the contents of a document directly on the server, without retrieving it from the server first.

<table>
  <tr>
    <th>Argument</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>id</td>
    <td>String</td>
    <td>Unique id for the document to update</td>
  </tr>
    <tr>
    <td>updateName</td>
    <td>String</td>
    <td>The name of the update method in our design document. In the example above, this would be "my-commit"</td>
  </tr>
    <tr>
    <td>documentProperties</td>
    <td>Object</td>
    <td>An object containing key/value pairs to be added to the document. Note that these will be added to the top level of the document and will over-write existing key/values with the same name. Nested key/values are not allowed.</td>
</tr>
    <tr>
    <td>callback</td>
    <td>Function</td>
    <td>A function to call when the update completes</td>
  </tr>
</table>

<a name="design-system"> </a>
#####system object

The `design.system` object is a hash used to control the asynchronous behavior of a `query` or `get` request.

<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Default Value</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>asynch</td>
    <td>Boolean</td>
	<td>false</td>
    <td>If true and the `fetch` request specifies a `page-size` option, BoxspringJS will continue to fetch rows of data up to the `cache-limit` and deposit them using the `moreData` callback. When `false`, the `fetch` request will return only the first quantity of rows to the callback, regardless of whether `page-size` is set or not.</td>
  </tr>
  <tr>
    <td>page-size</td>
    <td>Number</td>
    <td>undefined</td>
    <td>The maximum number of rows to return for a single http GET request.</td>
  </tr>
    <tr>
    <td>cache-size</td>
    <td>Number</td>
    <td>Infinite</td>
    <td>The number of `page-size` blocks to fetch from the server.</td>
  </tr>
	  <tr>
    <td>delay</td>
    <td>Number</td>
    <td>0.5</td>
    <td>Time to wait between asynchronous http requests to the server for more data.</td>
  </tr>
</table>

To update the system hash variables, use the following:

	var mydesign = mydb.design().system.update({
		'asynch': true,
		'page-size': 100,
		'cache-size': 10
	});
	
	console.log(mydesign.system.get('asynch'));
	// -> true

<a name="design-query"> </a>
#####query(options)

Query the server, using the `view` defined by the current design document object. The `options` arguments are taken directly from the [CouchDB View API](http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options).

> The `query()` method of the design object relies on `fetch()` to complete its work. Observe that `query()` takes no `callback` argument, instead it uses events to communicate its status. The details of the events `query()` uses to indicate its status are described in the [Query/Result methods](#query-result-methods) section.

<a name="design-get"> </a>
#####fetch(options, callback, moreDataCallback)

Fetch row data from the server using the `view` defined by the current design document object. `options` are the same as used by [`query()`](http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options). When data is returned from the server, `callback` function is executed with the [`response` object](#response-object) and some [helper methods](#rows-methods) to streamline downstream processing and rendering the data.

The `moreDataCallback` function is executed with the [response](#response-object) after the first block of rows are returned to the callback to handle subsequent fetches of data when the system property `asynch=true`.

	// Example get request.
	var mydesign = mydb.design('my-design', ddoc, 'my-view');
	
	// update the system variables
	mydesign.system.update({
		'asynch': true,
		'cache-size: 2,
		'page-size: 10
	});
	
	// define a function to catch the rows not initially displayed
	var moreData = function(err, response) {
		if (!err) {
			console.log(response.offset());
			// -> 1
		}
	};
	
	// get some data;
	mydesign.fetch({}, function(err, response) {
		if (!err) {
			console.log(response.offset());
			// -> 0
		}
	}, moreData);


<a name="query-result-methods"> </a>
###Query/Result methods

The Query/Result object is the heart of the BoxspringJS data model. A `query()` object is instantiated off of the [design document object](#design-query) and it inherits the design's name and design document.

	// Example instantiation of a query object and executing a query
 	var myquery = mydesign.query({});

	// set asynch = true
	mydesign.system.update({'asynch': true, 'cache-size': 10, 'page-size': 100});

	myquery.on('result', function(err, result) {
		// check for errors and process first 100 rows here...
	});
	
	myquery.on('more-data', function(err, result) {
		// check for errors and send more data to the model view, if you like.
	});
	
	// now initiate the query
	myquery.server();

####query events

As depicted in the example above, the `query()` object will trigger the __result__ and __more-data__ events when it has data from the server.

<table>
  <tr>
    <th>Name</th>
    <th>Event</th>
  </tr>
  <tr>
    <td>result</td>
    <td>The server has delivered its first response to the application.</td>
  </tr>
  <tr>
    <td>more-data</td>
    <td>First and subsequent responses when system variable asynch=true</td>
  </tr>
  <tr>
    <td>completed</td>
    <td>All of the rows from the server have been fetched into memory.</td>
  </tr>
</table>

<a name="result-helper-methods"> </a>
#####result helper methods

The result object comes wrapped with methods so that the application can navigate the cache. A `nextPrev()` method provides access to the next or previous "page" of rows available in memory, or if the application has reached the last page available it will increase the `cache-size` by one and on its own will initiate another `fetch()` request to get the next page from the server. __At present, BoxspringJS will accumulate more pages rather than shift the earliest page out of memory.__

######unPaginate()

Returns a `result()` object as though all the pages were fetched in a single http request.

######nextPrev(direction)

Takes a string argument `'next'` or `'previous'` and triggers an event `'on-display'` with the next or previous page of rows from the cache. Does nothing if current page is page 0 and previous page is requested or if on last page and next page is requested.

> Automatically fetches more data from server if on last page of the cache and still more data on server,

######pageInfo()

Returns an object used by the data views to control the session.

<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>completed</td>
	<td>Boolean</td>
    <td>Value equals 'true' when there are no more rows to fetch.</td>
  </tr>
  <tr>
    <td>page</td>
    <td>Number</td>
	<td>The current page.</td>
  </tr>
  <tr>
    <td>pages</td>
    <td>Number</td>
	<td>Total number of pages needed for all rows.</td>
  </tr>
  <tr>
    <td>total-rows</td>
    <td>Number</td>
	<td>The total number of rows for this query.</td>
  </tr>
  <tr>
    <td>page-size</td>
    <td>Number</td>
	<td>The requested page-size from design.system.get('page-size')</td>
  </tr>
  <tr>
    <td>cached-pages</td>
    <td>Number</td>
	<td>The total number of cached pages in memory, for this query</td>
  </tr>
  <tr>
    <td>last-page</td>
    <td>Number</td>
	<td>The index of the last cached page.</td>
  </tr>
</table>


<a name="rows-methods"> </a>
###Rows/Row/Cell methods

The `rows(), row(), and cell() `methods operate on the collection of rows, individual rows, and the key/value components of a row, respectively. First, the [response object](#response-object) from a `fetch()` is wrapped by the `rows()` object, then each individual row is wrapped by `row()`. Finally, key/value elements of individual rows are provided some methods for access, formatting, and type-checking. Any of these methods could be useful to the downstream view processor, and minimize the tedium of the detail data structures.

A `visible` hash object keeps track of key/values requested and found across all rows. For example, when displaying tabular data, if a there is never a value for a key, then it may be possible to hide that column from the display.


	// Example use
	var rowdata = result.visible
	
	// result.each() == [['field1': 'yes!'], ['field2': undefined ]];
	
	result.each().forEach(function(row) {
		console.log(row.select('field1'), row.select('field2));
	});
	// -> 'yes!', undefined
	// -> undefined, undefined
	
	console.log(rowdata.setValues());
	// -> { 'field1': true }

The `rows()` methods provides handy helper functions to iterate over all rows `each()`, get the `first()` and `last()` rows of a collection, and hide the details of the result data structure `offset(), total_rows(), and getLength()`.

<a name="rows-collection-helper-methods"> </a>
####rows collection helper methods

#####each()

Returns an array of rows, wrapped in `row()` methods which can be easily iterated.

#####offset()

Returns the `offset` of the first row relative to all rows in the view.

#####total_rows()

Returns the total number of rows for this index.

#####getLength()

Returns the number of rows attached to this result object.

#####first()

Returns the first row in the collection.

#####last()

Returns the last row in the collection.

#####getRow(index)

Returns row `index` in the collection, where `index` is greater than zero and less than `getLength()`. Return `first()` or `last()` if no index argument or the index given is out of bounds.

#####facets()

Returns the list of unique values for a key over the set of rows, the 'facet'

#####sortByValue(iterator)

Returns the list of rows sorted by the value of the iterator.

	// consider this set of rows
	var rows = response.each();
 	// rows = [ { 'key': 'A', 'value': {'X': 1, 'Y': 2 }}, { 'key': 'B', 'value': {'X': 2, 'Y': 1 }}];
		
	console.log(rows.sortByValue(function(x) { return x.value['Y'] }));
	// -> [	{ 'key': 'B', 'value': {'X': 2, 'Y': 1 }},
			{ 'key': 'A', 'value': {'X': 1, 'Y': 2 }}]
	

#####range()

Returns the first and last keys of an index.

	// using the output of the example above
	console.log(rows.range());
	// -> {'start': 'B', 'end': 'A' }

#####getSortColumn(column) 

Setter/getter for defining the `sort-column`. Used mostly by the downstream `view` processes.

#####getDisplayColumns(columns)

Setter/getter for modifying the list of columns to display. Used mostly by the downstream `view` processes.

#####getSelected(selected)

Setter/getter for marking a set of rows as 'selected'. Argument `selected` is an array of integer row indexes. When called without an argument, returns a new Rows object containing only those selected rows.

	// For example, to mark rows 1, 2, and 11 as selected
	rows.getSelected([1, 2, 11]);
	

#####column2Index(columnLabel)

Uses the `header` information from the [design document](#design-methods) to convert a column label to an index. Returns the index of the column requested, or the index of 'sort-column', or 0 if both are not found.

#####index2Column(index)

Converts an integer index into the column list and uses the header section of the [design document](#design-methods) to return the name of the column.

#####sortByColumn(reverse)

If columns are integers, returns the columns sorted. Otherwise returns the columns in their original order, or in reverse order if `reverse` argument is true.

<a name="row-helper-methods"> </a>
####row()

#####getKey()

Get the `key` property of a row of data.

#####getValue()

Get the `value` property of a row of data.

#####select(property)

Returns value of `property`.

#####selectFor(property, value)

Returns true if row `property` value equals `value`.

#####filter(object)

Returns true if ALL property values of the row match ALL property values of `object`.

<a name="cell-helper-methods"> </a>
####cell()

#####columnType(name, type, [width])
#####columnType(object)

Extend the list of data types.

	// BoxspringJS provides the following built-in types:	
	/*
	{ 'year': ['number',1],
	'month': ['number',1],
	'country': ['string',2],
	'city': ['string',2],
	'state': ['string',2],
	'address': ['string',4],
	'count': ['number',1],
	'sum': ['number',1],
	'average': ['number',1],
	'keyword': ['string',1],
	'index': ['number',1],
	'values': ['object',2],
	'row total': ['number',1],
	'column total': ['number',1],
	'view': ['string', 1],
	'summary': ['object', 8] };
	*/
	// The array value consists of [ type, width ] where `type` is a JavaScript type and `width` is a 
	// relative numeric width that can be used by downstream `view` processes to format and layout the 
	// data. For example, `address` would be afford 4 units of width in display, versus only 1 for `year`.

> Use columnType with an `object` argument to bulk update the set of available data types.
> Call columnType individually with `name`, `type`, and optional `width` to add individual types. `width` defaults to 1 if none is supplied.
> If the [design document](#custom) specifies a list of types for the domain, then these are automatically used to extend the list of built-in types available to the application.

#####hasType(label)

Returns true if `label` has a `type` definition.
	
#####getType(label)

Returns the requested type from the list of valid types.

#####columnWidth(label)

Returns the numeric width of the requested label.

#####newCell(label, [value, [type]])
#####newCell(object)

Returns an object with five properties: `name, value, type, format, properties`. 

> This object can be easily transformed into downstream graphing packages such as Googles Visualization Table format.

> newCell will determine the type by comparing the label provided to the values in the columnTypes object. If the value does not match the intended type then it will attempt to `coerce` the value to the intended type. Failing this, it will set the type and value to `String`.

> If a `format()` function is provided on the [design document](#custom) it will be applied to fill in the format property of the object being returned.
 
