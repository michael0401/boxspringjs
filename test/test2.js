require('../index');
var test = require('tape')
, boxspringjs = Maker('127.0.0.1')
, doc1 = boxspringjs.doc('first').docinfo({content: 'aw'})
, doc2 = boxspringjs.doc('second').docinfo({content: 'shucks'})
;

(function () {

	test('bulk-tests', function (t) {
		t.plan(8);
		
		var bulkPushTest = function () {
			var bulk = boxspringjs.bulk()
				.push(doc1.post())
				.push(doc2);
			t.equal(bulk.getLength(), 2, 'bulk-getLength');
			bulk.save(function(err, result) {
				t.equal(result.code, 201, 'bulk-push-save');
				bulk.remove(function(err, data) {
					t.equal(data.data[0].ok, result.data[0].ok, 'bulk-push-remove');
				});
			});	
		}
		, bulk = boxspringjs.bulk([ doc1, doc2.post() ]);

		t.equal(typeof bulk, 'object', 'is-object');
		t.equal(typeof bulk.save, 'function', 'is-function');
		t.equal(typeof bulk.queryHTTP, 'function','is-another-function');
		// bulk tests
		bulk.save(function(err, result) {
			t.equal(result.code, 201, 'bulk-save');
			bulk.remove(function(err, data) {
				t.equal(data.data[0].ok, result.data[0].ok, 'bulk-remove');
				bulkPushTest();
			});
		});		
	});	
}());
