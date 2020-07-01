"use strict";
//---------------------------------------------------------------
// TreasureHunt DB interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.TreasureHunt = class {
  constructor(userManagement, dbManager) {
    this._dbManager = dbManager;
    this._userManagement = userManagement;
  }
  
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'projectlist') {
      dbResult = await this._getProjectList(params, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._insertSchedule(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._updateSchedule(params, postData, userInfo);      
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._deleteSchedule(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getProjectList(params, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
/*
    queryList = {
      projects:
        'select ' + 
          'p.projectid, p.projectname, ' + 
          'p.imagename, p.imagefullpage, ' +
          'p.message, p.positiveresponse, p.negativeresponse, ' +
          'c.clueid, c.cluenumber, ' +
          'c.clueprompt, c.clueresponse, ' +
          'c.clueactiontype, c.clueactiontarget, c.clueactionmessage, c.cluesearchfor, ' +
          'c.clueconfirmation ' +
        'from project as p, clue as c ' +
        'where userid = ' + userInfo.userId + ' ' +
          'and p.projectid = c.projectid'
    };
  */            
    queryList = {
      projects:
        'select ' + 
          'p.projectid, p.projectname, ' + 
          'p.imagename, p.imagefullpage, ' +
          'p.message, p.positiveresponse, p.negativeresponse ' +
        'from project as p ' +
        'where p.userid = ' + userInfo.userId
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var projectInfo = queryResults.data.projects;
    queryList = {};
    for (var i = 0; i < projectInfo.length; i++) {
      var project = projectInfo[i];
      queryList[project.projectid] = 
        'select ' + 
          'c.clueid, c.cluenumber, ' +
          'c.clueprompt, c.clueresponse, ' +
          'c.clueactiontype, c.clueactiontarget, c.clueactionmessage, c.cluesearchfor, ' +
          'c.clueconfirmation ' +
        'from clue as c ' +
        'where c.projectid = ' + project.projectid
    };

    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var clueInfo = {};
    for (var key in queryResults.data) {
      var clueList = queryResults.data[key];
      clueInfo[key] = [];
      for (var i = 0; i < clueList.length; i++) {
        var clue = clueList[i];
        clueInfo[key].push({
          clueid: clue.clueid,
          number: clue.cluenumber,
          prompt: clue.clueprompt,
          response: clue.clueresponse,
          action: {
            type: clue.clueactiontype,
            target: clue.clueactiontarget,
            message: clue.clueactionmessage,
            searchfor: clue.cluesearchfor
          },
          confirmation: clue.clueconfirmation
        })
      }
    }

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.projects = projectInfo;
      result.clues = clueInfo;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
 
//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
  async _insertSchedule(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    /*
    var scheduleName = this._sanitizeText(postData.schedulename);
    var query = 'insert into schedule (userid, schedulename, schedulelength, schedulestartdate) ' +
                'values (' +
                  userInfo.userId + ', ' + 
                  '"' + scheduleName + '", ' +
                  postData.schedulelength + ', ' + 
                '"' + postData.schedulestartdate + '" ' +                   
                ')';
    
    var queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success) {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate schedule name';
      }
      return result;
    }    

    if (queryResults.success) {
      query = 'select scheduleid ' +
              'from schedule ' +
              'where schedulename = "' + scheduleName + '" ' +
              'and userid = ' + userInfo.userId;
              
      queryResults = await this._dbManager.dbQuery(query);
      if (queryResults.success) {
        result.success = true;
        result.details = 'insert succeeded';
        result.data = queryResults.data[0];
        
      } else {
        result.details = queryResults.details;
      }
        
    } else {
      result.details = queryResults.details;
    }
    */
    return result;
  }  

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateSchedule(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();

/*
    var scheduleName = this._sanitizeText(postData.schedulename);
    var query = 'update schedule ' +
                'set ' +
                  'schedulename = "' + scheduleName + '", ' +
                  // don't allow length change here 'schedulelength = ' + postData.schedulelength + ', ' +
                  'schedulestartdate = "' + postData.schedulestartdate + '" ' +
                'where scheduleid = ' + postData.scheduleid;

    var queryResults = await this._dbManager.dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate schedule name';
      }
    }
*/
    return result;
  }  
  
//---------------------------------------------------------------
// specific delete methods
//---------------------------------------------------------------
  async _deleteSchedule(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
/*
    var query = 'delete from schedule ' +
                'where scheduleid = ' + postData.scheduleid + ' ' +
                  'and userid = ' + userInfo.userId ;

    var queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
  */  
    return result;
  }  

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  _sanitizeText(str, skipAmpersandSanitizing) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    if (!skipAmpersandSanitizing) cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }
  
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
