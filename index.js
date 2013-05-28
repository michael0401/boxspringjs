if (typeof module !== 'undefined' && module.exports) {
	_ = require('underscore');			
	Backbone = require('Backbone');	
	Boxspring = require('boxspring');	
} else {
	function boxspring_load(scripts) {
	  for (var i=0; i < scripts.length; i++) {
	    document.write('<script src="'+scripts[i]+'"><\/script>')
	  };
	};

	var UTIL = {};
	boxspring_load([
		"../node_modules/underscore",
		"../node_modules/Backbone",
		"../node_modules/boxspring"
	]);
}

var Maker = new Boxspring();
//var maker = Maker.extend();
var a = Maker.extend('a', {'some': 'other-stuff'});
var b = Maker.extend('b', {'auth': {'name': 'couchdb', 'password': 'couchdb' }})('127.0.0.1');

b.login(function(err, res) {
	console.log('b', res.code);
});

a().login(function(err, res) {
	console.log('a', res.code);
})

/*
require('auth');
require('js-base');
require('format');
require('js-url');
require('js-dates');

boxspring.UTIL = {};
boxspring.UTIL.hash = require('js-hash');
boxspring.UTIL.queue = require('js-queue');
boxspring.UTIL.XML = require('js-ObjTree');
boxspring.UTIL.fileio = require('js-fileio');


require('db');
require('bulk');
require('doc');
require('design');
require('view');
require('row');
require('rows');
require('cell');
require('query');

*/


