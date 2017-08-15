
// SAP HANA Client
// -------
import inherits from 'inherits';

import Client from 'knex/client';
import Promise from 'bluebird';
import * as helpers from 'knex/src/helpers';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import SchemaCompiler from './schema/compiler';
import TableCompiler from './schema/tablecompiler';
import ColumnCompiler from './schema/columncompiler';

import { assign, map } from 'lodash'
import { makeEscape } from 'knex/query/string'

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

  queryCompiler() {
    return new QueryCompiler(this, ...arguments)
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments)
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments)
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments)
  },

  transaction() {
    throw new Error("transactions not supported")
  },

  _escapeBinding: makeEscape(),

  wrapIdentifier(value) {
    if (value === '*') return value
    const matched = value.match(/(.*?)(\[[0-9]\])/)
    if (matched) return this.wrapIdentifier(matched[1]) + matched[2]
    return `"${value.replace(/"/g, '""')}"`
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const connection = this.driver.createClient(this.connectionSettings)
      connection.connect((err) => {
        if (err) return rejecter(err)
        connection.on('error', err => {
          connection.__knex__disposed = err
        })
        resolver(connection)
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
    if (!obj || typeof obj === 'string') obj = {sql: obj}
    return new Promise(function(resolver, rejecter) {
      let { sql } = obj
      if (!sql) return resolver()
      if (obj.options) sql = assign({sql}, obj.options)
      
      connection.prepare(obj.sql, function(statement, next) {
        return statement.execute(obj.bindings, function(err, result) {
          if (err) return rejecter(err)
          
          if (obj.method === 'select' || obj.method === 'pluck' || obj.method === 'first') {
            result.fetch(function (err, rows) {
              if (err) return rejecter(err)
              
              obj.response = rows
              resolver(obj)
            })
          } else {
            obj.response = result
            resolver(obj)
          }
        })
      })
    })
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response } = obj
    const { method } = obj
    
    if (obj.output) return obj.output.call(runner, response)
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        const resp = helpers.skim(response)
        if (method === 'pluck') return map(resp, obj.pluck)
        return method === 'first' ? resp[0] : resp
      }
      default:
        return response
    }
  },

  canCancelQuery: false,

  cancelQuery(connectionToKill) {
    return Promise.reject('cancel query not supported')
  }

})

export default Client_HDB
