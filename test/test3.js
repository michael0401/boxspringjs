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
		'types': {
			'_id': ['string', 1],
			'_rev': ['string', 1],
			'doc': ['object', 4],
			'content': ['string', 2],
			'more-content': ['string', 2]			
		},
		"views": {
			'lib': {
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
	};
}
, anotherdb = _.create(bx.dbUtils, 'regress', {
	'id': 'anotherdb',
	'index': 'my-view',
	'designName': '_design/my-design',
	'maker': ddoc
})
;

(function() {
	test('row-tests', function (t) {
		t.plan(17);

		anotherdb.db.authorize(bx.auth, function() {
			anotherdb.design().build().get({}, function(response) {
				var first = response.data.rows[0]
				, selected
				, selected1
				, selected2
				, cell = response.cell;
				
				t.equal(_.identical(response.data.rows[0].columns, 
										['_id', 'doc', 'content', 'more-content', '_rev' ]), true);
				t.equal(first.select('_id'), first.getKey(0));
				t.equal(first.getValue()['_id'], first.select('_id'));
				t.equal(first.getValue()['content'], first.select('content'));
				t.equal(_.identical(response.visible.setValues(), 
										[ '_id', 'content', 'more-content', '_rev' ]), true);
				selected1 = _.reduce(response.each(), function(result, row) {
					if (row.selectFor('content', 'shucks')) {
						result.push(row.select('_id'));
					}
					return result;
				}, []);
				selected2 = _.reduce(response.each(), function(result, row) {
					if (row.select('content') === 'shucks') {
						result.push(row.select('_id'));
					}
					return result;
				}, []);
				t.equal(_.identical(selected1, selected2), true);
				selected2 = _.reduce(response.each(), function(result, row) {
					if (row.filter({'content': 'shucks'})) {
						result.push(row.select('_id'));
					}
					return result;
				}, []);
				t.equal(_.identical(selected1, selected2), true);				
				t.equal(cell.getType('_id'), 'string');
				t.equal(cell.hasType('_id'), true);
				t.equal(cell.hasType(cell.builtInColumns.get('junk')), false);
				t.equal(cell.columnWidth(cell.builtInColumns.get('_id')), 1);
				
				// format the cell and strip off the 'formatted: ' to make sure the cell formatted
				// the value and put it in the format field.
				selected = cell.newCell('_id', first.select('_id')).format.replace('formatted: ', '');
				t.equal(selected, first.select('_id'));
				t.equal(cell.newCell('_id', first.select('_id')).type, 'string');
				
				// do the same as above for a field that has no formatting
				selected = cell.newCell('content', first.select('content'));
				t.equal(selected.name, 'content');
				t.equal(selected.value, 'shucks');
				t.equal(selected.type, 'string');
				t.equal(typeof selected.format, 'undefined');
			});
		});	
	});
}());

return;

(function () {

	test('boxspringjs-2', function (t) {
		t.plan(8);

		var design = boxspringjs.design();
		t.equal(typeof design, 'object');
		t.equal(typeof design.get, 'function');
		
		var anotherdbDesignTests = function () {
			anotherdb.design().build().ddoc.update(function(response) {
				t.equal(response.code, 201, 'anotherdb-design');
				anotherdb.design().get({}, function (c) {
					anotherdb.design('_design/my-design', ddoc).get({'index': 'my-view' }, function(n) {							
						t.equal(c.data.rows.length, n.data.total_rows, 'my-view-respnose');
					});
				});
			});			
		}


		var designTests = function () {
			// What this does: gets a list of documents using the built-in 'Index' view. 
			// For each document, it gets the key.id and calls the server-side 'update' using 
			// a local update handler 'my-commit'. After the last completion, it asserts the test
			// and triggers the queue-test and a 'read-back-test' to exercise the 'Index' view 
			// running in node.js and not on the server.
			design.get({'index': 'Index'}, function(r) {

				design.get({ 'index': 'Index' }, function(n) {
					t.equal(r.data.rows.length, n.data.rows.length, 'view-tests');
					design.commit('base_test_suite', 'in-place', { 'random': Date.now() }, 
					function(commit) {
						t.equal(commit.code, 201, 'update-handler');
						anotherdbDesignTests();
					});					
				}); 
			});		
		};

		boxspringjs.db.authorize(bx.auth, function() {
				design.build().ddoc.update(function(response) {
					t.equal(response.code, 201, 'design-saved');
					design.ddoc.retrieve(function(res) {
						var readBack = res.data
						, designKeys = _.keys(readBack.updates).concat(_.keys(readBack.views));
						t.equal(_.difference(designKeys, 
							[ 'lib', 'in-place', 'Index']).length,0, 'design-read-back');
						designTests();
					});
				});		
		});

	});	
}());

(function() {
	test('rows-tests', function (t) {
		t.plan(16);

		anotherdb.db.authorize(bx.auth, function() {
			anotherdb.design().build().get({}, function(response) {
				t.equal((response.each()).length, response.data.rows.length);
				t.equal(response.column2Index('doc'), 1);
				t.equal(response.column2Index('dfdfaf'), 0);
				t.equal(response.sortColumn(), 'doc');
				t.equal(_.identical(response.displayColumns(), ['_id', 'doc', 'content', 'more-content', '_rev' ]), true);
				t.equal(_.identical(response.displayColumns(['doc']), ['doc']), true);
				t.equal(response.index2Column(0), 'doc');
				t.equal(response.index2Column(1), 'doc');
				response.displayColumns(['_id', 'doc']);
				t.equal(response.index2Column(0), '_id');
				t.equal(response.index2Column(1), 'doc');
				t.equal(_.identical(response
								.visible.setValues({'_id': true, 'doc': false }), ['_id','doc']), true);
				t.equal(response.visible.getSortColumn(), 1);
				response.visible.restore();
				t.equal(_.identical(response.visible.setValues(), []), true);
				t.equal(response.visible.getSortColumn(), 0);
				t.equal(_.identical(response.columnSort().displayColumns(), ['_id', 'doc', 'content', 'more-content', '_rev' ]), true);
				t.equal(_.identical(response.columnSort(true).displayColumns(), [ '_rev', 'more-content', 'content', 'doc', '_id' ]), true);
			});
		});	
	});
}());

