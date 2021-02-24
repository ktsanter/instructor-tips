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
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._insertCourse(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._updateCourse(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._deleteCourse(params, postData, userInfo);
    
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
    
    console.log(params);
    console.log(postData);
    console.log(userInfo);
    return result;
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.courseid, a.coursename, a.ap, a.haspasswords, ' +
        'b.configurationid, b.examid, b.proctoringid, b.retakeid, b.resubmissionid ' +
      'from course as a, configuration as b ' +
      'where userid = ' + userInfo.userId + ' ' +
        'and a.courseid = b.courseid ' +
      'order by coursename';
      
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

  async _insertCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'call add_default_course(' +
         userInfo.userId + ', ' +
         '"' + postData.coursename + '"' +
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

  async _updateCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
 
    var queryList, queryResults;
    
    var updatedExamId = (postData.examid) == '' ? 'null' : postData.examid;
    var updatedProctoringId = (postData.proctoringid) == '' ? 'null' : postData.proctoringid;
    var updatedRetakeId = (postData.retakeid) == '' ? 'null' : postData.retakeid;
    var updatedResubmissionId = (postData.resubmissionid) == '' ? 'null' : postData.resubmissionid;

    queryList = {
      course:
        'update course ' +
        'set ' +
          'coursename = "' + postData.coursename + '", ' +
          'ap = ' + postData.ap + ', ' +
          'haspasswords = ' + postData.haspasswords + ' ' +
        'where courseid = ' + postData.courseid,
      
      configuration: 
        'update configuration ' +
        'set ' +
          'examid = ' + updatedExamId + ', ' +
          'proctoringid = ' + updatedProctoringId + ', ' +
          'retakeid = ' + updatedRetakeId + ', ' +
          'resubmissionid = ' + updatedResubmissionId + ' ' +
        'where courseid = ' + postData.courseid
    };
      
    queryResults = await this._dbManager.dbQueries(queryList);    
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      if (queryResults.details.toLowerCase().includes('duplicate entry')) {
        result.details = 'duplicate';
      } else {
        result.details = queryResults.details;
      }
    }

    return result;
  }
  
  async _deleteCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'delete from course  ' +
      'where courseid = ' + postData.courseid;
      
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
