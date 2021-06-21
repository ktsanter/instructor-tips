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
    this._apiKey = params.apiKey;
        
    this.colEnrollment_Student = 'Student';
    this.colEnrollment_Section = 'Section';
    this.colEnrollment_Email = 'StudentEmail';
    this.colEnrollment_StartDate = 'StartDate';
    this.colEnrollment_EndDate = 'EndDate';
    this.colEnrollment_Affiliation = 'Affiliation';
    this.colEnrollment_Term = 'LMSTerm';

    this.colMentor_Student = 'Student_Name';
    this.colMentor_Section = 'Section_Name';
    this.colMentor_Term = 'Term_Name';
    this.colMentor_Role = 'Role';
    this.colMentor_Name = 'Mentor/Guardian';
    this.colMentor_Email = 'Mentor Email';

    this._requiredColumns_Enrollment = new Set([
      this.colEnrollment_Student,
      this.colEnrollment_Section,
      this.colEnrollment_Email,
      this.colEnrollment_StartDate,
      this.colEnrollment_EndDate,
      this.colEnrollment_Affiliation,
      this.colEnrollment_Term
    ]);    

    this._requiredColumns_Mentor = new Set([
      this.colMentor_Student,
      this.colMentor_Section,
      this.colMentor_Term,
      this.colMentor_Role,
      this.colMentor_Name,
      this.colMentor_Email
    ]);    
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------  
  async renderManagerPage(res, me, pugFileName, renderAndSendPug, userManagement, userInfo) {
    var dbResult = await me._getGoogleFileId(userInfo);
    if (!dbResult.success) me._sendFail(res, 'cannot access page: roster manager');
    
    var googleFileId = '[none]';
    if (dbResult.data.length > 0) googleFileId = dbResult.data[0].googlefileid;
    
    var pugOptions = {
      "googlefileid": googleFileId
    };
    
    renderAndSendPug(res, 'rostermanager', pugFileName, {params: pugOptions});    
  }

  processUploadedFile(req, res, uploadType) {
    if (uploadType == 'enrollment') {
      this._processExcelFile(req, res, uploadType);
      
    } else if (uploadType == 'mentor') {
      this._processExcelFile(req, res, uploadType);
      
    } else {
      this._sendFail(res, 'unrecognized upload type: ' + uploadType);
    }
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'apikey') {
      dbResult = await this._getAPIKey(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'googlefileid') {
      dbResult = await this._replaceGoogleFileId(params, postData, userInfo);
  
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
// private methods - file processing
//--------------------------------------------------------------- 
  async _processExcelFile(req, res, uploadType) {
    var thisObj = this;
    
    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._sendFail(req, res, 'error in form.parse: ' + JSON.stringify(err));
        return;
      }
      
      var origFileName = files.file.name;
      var filePath = files.file.path;
      
      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(filePath);
      if (workbook.worksheets.length == 0) {
        thisObj._sendFail(req, res, 'missing first worksheet');
        return;
      }    
      
      workbook.clearThemes();
      var worksheet = workbook.getWorksheet(1);

      if (uploadType == 'enrollment') {
        thisObj._processEnrollmentFile(res, thisObj, worksheet);
        
      } else if (uploadType == 'mentor') {
        thisObj._processMentorFile(res, thisObj, worksheet);
        
      } else {
        thisObj._sendFail(res, 'unrecognized upload type: ' + uploadType);
      }
    });
  }
  
  async _processEnrollmentFile(res, thisObj, worksheet) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_Enrollment);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var packagedValues = thisObj._packageEnrollmentValues(thisObj, worksheet, validate.columnInfo);
    
    if (!packagedValues.success) {
      thisObj._sendFail(req, res, 'failed to package enrollment values');
      return;
    }
    
    thisObj._sendSuccess(res, 'upload succeeded', packagedValues.data);
  }
  
  async _processMentorFile(res, thisObj, worksheet) {
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_Mentor);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }

    var packagedValues = thisObj._packageMentorValues(thisObj, worksheet, validate.columnInfo);
    
    if (!packagedValues.success) {
      thisObj._sendFail(req, res, 'failed to package enrollment values');
      return;
    }
    
    thisObj._sendSuccess(res, 'upload succeeded', packagedValues.data);
  }
  
  _packageEnrollmentValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var enrollments = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colEnrollment_Student]).value;

      if (student != thisObj.colEnrollment_Student) {
        enrollments.push({
          "student": student,
          "term": row.getCell(columnInfo[thisObj.colEnrollment_Term]).value,
          "section": row.getCell(columnInfo[thisObj.colEnrollment_Section]).value,
          "startdate": row.getCell(columnInfo[thisObj.colEnrollment_StartDate]).value,
          "enddate": row.getCell(columnInfo[thisObj.colEnrollment_EndDate]).value,
          "email": row.getCell(columnInfo[thisObj.colEnrollment_Email]).value,
          "affiliation": row.getCell(columnInfo[thisObj.colEnrollment_Affiliation]).value
        });
      }
    });
    
    result.success = true;
    result.data = enrollments;
    
    return result;
  }
  
  _packageMentorValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var enrollments = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colMentor_Student]).value;

      if (student != thisObj.colMentor_Student) {
        enrollments.push({
          "student": student,
          "term": row.getCell(columnInfo[thisObj.colMentor_Term]).value,
          "section": row.getCell(columnInfo[thisObj.colMentor_Section]).value,
          "role": row.getCell(columnInfo[thisObj.colMentor_Role]).value,
          "name": row.getCell(columnInfo[thisObj.colMentor_Name]).value,
          "email": row.getCell(columnInfo[thisObj.colMentor_Email]).value
        });
      }
    });
    
    result.success = true;
    result.data = enrollments;
    
    return result;
  }
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getGoogleFileId(userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'googlefileid ' +
      'from rosterfile ' +
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
    
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  
  
  async _getAPIKey(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = this._apiKey;

    return result;
  }  
  
  async _replaceGoogleFileId(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      "delete":
        'delete ' +
        'from rosterfile ' +
        'where userid = ' + userInfo.userId,
        
      "insert": 
        'insert ' +
        'into rosterfile(userid, googlefileid) ' + 
        'values (' + 
          userInfo.userId + ', ' +
          '"' + postData.googlefileid + '"' +
        ') '
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

//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _sendFail(res, failMessage) {
    var result = {
      sucess: false,
      details: failMessage,
      data: null
    };
    
    res.send(result);
  }
  
  _sendSuccess(res, successMessage, dataValues) {
    if (!dataValues) dataValues = null;
    
    var result = {
      success: true,
      details: successMessage,
      data: dataValues
    };
    
    res.send(result);
  }  
  
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
}
