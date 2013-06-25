require('../index');
var test = require('tape')
, boxspringjs = Maker('127.0.0.1')
, anotherdb = Maker('127.0.0.1')
, docs = _.map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], function(i) {
	return({'_id': 'doc' + i, 'now': Date() });
});


(function() {
	test('query-smoke-tests', function (t) {
		t.plan(9);
		
		var view = anotherdb.doc('_view') 
		, query = new anotherdb.Query({'view': view, 'options': {
			'reduce': true,
			'limit': 500 }})
		, query2 = new anotherdb.Query({'view': view, 'options': {
			'reduce': false
		}})	
			
		// smoke test: make sure we have two different objects and attributes are set up
		t.equal(query.get('reduce') === query2.get('reduce'), false, 'query-create-1');
		t.equal(query === query2, false, 'query-create-2');
		// smoke tests to confirm the object is set up
		t.equal(query.get('reduce'), true);
		t.equal(query.system.get('asynch'), false);
		// try changing the value of one of the parameters
		query.set('display', true);
		// confirm the change
		t.equal(query.get('display'), true);
		// change a system parameter
		query.system.set('asynch', true);
		t.equal(query.system.get('asynch'), true);
		
		// verify two different event contexts
		query.on('try', function(arg) {
			t.equal(arg, 'query', 'event-create-1');
		});
		
		query2.on('try', function(arg) {
			t.equal(arg, 'query2', 'event-create-2');
		});
		
		query.trigger('try', 'query');
		query2.trigger('try', 'query2');
			
		// event when the server has data			
		query.on('result', function(response) {
			t.equal(response.total_rows(), response.getLength(), 'smoke-test-result');
		});
		// query the server
		query.fetch();
	});	
}());

(function() {
	test('document-create-test', function(t) {
		t.plan(1);
				
		boxspringjs
			.bulk(docs)
			.save(function(err, response) {
				if (err) {
					console.log(err, response.data, response.request);
					throw '';
				}
				t.equal(1, 1, 'bulk-succeeded');				
			});
	});
}());


(function() {
	test('query-paging-tests', function (t) {
		var pages
		, page
		, query = new boxspringjs.Query({
			'view': boxspringjs.doc('_view'),
			'system': {'asynch': true, 'page-size': 2, 'cache-size': 2, 'delay': 1/10 }
		});
		
		query.on('result', function(result) {
			//console.log('result triggered', result.code, result.unPaginate().getLength(), result.getLength());
			if (typeof page === 'undefined') {
				page = 1;
				pages = Math.ceil(result.total_rows()/2);
				t.plan(((pages-1)*2)+1);
				//console.log('query-paging-tests:', (pages-1)*2);				
			} else {
				t.equal(1, 1, page.toString());
				page += 1;				
			}
		});
		
		query.on('more-data', function(result) {
			//console.log('more-data,page',page,'completed',result.pageInfo().completed,result.query.qid); 
			if (result.pageInfo().completed) {
				result.nextPrev('next');					
				while (result.pageInfo().page > 0) {
					result.nextPrev('previous');
				}
			} else {
				result.nextPrev('next');					
			}
		});
		
		query.on('completed', function(r) {
			t.equal(1, 1, 'completed-true');
			query.trigger('more-data', r);
		});
		query.fetch();
	});
}());


(function() {
	test('query-more-data-tests', function (t) {
		var rowCount
		, pages
		, query = new boxspringjs.Query({
			'view': boxspringjs.doc('_view')
		});
				
		query.system.update({'asynch': true, 'page-size': 3, 'cache-size': 50 });
		query.on('result', function(result) {
			pages = Math.floor(result.total_rows() / 3);
			t.plan(pages+10);
			
			t.equal(result.getLength(), 3, 'initial-result');
			t.equal(query.system.get('asynch'), true, 'asynch-true');
			rowCount = result.total_rows();
		});

		var changeRegister = function () {
			t.equal(query.qid, this.get('data').query.qid, 'changeRegister');
		}

		var eventRegister = function (result) {
			t.equal(query.qid, result.query.qid, 'eventRegister');
		}
		
		query.on('change:more-data', changeRegister);
		query.on('completed', eventRegister);
		query.fetch();
	});
}());

(function() {
	test('document-remove-test', function(t) {
		t.plan(1);
				
		boxspringjs
			.bulk(docs)
			.remove(function(err, response) {
				if (err) {
					console.log(err, response.data, response.request);
					throw '';
				}
				t.equal(1, 1, 'bulk-remove-succeeded');				
			});
	});
}());


