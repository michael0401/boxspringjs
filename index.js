_ = require('underscore');
Backbone = require('Backbone');
bx = function () {};
bx.Lookup = require('../js-lookup/js-lookup');
bx.baseUtils = require('../base-utils/base-utils');
bx.fileUtils = require('../file-utils/file-utils');
bx.urlUtils = require('../file-utils/url-utils');
bx.dateUtils = require('../date-utils/date-utils');
bx.List = require('../js-list/js-list');
bx.Queue = require('../js-queue/js-queue').Queue;
bx.auth = require('../file-utils/auth');
require('../node-ObjTree/ObjTree');
bx.Serialize = require('../base-utils/format').Serialize;
bx.db = require('./db');
bx.bulk = require('./bulk');
bx.doc = require('./doc');
bx.design = require('./design');
bx.view = require('./view');
bx.row = require('./row');
bx.rows = require('./rows');
bx.cell = require('./cell');
bx.dbUtils = require('./db-utils');

_.mixin(_.extend(bx.baseUtils, bx.urlUtils));


bx.Events = function(Obj) {
	var e = _.extend(Obj || {}, _.clone(Backbone.Events));
	var relay = function (tag, ctx1, ctx2) {
		var local = this;
		ctx1.on(tag, function () {
			// make the 'tag' the first argument
			ctx2.trigger.apply(ctx2, [tag].concat(_.toArray(arguments)));
		});
	};
	e.relay = relay;
	return e;
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


bx.createQuery = function (name) {
	var obj = require('./query');
	
	return bx.baseUtils.handle().create(obj, { 'name': name });
};

bx.createRow = function () {
	var obj = require('./row');
	
	return bx.baseUtils.handle().create(obj, bx.Lookup.Hash());
};

bx.createAccess = function () {
	var obj = require('./access');
	return bx.baseUtils.handle().create(obj, {'_id': '123'});
}


