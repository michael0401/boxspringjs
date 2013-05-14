util = require('util');
Backbone = require('Backbone');

_ = require('underscore');
_.mixin(require('../base-utils/base-utils'));
_.mixin(require('../file-utils/url-utils'));

boxspring = require('./boxspring');

boxspring.Lookup = require('../js-lookup/js-lookup');
boxspring.List = require('../js-list/js-list');
boxspring.Queue = require('../js-queue/js-queue').Queue;


boxspring.fileUtils = require('../file-utils/file-utils');
boxspring.dateUtils = require('../date-utils/date-utils');
boxspring.auth = require('../file-utils/auth');
require('../node-ObjTree/ObjTree');
boxspring.Serialize = require('../base-utils/format').Serialize;


require('./db');
require('./bulk');
require('./doc');
require('./design');
require('./view');
require('./row');
require('./rows');
require('./cell');
//require('./db-utils');
require('./query-utils');

boxspring.Events = function(Obj, ctx2, tags) {
	var ctx1 = _.extend(Obj || {}, _.clone(Backbone.Events));
	return ctx1;
};


// What it does: convert a URL into a valid docId
var url2Id = function (host, reverse) {

	if (reverse && typeof host === 'string') {
		return(host.replace(/-/g, '.'));
	}
	if (host.indexOf('http://') === -1) {				
		return(_.urlParse('http://' + host).host.replace(/\./g, '-'));
	}
	return(_.urlParse(host).host.replace(/\./g, '-'));
};


