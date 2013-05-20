###Document methods
		
__source([json-object])__

*Set/get the contents of the document. If you supply a JSON object as an argument to `source()`, the contents of the object will be used to extend the document's contents. When used this way the document `save()` method can be chained to `source()` to populate the documents content and save it to the server:*

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

*By persisting this information about the document you can use the same document object to simplify updating document contents and save the document repeatedly within a session.*

> Note 1: You must supply a property owner for your new document content or else the `_id` and `_rev` information will be over-written and subsequent save requests will fail.

> Note 2: Calling `source(object)` to update the contents of a document does not save it to the server. For that you must call `doc.save()`

#####Alias: docinfo()

__save(callback)__

*Save the contents of a document object to the server.*

__retrieve(callback)__

#####Alias: __create(callback)__

*Read the contents of a document from the server, and update the document object with it.*

	var mydoc = mydb.doc('my-doc').retrieve(function(err, response) {
		if (err) {
			// handle the error
		}
		console.log(mydoc.source());
		// -> contents document from the server, including _id and _rev information
	});

__update(callback)__

*Use this method to update the contents of a document existing on the server.*

> Note 1: If the document does not already exist on the server, then update will create it.

> Note 2: The document resulting on the server will be over-written with the contents of your document object, except the _id and _rev information. **If this is not what you wan, then you should be sure to issue a `retrieve()` followed by `update()`.

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
	

	//Over-writing the contents of a document on the server.
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

*Remove a document from the database server.*

#####Alias: __delete(callback)__

__info(callback)__

*Get the revision information for a document.*

__head(callback)__

*Get the http request header for a document.*

> Use head when you only need to test the existence of a document on the server. 

__exists()__

*Helper function, returns true if the document exists on the server.

> Only useful after `head()` or `retrieve()` or `save()`

__docId()__

*Helper function, returns an object containing the unique document identifier.

	var mydoc = mydb.doc('my-doc');
	
	console.log(mydoc.docId());
	// -> { '_id': 'my-doc' }

__docRev()__

*Helper function, returns an object containing the latest revision of the document on the server.*

> Only useful after `head()` or `retrieve()` or `save()`
 
__url2Id(url, reverse)__

*Helper function, converts a `url` to a valid document identifier, or if `reverse=true` converts an id to a valid `url`.*  

__docHdr(name, value)__

*Helper function, returns an object with `headers` property who value is an object with property `name=value`*


