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

var Admin = admin = Boxspring({'name': '_users', 
	'auth': {'name': 'couchdb', 'password': 'admin'}})('127.0.0.1')
// anonymous user
, user = Boxspring('_users')().users('ron')	
, db1 = Boxspring({'name': 'regress', 'auth': thisauth.auth })('127.0.0.1')
, db2 = Boxspring({'name': 'regress', 'auth': badname.auth })()
, db3 = Boxspring({'name': 'regress', 'auth': badpass.auth })()
;


test('boxspring-auth-1', function (t) {

	t.plan(3);
		
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
});

test('boxspring-auth-2', function(t) {
	t.plan(15);
	
	var signUpSequence4 = function () {
		var model = new user.Users(user)
		, expected = true;
		
		
		model.set('auth', {'name': 'couchdb', 'password': 'admin'});

		model.on('change:loggedIn', function() {
			t.equal(this.get('loggedIn'), expected, 'loggedIn');
			expected = !expected;
		});
		
		model.on('change:removed', function() {
			t.equal(this.get('removed'), 200, 'changed');
		})
		
		model.on('change:updated', function() {
			t.equal(this.get('error'), null, 'updated');
			model.set('auth', {'name': 'couchdb', 'password': 'admin'});
			model.login();
		});
		
		model.login();
		_.wait(2, function() {
			model.logout();
		});
		
		_.wait(4, function() {
			model.set('auth', {'name': 'ron', 'password': 'ran'});
			model.signup();
		});
		
		_.wait(6, function() {
			model.update('ran');
		});
		
		_.wait(8, function() {
			model.remove('ron');
		});
	}


	var signUpSequence3 = function () {
		user.signUp('ran', [], function(err, response, user) {
			t.equal(err, null,'signUp-3');
			// use the created/logged in account to change the password
			user.users('ron').update('run', [], function(err, response) {
				t.equal(err, null, 'update-user-3');
				// remove using the admin account
				admin.users('ron').remove(function(err, response) {
					t.equal(response.code, 200, 'delete-updated-user-3');
					// confirm the login fails
					user.login(function(err, response) {
						t.equal(response.code, 401, 'login-deleted-3');
						signUpSequence4();
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
				admin.users('ron').remove(function(err, response) {
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
		user.signUp('ran', [], function(err, response, newUser) {
			t.equal(err, null, 'signUp-1');
			newUser.users('ron').remove(function(err, response) {
				if (err) {
					t.equal(response.code, 404, 'expect-remove-fail');
					// expect to fail, user can't remove their own
					admin.users('ron').remove(function(err, response) {
						t.equal(response.code, 200, 'user-deleted-1');
						if (response.code === 200) {
							signUpSequence2();					
						}
					});
				} else {
					t.equal(response.code, 404, 'expect-remove-fail');
				}
			});

		});		
	};

	admin.login(function(e, r) {
		admin.users('ron', admin).fetch(function(err, res) {
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

