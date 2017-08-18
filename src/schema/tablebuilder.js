/* eslint max-len:0 no-console:0*/

// HDB Table Builder & Compiler
// -------
import inherits from 'inherits';
import TableBuilder from 'knex/lib/schema/tablebuilder';

import { assign } from 'lodash';

// Table Builder
// ------

function TableBuilder_HDB() {
  TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_HDB, TableBuilder);

assign(TableBuilder_HDB.prototype, {
  tableType(value) {
    this._single.tableType = value;
  }
});

module.exports = TableBuilder_HDB;
