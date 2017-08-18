'use strict';

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablebuilder = require('knex/lib/schema/tablebuilder');

var _tablebuilder2 = _interopRequireDefault(_tablebuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Builder
// ------

/* eslint max-len:0 no-console:0*/

// HDB Table Builder & Compiler
// -------
function TableBuilder_HDB() {
  _tablebuilder2.default.apply(this, arguments);
}
(0, _inherits2.default)(TableBuilder_HDB, _tablebuilder2.default);

(0, _assign3.default)(TableBuilder_HDB.prototype, {
  tableType: function tableType(value) {
    this._single.tableType = value;
  }
});

module.exports = TableBuilder_HDB;