"use strict";
//---------------------------------------------------------------
// server-side for ITips
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.ITips = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;  

    console.log('ITips.constructor');   
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'schedule-list') {
      dbResult = await this._getScheduleList(params, postData, userInfo, funcCheckPrivilege);
      
    }else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._insertSchedule(params, postData, userInfo, funcCheckPrivilege);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult.details = 'dummy update call succeeded';
      dbResult.success = true;

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult.details = 'dummy delete call succeeded';
      dbResult.success = true;

    } else if (params.queryName == 'term-remove') {
      dbResult = await this._removeTermData(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------      
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------    
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  

  async _getScheduleList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      schedule:
        'select ' + 
          's.scheduleid, s.schedulename, s.schedulelength, s.schedulestart ' + 
        'from schedule as s ' +
        'where s.userid = ' + userInfo.userId + ' ' +
        'order by s.schedulename'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.schedule;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getScheduleList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      schedule:
        'select ' + 
          's.scheduleid, s.schedulename, s.schedulelength, s.schedulestart ' + 
        'from schedule as s ' +
        'where s.userid = ' + userInfo.userId + ' ' +
        'order by s.schedulename'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.schedule;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _insertSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryResults;
    
    query = 
      'call add_schedule(' + 
        userInfo.userId + ', ' +
        '"' + postData.schedulename + '", ' +
            + postData.schedulelength + ', ' +
        '"' + postData.schedulestart + '" ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = queryResults.data[0][0];

    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }

    return result;
  }  

  
  
//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _sendFail(res, failMessage) {
    var result = {
      sucess: false,
      details: failMessage,
      data: null
    };
    
    res.send(result);
  }
  
  _sendSuccess(res, successMessage, dataValues) {
    if (!dataValues) dataValues = null;
    
    var result = {
      success: true,
      details: successMessage,
      data: dataValues
    };
    
    res.send(result);
  }  
}
