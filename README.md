# Knex.js HDB

This library add support for SAP HANA to [knex.js](http://knexjs.org/). It uses
[`node-hdb`](https://github.com/SAP/node-hdb) as driver.

## Installation

    npm install --save knex-hdb

## Usage

Please read the [knex documentation](http://knexjs.org/).

### Connect

Passing a custom client class to knex isn't working. You therefore need to instantiate the client yourself and
use the `makeknex` utility.

```js
const makeKnex = require('knex/lib/util/make-knex');
const HDBClient = require('knex-hdb');

const client = new HDBClient({
  connection: {
    host     : 'hostname',
    port     : 30015,
    user     : 'user',
    password : 'secret',
    schema   : 'schema'
  }
});

const knex = makeKnex(client);
```

### Create a table

The custom `tableType` option may be used to specify the [table type][1].

An `increments` column will translate to a `DEFAULT TO IDENTITY` statement. This is only available for 'COLUMN' tables,
not for 'ROW' type tables.

Pass `'utf-8'` to a `string` column to create an `NVARCHAR` column instead a `VARCHAR`. 

```js
knex.schema.createTable('accounts', function(table) {
  table.string('id', 32).primary();
  table.string('account_name');
  table.string('full_name', 255, 'utf-8');
  table.index('account_name');
})
```

## Build

To build this project from source, download it from GitHub and then run

    npm install
    npm run build

There will be a new 'lib' folder.

## Todo

* Unit tests
* Support for modifying a table
* Tranactions
* Upsert support

_This is a very early version and there are likely to be bugs. Please be so kind to report any issues you come across
and if possible provide a pull request._

[1]: https://help.sap.com/viewer/4fe29514fd584807ac9f2a04f6754767/2.0.02/en-US/20d58a5f75191014b2fe92141b7df228.html#loio20d58a5f75191014b2fe92141b7df228__sql_create_table_1sql_create_table_syntax_elements
