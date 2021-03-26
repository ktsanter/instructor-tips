"use strict";
//---------------------------------------------------------------
// CommentBuddy
//---------------------------------------------------------------
// TODO: look up comment data based on access key
//---------------------------------------------------------------
const internal = {};

module.exports = internal.CommentBuddy = class {
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

    if (params.queryName == 'comments') {
      dbResult = await this._getComments(params, postData, userInfo);
            
    } else if (params.queryName == 'client-comments') {
      dbResult = await this._getClientComments(params, postData);
            
    } else if (params.queryName == 'accesskey') {
      dbResult = await this._getAccessKey(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'default-comment') {
      dbResult = await this._insertDefaultComment(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'comment') {
      dbResult = await this._updateComment(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'comment') {
      dbResult = await this._deleteComment(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getComments(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.commentid, a.tags, a.hovertext, a.commenttext as "comment" ' +
      'from comment as a ' +
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

  async _getClientComments(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    var query =
      'select ' + 
        'a.userid ' +
      'from accesskey as a ' +
      'where a.accesskey = "' + postData.accesskey + '"';
       
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success  || queryResults.data.length != 1) {
      result.details = 'invalid access key';
      return result;
    }
    
    var userId = queryResults.data[0].userid;
    
    query = 
      'select ' +
        'a.commentid, a.tags, a.hovertext, a.commenttext as "comment" ' +
      'from comment as a ' +
      'where userid = ' + userId;
      
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

  async _getAccessKey(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.accesskey ' +
      'from accesskey as a ' +
      'where userid = ' + userInfo.userId;
      
    queryResults = await this._dbManager.dbQuery(query);   
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    if (queryResults.data.length == 0) {
      if ( !(await this._generateAccessKey(userInfo.userId)) ) {
        result.success = false;
        result.details = 'failed to generate access key';
        
      } else {
        queryResults = await this._dbManager.dbQuery(query);
      }
    }
    
    if (queryResults.success && queryResults.data.length > 0) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data[0];
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  async _generateAccessKey(userId) {
    var charList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    var key = '';
    for (var i = 0; i < 24; i++) {
      if (i != 0 && i % 4 == 0) key += '-';
      var randIndex = Math.floor(Math.random() * charList.length);
      key += charList.charAt(randIndex);
    }

    var query, queryResults;
    
    query = 
      'insert ' +
      'into accesskey (accesskey, userid) ' +
      'values (' +
        '"' + key + '", ' +
        userId +
      ') ';
      
    queryResults = await this._dbManager.dbQuery(query);   
    
    return queryResults.success;
  }

  async _updateComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    var hierarchyData = postData.hierarchy;
    
    query = 
      'update comment ' +
      'set ' +
        'tags = "' + postData.tags + '", ' +
        'hovertext = "' + postData.hovertext + '", ' +
        'commenttext = "' + postData.comment + '" ' +
      'where commentid = ' + postData.commentid;

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
  
  async _insertDefaultComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'call add_default_comment(' + 
        userInfo.userId + ' ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = queryResults.data[0][0];

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _deleteComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryResults;
    
    query = 
      'delete from comment ' +
      'where commentid = ' + postData.commentid + ' ' +
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
  _renderFail() {
    res.send('cannot access page: welcome letter configuration')    
  }  
}
