"use strict";
//---------------------------------------------------------------
// server-side DB insert interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminInsert = class {
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
  async doInsert(params, postData) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'privileges') {
      dbResult = await this._insertPrivilege(params, postData);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._insertUser(params, postData);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._insertUserPrivilege(params, postData);
            
    } else if (params.queryName == 'categories') {
      dbResult = await this._insertCategory(params, postData);
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._insertTip(params, postData);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._insertTipCategory(params, postData);
      
    } else if (params.queryName == 'admin_schedules') {
      dbResult = await this._insertSchedule(params, postData);
      
    } else if (params.queryName == 'scheduletips') {
      dbResult = await this._insertScheduleTip(params, postData);
      
    } else if (params.queryName == 'controlstates') {
      dbResult = await this._insertControlState(params, postData);
      
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
        const rows = await conn.query(sql);
        dbResult.success = true;
        dbResult.details = 'db request succeeded';
        dbResult.data = [];
        for (var i = 0; i < rows.length; i++) {
          dbResult.data.push(rows[i]);
        }        
        
    } catch (err) {
      dbResult.details = err;
      //throw err;
      
    } finally {
      if (conn) conn.release();
    }
    
    return dbResult;
  }
  
  async _dbQueries(queryList) {
    var queryResults = {
      success: true,
      details: 'queries succeeded',
      data: {}
    };
    
    for (var key in queryList) {
      var singleResult = await this._dbQuery(queryList[key]);
      if (!singleResult.success) {
        queryResults.success = false;
        queryResults.details = 'DB query failed (' + key +') ' + singleResult.details;
        
      } else {
        queryResults.data[key] = singleResult.data;
      }
    }
          
    return queryResults;
  }   

//---------------------------------------------------------------
// specific query functions
//---------------------------------------------------------------
  async _insertPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into privilege (privilegename) ' +
                'values (' +
                  '"' + postData.privilegename + '"' + 
                ')';
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _insertUser(params, postData) {
    var result = this._queryFailureResult();
    
    var sharedScheduleOption = 0;
    if (postData.sharedschedule == '1') sharedScheduleOption = 1;
    var pushRemindersOption = 0;
    if (postData.pushreminders == '1') pushRemindersOption = 1;
    
    var query = 'insert into user (usershortname, username, email, sharedschedule, pushreminders) ' +
                'values (' +
                  '"' + postData.usershortname + '", ' + 
                  '"' + postData.username + '",' + 
                  '"' + postData.email + '", ' +
                  sharedScheduleOption + ', ' +
                  pushRemindersOption +
                ')';
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
    
  async _insertUserPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into userprivilege (userid, privilegeid) ' +
                'values (' +
                  '"' + postData.userid + '", ' + 
                  '"' + postData.privilegeid + '"' + 
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _insertTip(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into tip (tiptext, common) ' +
                'values (' +
                  '"' + postData.tiptext + '", ' + 
                  (postData.common ? 1 : 0) + ' ' +
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _insertCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into category (categorytext) ' +
                'values (' +
                  '"' + postData.categorytext + '"' + 
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _insertTipCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into tipcategory (tipid, categoryid) ' +
                'values (' +
                  postData.tipid + ', ' + 
                  postData.categoryid + 
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _insertSchedule(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into schedule (userid, schedulename, schedulelength, schedulestartdate) ' +
                'values (' +
                  postData.userid + ', ' + 
                  '"' + postData.schedulename + '", ' + 
                  postData.schedulelength + ', ' +
                  '"' + postData.schedulestartdate + '" ' +
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  

  async _insertScheduleTip(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into scheduletip (' +
                  'scheduleid, tipid, tipstate, schedulelocation, previousitem, nextitem' +
                ') ' +
                'values (' +
                  postData.scheduleid + ', ' + 
                  postData.tipid + ', ' + 
                  postData.tipstate + ', ' + 
                  postData.schedulelocation + ', ' + 
                  postData.previousitem + ', ' + 
                  postData.nextitem + 
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _insertControlState(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into controlstate (userid, controlgroup, state)' +
                'values (' +
                  postData.userid + ', ' + 
                  '"' + postData.controlgroup + '", ' + 
                  '"' + postData.state + '" ' +
                ')';
    
    console.log(query);
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
}
