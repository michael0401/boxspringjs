require ('../index');
var test = require('tape')
, bx = boxspring('regress', {'id': 'my-db'})
, bx2 = boxspring('regress', {'id': 'your-db', 'designName': 'your-design' })
, newdoc = bx.doc('sample-content').docinfo({'content': Date() })
, newdoc1 = bx.doc('write-file-test').docinfo({'content': Date() })
;

test('objects', function (t) {
	t.plan(14);

	t.equal(bx.id, 'my-db', 'db-options-check1');
	t.equal(bx2.id, 'your-db', 'db-options-check2');
	t.equal(newdoc===newdoc1, false, 'doc-check1');
	t.equal(newdoc.docinfo()._id===newdoc1.docinfo()._id, false, 'doc-check2');
	t.equal(typeof boxspring, 'function');
	t.equal(_.identical([ 'function', 'function', 'function', 'function' ],
		[typeof boxspring, typeof bx.doc, typeof bx.design, typeof bx.bulk]), true, 
		'boxspring');
		
	var compare = function (expected, name) {
		t.equal(_.difference(expected, _.keys(boxspring[name]())).length, 0, name);
	}
	
	compare([ 'sync',
	  'docId',
	  'docRev',
	  'docHdr',
	  'save',
	  'retrieve',
	  'head',
	  'update',
	  'remove',
	  'info',
	  'exists',
	  'docinfo' ], 'doc');

	compare([ 'queryHTTP',
	  'dbQuery',
	  'heartbeat',
	  'session',
	  'all_dbs',
	  'all_docs',
	  'exists',
	  'db_info',
	  'save',
	  'remove' ], 'db'); 
	
	compare([ 'exec',
	  'save',
	  'remove',
	  'max',
	  'push',
	  'getLength',
	  'fullCommit' ],'bulk'); 
	
	compare([ 'fetch', 'node', 'couch', 'end' ], 'view');
	
	compare([ 'getKey',
	  'getValue',
	  'select',
	  'selectFor',
	  'filter' ], 'row'); 
	
	compare([ 'each',
	  'offset',
	  'total_rows',
	  'getLength',
	  'facets',
	  'sortByValue',
	  'range',
	  'first',
	  'last',
	  'getSortColumn',
	  'getDisplayColumns',
	  'column2Index',
	  'index2Column',
	  'sortByColumn',
	  'collection' ], 'rows'); 
	
	compare([ 'thisType',
	  'thisWidth',
	  'hasType',
	  'getType',
	  'columnWidth',
	  'newCell',
	  'newColumn' ], 'cell'); 

	compare([ 'server' ], 'query');
	
});


/*
Item = Item.extend(Item1);
t.equal(Item['my-obj', 'yes!']);

t.equal(x.value, 5);
t.equal(y.toInt(y.a())+y.b, 12);
t.equal(y.c, 57);
var Item1 = {
	'my-obj': 'yes!', 
	'construct': function (x) { 
		this.value = x; 
	}
}
, Item = {
	'construct': function () {
		this.c = 57;
	},
	'a': function() {
		return '5';
	},
	'b': 7,
	'toInt': function (x) {
		return parseInt(x, 10);
	}
}
, y = boxspring(Item)
, x = boxspring(Item1)
*/
