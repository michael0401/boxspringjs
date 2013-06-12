// BoxspringJS dependencies
_ = require('underscore');			
Backbone = require('Backbone');	
Boxspring = require('boxspring');

// external auth file { "auth": {"name": "some-user", "password": "secret-password"}};	
auth = require('auth').auth;

// database template used by most test scripts
Maker = Boxspring({'name': 'regress', 'auth': auth.auth});
