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
      
    } else if (params.queryName == 'project-landing') {
      dbResult = await this._getProjectLandingURL(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'project') {
      dbResult = await this._insertProject(params, postData, userInfo);
            
    } else if (params.queryName == 'clue') {
      dbResult = await this._insertClue(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'project') {
      dbResult = await this._updateProject(params, postData, userInfo);      
    
    } else if (params.queryName == 'clue') {
      dbResult = await this._updateClue(params, postData, userInfo);        
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'project') {
      dbResult = await this._deleteProject(params, postData, userInfo);
            
    } else if (params.queryName == 'clue') {
      dbResult = await this._deleteClue(params, postData, userInfo);
            
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
      
    queryList = {
      projects:
        'select ' + 
          'p.projectid, p.projectname, ' + 
          'p.imagename, p.imagefullpage, ' +
          'p.message, p.positiveresponse, p.negativeresponse ' +
        'from project as p ' +
        'where p.userid = ' + userInfo.userId + ' ' +
        'order by p.projectname'
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
          'c.clueactiontype, c.clueactiontarget, c.clueactioneffecttype, c.clueactionmessage, c.cluesearchfor, ' +
          'c.clueconfirmation ' +
        'from clue as c ' +
        'where c.projectid = ' + project.projectid + ' ' +
        'order by c.cluenumber'
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
            effecttype: clue.clueactioneffecttype,
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
 
  async _getProjectLandingURL(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select projectid ' +
      'from project ' +
      'where projectid = ' + postData.projectid
      
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = '/treasurehunt/landing/' + postData.projectid;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
  async _insertProject(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'insert into project(' +
        'userid, ' +
        'projectname, ' + 
        'imagename, imagefullpage, ' +
        'message, positiveresponse, negativeresponse ' +
      ') values (' +
        userInfo.userId + ', ' +
        '"' + postData.projectname + '", ' +
        '"", ' +
        '0, ' +
        '"", ' +
        '"", ' +
        '""' +
      ')';
    
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _insertClue(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    var actionTarget = postData.action.target ? postData.action.target : '';
    var actionEffectType = postData.action.effecttype ? postData.action.effecttype : '';
    var actionMessage = postData.action.message ? postData.action.message : '';
    var actionSearchFor = postData.action.searchfor ? postData.action.searchfor : '';
    
    query =
      'insert into clue (' +
        'projectid, ' +
        'cluenumber, clueprompt, clueresponse, clueconfirmation, ' +
        'clueactiontype, clueactiontarget, clueactioneffecttype, clueactionmessage, cluesearchfor ' +
      ') values (' +
        postData.projectid + ', ' +
        postData.number + ', ' +
        '"' + postData.prompt + '", ' +
        '"' + postData.response + '", ' +
        '"' + postData.confirmation + '", ' +
        '"' + postData.action.type + '", ' +
        '"' + actionTarget + '", ' +
        '"' + actionEffectType + '", ' +
        '"' + actionMessage + '", ' +
        '"' + actionSearchFor + '" ' +
      ')';
      
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateProject(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryResults;
    
    query =
      'update project ' +
      'set ' +
        'projectname = "' + postData.projectname + '", ' +
        'imagename = "' + postData.imagename + '", ' +
        'imagefullpage = ' + postData.imagefullpage + ', ' +
        'message = "' + postData.message + '", ' +
        'positiveresponse = "' + postData.positiveresponse + '", ' +
        'negativeresponse = "' + postData.negativeresponse + '" ' +
      'where projectid = ' + postData.projectid;
      
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;

    } else {
      result.details = queryResults.details;
    }      

    return result;
  }  
  
  async _updateClue(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryResults;
    
    var actionTarget = postData.action.target ? postData.action.target : '';
    var actionEffectType = postData.action.effecttype ? postData.action.effecttype : '';
    var actionMessage = postData.action.message ? postData.action.message : '';
    var actionSearchFor = postData.action.searchfor ? postData.action.searchfor : '';

    query = 
      'update clue ' +
      'set ' +
        'cluenumber = ' + postData.number + ', ' +
        'clueprompt = "' + postData.prompt + '", ' +
        'clueresponse = "' + postData.response + '", ' +
        'clueconfirmation = "' + postData.confirmation + '", ' +
        'clueactiontype = "' + postData.action.type + '", ' +
        'clueactiontarget = "' + actionTarget + '", ' +
        'clueactioneffecttype = "' + actionEffectType + '", ' +
        'clueactionmessage = "' + actionMessage + '", ' +
        'cluesearchfor = "' + actionSearchFor + '" ' +
      'where clueid = ' + postData.clueid;
    
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _repositionClue(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var queryList, queryResults;
    
    var finalClueNumber = postData.destcluenumber;
    if (postData.sourcecluenumber > postData.destcluenumber) finalClueNumber++;
    var growCutoff = postData.destcluenumber;
    if (postData.sourcecluenumber < postData.destcluenumber) growCutoff--;
    
    queryList = {
      removesource:
        'update clue ' +
        'set cluenumber = 0 ' +
        'where clueid = ' + postData.sourceclueid,
        
      shrink:
        'update clue ' +
        'set cluenumber = cluenumber - 1 ' +
        'where projectid = ' + postData.projectid + ' ' +
          'and cluenumber > ' + postData.sourcecluenumber,
        
      grow:
        'update clue ' +
        'set cluenumber = cluenumber + 1 ' +
        'where projectid = ' + postData.projectid + ' ' +
          'and cluenumber > ' + growCutoff,
        
      reinsertsource:
        'update clue ' +
        'set cluenumber = ' + finalClueNumber + ' ' +
        'where clueid = ' + postData.sourceclueid
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
//---------------------------------------------------------------
// specific delete methods
//---------------------------------------------------------------
  async _deleteProject(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryResults;
    
    query = 
      'delete from project ' +
      'where projectid = ' + postData.projectid + ' ' +
        'and userid = ' + userInfo.userId;
         
    var queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _deleteClue(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryList, queryResults;
    
    query = 
      'select userid, projectid ' +
      'from project ' +
      'where projectid in (' +
        'select projectid ' +
        'from clue ' +
        'where clueid = ' + postData.clueid + 
      ')';
        
    queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    if (queryResults.data.length == 0 || queryResults.data[0].userid != userInfo.userId) {
      result.details = 'invalid user for deletion';
      return result;
    }
    
    var projectId = queryResults.data[0].projectid;
    
    queryList = {
      deletion: 
        'delete from clue ' +
        'where clueid = ' + postData.clueid,
        
      update: 
        'update clue ' +
        'set cluenumber = cluenumber - 1 ' +
        'where projectid = ' + projectId + ' ' +
          'and cluenumber > ' + postData.number
    };
      
    var queryResults = await this._dbManager.dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }

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
