"use strict";
//---------------------------------------------------------------
// FAQ composer
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.FAQComposer = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
  }
    
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'hierarchy') {
      dbResult = await this._getHierarchy(params, postData, userInfo);
            
    } else if (params.queryName == 'faqsetlist') {
      dbResult = await this._getFAQsetList(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'faqset') {
      dbResult = await this._insertFAQSet(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'hierarchy') {
      dbResult = await this._updateHierarchy(params, postData, userInfo);
    
    } else if (params.queryName == 'faqset') {
      dbResult = await this._updateFAQset(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'faqset') {
      dbResult = await this._deleteFAQset(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getHierarchy(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.projectid, a.hierarchy ' +
      'from project as a ' +
      'where userid = ' + userInfo.userId;
      
    queryResults = await this._dbManager.dbQuery(query);   

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    if (queryResults.data.length == 0) {
      query = 
        'call add_default_project(' +
          userInfo.userId + 
        ')';

      queryResults = await this._dbManager.dbQuery(query);
    }      

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = {
        projectid: queryResults.data[0].projectid,
        hierarchy: queryResults.data[0].hierarchy
      }
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _updateHierarchy(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    var hierarchyData = postData.hierarchy;
    
    query = 
      'update project ' +
      'set ' +
        'hierarchy = \'' + hierarchyData + '\' ' +
      'where userid = ' + userInfo.userId;

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
  
  async _getFAQsetList(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
        
    query = 
      'select ' +
        'a.faqsetid, a.faqsetname, a.faqsetdata ' +
      'from faqset as a, project as b ' +
      'where b.userid = ' + userInfo.userId + ' ' +
        'and a.projectid = b.projectid ' +
      'order by faqsetname ';
          
    queryResults = await this._dbManager.dbQuery(query);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data =  queryResults.data
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  async _insertFAQSet(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    query = 
      'select projectid ' +
      'from project ' +
      'where userid = ' + userInfo.userId;

    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults || queryResults.data.length == 0) return result;
    
    query = 
      'call add_default_faqset(' +
         queryResults.data[0].projectid + ', ' +
         '"' + postData.faqsetname + '"' +
      ')';
    
    queryResults = await this._dbManager.dbQuery(query);    
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data[0][0];
      
    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }
    
    return result;
  }    
  
  async _updateFAQset(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    var hierarchyData = postData.hierarchy;
    
    query = 
      'update faqset ' +
      'set ' +
        'faqsetdata = \'' + postData.faqsetdata + '\' ' +
      'where faqsetid = ' + postData.faqsetid;

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

  async _deleteFAQset(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'delete from faqset  ' +
      'where faqsetid = ' + postData.faqsetid;
      
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
// other support methods
//---------------------------------------------------------------       
  _renderFail() {
    res.send('cannot access page: welcome letter configuration')    
  }  
}
