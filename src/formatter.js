import Formatter from 'knex/lib/formatter'

export default class HDB_Formatter extends Formatter {

  parameter(value, notSetValue) {
    if (value instanceof Date) {
      value = value.toISOString().replace(/\..+$/, '')
    }
    
    return super.parameter(value, notSetValue)
  }

}