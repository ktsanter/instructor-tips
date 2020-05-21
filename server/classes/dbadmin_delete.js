"use strict";
//---------------------------------------------------------------
// server-side DB delete interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminDelete = class {
  constructor(mariadb, dbName, userManagement) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: 'localhost',
      user: 'root',
      password: 'SwordFish002',
      connectionLimit: 5  
    });
    
    this._dbName = dbName;
    this._userManagement = userManagement;
  }
  
//---------------------------------------------------------------
// query dispatcher
//---------------------------------------------------------------
  async doDelete(params, postData) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'privileges') {
      dbResult = await this._deletePrivilege(params, postData);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._deleteUser(params, postData);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._deleteUserPrivilege(params, postData);
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._deleteTip(params, postData);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._deleteCategory(params, postData);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._deleteTipCategory(params, postData);
      
    } else if (params.queryName == 'admin_schedules') {
      dbResult = await this._deleteSchedule(params, postData);
      
    } else if (params.queryName == 'scheduletips') {
      dbResult = await this._deleteScheduleTip(params, postData);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// general query functions
//---------------------------------------------------------------
  _queryFailureResult() {
    return {success: false, details: 'db insert failed', data: null};
  }

  async _dbQuery(sql) {
    var conn;
    var dbResult = this._queryFailureResult();

    try {
        conn = await this._pool.getConnection();
        await conn.query('USE ' + this._dbName);
        await conn.query(sql);
        dbResult.success = true;
        dbResult.details = 'db request succeeded';
        
    } catch (err) {
      dbResult.details = err;
      //throw err;
      
    } finally {
      if (conn) conn.release();
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query functions
//---------------------------------------------------------------
  async _deletePrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from privilege ' +
                'where privilegeid = ' + postData.privilegeid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
      
    
    return result;
  }
  
  async _deleteUser(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from user ' +
                'where userid = ' + postData.userid;
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
    
  async _deleteUserPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from userprivilege ' +
                'where userprivilegeid = ' + postData.userprivilegeid;
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _deleteTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tip ' +
                'where tipid = ' + postData.tipid;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _deleteCategory(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from category ' +
                'where categoryid = ' + postData.categoryid;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _deleteTipCategory(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tipcategory ' +
                'where tipcategoryid = ' + postData.tipcategoryid;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
    
  async _deleteSchedule(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from schedule ' +
                'where scheduleid = ' + postData.scheduleid;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }    
    
  async _deleteScheduleTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from scheduletip ' +
                'where scheduletipid = ' + postData.scheduletipid;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }    
}
