
// HDB Query Compiler
// ------
import inherits from 'inherits';
import QueryCompiler from 'knex/src/query/compiler';

import { assign, compact } from 'lodash'

function QueryCompiler_HDB(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_HDB, QueryCompiler)

assign(QueryCompiler_HDB.prototype, {

  _emptyInsertValue: '() values ()',

  // Update method, including joins, wheres, order & limits.
  update() {
    const join = this.join();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    
    return `update ${this.tableName}` +
      (limit ? ` ${limit}` : '')
      (join ? ` from ${this.tableName} ${join}` : '') +
      ' set ' + updates.join(', ') +
      (where ? ` ${where}` : '');
  },

  forUpdate() {
    return 'for update';
  },

  forShare() {
    return ''; // not supported
  },

  // Compiles a `columnInfo` query.
  columnInfo() {
    const column = this.single.columnInfo;
    const dbname = this.client.connectOptions.databaseName || '';
    return {
      sql: 'select * TABLE_COLUMNS where TABLE_NAME = ?'
        + (this.client.connectOptions.databaseName ? ' and SCHEMA_NAME = ?' : ''),
      bindings: [this.single.table.toUpperCase(), dbname.toUpperCase()],
      output(resp) {
        const out = resp.reduce(function(columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE_NAME,
            maxLength: val.LENGTH,
            nullable: (val.IS_NULLABLE)
          };
          return columns
        }, {})
        return column && out[column] || out;
      }
    };
  },

  limit() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only.
    const limit = (this.single.offset && noLimit)
      ? '18446744073709551615'
      : this.formatter.parameter(this.single.limit)
    return `limit ${limit}`;
  }

})

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
export default QueryCompiler_HDB;
