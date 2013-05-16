require('../index');
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


// Documentation: https://npmjs.org/package/tape
test('boxspringjs-1', function (t) {

	t.plan(19);
	
	var boxspringjs = boxspring('regress')
	, newdoc = boxspringjs.doc('sample-content').docinfo({'content': Date() })
	, newdoc1 = boxspringjs.doc('write-file-test').docinfo({'content': Date() })
	, anotherdb = boxspring('regress', {
		'id': 'anotherdb',
		'index': 'my-view',
		'designName': 'my-design',
		'maker': ddoc,
		'authorization': function(err, result) {
			
			t.equal(result.code, 200, 'login');
			
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
			//	t.equal(anotherdb.name, boxspringjs.Id('anotherdb').name, 'anotherdb-name');
				t.equal(anotherdb.name, 'regress', 'regress-name');
				// tests the defaultView method since not defined
				t.equal(anotherdb.index, 'my-view', 'my-view');
				// not explicitly defined 'default'
				//console.log('anotherdb.index', anotherdb.index, 'boxspringjs.designName', boxspringjs.designName);
				t.equal(boxspringjs.designName, '_design/default', 'default');
				// makes sure we return a .doc object		
				t.equal(typeof boxspringjs.doc, 'function', 'function');

				// update saves an existing doc
				newdoc.update(function(err, result) {
					t.equal(result.code, 201, 'update');				
					newdoc.retrieve(function(err, result) {
						t.equal(result.code, 200, 'retrieve');
						newdoc.docinfo({ 'more-content': 'abcdefg'})
							.update(function(err, result) {
							t.equal(result.code, 201, 'more-content');
							newdoc.head(function(err, head) {
								t.equal(head.code, 200, 'head');
								newdoc.remove(function(err, result) {
									t.equal(result.code, 200, 'remove');
								});								
							});
						});
					});
				});

				boxspringjs.doc('docabc')
					.update({ 'extended-content': Date() }, function(err, response) {
						t.equal(response.code, 201, 'extended-content');
				});

				// save and expect to fail
				newdoc1.save(function(err, response) {
					t.equal(response.code, 409, 'save-fail');
					//console.log('save response:', newdoc1.docRev(), response.header.etag);
					// update should work
					newdoc1.update(function(err, update) {
						//console.log('update response', newdoc1.docRev(), update.header.etag, update.code);
						t.equal(update.code, 201, 'newdoc1 update');
						// get all docs using map views on the server (default)
						boxspringjs
							.design().get({ 'index': 'all_docs' }, function(err, couch) {
							t.equal(couch.code, 200, 'all_docs');

							// get all docs using map views FUTURE running in node
							boxspringjs
								.design().get({ 'index': 'all_docs', 'server': 'node' }, 
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
		}
	});
});
