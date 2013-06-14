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

(function() {
	test('query-paging-tests', function (t) {
		var pages
		, page
		, query = boxspringjs.design().query({
			'system': {'asynch': true, 'page-size': 100, 'cache-size': 2, 'delay': 1/10 }
		})
		, display = query;
		
		display.addEventListener('result', function(eventStr, result) {
			page = 1;
			pages = Math.ceil(result.total_rows()/100);
			t.plan((pages-1)*2);
		});
		
		try {
			display.addEventListener('on-display', function(result) {
				return ;
			});			
		} catch (e) {
			t.equal(1, 1, 'unrecognized-event-expect-throw');
		}

		
		var nextprev = function(eventstr, result) {
			//console.log('more-data, page', page, 'completed', result.pageInfo().completed,
			//result.query.qid); 
			
			if (result.pageInfo().completed) {
				result.nextPrev('next');					
				while (result.pageInfo().page > 0) {
					t.equal(true, true, 'prev');
					
					result.nextPrev('previous');
				}
			} else {
				t.equal(true, true, 'next');
				result.nextPrev('next');					
			}			
		}
		
		display.addEventListener('more-data', nextprev);
		display.addEventListener('completed', nextprev);
		display.server();
	});
}());


(function() {
	test('display-addEventListener-tests', function (t) {
		var rowCount
		, pages
		, query = boxspringjs.design().query()
		, display = query;
		
		display.system.update({'asynch': true, 'page-size': 200 });
		display.addEventListener('result', function(eventStr, result) {
			pages = Math.floor(result.total_rows() / 200);
			t.plan(pages+1);
			console.log('Plan:', pages+1);
			t.equal(result.getLength(), 200, 'initial-result');
			rowCount = result.total_rows();
		});
		
		display.addEventListener('more-data', function(eventStr, result) {
			t.equal(query.qid, result.query.qid, query.qid);
		});
		
		display.addEventListener('completed', function(eventStr, result) {
			t.equal(result.total_rows(), result.unPaginate().getLength(), 'completed');
		});
		
		display.fetch();
	});
}());

