'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _formatter = require('knex/lib/formatter');

var _formatter2 = _interopRequireDefault(_formatter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HDB_Formatter = function (_Formatter) {
  (0, _inherits3.default)(HDB_Formatter, _Formatter);

  function HDB_Formatter() {
    (0, _classCallCheck3.default)(this, HDB_Formatter);
    return (0, _possibleConstructorReturn3.default)(this, _Formatter.apply(this, arguments));
  }

  HDB_Formatter.prototype.parameter = function parameter(value, notSetValue) {
    if (value instanceof Date) {
      value = value.toISOString().replace(/\..+$/, '');
    }

    return _Formatter.prototype.parameter.call(this, value, notSetValue);
  };

  return HDB_Formatter;
}(_formatter2.default);

exports.default = HDB_Formatter;
module.exports = exports['default'];