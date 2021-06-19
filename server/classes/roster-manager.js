"use strict";
//---------------------------------------------------------------
// server-side for roster manager 
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.RosterManager = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res) {
    console.log('RosterManager.processUploadedFile');
    console.log(req.params);
    res.send('RosterManager.processUploadedFile');
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'test') {
      dbResult = await this._getTest(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._insertDummy(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._updateDummy(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._deleteDummy(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// private methods
//--------------------------------------------------------------- 
  _failureCallback(req, res, errorDescription, callback) {
    var result = {
      sucess: false,
      formname: req.params.formname,
      description: errorDescription,
      workbook: null,
      targetfilename: ''
    };
    
    callback(req, res, result);
  }
  
  _successCallback(req, res, message, workbookToSend, targetFileName, callback) {
    var result = {
      success: true,
      formname: req.params.formname,
      description: message,
      workbook: workbookToSend,
      targetfilename: targetFileName
    };
    
    callback(req, res, result);
  }
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getTest(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    var queryList = {
      'test': 
        'select ' +
          'a.userid, a.testname ' +
        'from test as a '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  
  
//------------------------------------------------------------------------------
// 
//------------------------------------------------------------------------------

//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _verifyHeaderRow(headerRow, requiredColumns) {
    var result = {
      success: false,
      columnInfo: {}
    };
    
    var foundColumns = new Set();
    var columnMapping = {};
    
    for (var i = 0; i < headerRow.values.length; i++) {
      var columnName = headerRow.getCell(i + 1).value;
      if (columnName) {
        foundColumns.add(headerRow.getCell(i+1).value);
        columnMapping[columnName] = i + 1;
      }
    }
    
    const difference = new Set(
      [...requiredColumns].filter(x => !foundColumns.has(x)));

    if (difference.size == 0) {
      result.success = true;
      result.columnInfo = columnMapping;
    }
    
    return result;
  }

  _formatStudentName(origStudent) {
    var student = origStudent;
    
    var splitName = student.split(' ');
    if (splitName.length == 2) {
      student = splitName[1] + ', ' + splitName[0];
      
    } else if (splitName.length == 3) {
      student = splitName[2] + ', ' + splitName[0] + ' ' + splitName[1];
      
    } else if (splitName.length == 4) {
      student = splitName[3] + ', ' + splitName[0] + ' ' + splitName[1] + ' ' + splitName[2];
    }
    
    return student;
  }
  
  _formatDate(d) {
    var fDate = new Date(d);
    
    return fDate;
  }
  
  _createOrReplaceSheet(workbook, sheetId) {
    var sheet = workbook.getWorksheet(sheetId);
  
    if (sheet) workbook.removeWorksheet(sheetId);   
    sheet = workbook.addWorksheet(sheetId);
      
    return sheet;
  }
}
