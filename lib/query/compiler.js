'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('knex/lib/query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// HDB Query Compiler
// ------
function QueryCompiler_HDB(client, builder) {
    _compiler2.default.call(this, client, builder);
}

(0, _inherits2.default)(QueryCompiler_HDB, _compiler2.default);

(0, _assign3.default)(QueryCompiler_HDB.prototype, {

    _emptyInsertValue: '() values ()',

    // Update method, including joins, wheres, order & limits.
    update: function update() {
        var join = this.join();
        var updates = this._prepUpdate(this.single.update);
        var where = this.where();
        var order = this.order();
        var limit = this.limit();

        return 'update ' + this.tableName + (limit ? ' ' + limit : '') + (join ? ' from ' + this.tableName + ' ' + join : '') + ' set ' + updates.join(', ') + (where ? ' ' + where : '');
    },


    // Compiles an "insert" query, allowing for multiple
    // inserts using a single query statement.
    insert: function insert() {
        var insertValues = this.single.insert || [];
        var returning = this.single.returning;


        var sql = this.with() + ('insert into ' + this.tableName + ' ');
        if (Array.isArray(insertValues)) {
            if (insertValues.length === 0) {
                return '';
            }
        } else if ((typeof insertValues === 'undefined' ? 'undefined' : (0, _typeof3.default)(insertValues)) === 'object' && (0, _isEmpty3.default)(insertValues)) {
            return sql + this._emptyInsertValue;
        }

        var insertData = this._prepInsert(insertValues);
        if (typeof insertData === 'string') {
            sql += insertData;
        } else {
            if (insertData.columns.length) {
                sql += '(' + this.formatter.columnize(insertData.columns);
                sql += ') values (';
                var i = -1;
                while (++i < insertData.values.length) {
                    if (i !== 0) sql += '), (';
                    sql += this.formatter.parameterize(insertData.values[i], this.client.valueForUndefined);
                }
                sql += ')';
            } else if (insertValues.length === 1 && insertValues[0]) {
                sql += this._emptyInsertValue;
            } else {
                sql = '';
            }
        }

        if (returning) {
            sql.returning = returning;
            // generate select statement
            // select CURRENT_IDENTITY_VALUE() as ID from "SYSTEM"."INDUSTRIES" limit 1;
            sql.returningSql = 'select CURRENT_IDENTITY_VALUE() as ID' + ' from ' + this.tableName + '  limit 1';
        }
        return sql;
    },
    forUpdate: function forUpdate() {
        return 'for update';
    },
    forShare: function forShare() {
        return ''; // not supported
    },


    // Compiles a `columnInfo` query.
    columnInfo: function columnInfo() {
        var column = this.single.columnInfo;
        var dbname = this.client.connectOptions.databaseName || '';
        return {
            sql: 'select * from TABLE_COLUMNS where TABLE_NAME = ? and SCHEMA_NAME = CURRENT_SCHEMA' + (column ? ' and COLUMN_NAME = ?' : ''),
            bindings: [this.single.table.toUpperCase(), column ? column.toUpperCase() : ''],
            output: function output(resp) {
                var out = resp.reduce(function (columns, val) {
                    columns[val.COLUMN_NAME] = {
                        defaultValue: val.COLUMN_DEFAULT,
                        type: val.DATA_TYPE_NAME,
                        maxLength: val.LENGTH,
                        nullable: val.IS_NULLABLE
                    };
                    return columns;
                }, {});
                return column && out[column] || out;
            }
        };
    },
    limit: function limit() {
        var noLimit = !this.single.limit && this.single.limit !== 0;
        if (noLimit && !this.single.offset) return '';

        // Workaround for offset only.
        var limit = this.single.offset && noLimit ? '18446744073709551615' : this.formatter.parameter(this.single.limit);
        return 'limit ' + limit;
    }
});

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
exports.default = QueryCompiler_HDB;
module.exports = exports['default'];