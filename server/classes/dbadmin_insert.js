"use strict";
//---------------------------------------------------------------
// server-side DB insert interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminInsert = class {
  constructor(userManagement, dbManager) {
    this._userManagement = userManagement;
    this._dbManager = dbManager;
  }
  
//---------------------------------------------------------------
// query dispatcher
//---------------------------------------------------------------
  async doInsert(params, postData) {
    var dbResult = this._dbManager.queryFailureResult();
    
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
// specific query functions
//---------------------------------------------------------------
  async _insertPrivilege(params, postData) {
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into privilege (privilegename) ' +
                'values (' +
                  '"' + postData.privilegename + '"' + 
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var sharedScheduleOption = 0;
    if (postData.sharedschedule == '1') sharedScheduleOption = 1;
    var pushRemindersOption = 0;
    if (postData.pushreminders == '1') pushRemindersOption = 1;
    
    var query = 'insert into user (usershortname, username, email) ' +
                'values (' +
                  '"' + postData.usershortname + '", ' + 
                  '"' + postData.username + '",' + 
                  '"' + postData.email + '" ' +
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into userprivilege (userid, privilegeid) ' +
                'values (' +
                  '"' + postData.userid + '", ' + 
                  '"' + postData.privilegeid + '"' + 
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into tip (tiptext, common, userid) ' +
                'values (' +
                  '"' + postData.tiptext + '", ' + 
                  (postData.common ? 1 : 0) + ', ' +
                  (postData.common ? 'NULL' : postData.userid) + ' ' +
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into category (categorytext) ' +
                'values (' +
                  '"' + postData.categorytext + '"' + 
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into tipcategory (tipid, categoryid) ' +
                'values (' +
                  postData.tipid + ', ' + 
                  postData.categoryid + 
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into schedule (userid, schedulename, schedulelength, schedulestartdate) ' +
                'values (' +
                  postData.userid + ', ' + 
                  '"' + postData.schedulename + '", ' + 
                  postData.schedulelength + ', ' +
                  '"' + postData.schedulestartdate + '" ' +
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into scheduletip (' +
                  'scheduleid, tipid, tipstate, schedulelocation, schedulelocationorder' +
                ') ' +
                'values (' +
                  postData.scheduleid + ', ' + 
                  postData.tipid + ', ' + 
                  postData.tipstate + ', ' + 
                  postData.schedulelocation + ', ' + 
                  postData.schedulelocationorder + ' ' + 
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'insert into controlstate (userid, controlgroup, state)' +
                'values (' +
                  postData.userid + ', ' + 
                  '"' + postData.controlgroup + '", ' + 
                  '"' + postData.state + '" ' +
                ')';
    
    console.log(query);
    var queryResults = await this._dbManager.dbQuery(query);

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
