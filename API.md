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


###Database object methods

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



        
     


    
