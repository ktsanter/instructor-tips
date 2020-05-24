"use strict";
//---------------------------------------------------------------
// server-side DB update interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminUpdate = class {
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
  async doUpdate(params, postData) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'privileges') {
      dbResult = await this._updatePrivilege(params, postData);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._updateUser(params, postData);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._updateUserPrivilege(params, postData);
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._updateTip(params, postData);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._updateCategory(params, postData);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._updateTipCategory(params, postData);
      
    } else if (params.queryName == 'admin_schedules') {
      dbResult = await this._updateSchedule(params, postData);
      
    } else if (params.queryName == 'scheduletips') {
      dbResult = await this._updateScheduleTip(params, postData);
      
    } else if (params.queryName == 'controlstates') {
      dbResult = await this._updateControlState(params, postData);
      
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
  async _updatePrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update privilege ' +
                'set ' +
                  'privilegename = "' + postData.privilegename + '" ' + 
                'where privilegeid = ' + postData.privilegeid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _updateUser(params, postData) {
    var result = this._queryFailureResult();

    var sharedScheduleOption = 0;
    if (postData.sharedschedule == '1') sharedScheduleOption = 1;
    var pushRemindersOption = 0;
    if (postData.pushreminders == '1') pushRemindersOption = 1;
    
    var query = 'update user ' + 
                'set ' + 
                  'usershortname = "' + postData.usershortname + '", ' +
                  'username = "' + postData.username + '", ' +
                  'email = "' + postData.email + '", ' +
                  'sharedschedule = ' + sharedScheduleOption + ', ' +
                  'pushreminders = ' + pushRemindersOption + ' ' +
                'where userid = ' + postData.userid;
                
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
    
  async _updateUserPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update userprivilege ' + 
                'set ' + 
                  'userid = ' + postData.userid + ', ' +
                  'privilegeid = ' + postData.privilegeid + ' ' +
                'where userprivilegeid = ' + postData.userprivilegeid;
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _updateTip(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update tip ' +
                'set ' +
                  'tiptext = "' + postData.tiptext + '", ' + 
                  'common = ' + (postData.common ? 1 : 0) + ' ' + 
                'where tipid = ' + postData.tipid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
    
  async _updateCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update category ' +
                'set ' +
                  'categorytext = "' + postData.categorytext + '" ' + 
                'where categoryid = ' + postData.categoryid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  

  async _updateTipCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update tipcategory ' +
                'set ' +
                  'tipid = ' + postData.tipid + ', ' + 
                  'categoryid = ' + postData.categoryid + ' ' +
                'where tipcategoryid = ' + postData.tipcategoryid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _updateSchedule(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update schedule ' +
                'set ' +
                  'userid = ' + postData.userid + ', ' +
                  'schedulename = "' + postData.schedulename + '", ' + 
                  'schedulelength = ' + postData.schedulelength + ', ' +
                  'schedulestartdate = "' + postData.schedulestartdate + '" ' + 
                'where scheduleid = ' + postData.scheduleid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _updateScheduleTip(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update scheduletip ' +
                'set ' +
                  'scheduleid = ' + postData.scheduleid + ', ' + 
                  'tipid = ' + postData.tipid + ', ' + 
                  'tipstate = ' + postData.tipstate + ', ' + 
                  'schedulelocation = ' + postData.schedulelocation + ', ' +
                  'schedulesublocation = ' + postData.schedulesublocation + ' ' +
                'where scheduletipid = ' + postData.scheduletipid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _updateControlState(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update controlstate ' +
                'set ' +
                  'userid = ' + postData.userid + ', ' + 
                  'controlgroup = "' + postData.controlgroup + '", ' + 
                  'state = "' + postData.state + '" ' +
                'where controlstateid = ' + postData.controlstateid;
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
}
