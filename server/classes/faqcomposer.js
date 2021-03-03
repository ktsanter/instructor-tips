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
    this._fileServices = params.fileServices;
    this._pug = params.pug;
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
// landing page 
//---------------------------------------------------------------       
  async renderLandingPage(params, pugFileName) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    query =  
      'select ' +
      '  faqsetname, faqsetdata, projectid ' +
      'from faqset ' +
      'where faqsetid = ' + params.faqsetid;

    queryResults = await this._dbManager.dbQuery(query);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    if (queryResults.data.length == 0) {
      result.details = 'no data found for project';
      return result;
    }

    var projectId = queryResults.data[0].projectid;
    result.data = {
      faqsetname: queryResults.data[0].faqsetname,
      itemdata: []
    };
    
    var faqsetData = JSON.parse(queryResults.data[0].faqsetdata);
    var itemList = [];
    if (faqsetData && faqsetData.orderedItems) itemList = faqsetData.orderedItems;

    queryResults = await this._getFAQItems(projectId, itemList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var nodeList = queryResults.data;
    
    if (this._fileServices.existsSync(pugFileName)) {
      result.success = true;
      result.details = 'data retrieval successful';
      result.data = this._pug.renderFile(pugFileName, {"params": nodeList});
    } else {
      result.details = 'could not find file ' + pugFileName;
    }
    
    return result;
  }
  
  async _getFAQItems(projectId, itemList) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    query = 
      'select hierarchy ' +
      'from project ' +
      'where projectid = ' + projectId;
      
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var hierarchy = [];
    if (queryResults.data[0].hierarchy) {
      hierarchy = JSON.parse(decodeURIComponent(queryResults.data[0].hierarchy));
    }
    
    var nodeList = [];
    for (var i = 0; i < itemList.length; i++) {
      var foundNode = this._FAQItem(itemList[i], hierarchy);
      foundNode = this._cleanNode(foundNode);
      nodeList.push({label: foundNode.tmContent.label, content: foundNode.tmContent.markdown});
    }

    result.data = nodeList;
    result.success = true;
    
    return result;
  }
  
  _FAQItem(idToFind, baseList) {
    var foundNode;
    
    for (var i = 0; i < baseList.length && !foundNode; i++) {
      var node = baseList[i];
      if (idToFind == node.id) {
        foundNode = node;
      } else if (node.children) {
        foundNode = this._FAQItem(idToFind, node.children);
      }
    }
    
    return foundNode;
  }
  
  _cleanNode(node) {
    var cleaned = node;
    
    cleaned.tmContent.label = cleaned.tmContent.label.replace(/&quot;/g, '"');
    cleaned.tmContent.label = cleaned.tmContent.label.replace(/&apos;/g, '\'');
    cleaned.tmContent.label = cleaned.tmContent.label.replace(/&newline;/g, '\n');

    cleaned.tmContent.markdown = cleaned.tmContent.markdown.replace(/&quot;/g, '"');
    cleaned.tmContent.markdown = cleaned.tmContent.markdown.replace(/&apos;/g, '\'');
    cleaned.tmContent.markdown = cleaned.tmContent.markdown.replace(/&newline;/g, '\n');

    return cleaned;
  }
  
//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------       
  _renderFail() {
    res.send('cannot access page: welcome letter configuration')    
  }  
}
