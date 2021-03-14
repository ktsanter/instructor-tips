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
    
    if (params.queryName == 'project') {
      dbResult = await this._insertProject(params, postData, userInfo);
                   
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'project') {
      dbResult = await this._updateProject(params, postData, userInfo);              
    } else if (params.queryName == 'preview') {
      dbResult = await this._updateProjectPreview(params, postData, userInfo);    
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'project') {
      dbResult = await this._deleteProject(params, postData, userInfo);
            
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

//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
  async _insertProject(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'call add_project(' + 
        userInfo.userId + ', ' +
        '"' + postData.projectname + '" ' +
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

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateProject(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var projectData = postData.project;
    var clueData = postData.clues;
    
    var queryList, queryResults;
    
    queryList = {
      project:
        'update project ' +
        'set ' +
          'projectname = "' + projectData.projectname + '", ' +
          'imagename = "' + projectData.imagename + '", ' +
          'imagefullpage = ' + projectData.imagefullpage + ', ' +
          'message = "' + projectData.message + '", ' +
          'positiveresponse = "' + projectData.positiveresponse + '", ' +
          'negativeresponse = "' + projectData.negativeresponse + '" ' +
        'where projectid = ' + projectData.projectid ,
        
      deleteClues:
        'delete from clue ' + 
        'where projectid = ' + projectData.projectid
    };
    
    for (var i = 0; i < clueData.length; i++) {
      var clueInsertQuery = this._makeClueInsertQuery(projectData.projectid, clueData[i]);
      queryList['clue' + clueData[i].clueid] = clueInsertQuery
    }

    queryResults = await this._dbManager.dbQueries(queryList);
      
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;

    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }      

    return result;
  }  
  
  _makeClueInsertQuery(projectId, clue) {
    var query;
    var action = clue.action;
    
    var actionTarget = action.target ? action.target : '';
    var actionEffectType = action.effecttype ? action.effecttype : '';
    var actionMessage = action.message ? action.message : '';
    var actionSearchFor = action.searchfor ? action.searchfor : '';

    query =
      'insert into clue (' +
        'projectid, ' +
        'cluenumber, clueprompt, clueresponse, clueconfirmation, ' +
        'clueactiontype, clueactiontarget, clueactioneffecttype, clueactionmessage, cluesearchfor ' +
      ') values (' +
        projectId + ', ' +
        clue.number + ', ' +
        '"' + clue.prompt + '", ' +
        '"' + clue.response + '", ' +
        '"' + clue.confirmation + '", ' +
        '"' + clue.action.type + '", ' +
        '"' + actionTarget + '", ' +
        '"' + actionEffectType + '", ' +
        '"' + actionMessage + '", ' +
        '"' + actionSearchFor + '" ' +
      ')';
      
    return query;
  }
  
  async _updateProjectPreview(params, postData, userInfo) {
    console.log('\n_updateProjectPreview');
    var result = this._dbManager.queryFailureResult();
    
    var queryList, queryResults;
    
    var snapshot = this._escapeProblems(JSON.stringify(postData));
    console.log('snapshot');
    console.log(snapshot);
    
    queryList = {
      project: 
        'replace into projectpreview( ' +
          'userid, ' +
          'snapshot ' +
        ') values (' +        
          userInfo.userId + ', ' +
          '\'' + snapshot + '\' ' +
        ')'
    };

    console.log('query');
    console.log(queryList.project);
    queryResults = await this._dbManager.dbQueries(queryList);
    console.log('results');
    console.log(queryResults);

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

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  _escapeProblems(str) {
    var escaped = str.replace(/\\'/g, 'singlequotereplacement');
    return escaped;
  }
}
