require ('../index');
var test = require('tape')
, bx = boxspring('regress', {'id': 'my-db'})
, bx2 = boxspring('regress', {'id': 'your-db', 'designName': 'your-design' })
, newdoc = bx.doc('sample-content').docinfo({'content': Date() })
, newdoc1 = bx.doc('write-file-test').docinfo({'content': Date() })
;

var dbObject = [ 'VERSION',
  'boxspring',
  'authorize',
  'db',
  'bulk',
  'doc',
  'design',
  'view',
  'row',
  'rows',
  'cell',
  'query',
  'name',
  'id',
  'index',
  'maker',
  'designName',
  'authorization',
  'path',
  'db_exists',
  'HTTP',
  'queryHTTP',
  'dbQuery',
  'getRev',
  'responseOk',
  'heartbeat',
  'session',
  'all_dbs',
  'all_docs',
  'exists',
  'db_info',
  'save',
  'remove',
  'events' ],

docObject = 	[ 'updated_docinfo',
	  'VERSION',
	  'boxspring',
	  'authorize',
	  'db',
	  'bulk',
	  'create',
	  'delete',
	  'doc',
	  'design',
	  'view',
	  'row',
	  'rows',
	  'cell',
	  'query',
	  'name',
	  'open',
	  'source',
	  'id',
	  'index',
	  'maker',
	  'designName',
	  'authorization',
	  'path',
	  'db_exists',
	  'HTTP',
	  'queryHTTP',
	  'dbQuery',
	  'getRev',
	  'responseOk',
	  'heartbeat',
	  'session',
	  'all_dbs',
	  'all_docs',
	  'exists',
	  'db_info',
	  'save',
	  'remove',
	  'events',
	  'sync',
	  'docId',
	  'url2Id',
	  'docRev',
	  'docHdr',
	  'retrieve',
	  'head',
	  'update',
	  'info',
	  'docinfo' ],

bulkObject = 	[ 'VERSION',
      'status',
	  'boxspring',
	  'authorize',
	  'db',
	  'bulk',
	  'doc',
	  'design',
	  'view',
	  'row',
	  'rows',
	  'cell',
	  'query',
	  'name',
	  'id',
	  'index',
	  'maker',
	  'designName',
	  'authorization',
	  'path',
	  'db_exists',
	  'HTTP',
	  'queryHTTP',
	  'dbQuery',
	  'getRev',
	  'responseOk',
	  'heartbeat',
	  'session',
	  'all_dbs',
	  'all_docs',
	  'exists',
	  'db_info',
	  'save',
	  'remove',
	  'events',
	  'docs',
	  'Max',
	  'headers',
	  'options',
	  'exec',
	  'max',
	  'push',
	  'getLength',
	  'fullCommit' ],

rowObject = [ 'values',
	  'original',
	  'set',
	  'store',
	  'get',
	  'lookup',
	  'find',
	  'contains',
	  'post',
	  'getLength',
	  'remove',
	  'each',
	  'keys',
	  'first',
	  'update',
	  'pick',
	  'restore',
	  'empty',
	  'columns',
	  'visible',
	  'cell',
	  'getKey',
	  'getValue',
	  'select',
	  'selectFor',
	  'filter' ],

rowsObject = [ 'columns',
	  'keys',
	  'displayColumns',
	  'cell',
	  'collection',
	  'visible',
	  'each',
	  'offset',
	  'first',
	  'last',
	  'total_rows',
	  'getLength',
	  'facets',
	  'sortByValue',
	  'range',
	  'getSortColumn',
	  'getDisplayColumns',
	  'column2Index',
	  'index2Column',
	  'sortByColumn' ]

cellObject = [ 'builtInColumns',
	  'formats',
	  'thisType',
	  'thisWidth',
	  'hasType',
	  'getType',
	  'columnWidth',
	  'columnTypes',
	  'newCell',
	  'newColumn' ],	

queryObject = [ 'VERSION',
	  'boxspring',
	  'authorize',
	  'db',
	  'bulk',
	  'doc',
	  'design',
	  'view',
	  'row',
	  'rows',
	  'cell',
	  'query',
	  'name',
	  'id',
	  'index',
	  'maker',
	  'designName',
	  'authorization',
	  'path',
	  'db_exists',
	  'HTTP',
	  'queryHTTP',
	  'getRev',
	  'dbQuery',
	  'responseOk',
	  'heartbeat',
	  'session',
	  'all_dbs',
	  'all_docs',
	  'exists',
	  'db_info',
	  'save',
	  'remove',
	  'events',
	  'on',
	  'off',
	  'trigger',
	  'bind',
	  'unbind',
	  'reduce',
	  'limit',
	  'startkey',
	  'endkey',
	  'group_level',
	  'descending',
	  'key',
	  'keys',
	  'filter',
	  'pivot',
	  'display',
	  'vis',
	  'server',
	  'qid' ],
	
viewObject = [ 'on',
	  'off',
	  'trigger',
	  'bind',
	  'unbind',
	  'db',
	  'design',
	  'index',
	  'views',
	  'emitter',
	  'query',
	  'system',
	  'setQuery',
	  'fetch',
	  'node',
	  'couch',
	  'end' ];			
	
test('objects', function (t) {
	t.plan(14);
	
	var db = boxspring();

	t.equal(bx.id, 'my-db', 'db-options-check1');
	t.equal(bx2.id, 'your-db', 'db-options-check2');
	t.equal(newdoc===newdoc1, false, 'doc-check1');
	t.equal(newdoc.docinfo()._id===newdoc1.docinfo()._id, false, 'doc-check2');
	t.equal(typeof boxspring, 'function');
	t.equal(_.identical([ 'function', 'function', 'function', 'function' ],
		[typeof boxspring, typeof bx.doc, typeof bx.design, typeof bx.bulk]), true, 
		'boxspring');
		

	var compare = function (actual, expected, testname) {
		var intersection = _.intersection(actual, expected);

		actual = _.sortBy(actual, _.item);
		expected = _.sortBy(expected, _.item);

		if (_.identical(actual, expected)) {
			t.equal(true, true, testname);
			return ;
		} 
		t.equal(false, true, testname);
		if (_.difference(actual, intersection).length > 0) {
			console.log(_.difference(actual, intersection), 'not found in actual');		
		} else if (_.difference(expected, intersection).length > 0) {
			console.log(_.difference(expected, intersection), 'missing from actual');		
		}
	}

	compare(dbObject, _.keys(db), 'db'); 
	compare(docObject, _.keys(db.doc()), 'doc');
	compare(bulkObject, _.keys(db.bulk()), 'bulk'); 	
	compare(rowObject, _.keys(boxspring.row()), 'row'); 
	compare(rowsObject, _.keys(boxspring.rows()), 'rows'); 
	compare(cellObject, _.keys(boxspring.cell()), 'cell');
	compare(queryObject, _.keys(boxspring()['query'](boxspring())), 'query');
	compare(viewObject, _.keys(boxspring()['view'](boxspring())), 'view');
	
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
