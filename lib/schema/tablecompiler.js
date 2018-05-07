'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablecompiler = require('knex/lib/schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _helpers = require('knex/lib/helpers');

var helpers = _interopRequireWildcard(_helpers);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Compiler
// ------

/* eslint max-len:0 no-console:0*/

// HDB Table Builder & Compiler
// -------
function TableCompiler_HDB() {
  _tablecompiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(TableCompiler_HDB, _tablecompiler2.default);

(0, _assign3.default)(TableCompiler_HDB.prototype, {
  createQuery: function createQuery(columns) {
    var tableType = this.single.tableType || '';
    var createStatement = 'create ' + tableType + ' table ';
    var client = this.client;

    var sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

    if (this.single.comment) {
      var comment = this.single.comment || '';
      sql += ' comment \'' + comment + '\'';
    }

    this.pushQuery(sql);
  },


  // Compiles the comment on the table.
  comment: function comment(_comment) {
    this.pushQuery('comment on ' + this.tableName() + ' comment is \'' + _comment + '\'');
  },


  // Create an index
  index: function index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },


  // Set the primary key
  primary: function primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + constraintName + ' primary key (' + this.formatter.columnize(columns) + ')');
  },


  // Create an index
  unique: function unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create unique index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  }
});

exports.default = TableCompiler_HDB;
module.exports = exports['default'];