##API Reference

__boxspring([name, [options]])__

Create a new database object. <code>name</code> is a string for the name of the database on the server. <em>Note: Creating a database object does not create the database on the server. For that you must call the <code>save</code> method of the database object.</em>

####Example:

        var mydb = boxspring('my-db');
        
The following <code>options</code> can be supplied to initialize the database object:

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
    <tr>
    <td>maker</td>
    <td>Function</td>
    <td></td>
    <td>A function that returns a design document object</td>
  </tr>
    <tr>
    <td>authorization</td>
    <td>Function</td>
    <td></td>
    <td>A callback function with authentication status</td>
  </tr>
</table>


###Database methods

The BoxspringJS database API provides a uniform interface to CouchDB database services for server side access via Node.js `require('http').request` and browser sessions via jQuery `$.ajax()`. 

> Please refer to [Complete HTTP API Reference](http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference) for details on CouchDB database service operations and return values.

__heartbeat(callback)__

*Confirm the connection to the server with no authentiation.* 

####Example:

        mydb.heartbeat(function(err, response) {
        
            if (err) {
                return console.log('error connecting to the server', err);
            }
            
            // continue on with the application....
            
        }


> **Note about the <em>BoxspringJS Response Object</em>** 

> All BoxspringJS http request methods provide the callback two arguments: <code>err</code> and a <code>response</code> object. <code>err</code> is the <code>Error</code> object thrown by the request method if an unexpected http response is given, i.e., anything code greater than or equal to <code>400</code>. The <code>response</code> object will always have the following four properties, some of which may not be filled in:

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

__session(callback)__

*Authenticate this user for this database.*

__all_dbs(callback)__

*Return a list of all databases available on the server.*

__all_docs(callback)__

*Return a list of all documents contained in this database.*

__db_info(callback)__

*Return an object with details of the database on the server.*

####Example:

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

__save(callback)__

*Create this database on the server. Server will return a 401 `CONFLICT` if the database is already existing or 409 `UNAUTHORIZED` if you do not have permission for this database.*

__remove(callback)__

*Remove this database from the server.*

__doc(id)__

*Create an object describing document with id=`id`. 

> Note: Creating a document object does not create the document on the server. For that you must call the <code>save</code> method of the document object.

> If you do not provide an id for the document, one will be created for it.

####Example:

	var mydoc = mydb.doc('my-doc);

	console.log(mydoc).source();
	// -> { '_id', 'my-doc } );
	
See [Document methods](###Document methods)

__bulk([doclist])__

*Create an object for loading and removing lists of documents. `doclist` is a JavaScript array of JSON objects produced by calling the `source()` method of a document object without any arguments.

See [Bulk methods](###Bulk methods)

####Example: 

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

###Document methods
		
__source([json-object])__

*Set/get the contents of the document. If you supply a JSON object as an argument to `source()`, the contents of the object will be used to extend the document's contents. When used this way the document `save()` method can be chained to `source()` to populate the documents content and save it to the server:

####Example

	mydoc.source({'content': 'some-data' }).update(function(err, response) {
		if (err) {
			// handle the error and return;
		}
		// calling mydoc.source() with no arguments shows that the document
		// revision _rev reflects the latest rev.
		console.log(mydoc.source());
		/* ->
		{	'_id': 'my-doc', 
			'_rev': '1-3124e051ba16af0da859597e35dfa875',
			'content': 'some-data' }
	});

*By persisting this information about the document you can use the same document object to simplify updating document contents and save the document repeatedly within a session.

> Note 1: You must supply a property owner for your new document content or else the `_id` and `_rev` information will be over-written and subsequent save requests will fail.

> Note 2: Calling `source(object)` to update the contents of a document does not save it to the server. For that you must call `doc.save()`

#####Alias: docinfo()

__save(callback)__

*Save the contents of a document object to the server.

__retrieve(callback)__

#####Alias: __create(callback)__

*Read the contents of a document from the server, and update the document object with it.

####Example

	var mydoc = mydb.doc('my-doc').retrieve(function(err, response) {
		if (err) {
			// handle the error
		}
		console.log(mydoc.source());
		// -> contents document from the server, including _id and _rev information
	});

__update(callback)__

*Use this method to update the contents of a document existing on the server.

> Note 1: If the document does not already exist on the server, then update will create it.

> Note 2: The document resulting on the server will be over-written with the contents of your document object, except the _id and _rev information. **If this is not what you wan, then you should be sure to issue a `retrieve()` followed by `update()`.

####Example 1: Augmenting the contents of a document on the server.

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
	
####Example 2: Over-writing the contents of a document on the server.
	
	var mydoc2 = mydb.doc('mydoc1');
	
	mydoc2.retrieve(function(err, response) {
		if (err) {
			// handle error
		}
		mydoc2.source({'contents': 'new-data' })
			.update(function(err, response) {
				if (err) {
					// handle error
				}
				console.log(mydoc2.source());
				/* ->
				{ 	'_id': ...,
					'_rev': ...,
					'contents': 'new-data' }
				*/ 
			});
	});  

__remove(callback)__

*Remove a document from the database server.

#####Alias: __delete(callback)__

__info(callback)__

*Get the revision information for a document

__head(callback)__

*Get the http request header for a document

> Use head when you only need to test the existence of a document on the server. 

__exists()__

*Helper function, returns true if the document exists on the server.

> Only useful after `head()` or `retrieve()` or `save()`

__docId()__

*Helper function, returns an object containing the unique document identifier.

#####Example

	var mydoc = mydb.doc('my-doc');
	
	console.log(mydoc.docId());
	// -> { '_id': 'my-doc' }

__docRev()__

*Helper function, returns an object containing the latest revision of the document on the server.

> Only useful after `head()` or `retrieve()` or `save()`
 
__url2Id(url, reverse)__

*Helper function, converts a `url` to a valid document identifier, or if `reverse=true` converts an id to a valid `url`.  

__docHdr(name, value)__

*Helper function, returns an object with `headers` property who value is an object with property `name=value`


