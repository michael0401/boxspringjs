require('../index');
var test = require('tape')
, boxspringjs = Maker('127.0.0.1')
, anotherdb = Maker('127.0.0.1')
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
};


//var query = anotherdb.design().query({
//	'reduce': true,
//	'limit': 500 }, {
//		'auth': auth.auth })
		
//console.log(query);
//return;

	
(function() {
	test('query-smoke-tests', function (t) {
		t.plan(9);
		
		var query = anotherdb.design().query({
			'reduce': true,
			'limit': 500 }, {
				'auth': auth.auth })
		, query2 = anotherdb.design().query({
			'reduce': false
		}, 	{ 'auth': auth.auth });
			
		// smoke test: make sure we have two different objects
		t.equal(query.reduce === query2.reduce, false, 'query-create-1');
		t.equal(query === query2, false, 'query-create-2');
		// smoke tests to confirm the object is set up
		t.equal(query.reduce, true);
		t.equal(query.system.get('asynch'), false);
		// try changing the value of one of the parameters
		query.display = true;
		// confirm the change
		t.equal(query.display, true);
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
			t.equal(response.total_rows(), response.first().getValue(), 'smoke-test-result');
		});
		// query the server
		query.server();
	});	
}());

(function() {
	test('query-paging-tests', function (t) {
		var pages
		, page
		, query = boxspringjs.design().query({
			'system': {'asynch': true, 'page-size': 100, 'cache-size': 2, 'delay': 1/10 }
		});
		
		query.on('result', function(result) {
			if (typeof page === 'undefined') {
				page = 1;
				pages = Math.ceil(result.total_rows()/100);
				t.plan((pages-1)*2);
				//console.log('query-paging-tests:', (pages-1)*2);				
			} else {
				t.equal(1, 1, page.toString());
				page += 1;				
			}
		});
		
		query.on('more-data', function(result) {
			//console.log('more-data, page', page, 'completed', result.pageInfo().completed,
			//result.query.qid); 
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
			query.trigger('more-data', r);
		});
		query.server();
	});
}());

(function() {
	test('query-more-data-tests', function (t) {
		var rowCount
		, pages
		, query = boxspringjs.design().query();
		
		query.system.update({'asynch': true, 'page-size': 200 });
		query.on('result', function(result) {
			pages = Math.floor(result.total_rows() / 200);
			t.plan(pages+5);
			
			t.equal(result.getLength(), 200, 'initial-result');
			rowCount = result.total_rows();
		});

		var register = function (result) {
			t.equal(query.qid, result.query.qid, query.qid);
		}
		query.on('completed', register);
		query.on('more-data', register);
		query.server();
	});
}());

