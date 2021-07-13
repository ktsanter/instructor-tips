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
  async doQuery(params, postData, userInfo) {
    console.log(params);
    console.log(postData);
    console.log(userInfo);
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'projectinfo') {
      dbResult = await this._getProjectInfo(params, userInfo);
      
    } else if (params.queryName == 'singleproject') {
      if (params.configkey == 'preview') {
        dbResult = await this._getProjectPreview(userInfo);
        
      } else {
        dbResult = await this._getSingleProjectInfo(params);
      }

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
      project.layoutimages = JSON.stringify(imageInfoArrays[project.projectid]);
      projectInfo.push(project);
    }
    delete queryResults.data.layoutimages;
    queryResults.projects = projectInfo;

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.projects = projectInfo;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
 
  async _getSingleProjectInfo(params) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
      
    queryList = {
      project:
        'select ' + 
          'p.projectid, p.projectname, ' + 
          'p.projecttitle, p.projectsubtitle, ' +
          'p.colorscheme, p.layoutrows, p.layoutcols ' +
        'from project as p ' +
        'where p.projectid = ' + params.configkey + ' ',        
        
      layoutimages:
        'select ' + 
          'l.imageindex, l.imageurl ' + 
        'from layoutimage as l ' +
        'where l.projectid = ' + params.configkey + ' ' + 
        'order by l.imageindex'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    if (queryResults.data.project.length < 1) {
      result.details = 'project info not found';
      return result;
    }
    
    //-- collate image info
    var imageInfo = queryResults.data.layoutimages;
    var imageInfoArray = [];
    for (var i = 0; i < imageInfo.length; i++) {
      imageInfoArray.push(imageInfo[i].imageurl);
    }
        
    //-- combine project info with image info
    var projectInfo = queryResults.data.project[0];
    projectInfo.layoutimages = JSON.stringify(imageInfoArray);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.project = projectInfo;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
 
  async _getProjectPreview(userInfo) {
    console.log('_getProjectPreview');
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
      
    queryList = {
      project:
        'select ' + 
          'p.snapshot ' + 
        'from projectpreview as p ' +
        'where p.userid = ' + userInfo.userId + ' '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.project = JSON.parse(queryResults.data.project[0].snapshot);

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
    var result = this._dbManager.queryFailureResult();
    
    var queryList, queryResults;
    
    queryList = {
      project: 
        'update project ' +
        'set ' +
          'projectname = "' + postData.projectname + '", ' +
          'projecttitle = "' + postData.projecttitle + '", ' +
          'projectsubtitle = "' + postData.projectsubtitle + '", ' +
          'colorscheme = "' + postData.colorscheme + '", ' +
          'layoutrows = ' + postData.layoutrows + ', ' +
          'layoutcols = ' + postData.layoutcols + ' ' +
        'where projectid = ' + postData.projectid + ' ' +
          'and userid = ' + userInfo.userId ,
    };
    
    for (var i = 0; i < postData.layoutimages.length; i++) {
      queryList['layoutimage' + i] = 
        'update layoutimage ' +
        'set ' +
          'imageurl = "' + postData.layoutimages[i] + '" ' +
        'where projectid = ' + postData.projectid + ' ' +
          'and imageindex = ' + i          
    }
      
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
  
  async _updateProjectPreview(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var queryList, queryResults;
    
    queryList = {
      project: 
        'replace into projectpreview( ' +
          'userid, ' +
          'snapshot ' +
        ') values (' +        
          userInfo.userId + ', ' +
          '\'' + JSON.stringify(postData) + '\' ' +
        ')'
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
