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

var admin = Boxspring.extend('_users', {
	'auth': {'name': 'couchdb', 'password': 'admin'}})('127.0.0.1')
, user = Boxspring.extend('_user')().users('ron', thisauth.auth)	
, db1 = Boxspring.extend('regress', { 'auth': thisauth.auth })('127.0.0.1')
, db2 = Boxspring.extend('regress', { 'auth': badname.auth })()
, db3 = Boxspring.extend('regress', { 'auth': badpass.auth })()
, db4 = Boxspring.extend('regress', {'auth': alternate.auth })()
, db5 = Boxspring.extend('regress')();



/*
test('boxspring-auth-1', function (t) {

	t.plan(4);
		
	var confirmSession = function(db, expected, name, count) {
		count = typeof count === 'undefined' ? 0 : count;
		
		db.login(function(err, result) {
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
	
});
*/
test('boxspring-auth-2', function(t) {
	t.plan(9);


	var signUpSequence3 = function () {
		user.signUp('ran', [], function(err, response) {
			t.equal(err, null,'signUp-3');
			user.update('run', [], function(err, response) {
				t.equal(err, null, 'update-user-3');
				user.remove(function(err, response) {
					t.equal(response.code, 200, 'delete-updated-user-3');
					user.login(function(err, response) {
						t.equal(response.code, 401, 'login-deleted-3');
					});
				});
			});
		});
	};

	// test that a duplicate user name will fail
	var signUpSequence2 = function () {
		user.signUp('ran', [], function(err) {
			t.equal(err, null, 'signUp-2');
			user.signUp('ran', [], function(err, response) {
				t.equal(response.code, 409, 'signUp-conflict-2');
				user.remove(function(err, response) {
					t.equal(response.code, 200, 'user-deleted-2');
					if (response.code === 200) {
						signUpSequence3();						
					}
				});
			});		
		});
	};
		
	// test that a user name is created, and deleted.	
	var signUpSequence1 = function () {
		user.signUp('ran', [], function(err) {
			t.equal(err, null, 'signUp-1');
			user.remove(function(err, response) {
				t.equal(response.code, 200, 'user-deleted-1');
				if (response.code === 200) {
					signUpSequence2();					
				}
			});
		});		
	};

	admin.login(function(e, r) {
		admin.users('ron', admin).get(function(err, res) {
			// if existing, remove it
			if (!err) {
				admin.users('ron', admin).remove(function(err, res) {
					if (err) {
						return console.log('Unable to remove user, aborting...', err);
					}
					console.log('Removed user before starting...');
					signUpSequence1();
				});
			} else {
				// otherwise, proceed
				console.log('Nothing to remove before starting...');
				signUpSequence1();
			}
		});		
	});
});

