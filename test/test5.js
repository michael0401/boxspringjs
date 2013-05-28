require('../index');
thisauth = require('auth').auth;
alternate = require('auth').alternate;
badname = require('auth').badname;
badpass = require('auth').badpass;

// Documentation: https://npmjs.org/package/tape
var test = require('tape')
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
		"views": {
			'my-view': {
				'map': function (doc) {
					if (doc && doc._id) {
						emit(doc._id, null);
					}
				}
			}
		}
	};
}

test('boxspringjs-1', function (t) {

	t.plan(4);
	
	var db1 = Boxspring.extend('regress', { 'auth': thisauth.auth })('127.0.0.1')
	, db2 = Boxspring.extend('regress', { 'auth': badname.auth })()
	, db3 = Boxspring.extend('regress', { 'auth': badpass.auth })()
	, db4 = Boxspring.extend('regress', {'auth': alternate.auth })();	
	
	var confirmSession = function(db, expected, name, count) {
		count = typeof count === 'undefined' ? 0 : count;
		
		db.session(function(err, result) {
			if (result.code === expected) {
				t.equal(result.code, expected, name);				
			} else {
				// retry until it works...
				if (count < 3) {
					console.log('Retrying...');
					confirmSession(db, expected, name, count+1);						
				} else {
					console.log('Retry failed...', result.code, result.data, db.auth);
					t.equal(result.code, expected, name);
				}
			}
		});
	}
		
	confirmSession(db1, 200, 'couch-succeed');
	confirmSession(db2, 401, 'bad-name');
	confirmSession(db3, 401, 'bad-password');
	confirmSession(db4, 200, 'hashed-auth');
	
	
//	 { ok: true, name: null, roles: [ '_admin' ] } }


	
	var xyz = function(err, result) {
			
		t.equal(result.code, 200, 'login');
		
		boxspringjs.heartbeat(function(err, data) {
			t.equal(data.code, 200, 'heartbeat');
		});

		boxspringjs.session(function(err, data) {
			t.equal(data.code, 200, 'session');
		});

		boxspringjs.db_info(function(err, data) {
			t.equal(data.code, 200, 'db_info');
		});

		boxspringjs.all_dbs(function(err, data) {
			t.equal(data.code, 200, 'all_dbs');

			// gets root name by default, then tests getting name with id provided
			t.equal(anotherdb.name, 'regress', 'regress-name');
			// tests the defaultView method since not defined
			t.equal(anotherdb.index, 'my-view', 'my-view');
			// not explicitly defined 'default'
			t.equal(boxspringjs.designName, '_design/default', 'default');
			// makes sure we return a .doc object		
			t.equal(typeof boxspringjs.doc, 'function', 'function');
		});
	};
});

