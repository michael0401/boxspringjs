



// adds methods to result object to enable 'pivot' on keys
// Note: this object relies on a view result that is reduced 'reduce=true' 
// adds methods to result object to enable 'pivot' on keys
// Note: this object relies on a view result that is reduced 'reduce=true' 
var pivot = function () {
	var local = this
	, columns = _.clone(local.query.all())
	, hash = bx.Hash()
	, pivotRow = local.query.get('pivot-row')
	, pivotColumn = local.query.get('pivot-column')
	, map = []
	, newPivotResult = function(c, s, a) {
		var that = {'count': c || 0, 'sum': s || 0, 'average': a || 0 };
		that.add = function(b) {
			this.count += b.count;
			this.sum += b.sum;
			this.average = (this.sum / this.count);
			return this;
		};
		return that;
	};
	
	// check the configuration to be sure the pivotRow and Columns exist
	if (!_.arrayFound(pivotRow, columns) ||
		!_.arrayFound(pivotColumn, local.query.get('referenceKey'))) {
			bx.alert('bad-pivot', 500, pivotRow + ', ' + pivotColumn);
			return this;
	}

	// step 1: calculate the unique columns [pivot-key-values]
	// start by getting the filtered rows; use them to build the new hash
	local.each(function(row) { map.push(row); });
	columns = _.sortBy(_.uniq(_.map(map, /*local.rows,*/ function(row) { 
		return (local.query.access(row).select(pivotColumn)).toString();
	}), false), function (x) { return x; });
	// add the row total column to the end
	columns = columns.concat(['row total']);
	// reset the access cache
	local.query.columnReset();
	// step 2: iterate over all rows, and produce a hash of values
	// since we're clipping from the key length, the hash will have to 
	// update, not just store
	this.each(function(row) {	
		var newRow = { 
			'key': [ local.query.access(row).select(pivotRow) ],
			'value': {}
		}
		, colHdr = (local.query.access(row).select(pivotColumn)).toString()
		// check for an existing entry at this address
		, lastValue = hash.find(newRow.key)
		, pivotValue = local.query.access(row).getValue(row)
		, template = newPivotResult(1, (_.isNumber(pivotValue) && pivotValue) || 1);

		if (lastValue) {
			newRow.value = lastValue.value;
			if (lastValue.value[colHdr]) {
				template.count = lastValue.value[colHdr].count + 1;
				template.sum += lastValue.value[colHdr].sum;
			}
			template.average = (template.sum / template.count);
		}
		newRow.value[colHdr] = template;			
		// store the newRow
		hash.store(newRow.key, newRow);
	});
	// step 1a: update the query object based on the new column values
	local.query.set('keys', [ pivotRow ]);
	local.query.set('columns', [ pivotRow ].concat(columns));
	local.query.set('displayColumns', [ pivotRow ].concat(columns));
	local.query.set('sortColumn', pivotRow);
	local.query.set('sortAscending', true);
	// new column defs for pivot table. first column string, rest numbers
	local.query.columnTypes(pivotRow, 'string');
	columns.forEach(function(c) {
		if (!local.query.hasType(c)) {
			local.query.columnTypes(c, 'number', 1);							
		}
	});
	
	// new 'each' method; called by rendering function ie., googleVis
	var each = function(fn) {
		var that = {}
		, func = _.isFunction(fn) ? fn : function() { return ; };

		that.total_rows = hash.length();
		that.totals = (function () {
			var totals = {
				'cT': {
					'key': ['column total'],
					'value': _.reduce(columns, function (x, col) {
						x[col] = newPivotResult();
						return x;
					}, {})
				}
			};
			
			totals.rowTotal = function (row) {						
				if (!row.value.hasOwnProperty('row total')) {
					// sum across the row values
					row.value['row total'] = _.reduce(row.value, function(x, y, z) {
						totals.cT.value[z].add(y);
						return x.add(y);
					}, newPivotResult());
					// sum the row total for all the columns
					this.cT.value['row total'].add(row.value['row total']);
				}
				return row;
			};
			totals.columnTotal = function () {
				return _.extend(this.cT, local.wrap(this.cT));
			};			
			return totals;
		}()); 
		/*jslint unparam: true */
		hash.each(function(row, key, current_row) {							
			that.current_row = current_row;
			// extend this row record with 'access'
			func(that.totals.rowTotal(local.wrap(row)), 
				that.total_rows === current_row);
			if (that.total_rows === current_row) {
				func(that.totals.columnTotal(), true);
			}
		});
		return that;
	};
	local.each = each;

	// update the pageInfo for this result
	local.total_rows = hash.keys().length;
	local.offset = 0;
	local.rows = hash.keys();					
	return local;
};			
that.pivot = pivot;

/*	
	NOT USED: MOVED HERE FROM FORMER RESULT() OBJECT
	// What it does: Swaps two indices in place. Effect is to switch axes
	var reverse = function (i1, i2) {
		var tmp;

		this.each(function(item) {
			tmp = item.key[i1];
			item.key[i1] = item.key[i2];
			item.key[i2] = tmp;
		});
		return this;
	};
	rows.reverse = reverse;

*/