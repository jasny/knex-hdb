// HDB Query Compiler
// ------
import inherits from 'inherits';
import QueryCompiler from 'knex/lib/query/compiler';

import {
    assign, bind, compact, groupBy, isEmpty, isString, isUndefined, map, omitBy,
    reduce
} from 'lodash';

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
        let sql = `update ${this.tableName}`
            + (limit ? ` ${limit}` : '')
            + (join ? ` from ${this.tableName} ${join}` : '')
            + ' set ' + updates.join(', ')
            + (where ? ` ${where}` : '');
        let {returning} = this.single||null;
        if (returning) {
            sql = {
                sql: sql,
                returning: '*',
                returningSQL: 'select CURRENT_IDENTITY_VALUE() as ID from ' + this.tableName + '  limit 1;',
                returningHandler(response) {
                    return response[0].ID
                }
            };
        }
        return sql;
    },

    // Compiles an "insert" query, allowing for multiple
    // inserts using a single query statement.
    insert() {
        const insertValues = this.single.insert || [];
        let { returning } = this.single;

        let sql = this.with() + `insert into ${this.tableName} `;
        if (Array.isArray(insertValues)) {
            if (insertValues.length === 0) {
                return ''
            }
        } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
            return sql + this._emptyInsertValue
        }

        const insertData = this._prepInsert(insertValues);
        if (typeof insertData === 'string') {
            sql += insertData;
        } else  {
            if (insertData.columns.length) {
                sql += `(${this.formatter.columnize(insertData.columns)}`
                sql += ') values ('
                let i = -1
                while (++i < insertData.values.length) {
                    if (i !== 0) sql += '), ('
                    sql += this.formatter.parameterize(insertData.values[i], this.client.valueForUndefined)
                }
                sql += ')';
            } else if (insertValues.length === 1 && insertValues[0]) {
                sql += this._emptyInsertValue
            } else {
                sql = ''
            }
        }
        if (returning) {
            sql = {
                sql: sql,
                returning: '*',
                returningSQL: 'select CURRENT_IDENTITY_VALUE() as ID' + ' from ' + this.tableName + '  limit 1;',
                returningHandler(response) {
                    return response[0].ID
                }
            };
        }
        return sql;
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
            sql: 'select * from TABLE_COLUMNS where TABLE_NAME = ? and SCHEMA_NAME = CURRENT_SCHEMA'
            + (column ? ' and COLUMN_NAME = ?' : ''),
            bindings: [this.single.table.toUpperCase(), column ? column.toUpperCase() : ''],
            output(resp) {
                const out = resp.reduce(function (columns, val) {
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
