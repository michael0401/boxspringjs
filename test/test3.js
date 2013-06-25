require('../index');
var test = require('tape')
, boxspringjs = Maker('127.0.0.1')
, anotherdb = Boxspring({
	'name': 'regress',
	'id': 'anotherdb',
	'_view': 'my-view',
	'_design': 'my-design',
	'maker': ddoc,
	'auth': auth.auth })('127.0.0.1');

(function () {

	test('boxspringjs-2', function (t) {
		t.plan(9);
		console.log('Running boxspringjs-2: 8');

		var design = boxspringjs.doc('_design/my-design');

		t.equal(typeof design, 'object');
		t.equal(anotherdb._design, '_design/my-design', 'design-name-test');
		
		var anotherdbDesignTests = function () {
			anotherdb.doc('_design').update(function(err, response) {
				t.equal(response.code, 201, 'anotherdb-design');
				anotherdb.doc('_view').fetch({}, function (err, c) {
					anotherdb.doc('_design/my-design').doc('_view/my-view').fetch({}, function(e, n) {
						t.equal(c.getLength(), n.getLength(), 'my-view-response');
					});
				});
			});
		}


		var designTests = function () {
			var ud = design.doc('_update/in-place');
			// What this does: gets a list of documents using the built-in 'Index' view. 
			// For each document, it gets the key.id and calls the server-side 'update' using 
			// a local update handler 'my-commit'. After the last completion, it asserts the test
			// and triggers the queue-test and a 'read-back-test' to exercise the 'Index' view 
			// running in node.js and not on the server.
			design.doc('_view/Index').fetch({}, function(e, r) {

				design.doc('_view/Index').fetch({}, function(e, n) {
					t.equal(r.data.rows.length, n.data.rows.length, 'view-tests');
					design.doc('_update/in-place')
						.source({ 'random': Date.now() })
						.update('base_test_suite1', function(e, commit) {
							t.equal(commit.data.error, 'render_error', 'expect-update-fail');
							ud.source({'random': Date.now() }).update('base_test_suite', function(e, r) {
								t.equal(r.code, 201, 'update-handler');
								anotherdbDesignTests();								
							});
					});					
				}); 
			});		
		};

		design.update(function(err, response) {
			t.equal(response.code, 201, 'design-saved');
			design.retrieve(function(err, res) {
				var readBack = res.data
				, designKeys = _.keys(readBack.updates).concat(_.keys(readBack.views));
				t.equal(_.difference(designKeys, 
					[ 'lib', 'in-place', 'Index']).length,0, 'design-read-back');
				designTests();
			});
		});		
	});	
}());

return;

(function() {
	test('row-tests', function (t) {
		t.plan(17);
		console.log('Running row-tests: 17');

		anotherdb.design().fetch({}, function(err, response) {
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
}());

(function() {
	test('rows-tests', function (t) {
		t.plan(23);
		console.log('Running rows-tests: 23');
		
		anotherdb.design().fetch({}, function(err, response) {
			t.equal((response.each()).length, response.data.rows.length);
			t.equal(response.column2Index('doc'), 1);
			t.equal(response.column2Index('dfdfaf'), 0);
			t.equal(response.getSortColumn(), 'doc');
			t.equal(_.identical(response.getDisplayColumns(), ['_id', 'doc', 'content', 'more-content', '_rev' ]), true);
			t.equal(_.identical(response.getDisplayColumns(['doc']), ['doc']), true);
			t.equal(response.index2Column(0), 'doc');
			t.equal(response.index2Column(1), 'doc');
			response.getDisplayColumns(['_id', 'doc']);
			t.equal(response.index2Column(0), '_id');
			t.equal(response.index2Column(1), 'doc');
			// reset the visible rows for this next test
			response.visible.restore();
			// set them and test them
			t.equal(_.identical(response
							.visible.setValues({'_id': true, 'doc': false }), ['_id','doc']), true, 'set-values');
			t.equal(response.visible.getSortColumn(), 1);
			response.visible.restore();
			t.equal(_.identical(response.visible.setValues(), []), true, 'set-values-restored');
			t.equal(response.visible.getSortColumn(), 0, 'visible-sort-column');
			t.equal(_.identical(response.sortByColumn().getDisplayColumns(), ['_id', 'doc', 'content', 'more-content', '_rev' ]), true);
			t.equal(_.identical(response.sortByColumn(true).getDisplayColumns(), [ '_rev', 'more-content', 'content', 'doc', '_id' ]), true);
			t.equal(response.offset(), 0);
			t.equal(response.total_rows(), response.getLength());
			t.equal(response.facets('_id').length, response.getLength());
			//console.log(response.facets('content'), 2);
			t.equal(response.facets('content').length, 3);
			t.equal(response.facets('find-nothing').length, 0);
			t.equal(_.identical(response.range().start, 
					[ response.data.rows[0].key ]), true, 'start-key');
			t.equal(_.identical(response.range().end, [ response.last().key ]), true, 'last-key');				
		});
	});
}());

