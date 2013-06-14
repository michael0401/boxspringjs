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
	test('model-paging-tests', function (t) {
		var pages
		, page
		, display = new boxspringjs.Query(boxspringjs.design().query({
				'system': {'asynch': true, 'page-size': 100, 'cache-size': 2, 'delay': 1/10 }				
			}))
		
		display.on('change:result', function(attributes, changes) {
			page = 1;
			pages = Math.ceil(this.get('data').total_rows()/100);
			t.plan(((pages-1)*2)-1);
		});
		
		display.on('change:more-data change:completed', function(attributes, changes) {
			var result = attributes.get('data');
			
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
		});
		display.fetch();
	});
}());

