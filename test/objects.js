require('../index');
var test = require('tape')
, Bx = Boxspring({'name': 'regress', 'id': 'my-db'})
, db = Bx('127.0.0.1')
, Bx2 = Boxspring({'name': 'regress', 'id': 'your-db', 'designName': 'your-design' })
, db2 = Bx2('127.0.0.1')
, newdoc = db.doc('sample-content').docinfo({'content': Date() })
, newdoc1 = db.doc('write-file-test').docinfo({'content': Date() })
;

var dbObject = [ 'UTIL',
  'Users',
  'Display',
  'Query',
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
  'path',
  'HTTP',
  'url',
  'queryHTTP',
  'dbQuery',
  'getRev',
  'responseOk',
  'heartbeat',
  'session',
  'login',
  'all_dbs',
  'all_docs',
  'exists',
  'db_info',
  'save',
  'remove',
  'events',
  'Boxspring', 'VERSION', 'create', 'getAuth', 'logout', 'users' ],

docObject = 	[ 'Boxspring',
	  'VERSION',
	  'attachment',
	  'getAuth',
	  'logout',
	  'users',
	  'UTIL',
	  'db',
	  'bulk',
	  'create',
	  'doc',
	  'design',
	  'view',
	  'row',
	  'rows',
	  'cell',
	  'query',
	  'name',
	  'source',
	  'id',
	  'index',
	  'maker',
	  'designName',
	  'path',
	  'HTTP',
	  'url',
	  'queryHTTP',
	  'dbQuery',
	  'getRev',
	  'responseOk',
	  'heartbeat',
	  'session',
	  'login',
	  'all_dbs',
	  'all_docs',
	  'exists',
	  'db_info',
	  'save',
	  'remove',
	  'events',
	  'docId',
	  'url2Id',
	  'docRev',
	  'docHdr',
	  'retrieve',
	  'head',
	  'update',
	  'info',
	  'docinfo',
	  'Display',
	  'Query',
	  'Users',
	  'delete',
	  'original',
	  'read',
	  'values' ],

bulkObject = 	[ 'status',
 	  'Display', 'Query', 'Users',
	  'Boxspring', 'VERSION', 'create', 'getAuth', 'logout', 'users',  
	  'UTIL',
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
	  'path',
	  'HTTP',
	  'url',
	  'queryHTTP',
	  'dbQuery',
	  'getRev',
	  'responseOk',
	  'heartbeat',
	  'session',
	  'login',
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
	  'getRow',
	  'getSelected',
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

queryObject = [ 
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
	  'path',
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
	  
	  'vis',
	  'server',
	  'system',
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
	t.plan(17);
	
	t.equal(db.VERSION, '0.0.1', 'version-check');
	t.equal(db.id, 'my-db', 'db-options-check1');
	t.equal(db2.id, 'your-db', 'db-options-check2');
	t.equal(db2.name, 'regress', 'db-name');	
	t.equal(newdoc===newdoc1, false, 'doc-check1');
	t.equal(newdoc.docinfo().get('_id')===newdoc1.docinfo().get('_id'), false, 'doc-check2');
	t.equal(typeof Boxspring, 'function', 'maker-function');
	t.equal(_.identical([ 'function', 'object', 'function', 'function', 'function' ],
		[typeof Bx, typeof db, typeof db.doc, typeof db.design, typeof db.bulk]), true, 
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
			console.log(_.difference(expected, intersection), 'missing from expected');		
		}
	}

	compare(dbObject, _.keys(db), 'db'); 	
	compare(docObject, _.keys(db.doc()), 'doc');
	compare(bulkObject, _.keys(db.bulk()), 'bulk'); 	
	compare(rowObject, _.keys(db.row()), 'row'); 
	compare(rowsObject, _.keys(db.rows()), 'rows'); 
	compare(cellObject, _.keys(db.cell()), 'cell');
	compare(queryObject, _.keys(db['query'](db)), 'query');
	t.equal(typeof db.design().query().system, 'object', 'system-object');
	compare(viewObject, _.keys(db['view'](db)), 'view');
	
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
