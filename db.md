###Database methods

The BoxspringJS database API provides a uniform interface to CouchDB database services for server side access via Node.js `require('http').request` and browser sessions via jQuery `$.ajax()`. 

> Please refer to [Complete HTTP API Reference](http://wiki.apache.org/couchdb/Complete_HTTP_API_Reference) for details on CouchDB database service operations and return values.

####Summary

*[heartbeat]()

__heartbeat(callback)__

*Confirm the connection to the server with no authentication.* 

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

<<<<<<< HEAD
*Create an object describing document with id=`id`.* 
=======
*Create an object describing document with `id=id`.* 
>>>>>>> 9b6901d3c43d02938351bead3e2f5d243afc84d6

> Note: Creating a document object does not create the document on the server. For that you must call the <code>save</code> method of the document object.

> If you do not provide an id for the document, one will be created for it.

	var mydoc = mydb.doc('my-doc);

	console.log(mydoc).source();
	// -> { '_id', 'my-doc } );
	
See [Document methods](###Document methods)

__bulk([doclist])__

*Create an object for loading and removing lists of documents. `doclist` is a JavaScript array of JSON objects produced by calling the `source()` method of a document object without any arguments.*

See [Bulk methods](###Bulk methods)

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

