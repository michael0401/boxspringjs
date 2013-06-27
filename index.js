// BoxspringJS dependencies
_ = require('underscore');			
Backbone = require('Backbone');	
Boxspring = require('boxspring');

// external auth file { "auth": {"name": "some-user", "password": "secret-password"}};	
auth = require('auth').auth;

// database template used by most test scripts
Maker = Boxspring({'name': 'regress', '_design': 'my-design', '_view': 'my-view', 'auth': auth.auth});

ddoc = function () {
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
			'id': ['string', 1],
			'rev': ['string', 1],
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
						'id': formatter,
						'rev': formatter
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
					'keys': ['id'],
					'columns': ['id', 'doc', 'content', 'more-content', 'rev' ]
				}
			}
		}
	};
};

	
