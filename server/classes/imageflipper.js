"use strict";
//---------------------------------------------------------------
// ImageFlipper DB interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.ImageFlipper = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
  }
  
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'projectinfo') {
      dbResult = await this._getProjectInfo(params, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {    
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'defaultproject') {
      dbResult = await this._insertDefaultProject(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    console.log('doUpdate');
    console.log(params);
    console.log(postData);
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'project') {
      dbResult = await this._updateProject(params, postData, userInfo);      
    
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
  async _getProjectInfo(params, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
      
    queryList = {
      projects:
        'select ' + 
          'p.projectid, p.projectname, ' + 
          'p.projecttitle, p.projectsubtitle, ' +
          'p.colorscheme, p.layoutrows, p.layoutcols ' +
        'from project as p ' +
        'where p.userid = ' + userInfo.userId + ' ' +
        'order by p.projectname',        
        
      layoutimages:
        'select ' + 
          'l.projectid, l.imageindex, l.imageurl ' + 
        'from layoutimage as l ' +
        'order by l.projectid, l.imageindex'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    //-- collate image info by project
    var imageInfo = {};
    for (var i = 0; i < queryResults.data.layoutimages.length; i++) {
      var row = queryResults.data.layoutimages[i];
      if (!imageInfo.hasOwnProperty(row.projectid)) {
        imageInfo[row.projectid] = {};
      }
      imageInfo[row.projectid][row.imageindex] = row.imageurl;
    }
    
    var imageInfoArrays = {};
    for (var projectid in imageInfo) {
      imageInfoArrays[projectid] = [];
      var nImages = Object.keys(imageInfo[projectid]).length;
      for (var i = 0; i < nImages; i++) {
        imageInfoArrays[projectid].push(imageInfo[projectid][i]);
      }
    }
    
    //-- combine project info with image info
    var projectInfo = [];
    for (var i = 0; i < queryResults.data.projects.length; i++) {
      var project = queryResults.data.projects[i];
      project.layoutimages = imageInfoArrays[project.projectid];
      projectInfo.push(project);
    }
    delete queryResults.data.layoutimages;
    queryResults.projects = projectInfo;
        
    var projectInfo = queryResults.data.projects;

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.projects = projectInfo;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
 
//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
  async _insertDefaultProject(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var queryList, queryResults;
    
    queryList = {
      insertProject:
        'call add_default_project(' + userInfo.userId + ') '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = {};
      result.data.projectid = queryResults.data.insertProject[0][0].projectid;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateProject(params, postData, userInfo) {
    console.log('update project');
    return this._dbManager.queryFailureResult();
    
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
