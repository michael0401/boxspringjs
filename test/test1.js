require('../index');
var test = require('tape')
, boxspringjs = _.create(bx.dbUtils, 'regress')
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
, anotherdb = _.create(bx.dbUtils, 'regress', {
	'id': 'anotherdb',
	'index': 'my-view',
	'designName': 'my-design',
	'maker': ddoc
})
, newdoc = boxspringjs.doc('sample-content').docinfo({'content': Date() })
, newdoc1 = boxspringjs.doc('write-file-test').docinfo({'content': Date() })
;

// Documentation: https://npmjs.org/package/tape
test('boxspringjs-1', function (t) {

	t.plan(19);
	boxspringjs.db.authorize(bx.auth, function() {

		boxspringjs.db.heartbeat(function(data) {
			t.equal(data.code, 200, 'heartbeat');
		});

		boxspringjs.db.session(function(data) {
			t.equal(data.code, 200, 'session');
		});

		boxspringjs.db.db_info(function(data) {
			t.equal(data.code, 200, 'db_info');
		});

		boxspringjs.db.all_dbs(function(data) {
			t.equal(data.code, 200, 'all_dbs');

			// gets root name by default, then tests getting name with id provided
			t.equal(anotherdb.name, boxspringjs.Id('anotherdb').name, 'anotherdb-name');
			t.equal(anotherdb.name, 'regress', 'regress-name');
			// tests the defaultView method since not defined
			t.equal(anotherdb.index, 'my-view', 'my-view');
			// not explicitly defined 'default'
			t.equal(boxspringjs.designName, '_design/default', 'default');
			// makes sure we return a .doc object		
			t.equal(typeof boxspringjs.doc, 'function', 'function');

			// update saves an existing doc
			newdoc.update(function(result) {
				t.equal(result.code, 201, 'update');
				newdoc.retrieve(function(result) {
					t.equal(result.code, 200, 'retrieve');
					newdoc.docinfo({ 'more-content': 'abcdefg'}).update(function(result) {
						t.equal(result.code, 201, 'more-content');
						newdoc.head(function(head) {
							t.equal(200, head.code, 'head');
							newdoc.remove(function(result) {
								t.equal(200, result.code, 'remove');								
							});								
						});
					});
				});
			});

			boxspringjs.doc('docabc')
				.update({ 'extended-content': Date() }, function(response) {
					t.equal(response.code, 201, 'extended-content');
			});

			// save and expect to fail
			newdoc1.save(function(response) {
				t.equal(response.code, 409, 'save-fail');
				//console.log('save response:', newdoc1.docRev(), response.header.etag);
				// update should work
				newdoc1.update(function(update) {
					//console.log('update response', newdoc1.docRev(), update.header.etag, update.code);
					t.equal(update.code, 201, 'newdoc1 update');
					// get all docs using map views on the server (default)
					boxspringjs.design().get({ 'index': 'all_docs' }, function(couch) {
						t.equal(couch.code, 200, 'all_docs');

						// get all docs using map views FUTURE running in node
						boxspringjs.design()
							.get({ 'index': 'all_docs', 'server': 'node' }, function(node) {
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
	});

});


/*







		


		db.on('design-tests', function () {

		});
		
		db.on('bulk-tests', function() {
			// bulk tests
			bulk.save(function(result) {
				t.equal('bulk-save', result.code, 201, result);
				bulk.remove(function(data) {
					//console.log(result);
					t.equal('bulk-remove', data.data[0].ok, result.data[0].ok, data);
					db.trigger('my-design-tests');						
				});
			});
		});
					
		db.on('my-design-tests', function () {
			anotherdb.design.update(function(response) {
				t.equal('my-design-update', response.code, 201, response.request.path);
				anotherdb.get('my-view', function (c) {
					anotherdb.get({'server': 'node'}, function(n) {							
						t.equal('my-view-test', c.bulk().rows.length, n.total_rows, n.response.request.path);
					});
				});
			});
		});			
	});
	return that;
};



*/
