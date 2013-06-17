require('../index');
// Documentation: https://npmjs.org/package/tape
var test = require('tape')
, ddoc = function () {
	return {
		"updates": {
			"my-commit": function (doc, req) {
				doc['last-updated'] = Date();
				doc.size = JSON.stringify(doc).length;
				doc.junk = 'another-try';
				return [doc, JSON.stringify(doc) ];
			}
		},
		"views": {
			'my-view': {
				'map': function (doc) {
					if (doc && doc._id) {
						emit(doc._id, null);
					}
				}
			}
		}
	};
}


var Boxspringjs = Maker
, boxspringjs = Boxspringjs('127.0.0.1')
, newdoc = boxspringjs.doc('sample-content').docinfo({'content': Date() })
, newdoc1 = boxspringjs.doc('write-file-test').docinfo({'content': Date() });


// tests to verify db save/remove
test('boxspring-create-db', function(t) {
	var mydb = Boxspring({'name': 'phantomdb', 'auth': auth.auth })();
	
	t.plan(1);
	
	var create = function(db) {
		db.doc().save(function(err, response) {
			if (err) {
				console.log('could not create database - ', db.name, response);
				throw err;
			} else {
				console.log(db.name, 'successfully created.');
				db.db_info(function(err, response) {
					t.equal(response.data.db_name, 'phantomdb', 'database-created');					
				});
			}
		});
	}
	
	mydb.db_info(function(err, response) {
		if (err) {
			create(mydb);
		} else {
			console.log('database already exists, removing...');
			mydb.doc().remove(function(err, response) {
				if (err) {
					console.log('unable to remove - ', mydb.name);
					throw err;
				} else {
					create(mydb);
				}
			});
		}
	});
});

// tests to verify db.js
test('boxspringjs-1', function (t) {

	t.plan(8);
	
	var anotherdb = Boxspring({'name': 'regress',
		'id': 'anotherdb',
		'index': 'my-view',
		'designName': 'my-design',
		'maker': ddoc, 
		'auth': { 'name': 'couchdb', 'password': 'couchdb' }})('127.0.0.1');
						
	boxspringjs.heartbeat(function(err, data) {
		t.equal(data.code, 200, 'heartbeat');
	});

	boxspringjs.session(function(err, data) {
		t.equal(data.code, 200, 'session');
	});

	boxspringjs.db_info(function(err, data) {
		t.equal(data.code, 200, 'db_info');
	});

	boxspringjs.all_dbs(function(err, data) {
		t.equal(data.code, 200, 'all_dbs');

		// gets root name by default, then tests getting name with id provided
		t.equal(anotherdb.name, 'regress', 'regress-name');
		// tests the defaultView method since not defined
		t.equal(anotherdb.index, 'my-view', 'my-view');
		// not explicitly defined 'default'
		t.equal(boxspringjs.designName, '_design/default', 'default');
		// makes sure we return a .doc object		
		t.equal(typeof boxspringjs.doc, 'function', 'function');
	});
});

// document create, update, remove
test('boxspringjs-2', function (t) {

	t.plan(6);

	// update saves an existing doc
	newdoc.update(function(err, result) {
		t.equal(err, null, 'update');		
		newdoc.retrieve(function(err, result) {
			t.equal(err, null, 'retrieve');
			newdoc.docinfo({ 'more-content': 'abcdefg'})
				.update(function(err, result) {
				t.equal(err, null, 'more-content');
				newdoc.head(function(err, head) {
					t.equal(err, null, 'head');
					newdoc.remove(function(err, result) {
						t.equal(err, null, 'remove:' + (err && err.message));
					});								
				});
			});
		});
	});
		
	// create a document, extend its content, update it, confirm it
	boxspringjs.doc('docabc').docinfo({ 'extended-content': Date() })
		.update(function(err, response) {
			t.equal(response.code, 201, 'extended-content');
	});	
	
});

// reading view indexes
test('boxspringjs-3', function (t) {

	t.plan(4);

	// save and expect to fail
	newdoc1.save(function(err, response) {
		t.equal(response.code, 409, 'save-fail');
		// update should work
		newdoc1.update(function(err, update) {
			//console.log('update response', newdoc1.docRev(), update.header.etag, update.code);
			t.equal(update.code, 201, 'newdoc1 update');
			// get all docs using map views on the server (default)
			boxspringjs
				.design().fetch({ 'index': '_all_docs' }, function(err, couch) {
				t.equal(couch.code, 200, 'all_docs');

				// get all docs using map views FUTURE running in node
				boxspringjs
					.design().fetch({ 'index': '_all_docs', 'server': 'node' }, 
					function(err, node) {
					var found;
					_.each(node.data.rows, function(d) {
						var found;
						_.each(couch.data.rows, function(c) {
							found = (c.id === d.id && d.id);
						});
					});
					t.equal(typeof found, 'undefined', 'get-compared');
				});
			});
		});
	});
});
	






