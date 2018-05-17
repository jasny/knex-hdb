'use strict';

exports.__esModule = true;

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('knex/lib/client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('knex/lib/helpers');

var helpers = _interopRequireWildcard(_helpers);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _tablebuilder = require('./schema/tablebuilder');

var _tablebuilder2 = _interopRequireDefault(_tablebuilder);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _string = require('knex/lib/query/string');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
// SAP HANA Client
// -------
function Client_HDB(config) {
    _client2.default.call(this, config);
}

(0, _inherits2.default)(Client_HDB, _client2.default);

(0, _assign3.default)(Client_HDB.prototype, {

    dialect: 'hdb',

    driverName: 'hdb',

    _driver: function _driver() {
        return require('hdb');
    },
    formatter: function formatter() {
        return new _formatter2.default(this);
    },
    queryCompiler: function queryCompiler() {
        return new (Function.prototype.bind.apply(_compiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
    },
    tableBuilder: function tableBuilder(type, tableName, fn) {
        return new _tablebuilder2.default(this, type, tableName, fn);
    },
    tableCompiler: function tableCompiler() {
        return new (Function.prototype.bind.apply(_tablecompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
    },
    columnCompiler: function columnCompiler() {
        return new (Function.prototype.bind.apply(_columncompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
    },
    transaction: function transaction() {
        throw new Error("transactions not supported yet");
    },


    _escapeBinding: (0, _string.makeEscape)(),

    wrapIdentifier: function wrapIdentifier(value) {
        if (value === '*') return value;

        var identifier = value.toUpperCase();
        var matched = identifier.match(/(.*?)(\[[0-9]\])/);
        if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
        return '"' + identifier.replace(/"/g, '""') + '"';
    },


    // Get a raw connection, called by the `pool` whenever a new
    // connection needs to be added to the pool.
    acquireRawConnection: function acquireRawConnection() {
        var _this = this;

        var wrapIdentifier = this.wrapIdentifier;

        return new _bluebird2.default(function (resolver, rejecter) {
            var connection = _this.driver.createClient(_this.connectionSettings);
            connection.connect(function (err) {
                if (err) return rejecter(err);
                connection.on('error', function (err) {
                    connection.__knex__disposed = err;
                });

                if (_this.connectionSettings.schema) {
                    connection.exec("set schema " + wrapIdentifier(_this.connectionSettings.schema), function (err) {
                        if (err) return rejecter(err);
                        resolver(connection);
                    });
                } else {
                    resolver(connection);
                }
            });
        });
    },


    // Used to explicitly close a connection, called internally by the pool
    // when a connection times out or the pool is shutdown.
    destroyRawConnection: function destroyRawConnection(connection) {
        connection.end(function (err) {
            if (err) connection.__knex__disposed = err;
        });
    },
    validateConnection: function validateConnection(connection) {
        return connection.readyState === 'connected';
    },


    // Grab a connection, run the query via the HDB streaming interface,
    // and pass that through to the stream we've sent back to the client.
    _stream: function _stream(connection, obj, stream, options) {
        options = options || {};
        return new _bluebird2.default(function (resolver, rejecter) {
            stream.on('error', rejecter);
            stream.on('end', resolver);
            connection.query(obj.sql, obj.bindings).createArrayStream(options).pipe(stream);
        });
    },


    // Runs the query on the specified connection, providing the bindings
    // and any other necessary prep work.
    _query: function _query(connection, obj) {
        var returningSQL = null,
            returningHandler = null;
        if (obj.returningSQL) returningSQL = obj.returningSQL;
        if (obj.returningHandler) returningHandler = obj.returningHandler;
        if (!obj || typeof obj === 'string') obj = { sql: obj };
        return new _bluebird2.default(function (resolver, rejecter) {
            var _obj = obj,
                sql = _obj.sql;

            if (!sql) return resolver();
            if (obj.options) sql = (0, _assign3.default)({ sql: sql }, obj.options);
            connection.prepare(obj.sql, function (err, statement) {
                if (err) return rejecter(err);
                return statement.exec(obj.bindings || [], function (err, result) {
                    if (err) return rejecter(err);
                    if (returningSQL && (0, _isString3.default)(returningHandler)) {
                        connection.exec(returningSQL, function (_err, res) {
                            if (_err) return rejecter(_err);
                            if (returningHandler && (0, _isFunction3.default)(returningHandler)) {
                                resolver(returningHandler(res));
                            } else {
                                resolver(res);
                            }
                        });
                    } else {
                        obj.response = result;
                        resolver(obj);
                    }
                });
            });
        });
    },


    // Process the response as returned from the query.
    processResponse: function processResponse(obj, runner) {
        if (obj == null) return;
        var response = obj.response;
        var method = obj.method;


        if (obj.output) return obj.output.call(runner, response);
        switch (method) {
            case 'select':
            case 'pluck':
            case 'first':
                {
                    var resp = helpers.skim(response);
                    if (method === 'pluck') return (0, _map3.default)(resp, obj.pluck);
                    return method === 'first' ? resp[0] : resp;
                }
            default:
                return response;
        }
    },


    canCancelQuery: false,

    cancelQuery: function cancelQuery(connectionToKill) {
        return _bluebird2.default.reject('cancel query not supported');
    }
});

exports.default = Client_HDB;
module.exports = exports['default'];