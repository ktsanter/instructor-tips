"use strict";
//---------------------------------------------------------------
// manage MariaDB connections and queries
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.MariaDBManager = class {
  constructor(initialDBParams) {
    var connectionPool = initialDBParams.reqd.createPool({
      host: initialDBParams.host,
      user: initialDBParams.user,
      password: initialDBParams.password,
      connectionLimit: initialDBParams.connectionLimit
    });
    
    this._config = {
      dbParams: initialDBParams,
      pool: connectionPool
    };
  }

//---------------------------------------------------------------
// general query methods
//---------------------------------------------------------------
  async dbQuery(sql) {
    var conn;
    var dbResult = this.queryFailureResult();

    try {
        conn = await this._config.pool.getConnection();
        await conn.query('USE ' + this._config.dbParams.dbName);
        const rows = await conn.query(sql);
        dbResult.success = true;
        dbResult.details = 'db request succeeded';
        dbResult.data = [];
        for (var i = 0; i < rows.length; i++) {
          dbResult.data.push(rows[i]);
        }
        
    } catch (err) {
      dbResult.details = err;
      
    } finally {
      if (conn) conn.release();
    }
    
    return dbResult;
  }

  async dbQueries(queryList) {
    var queryResults = {
      success: true,
      details: 'queries succeeded',
      data: {}
    };
    
    for (var key in queryList) {
      var singleResult = await this.dbQuery(queryList[key]);
      if (!singleResult.success) {
        queryResults.success = false;
        queryResults.details = 'DB query failed (' + key +') ' + singleResult.details;
        
      } else {
        queryResults.data[key] = singleResult.data;
      }
    }
          
    return queryResults;    
  }  

  queryFailureResult() {
    return {success: false, details: 'db query failed', data: null, constraints: null};
  }      
}