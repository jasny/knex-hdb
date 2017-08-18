/* eslint max-len:0 no-console:0*/

// HDB Table Builder & Compiler
// -------
import inherits from 'inherits';
import TableCompiler from 'knex/lib/schema/tablecompiler';
import * as helpers from 'knex/lib/helpers';
import Promise from 'bluebird';

import { assign } from 'lodash'

// Table Compiler
// ------

function TableCompiler_HDB() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_HDB, TableCompiler);

assign(TableCompiler_HDB.prototype, {

  createQuery(columns) {
    const tableType = this.single.tableType || '';
    const createStatement = `create ${tableType} table `;
    const { client } = this;
    let sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

    if (this.single.comment) {
      const comment = (this.single.comment || '');
      sql += ` comment '${comment}'`;
    }

    this.pushQuery(sql);
  },

  // Compiles the comment on the table.
  comment(comment) {
    this.pushQuery(`comment on ${this.tableName()} comment is '${comment}'`);
  },
  
  // Create an index
  index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`create index ${indexName} on ${this.tableName()} (${this.formatter.columnize(columns)})`);
  },
  
  // Set the primary key
  primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(columns)})`);
  },

  // Create an index
  unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`create unique index ${indexName} on ${this.tableName()} (${this.formatter.columnize(columns)})`);
  }
})

export default TableCompiler_HDB;
