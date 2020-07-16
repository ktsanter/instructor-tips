"use strict";
//---------------------------------------------------------------
// Pacing guide viewer DB interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.PacingGuideViewer = class {
  constructor(userManagement, dbManager) {
    this._dbManager = dbManager;
    this._userManagement = userManagement;
  }
  
//---------------------------------------------------------------
// pug rendering
//---------------------------------------------------------------
  async renderViewerPage(res, me, pugFileName, renderAndSendPug) {
    var queryList, queryResults;

    queryList = {
      courses: 
        'select courselistingid, textkey, description ' +
        'from courselisting ' +
        'order by description',
        
      startend:
        'select description, startdate, enddate ' +
        'from startend ' +
        'order by description'
    }
    
    queryResults = await me._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      me._renderFail();
      return;
    }
    
    var pugOptions = {
      courses: queryResults.data.courses,
      startend: queryResults.data.startend
    };
    
    renderAndSendPug(res, 'pacingguide-viewer', pugFileName, {params: pugOptions});
  }
  
  _renderFail() {
    res.send('cannot access page: pgviewer')    
  }
  
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'courselistings') {
      dbResult = await this._getCourseListings(params, postData, userInfo);
      
    } else if (params.queryName == 'startend') {
      dbResult = await this._getStartEndDates(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getCourseListings(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select courselistingid, textkey, description ' +
      'from courselisting ' +
      'order by description';
      
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _getStartEndDates(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select description, startdate, enddate ' +
      'from startend ' +
      'order by description';
      
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  
//---------------------------------------------------------------
// specific delete methods
//---------------------------------------------------------------

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  _getDateStamp() {
    var now = new Date();
;
    var yr = now.getFullYear();
    var mo = ('00' + (now.getMonth() + 1)).slice(-2);
    var da = ('00' + now.getDate()).slice(-2);
    var hr = ('00' + now.getHours()).slice(-2);
    var mi = ('00' + now.getMinutes()).slice(-2);
    var se = ('00' + now.getSeconds()).slice(-2);
    
    var dateStamp = yr + '-' + mo + '-' + da + ' ' + hr + ':' + mi + ':' + se;
    
    return dateStamp;
  }
}
