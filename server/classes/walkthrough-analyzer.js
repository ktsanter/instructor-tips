"use strict";
//---------------------------------------------------------------
// server-side for walkthrough analyzer 
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.WalkthroughAnalyzer = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
        
    // Excel column names for enrollments
    this.colEnrollment_Student = 'Student';
    this.colEnrollment_Section = 'Section';
    this.colEnrollment_Email = 'StudentEmail';
    this.colEnrollment_StartDate = 'StartDate';
    this.colEnrollment_EndDate = 'EndDate';
    this.colEnrollment_Affiliation = 'Affiliation';
    this.colEnrollment_Term = 'LMSTerm';
    this._requiredColumns_Enrollment = new Set([
      this.colEnrollment_Student,
      this.colEnrollment_Section,
      this.colEnrollment_Email,
      this.colEnrollment_StartDate,
      this.colEnrollment_EndDate,
      this.colEnrollment_Affiliation,
      this.colEnrollment_Term
    ]);    
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'walkthrough-data') {
      dbResult = await this._getWalkthroughData(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    dbResult.details = 'unrecognized parameter: ' + params.queryName;
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    dbResult.details = 'unrecognized parameter: ' + params.queryName;
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    dbResult.details = 'unrecognized parameter: ' + params.queryName;
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res, uploadType, userInfo) {
    var validTypes = new Set(['walkthrough']);

    if (validTypes.has(uploadType)) {
      this._processExcelFile(req, res, uploadType, userInfo);
      
    } else {
      this._sendFail(res, 'unrecognized upload type: ' + uploadType);
    }
  }
  
  exportToExcel(req, res, callback) {
    var thisObj = this;
    var result = {
        "success": false,
        "description": "export failed",
        "workbook": null,
        "targetfilename": ""
      }

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        callback(req, res, {"success": false, "description": 'error in form.parse: ' + JSON.stringify(err)});
        return;
      }
      
      if (!fields.hasOwnProperty('export-data')) {
        callback(req, res, {"success": false, "description": 'missing export data field'});
        return;
      }
      
      var exportData = JSON.parse(fields['export-data']);
      
      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      workbook.clearThemes();
      
      var exportFileName = 'roster-manager-export.xlsx';
      thisObj._writeExportDataToWorkbook(thisObj, exportData, workbook);
      
      var result = {
        "success": true,
        "description": "success",
        "workbook": workbook,
        "targetfilename": exportFileName
      }
      
      callback(req, res, result);
   });
  }
    
//---------------------------------------------------------------
// private methods - file processing
//--------------------------------------------------------------- 
  async _processExcelFile(req, res, uploadType, userInfo) {
    console.log('WalkthroughAnalyzer._processExcelFile', uploadType);
    var thisObj = this;

    thisObj._sendFail(res, 'testing...');
    return;
    
    var dbResult = await thisObj._getRosterInfo(null, null, userInfo);
    if (!dbResult.success) {
      thisObj._sendFail(res, dbResult.details);
      return;
    }
    var currentRosterData = dbResult.data;

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._sendFail(res, 'error in form.parse: ' + JSON.stringify(err));
        return;
      }
      
      var origFileName = files.file.name;
      var filePath = files.file.path;
      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(filePath);
      if (workbook.worksheets.length == 0) {
        thisObj._sendFail(res, 'missing first worksheet');
        return;
      }    
      
      workbook.clearThemes();
      var worksheet = workbook.getWorksheet(1);
       
      var processRoutingMap = {
        "enrollment": thisObj._processEnrollmentFile,
        "mentor": thisObj._processMentorFile,
        "studentflags": thisObj._processStudentFlagsFile,
        "iep": thisObj._processIEPFile,
        "504": thisObj._process504File,
        "homeschooled": thisObj._processHomeSchooledFile
      }
      
      if (processRoutingMap.hasOwnProperty(uploadType)) {
        processRoutingMap[uploadType](res, thisObj, worksheet, currentRosterData, userInfo);

      } else {
        thisObj._sendFail(res, 'unrecognized upload type: ' + uploadType);
      }
    });
  }
  
  //----------------------------------------------------------------------
  // process specific Excel file
  //----------------------------------------------------------------------
  async _processEnrollmentFile(res, thisObj, worksheet, currentRosterData, userInfo) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_Enrollment);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var result = thisObj._packageUploadedEnrollmentValues(thisObj, worksheet, validate.columnInfo);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
    }
    var uploadedData = result.data.enrollments;
    var currentData = currentRosterData.raw_enrollment_data;

    var differences = thisObj._findDifferences(thisObj, currentData, uploadedData, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    
    var result = await thisObj._postExcelData(thisObj, 'enrollment', uploadedData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post enrollment values');
      return;
    }
    
    result.success = true;
    result.data = {"differences": {"enrollment": differences}};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }
  
  async _processMentorFile(res, thisObj, worksheet, currentRosterData, userInfo) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_Mentor);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var result = thisObj._packageUploadedMentorValues(thisObj, worksheet, validate.columnInfo);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
      return;
    }
    var uploadedMentorData = result.data.mentors;
    var uploadedGuardianData = result.data.guardians
    var currentMentorData = currentRosterData.raw_mentor_data;
    var currentGuardianData = currentRosterData.raw_guardian_data;
    
    var mentorDifferences = thisObj._findDifferences(thisObj, currentMentorData, uploadedMentorData, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section + '\t' + item.name}
    );
    var guardianDifferences = thisObj._findDifferences(thisObj, currentGuardianData, uploadedGuardianData, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section + '\t' + item.name}
    );
    
    var result = await thisObj._postExcelData(thisObj, 'mentor', uploadedMentorData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post mentor values');
      return;
    }
    
    var result = await thisObj._postExcelData(thisObj, 'guardian', uploadedGuardianData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post guardian values');
      return;
    }
    
    result.success = true;
    result.data = {"differences": {"mentor": mentorDifferences, "guardian": guardianDifferences}};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }
  
  async _processStudentFlagsFile(res, thisObj, worksheet, currentRosterData, userInfo) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_StudentFlags);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }

    var result = thisObj._packageUploadedStudentFlagValues(thisObj, worksheet, validate.columnInfo);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
      return;
    }

    var uploadedData = result.data
    var differencesIEP = thisObj._findDifferences(thisObj, currentRosterData.raw_iep_data, uploadedData.dataIEP, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    var differences504 = thisObj._findDifferences(thisObj, currentRosterData.raw_504_data, uploadedData.data504, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    var differencesHomeschooled = thisObj._findDifferences(thisObj, currentRosterData.raw_homeschooled_data, uploadedData.dataHomeschool, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    
    var result = await thisObj._postExcelData(thisObj, 'iep', uploadedData.dataIEP, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post iep values');
      return;
    }
    var result = await thisObj._postExcelData(thisObj, 'student504', uploadedData.data504, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post 504 values');
      return;
    }
    var result = await thisObj._postExcelData(thisObj, 'homeschooled', uploadedData.dataHomeschool, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post homeschooled values');
      return;
    }

    result.success = true;
    result.data = {"differences": {"iep": differencesIEP, "504": differences504, "homeschooled": differencesHomeschooled}};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }

  async _processIEPFile(res, thisObj, worksheet, currentRosterData, userInfo) {    
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_IEP);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var result = thisObj._packageUploadedIEPValues(thisObj, worksheet, validate.columnInfo);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
      return;
    }
    var uploadedData = result.data.iep;
    var currentData = currentRosterData.raw_iep_data;
    
    var differences = thisObj._findDifferences(thisObj, currentData, uploadedData, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    
    var result = await thisObj._postExcelData(thisObj, 'iep', uploadedData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post IEP values');
      return;
    }
    
    result.success = true;
    result.data = {"differences": {"iep": differences}};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }

  async _process504File(res, thisObj, worksheet, currentRosterData, userInfo) {
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_504);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }

    var result = thisObj._packageUploaded504Values(thisObj, worksheet, validate.columnInfo);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
      return;
    }
    var uploadedData = result.data.student504;
    var currentData = currentRosterData.raw_504_data;
    
    var differences = thisObj._findDifferences(thisObj, currentData, uploadedData, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    
    var result = await thisObj._postExcelData(thisObj, 'student504', uploadedData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post 504 values');
      return;
    }
    
    result.success = true;
    result.data = {"differences": {"student504": differences}};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }

  async _processHomeSchooledFile(res, thisObj, worksheet, currentRosterData, userInfo) {
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_HomeSchooled);
    if (!validate.success) {
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }

    var result = thisObj._packageUploadedHomeSchooledValues(thisObj, worksheet, validate.columnInfo);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
      return;
    }
    var uploadedData = result.data.homeschooled;
    var currentData = currentRosterData.raw_homeschooled_data;
    
    var differences = thisObj._findDifferences(thisObj, currentData, uploadedData, 
      (item) => {return item.student + '\t' + item.term + '\t' + item.section}
    );
    
    var result = await thisObj._postExcelData(thisObj, 'homeschooled', uploadedData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post homeschooled values');
      return;
    }
    
    result.success = true;
    result.data = {"differences": {"homeschooled": differences}};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }

  //-----------------------------------------------------------------
  // package data from specific uploaded file
  //-----------------------------------------------------------------
  _packageUploadedEnrollmentValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var enrollments = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colEnrollment_Student]).value;
      student = thisObj._formatEnrollmentStudentName(student);
      
      var term = row.getCell(columnInfo[thisObj.colEnrollment_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colEnrollment_Section]).value;

      if (student != thisObj.colEnrollment_Student) {
        enrollments.push({
          "student": student,
          "term": term,
          "section": section,
          "startdate": thisObj._formatDate(row.getCell(columnInfo[thisObj.colEnrollment_StartDate]).value),
          "enddate": thisObj._formatDate(row.getCell(columnInfo[thisObj.colEnrollment_EndDate]).value),
          "email": row.getCell(columnInfo[thisObj.colEnrollment_Email]).value,
          "affiliation": row.getCell(columnInfo[thisObj.colEnrollment_Affiliation]).value
        });
      }
    });
    
    result.success = true;
    result.data = {
      "enrollments": enrollments
    };
    
    return result;
  }
  
  _formatEnrollmentStudentName(origName) {
    var formatted = origName;
    var splitName = origName.split(',');
    if (splitName.length > 1) {
      formatted = splitName[0].trim() + ', ' + splitName[1].trim();
    }
    
    return formatted;      
  }
  
  _packageUploadedMentorValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var entries = [];
    
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colMentor_Student]).value;
      var studentFirst = row.getCell(columnInfo[thisObj.colMentor_StudentFirst]).value;
      var studentLast = row.getCell(columnInfo[thisObj.colMentor_StudentLast]).value;
      
      var mentorFirst = row.getCell(columnInfo[thisObj.colMentor_FirstName]).value;
      var mentorLast = row.getCell(columnInfo[thisObj.colMentor_LastName]).value;

      var term = row.getCell(columnInfo[thisObj.colMentor_Term]).value;    
      var section = row.getCell(columnInfo[thisObj.colMentor_Section]).value;

      if (student != thisObj.colMentor_Student) {
        entries.push({
          "student": thisObj._formatNameFromMentorReport(student, 'student', studentFirst, studentLast),
          "term": term,
          "section": section,
          "role": row.getCell(columnInfo[thisObj.colMentor_Role]).value,
          "name": thisObj._formatNameFromMentorReport(row.getCell(columnInfo[thisObj.colMentor_Name]).value, 'mentor', mentorFirst, mentorLast),
          "email": thisObj._formatMentorEmail(row.getCell(columnInfo[thisObj.colMentor_Email]).value),
          "affiliation": row.getCell(columnInfo[thisObj.colMentor_Affiliation]).value,
          "phone": row.getCell(columnInfo[thisObj.colMentor_Phone]).value,
          "affiliationphone": row.getCell(columnInfo[thisObj.colMentor_AffiliationPhone]).value
        });
      }
    });
    
    var mentors = entries.filter(function(item) { return item.role == 'MENTOR' } );
    mentors = thisObj._removeDuplicates(mentors, function(item) { return item.student + '\t' + item.name + '\t' + item.term + '\t' + item.section; });
    for (var i = 0; i < mentors.length; i++) {
      delete mentors[i].role;
    }
    
    var guardians = entries.filter(function(item) { return item.role == 'GUARDIAN' } );
    guardians = thisObj._removeDuplicates(guardians, function(item) { return item.student + '\t' + item.name + '\t' + item.term + '\t' + item.section; });
    for (var i = 0; i < guardians.length; i++) {
      delete guardians[i].role;
    }
    
    result.success = true;
    result.data = {
      "mentors": mentors,
      "guardians": guardians
    }
    
    return result;
  }  
  
  _packageUploadedStudentFlagValues(thisObj, worksheet, columnInfo) {
    var result = {success: false, data: null};
    
    var flagInfo = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colFlags_Student]).value;
      var term = row.getCell(columnInfo[thisObj.colFlags_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colFlags_Section]).value;

      if (student != thisObj.colFlags_Student) {
        flagInfo.push({
          "student": student,
          "term": term,
          "section": section,
          "iep": row.getCell(columnInfo[thisObj.colFlags_IEP]).value == 'Yes',
          "504": row.getCell(columnInfo[thisObj.colFlags_504]).value == 'Yes',
          "homeschool": row.getCell(columnInfo[thisObj.colFlags_Homeschooled]).value == 'Yes'
        });
      }
    });
    
    var dataIEP = [];
    var data504 = [];
    var dataHomeschool = [];
    for (var i = 0; i < flagInfo.length; i++) {
      var entry = flagInfo[i];
      if (entry["iep"]) {
        dataIEP.push({"student": entry.student, "term": entry.term, "section": entry.section});
      }
      if (entry["504"]) {
        data504.push({"student": entry.student, "term": entry.term, "section": entry.section});
      }
      if (entry["homeschool"]) {
        dataHomeschool.push({"student": entry.student, "term": entry.term, "section": entry.section});
      }
    }
    
    result.success = true;
    result.data = {
      "dataIEP": dataIEP,
      "data504": data504,
      "dataHomeschool": dataHomeschool
    };
    
    return result;
  }

  _packageUploadedIEPValues(thisObj, worksheet, columnInfo) {
    console.log('unexpected call of _packageUploadedIEPValues');
    var result = {success: false, data: null};
    
    var iepInfo = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colIEP_Student]).value;
      var term = row.getCell(columnInfo[thisObj.colIEP_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colIEP_Section]).value;

      if (student != thisObj.colIEP_Student) {
        iepInfo.push({
          "student": thisObj._formatNameFromMentorReport(student, 'student'),
          "term": term,
          "section": section
        });
      }
    });
    
    result.success = true;
    result.data = {
      "iep": iepInfo
    };

    return result;
  }
    
  _packageUploaded504Values(thisObj, worksheet, columnInfo) {
    console.log('unexpected call of _packageUploaded504Values');
    var result = {success: false, data: null};
    
    var student504Info = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.col504_Student]).value;
      var term = row.getCell(columnInfo[thisObj.col504_Term]).value;
      var section = row.getCell(columnInfo[thisObj.col504_Section]).value;

      if (student != thisObj.col504_Student) {
        student504Info.push({
          "student": thisObj._formatNameFromMentorReport(student, 'student'),
          "term": term,
          "section": section
        });
      }
    });
    
    result.success = true;
    result.data = {
      "student504": student504Info
    };

    return result;
  }
    
  _packageUploadedHomeSchooledValues(thisObj, worksheet, columnInfo) {
    console.log('unexpected call of _packageUploadedHomeSchooledValues');
    var result = {success: false, data: null};
    
    
    var studentHomeSchooledInfo = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnInfo[thisObj.colHomeSchooled_Student]).value;
      var term = row.getCell(columnInfo[thisObj.colHomeSchooled_Term]).value;
      var section = row.getCell(columnInfo[thisObj.colHomeSchooled_Section]).value;

      if (student != thisObj.colHomeSchooled_Student) {
        studentHomeSchooledInfo.push({
          "student": student,
          "term": term,
          "section": section
        });
      }
    });
    
    result.success = true;
    result.data = {
      "homeschooled": studentHomeSchooledInfo
    };

    return result;
  }
  
  //------------------------------------------------------------
  // find differences between new and current data sets
  //------------------------------------------------------------
  _findDifferences(thisObj, originalData, newData, funcMakeKey) {
    var differences = [];
    
    
    for (var i = 0; i < originalData.length; i++) {
      var item = originalData[i];

      var searchResult = thisObj._findObjInList(thisObj, item, funcMakeKey(item), newData, funcMakeKey)
      if (searchResult.found) {
        if (!searchResult.exactMatch) {
          differences.push({"key": funcMakeKey(item), "item": item, "reason": 'changed'});
        } 
      } else {
        differences.push({"key": funcMakeKey(item), "item": item, "reason": 'removed'});
      }
    }

    for (var i = 0; i < newData.length; i++) {
      var item = newData[i];
      var searchResult = thisObj._findObjInList(thisObj, item, funcMakeKey(item), originalData, funcMakeKey)
      if (!searchResult.found) {
        differences.push({"key": funcMakeKey(item), "item": item, "reason": 'added'});
      }
    }

    return differences;
  }
  
  _findObjInList(thisObj, obj, objKey, list, funcMakeKey) {
    var searchResult = {"found": false};
    
    for (var i = 0; i < list.length && !searchResult.found; i++) {
      var listItem = list[i];
      var listItemKey = funcMakeKey(listItem);
      if (objKey == listItemKey) {
        searchResult.found = true;
        searchResult.exactMatch = thisObj._shallowEqual(obj, listItem);
      }
    }
    
    return searchResult;
  }  
  
  _shallowEqual(object1, object2) {
delete object1.welcomelettersent;
delete object2.welcomelettersent;
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (let key of keys1) {
      if (object1[key] != object2[key]) {
        return false;
      }
    }

    return true;
  }    

  //------------------------------------------------------------
  // post uploaded Excel data to DB
  //------------------------------------------------------------
  async _postExcelData(thisObj, dataName, data, userInfo) {
    var result = thisObj._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {};
    if (dataName == 'enrollment') {
      queryList.remove = 'delete from enrollment where userid = ' + userInfo.userId;
    } else if (dataName == 'mentor') {
      queryList.remove = 'delete from mentor where userid = ' + userInfo.userId;
    } else if (dataName == 'guardian') {
      queryList.remove = 'delete from guardian where userid = ' + userInfo.userId;
    } else if (dataName == 'iep') {
      queryList.remove = 'delete from iep where userid = ' + userInfo.userId;
    } else if (dataName == 'student504') {
      queryList.remove = 'delete from student504 where userid = ' + userInfo.userId;
    } else if (dataName == 'homeschooled') {
      queryList.remove = 'delete from homeschooled where userid = ' + userInfo.userId;
    } 

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = 'failed to delete old ' + dataName + ' data for user';
      return result;
    }
    
    queryList = {};
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      if (dataName == 'enrollment') {  
        queryList[i] = 
          'insert into enrollment (' +
          'userid, student, term, section, startdate, enddate, email, affiliation ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '", ' +
              '"' + thisObj._formatDate(item.startdate) + '", ' +
              '"' + thisObj._formatDate(item.enddate) + '", ' +
              '"' + item.email + '", ' +
              '"' + item.affiliation + '" ' +
          ') ';
          
      } else if (dataName == 'mentor') {  
        queryList[i] = 
          'insert into mentor (' +
          'userid, student, term, section, name, email, phone, affiliation, affiliationphone ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '", ' +
              '"' + item.name + '", ' +
              '"' + item.email + '", ' +
              '"' + item.phone + '", ' +
              '"' + item.affiliation + '", ' +
              '"' + item.affiliationphone + '" ' +
          ') ';
          
      } else if (dataName == 'guardian') {  
        queryList[i] = 
          'insert into guardian (' +
          'userid, student, term, section, name, email, phone, affiliation, affiliationphone ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '", ' +
              '"' + item.name + '", ' +
              '"' + item.email + '", ' +
              '"' + item.phone + '", ' +
              '"' + item.affiliation + '", ' +
              '"' + item.affiliationphone + '" ' +
          ') ';
          
      } else if (dataName == 'iep') {  
        queryList[i] = 
          'insert into iep (' +
          'userid, student, term, section ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '" ' +
          ') ';
          
      } else if (dataName == 'student504') {  
        queryList[i] = 
          'insert into student504 (' +
          'userid, student, term, section ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '" ' +
          ') ';
          
      } else if (dataName == 'homeschooled') {  
        queryList[i] = 
          'insert into homeschooled (' +
          'userid, student, term, section ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '" ' +
          ') ';
      }
    }
    
    queryResults = await this._dbManager.dbQueries(queryList); 

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// write export data to Excel workbook
//---------------------------------------------------------------    
  _writeExportDataToWorkbook(thisObj, exportData, workbook) {
    thisObj._writeStudentDataToWorkbook(exportData.studentExportData, workbook);
    thisObj._writeMentorDataToWorkbook(exportData.mentorExportData, workbook);
  }

  _writeStudentDataToWorkbook(studentData, workbook) {
    var sheet = workbook.addWorksheet('students');
    sheet.addRow([
      'student', 'term', 'section', 'start date', 'end date', 'enrollment end date', 
      'email', 'affiliation', 'preferred', 
      'IEP', '504', 'homeshcooled', 'welcome', 
      'notes'
    ]);
    sheet.getRow(1).font = {bold: true};
    sheet.getRow(1).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.columns = [ 
      {width: 19, style: {alignment: {vertical: 'top'}}}, 
      {width: 41, style: {alignment: {vertical: 'top'}}}, 
      {width: 33, style: {alignment: {vertical: 'top'}}}, 
      {width: 12, style: {alignment: {vertical: 'top', horizontal: 'center'}}}, 
      {width: 12, style: {alignment: {vertical: 'top', horizontal: 'center'}}}, 
      {width: 18, style: {alignment: {vertical: 'top', horizontal: 'center'}}}, 
      {width: 25, style: {alignment: {vertical: 'top'}}}, 
      {width: 35, style: {alignment: {vertical: 'top'}}}, 
      {width: 12, style: {alignment: {vertical: 'top'}}}, 
      {width: 8, style: {alignment: {vertical: 'top', horizontal: 'center'}}}, 
      {width: 8, style: {alignment: {vertical: 'top', horizontal: 'center'}}}, 
      {width: 13, style: {alignment: {vertical: 'top', horizontal: 'center'}}},
      {width: 10, style: {alignment: {vertical: 'top', horizontal: 'center'}}},
      {width: 60, style: {alignment: {vertical: 'top'}}}
    ]

    var rowList = [];
    for (var student in studentData) {
      var studentItem = studentData[student];
  
      for (var i = 0; i < studentItem.enrollments.length; i++) {
        var enrollment = studentItem.enrollments[i];

        var endDate = this._getEndDate(enrollment, studentItem.enddateoverride);
        
        var row = [
          student,
          enrollment.term,
          enrollment.section,
          enrollment.startdate,
          endDate,
          enrollment.enddate,
          enrollment.email,
          enrollment.affiliation,
          studentItem.preferredname,
          studentItem.iep ? '☑️' : '',
          studentItem["504"] ? '☑️' : '',
          studentItem.homeschooled ? '☑️' : '',
          enrollment.welcomelettersent ? '☑️' : ''
        ];
        
        var notesCombined = ''
        for (var j = 0; j < studentItem.notes.length; j++) {
          var note = studentItem.notes[j];
          if (notesCombined.length > 0) notesCombined += '\n';
          notesCombined += note.datestamp + ': ' + note.notetext;
        }
        row.push(notesCombined);
        
        rowList.push(row);
      }
    }
    
    rowList = rowList.sort((a,b) => {
      return a[0].localeCompare(b[0]);
    });
    
    for (var i = 0; i < rowList.length; i++) {
      sheet.addRow(rowList[i]);
    }
  }
  
  _writeMentorDataToWorkbook(mentorData, workbook) {
    var sheet = workbook.addWorksheet('mentors');
    
    var rowCount = 0;
    
    sheet.addRow(['section', 'mentor', 'email', 'phone', 'affiliation', 'aff phone', 'welcome', 'students']);
    sheet.getRow(1).font = {bold: true};
    sheet.getRow(1).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.columns = [ 
      {width: 40, style: {alignment: {vertical: 'top'}}}, 
      {width: 29, style: {alignment: {vertical: 'top'}}}, 
      {width: 26, style: {alignment: {vertical: 'top'}}}, 
      {width: 15, style: {alignment: {vertical: 'top'}}}, 
      {width: 36, style: {alignment: {vertical: 'top'}}}, 
      {width: 15, style: {alignment: {vertical: 'top'}}},
      {width: 6, style: {alignment: {vertical: 'top', horizontal: 'center'}, font: {size: 9}}},
      {width: 15, style: {alignment: {vertical: 'top'}}}
    ];

    var sectionList = [];
    for (var section in mentorData) {
      sectionList.push(section);
    }
    sectionList = sectionList.sort();
    
    for (var s = 0; s < sectionList.length; s++) {
      var section = sectionList[s];
      var sectionItem = mentorData[section];
      
      var mentorList = [];
      for (var mentor in sectionItem) {
        mentorList.push(mentor);
      }
      mentorList = mentorList.sort();
      
      for (var m = 0; m < mentorList.length; m++) {
        var mentor = mentorList[m];
        var mentorItem = sectionItem[mentor];
        var formattedStudentList = this._formatStudentList(mentorItem.studentlist);
        sheet.addRow([
          section,
          mentor,
          mentorItem.email,
          mentorItem.phone,
          mentorItem.affiliation,
          mentorItem.affiliationphone,
          mentorItem.welcomelettersent ? '☑️' : '',
          formattedStudentList
        ]);
      }
    }
  }
  
  _formatStudentList(studentList) {
    var formatted = '';
    for (var i = 0; i < studentList.length; i++) {
      if (i > 0) formatted += '; ';
      formatted += studentList[i];
    }
    return formatted;
  }
  
  _getEndDate(enrollment, enddateoverride) {
    var endDate = enrollment.enddate;
    for (var i = 0; i < enddateoverride.length; i++) {
      if (enrollment.section == enddateoverride[i].section) {
        endDate = enddateoverride[i].enddate;
      }
    }
    
    return endDate;    
  }
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------    
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  
  
  async _getWalkthroughData(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    result.success =true;
    result.details = 'testing';
    result.data = {"dummy": 'test walkthrough data'};
    return result;
    
    
    queryList = {
      "preferredname":
        'select p.studentname, p.preferredname ' +
        'from preferredname as p ' +
        'where p.userid = ' + userInfo.userId
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResuls.data;  

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
  
  _formatDate(theDate) {
    if (typeof theDate == 'string') return theDate;
    
    var y = String(theDate.getFullYear()).padStart(4, '0');
    var m = String(theDate.getMonth() + 1).padStart(2, '0');
    var d = String(theDate.getDate()).padStart(2, '0');
    
    return y + '-' + m + '-' + d;
  }  
}
