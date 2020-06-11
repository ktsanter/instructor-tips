"use strict";
//---------------------------------------------------------------
// server-side DB update interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminUpdate = class {
  constructor(userManagement, dbManager) {
    this._userManagement = userManagement;
    this._dbManager = dbManager;
  }
  
//---------------------------------------------------------------
// query dispatcher
//---------------------------------------------------------------
  async doUpdate(params, postData) {
    var dbResult = this._dbManager.queryFailureResult();
    
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
// specific query functions
//---------------------------------------------------------------
  async _updatePrivilege(params, postData) {
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update privilege ' +
                'set ' +
                  'privilegename = "' + postData.privilegename + '" ' + 
                'where privilegeid = ' + postData.privilegeid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();

    var sharedScheduleOption = 0;
    if (postData.sharedschedule == '1') sharedScheduleOption = 1;
    var pushRemindersOption = 0;
    if (postData.pushreminders == '1') pushRemindersOption = 1;
    
    var query = 'update user ' + 
                'set ' + 
                  'usershortname = "' + postData.usershortname + '", ' +
                  'username = "' + postData.username + '", ' +
                  'email = "' + postData.email + '" ' +
                'where userid = ' + postData.userid;
                ;
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update userprivilege ' + 
                'set ' + 
                  'userid = ' + postData.userid + ', ' +
                  'privilegeid = ' + postData.privilegeid + ' ' +
                'where userprivilegeid = ' + postData.userprivilegeid;
    
    var queryResults = await this._dbManager.dbQuery(query);

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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update tip ' +
                'set ' +
                  'tiptext = "' + postData.tiptext + '", ' + 
                  'common = ' + (postData.common ? 1 : 0) + ', ' + 
                  'userid = ' + (postData.common ? 'NULL' : postData.userid) + ' ' +
                'where tipid = ' + postData.tipid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update category ' +
                'set ' +
                  'categorytext = "' + postData.categorytext + '" ' + 
                'where categoryid = ' + postData.categoryid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update tipcategory ' +
                'set ' +
                  'tipid = ' + postData.tipid + ', ' + 
                  'categoryid = ' + postData.categoryid + ' ' +
                'where tipcategoryid = ' + postData.tipcategoryid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update schedule ' +
                'set ' +
                  'userid = ' + postData.userid + ', ' +
                  'schedulename = "' + postData.schedulename + '", ' + 
                  'schedulelength = ' + postData.schedulelength + ', ' +
                  'schedulestartdate = "' + postData.schedulestartdate + '" ' + 
                'where scheduleid = ' + postData.scheduleid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update scheduletip ' +
                'set ' +
                  'scheduleid = ' + postData.scheduleid + ', ' + 
                  'tipid = ' + postData.tipid + ', ' + 
                  'tipstate = ' + postData.tipstate + ', ' + 
                  'schedulelocation = ' + postData.schedulelocation + ', ' +
                  'schedulelocationorder = ' + postData.schedulelocationorder + ' ' +
                'where scheduletipid = ' + postData.scheduletipid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
    var result = this._dbManager.queryFailureResult();
    
    var query = 'update controlstate ' +
                'set ' +
                  'userid = ' + postData.userid + ', ' + 
                  'controlgroup = "' + postData.controlgroup + '", ' + 
                  'state = "' + postData.state + '" ' +
                'where controlstateid = ' + postData.controlstateid;
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
