// SAP HANA Client
// -------
import inherits from 'inherits';

import Client from 'knex/lib/client';
import Promise from 'bluebird';
import * as helpers from 'knex/lib/helpers';

import Formatter from './formatter';
import QueryCompiler from './query/compiler';
import TableBuilder from './schema/tablebuilder';
import TableCompiler from './schema/tablecompiler';
import ColumnCompiler from './schema/columncompiler';

import {assign, map, isFunction, isString} from 'lodash'
import {makeEscape} from 'knex/lib/query/string'

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_HDB(config) {
    Client.call(this, config);
}

inherits(Client_HDB, Client);

assign(Client_HDB.prototype, {

    dialect: 'hdb',

    driverName: 'hdb',

    _driver() {
        return require('hdb')
    },

    formatter() {
        return new Formatter(this)
    },

    queryCompiler() {
        return new QueryCompiler(this, ...arguments)
    },

    tableBuilder(type, tableName, fn) {
        return new TableBuilder(this, type, tableName, fn)
    },

    tableCompiler() {
        return new TableCompiler(this, ...arguments)
    },

    columnCompiler() {
        return new ColumnCompiler(this, ...arguments)
    },

    transaction() {
        throw new Error('Transaction not implemented yet')
    },

    _escapeBinding: makeEscape(),

    wrapIdentifier(value) {
        if (value === '*') return value

        const identifier = value.toUpperCase();
        const matched = identifier.match(/(.*?)(\[[0-9]\])/)
        if (matched) return this.wrapIdentifier(matched[1]) + matched[2]
        return `"${identifier.replace(/"/g, '""')}"`
    },

    // Get a raw connection, called by the `pool` whenever a new
    // connection needs to be added to the pool.
    acquireRawConnection() {
        const wrapIdentifier = this.wrapIdentifier;

        return new Promise((resolver, rejecter) => {
            const connection = this.driver.createClient(this.connectionSettings)
            connection.connect((err) => {
                if (err) return rejecter(err)
                connection.on('error', err => {
                    connection.__knex__disposed = err
                })

                if (this.connectionSettings.schema) {
                    connection.exec("set schema " + wrapIdentifier(this.connectionSettings.schema), (err) => {
                        if (err) return rejecter(err)
                        resolver(connection)
                    });
                } else {
                    resolver(connection)
                }
            })
        })
    },

    // Used to explicitly close a connection, called internally by the pool
    // when a connection times out or the pool is shutdown.
    destroyRawConnection(connection) {
        connection.end(err => {
            if (err) connection.__knex__disposed = err
        })
    },

    validateConnection(connection) {
        return connection.readyState === 'connected'
    },

    // Grab a connection, run the query via the HDB streaming interface,
    // and pass that through to the stream we've sent back to the client.
    _stream(connection, obj, stream, options) {
        options = options || {}
        return new Promise((resolver, rejecter) => {
            stream.on('error', rejecter)
            stream.on('end', resolver)
            connection.query(obj.sql, obj.bindings).createArrayStream(options).pipe(stream)
        })
    },


    // Runs the query on the specified connection, providing the bindings
    // and any other necessary prep work.
    _query(connection, obj) {
        let returningSQL = null, returningHandler = null;
        if (obj.returningSQL) returningSQL = obj.returningSQL;
        if (obj.returningHandler) returningHandler = obj.returningHandler;
        if (!obj || typeof obj === 'string') obj = {sql: obj}
        return new Promise(function (resolver, rejecter) {
            let {sql} = obj
            if (!sql) return resolver()
            if (obj.options) sql = assign({sql}, obj.options)
            connection.prepare(obj.sql, function (err, statement) {
                if (err) return rejecter(err)
                return statement.exec(obj.bindings || [], function (err, result) {
                    if (err) return rejecter(err)
                    if (returningSQL) {
                        connection.exec(returningSQL, function (_err, res) {
                            if (_err) return rejecter(_err);
                            if (returningHandler) {
                                obj.response =  returningHandler(res);
                                resolver(obj);
                            } else {
                                resolver(obj);
                            }
                        });
                    } else {
                        obj.response = result;
                        resolver(obj)
                    }
                })
            })
        })
    },

    // Process the response as returned from the query.
    processResponse(obj, runner) {
        if (obj == null) return;
        var response = obj.response;
        var method = obj.method;
        function handleReturn(response){
            try{
                return typeof runner.client.config.postProcessResponse ==='function' ? runner.client.config.postProcessResponse(response) : response;
            } catch(e){
                return response;
            }
        }
        if (obj.output) return obj.output.call(runner, response);
        switch (method) {
            case 'select':
            case 'pluck':
            case 'first':
            {
                var resp = helpers.skim(response);
                if (method === 'pluck') return handleReturn((0, _map3.default)(resp, obj.pluck));
                return method === 'first' ? handleReturn(resp[0]): handleReturn(resp);
            }
            default:
                return handleReturn(response);
        }
    },

    canCancelQuery: false,

    cancelQuery(connectionToKill) {
        return Promise.reject('cancel query not supported')
    }
})

export default Client_HDB
