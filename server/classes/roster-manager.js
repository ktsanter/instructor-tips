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
    this.colMentor_Term = 'Term_Name';
    this.colMentor_Section = 'Section_Name';
    this.colMentor_Role = 'Role';
    this.colMentor_Name = 'Mentor/Guardian';
    this.colMentor_Affiliation = 'Affilation_Name';
    this.colMentor_Email = 'Mentor Email';
    this.colMentor_Phone = 'Mentor Phone';
    this.colMentor_AffiliationPhone = 'Affiliation Phone';

    this.colIEP_Student = 'Name';
    this.colIEP_Term = 'Term Name';
    this.colIEP_Section = 'Section Name';

    this.col504_Student = 'Name';
    this.col504_Term = 'Term Name';
    this.col504_Section = 'Section Name';

    this.colHomeSchooled_Student = 'Name';
    this.colHomeSchooled_Term = 'Term Name';
    this.colHomeSchooled_Section = 'Section Name';

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
      this.colMentor_Term,
      this.colMentor_Section,
      this.colMentor_Role,
      this.colMentor_Name,
      this.colMentor_Email,
      this.colMentor_Affiliation,
      this.colMentor_Phone,
      this.colMentor_AffiliationPhone
    ]);    

    this._requiredColumns_IEP = new Set([
      this.colIEP_Student,
      this.colIEP_Term,
      this.colIEP_Section
    ]);    

    this._requiredColumns_504 = new Set([
      this.col504_Student,
      this.col504_Term,
      this.col504_Section
    ]);    

    this._requiredColumns_HomeSchooled = new Set([
      this.colHomeSchooled_Student,
      this.colHomeSchooled_Term,
      this.colHomeSchooled_Section
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
      
    } else if (uploadType == 'iep') {
      this._processExcelFile(req, res, uploadType);
      
    } else if (uploadType == '504') {
      this._processExcelFile(req, res, uploadType);
      
    } else if (uploadType == 'homeschooled') {
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
      
    } else if (params.queryName == 'student-properties') {
      dbResult = await this._getStudentProperties(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'googlefileid') {
      dbResult = await this._replaceGoogleFileId(params, postData, userInfo);
      
    } else if (params.queryName == 'student-property') {
      dbResult = await this._replaceStudentProperty(params, postData, userInfo);
  
    } else if (params.queryName == 'student-note') {
      dbResult = await this._addStudentNote(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'student-note') {
      dbResult = await this._updateStudentNote(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'student-note') {
      dbResult = await this._deleteStudentNote(params, postData, userInfo);
    
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
        
      } else if (uploadType == 'iep') {
        thisObj._processIEPFile(res, thisObj, worksheet);
        
      } else if (uploadType == '504') {
        thisObj._process504File(res, thisObj, worksheet);
        
      } else if (uploadType == 'homeschooled') {
        thisObj._processHomeSchooledFile(res, thisObj, worksheet);
        
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
      thisObj._sendFail(req, res, 'failed to package mentor values');
      return;
    }
    
    thisObj._sendSuccess(res, 'upload succeeded', packagedValues.data);
  }
  
  async _processIEPFile(res, thisObj, worksheet) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_IEP);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var packagedValues = thisObj._packageIEPValues(thisObj, worksheet, validate.columnInfo);
    
    if (!packagedValues.success) {
      thisObj._sendFail(req, res, 'failed to package IEP values');
      return;
    }
    
    thisObj._sendSuccess(res, 'upload succeeded', packagedValues.data);
  }
  
  async _process504File(res, thisObj, worksheet) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_504);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var packagedValues = thisObj._package504Values(thisObj, worksheet, validate.columnInfo);
    
    if (!packagedValues.success) {
      thisObj._sendFail(req, res, 'failed to package 504 values');
      return;
    }
    
    thisObj._sendSuccess(res, 'upload succeeded', packagedValues.data);
  }
  
  async _processHomeSchooledFile(res, thisObj, worksheet) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_HomeSchooled);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var packagedValues = thisObj._packageHomeSchooledValues(thisObj, worksheet, validate.columnInfo);
    
    if (!packagedValues.success) {
      thisObj._sendFail(req, res, 'failed to package home schooled values');
      return;
    }
    
    thisObj._sendSuccess(res, 'upload succeeded', packagedValues.data);
  }
  
  _packageEnrollmentValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var enrollments = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colEnrollment_Student]).value;
      var term = row.getCell(columnInfo[thisObj.colEnrollment_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colEnrollment_Section]).value;
      var term_section = term + '\t' + section;

      if (student != thisObj.colEnrollment_Student) {
        enrollments.push({
          "student": student,
          "term": term,
          "section": section,
          "term_section": term_section,
          "startdate": row.getCell(columnInfo[thisObj.colEnrollment_StartDate]).value,
          "enddate": row.getCell(columnInfo[thisObj.colEnrollment_EndDate]).value,
          "email": row.getCell(columnInfo[thisObj.colEnrollment_Email]).value,
          "affiliation": row.getCell(columnInfo[thisObj.colEnrollment_Affiliation]).value
        });
      }
    });
    
    var enrollmentsByStudent = thisObj.collateObjectArray(enrollments, 'student');
    var enrollmentsByTermSection = thisObj.collateObjectArray(enrollments, 'term_section');
    
    result.success = true;
    result.data = {
      "enrollments": enrollments,
      "enrollmentsByStudent": enrollmentsByStudent,
      "enrollmentsByTermSection": enrollmentsByTermSection
    };
    
    return result;
  }
  
  _packageMentorValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var entries = [];
    
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colMentor_Student]).value;    
      var term = row.getCell(columnInfo[thisObj.colMentor_Term]).value;    
      var section = row.getCell(columnInfo[thisObj.colMentor_Section]).value;
      var term_section = term + '\t' + section;      

      if (student != thisObj.colMentor_Student) {
        entries.push({
          "student": thisObj._formatName(student),
          "term": term,
          "section": section,
          "term_section": term_section,
          "role": row.getCell(columnInfo[thisObj.colMentor_Role]).value,
          "name": thisObj._formatName(row.getCell(columnInfo[thisObj.colMentor_Name]).value),
          "email": row.getCell(columnInfo[thisObj.colMentor_Email]).value,
          "affiliation": row.getCell(columnInfo[thisObj.colMentor_Affiliation]).value,
          "phone": row.getCell(columnInfo[thisObj.colMentor_Phone]).value,
          "affiliationphone": row.getCell(columnInfo[thisObj.colMentor_AffiliationPhone]).value
        });
      }
    });
    
    var mentors = entries.filter(function(item) { return item.role == 'MENTOR' } );
    var mentorsNoStudentInfo = thisObj._reduceObjectArray(mentors, 'student', (item) => { return item.term_section + '\t' + item.name; });
    var mentorsByTermSection = thisObj.collateObjectArray(mentorsNoStudentInfo, 'term_section');
    mentors = thisObj._removeDuplicates(mentors, function(item) { return item.student + '\t' + item.name; });
    var mentorsByStudent = thisObj.collateObjectArray(mentors, 'student');    
    
    var guardians = entries.filter(function(item) { return item.role == 'GUARDIAN' } );
    guardians = thisObj._removeDuplicates(guardians, function(item) { return item.student + '\t' + item.name; });
    var guardiansByStudent = thisObj.collateObjectArray(guardians, 'student');
    
    result.success = true;
    result.data = {
      "mentors": mentors,
      "mentorsByStudent": mentorsByStudent,
      "mentorsByTermSection": mentorsByTermSection,
      "guardians": guardians,
      "guardiansByStudent": guardiansByStudent
    }
    
    return result;
  }
  
  _packageIEPValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var iepInfo = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colIEP_Student]).value;
      var term = row.getCell(columnInfo[thisObj.colIEP_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colIEP_Section]).value;
      var term_section = term + '\t' + section;

      if (student != thisObj.colIEP_Student) {
        iepInfo.push({
          "student": student,
          "term": term,
          "section": section,
          "term_section": term_section
        });
      }
    });
    
    var iepsByStudent = thisObj.collateObjectArray(iepInfo, 'student');
    
    result.success = true;
    result.data = {
      "iep": iepInfo,
      "iepsByStudent": iepsByStudent
    };
    
    return result;
  }
  
  _package504Values(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var info504 = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.col504_Student]).value;
      var term = row.getCell(columnInfo[thisObj.col504_Term]).value;
      var section = row.getCell(columnInfo[thisObj.col504_Section]).value;
      var term_section = term + '\t' + section;

      if (student != thisObj.col504_Student) {
        info504.push({
          "student": student,
          "term": term,
          "section": section,
          "term_section": term_section
        });
      }
    });
    
    var info504ByStudent = thisObj.collateObjectArray(info504, 'student');
    
    result.success = true;
    result.data = {
      "504": info504,
      "504ByStudent": info504ByStudent
    };
    
    return result;
  }
  
  _packageHomeSchooledValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var infoHomeSchooled = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colHomeSchooled_Student]).value;
      var term = row.getCell(columnInfo[thisObj.colHomeSchooled_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colHomeSchooled_Section]).value;
      var term_section = term + '\t' + section;

      if (student != thisObj.colHomeSchooled_Student) {
        infoHomeSchooled.push({
          "student": student,
          "term": term,
          "section": section,
          "term_section": term_section
        });
      }
    });
    
    var infoHomeSchooledByStudent = thisObj.collateObjectArray(infoHomeSchooled, 'student');
    
    result.success = true;
    result.data = {
      "homeSchooled": infoHomeSchooled,
      "homeSchooledByStudent": infoHomeSchooledByStudent
    };
    
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
  
  async _getStudentProperties(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "preferredname":
        'select p.studentname, p.preferredname ' +
        'from preferredname as p ' +
        'where p.userid = ' + userInfo.userId,
        
      "notes": 
        'select n.noteid, n.studentname, n.datestamp, n.notetext ' +
        'from note as n ' +
        'where n.userid = ' + userInfo.userId + ' ' +
        'order by n.datestamp ',
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

  async _replaceStudentProperty(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    if (postData.property == 'preferredname') {
      queryList = {
        "delete":
          'delete ' +
          'from preferredname ' +
          'where userid = ' + userInfo.userId + ' ' +
            'and studentname = "' + postData.student + '" ',
          
        "insert": 
          'insert ' +
          'into preferredname(userid, studentname, preferredname) ' + 
          'values (' + 
            userInfo.userId + ', ' +
            '"' + postData.student + '", ' +
            '"' + postData.value + '"' +
          ') '
      };
      
    } else {
      result.details = 'invalid property: ' + postData.property;
      return result;
    }

    queryResults = await this._dbManager.dbQueries(queryList);   
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = postData;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  async _addStudentNote(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "insert": 
        'insert ' +
        'into note(userid, studentname, datestamp, notetext) ' + 
        'values (' + 
          userInfo.userId + ', ' +
          '"' + postData.student + '", ' +
          '"' + postData.datestamp + '", ' +
          '"' + postData.notetext + '" ' +
        ') '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);   
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = postData;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _updateStudentNote(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "update": 
        'update note ' +
        'set ' + 
          'notetext = "' + postData.notetext + '", ' +
          'datestamp = "' + postData.datestamp + '" ' +
        'where ' +        
          'noteid = ' + postData.noteid
    };
     
    queryResults = await this._dbManager.dbQueries(queryList);   
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = postData;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _deleteStudentNote(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "delete": 
        'delete from note ' +
        'where ' +        
          'noteid = ' + postData.noteid
    };
         
    queryResults = await this._dbManager.dbQueries(queryList);   
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = postData;
      
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

  _formatName(origName) {
    var name = origName;
    
    var splitName = name.split(' ');
    if (splitName.length == 2) {
      name = splitName[1] + ', ' + splitName[0];
      
    } else if (splitName.length == 3) {
      name = splitName[2] + ', ' + splitName[0] + ' ' + splitName[1];
      
    } else if (splitName.length == 4) {
      name = splitName[3] + ', ' + splitName[0] + ' ' + splitName[1] + ' ' + splitName[2];
    }
    
    return name;
  }
    
  collateObjectArray(objectArray, collationKey) {
    var collated = {};
    for (var i = 0; i < objectArray.length; i++) {
      var item = objectArray[i];
      var keyval = item[collationKey];
      if (!collated.hasOwnProperty(keyval)) {
        collated[keyval] = [];
      }
      collated[keyval].push(item);
    }
    
    return collated;
  }
  
  _reduceObjectArray(objectArray, keyToRemove, funcMakeIndex) {
    var result = [];
    var map = new Map();
    
    for (var item of objectArray) {
      var indexVal = funcMakeIndex(item);
      
      if(!map.has(indexVal)){
        map.set(indexVal, true);
        var reducedItem = JSON.parse(JSON.stringify(item));
        delete reducedItem.student;
        result.push(reducedItem);
      }
    }

    return result;
  }
  
  _removeDuplicates(list, funcKey) {
    var result = [];
    var keyList = new Set();
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var key = funcKey(item);
      if (!keyList.has(key)) {
        result.push(item);
      }
      keyList.add(key);
    }
    
    return result;
  }
}
