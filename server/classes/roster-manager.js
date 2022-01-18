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
    this._dbManager_enddate = params.dbManager_enddate;
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


    // Excel column names for mentor/guardian
    this.colMentor_Student = 'Student_Name';
    this.colMentor_StudentFirst = 'First Name';
    this.colMentor_StudentLast = 'Last Name';
    this.colMentor_Term = 'Term_Name';
    this.colMentor_Section = 'Section_Name';
    this.colMentor_Role = 'Role';
    this.colMentor_Name = 'Mentor/Guardian';
    this.colMentor_FirstName = 'Mentor/Guardian First Name';
    this.colMentor_LastName = 'Mentor/Guardian Last Name';
    this.colMentor_Affiliation = 'Affilation_Name';
    this.colMentor_Email = 'Mentor Email';
    this.colMentor_Phone = 'Mentor Phone';
    this.colMentor_AffiliationPhone = 'Affiliation Phone';
    this._requiredColumns_Mentor = new Set([
      this.colMentor_Student,
      this.colMentor_StudentFirst,
      this.colMentor_StudentLast,
      this.colMentor_Term,
      this.colMentor_Section,
      this.colMentor_Role,
      this.colMentor_Name,
      this.colMentor_FirstName,
      this.colMentor_LastName,
      this.colMentor_Email,
      this.colMentor_Affiliation,
      this.colMentor_Phone,
      this.colMentor_AffiliationPhone
    ]);    

    // Excel column names for students with flags report
    this.colFlags_Student = 'Student';
    this.colFlags_Term = 'LMSTerm';
    this.colFlags_Section = 'Section';
    this.colFlags_IEP = 'iep';
    this.colFlags_504 = 'Section504';
    this.colFlags_Homeschooled = 'Homeschool';
    this._requiredColumns_StudentFlags = new Set([
      this.colFlags_Student,
      this.colFlags_Term,
      this.colFlags_Section,
      this.colFlags_IEP,
      this.colFlags_504,
      this.colFlags_Homeschooled
    ]);
    
    // Excel column names for IEP data
    this.colIEP_Student = 'Name';
    this.colIEP_Term = 'Term Name';
    this.colIEP_Section = 'Section Name';
    this._requiredColumns_IEP = new Set([
      this.colIEP_Student,
      this.colIEP_Term,
      this.colIEP_Section
    ]);    

    // Excel column names for 504 data
    this.col504_Student = 'Name';
    this.col504_Term = 'Term Name';
    this.col504_Section = 'Section Name';
    this._requiredColumns_504 = new Set([
      this.col504_Student,
      this.col504_Term,
      this.col504_Section
    ]);    

    // Excel column names for homeschooled
    this.colHomeSchooled_Student = 'Name';
    this.colHomeSchooled_Term = 'Term Name';
    this.colHomeSchooled_Section = 'Section Name';
    this._requiredColumns_HomeSchooled = new Set([
      this.colHomeSchooled_Student,
      this.colHomeSchooled_Term,
      this.colHomeSchooled_Section
    ]);    
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'rosterinfo') {
      dbResult = await this._getRosterInfo(params, postData, userInfo);
      
    } else if (params.queryName == 'student-properties') {
      dbResult = await this._getStudentProperties(params, postData, userInfo);
      
    } else if (params.queryName == 'mentor-properties') {
      dbResult = await this._getMentorProperties(params, postData, userInfo);
      
    } else if (params.queryName == 'accesskey') {
      dbResult = await this._getAccessKey(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-data') {
      dbResult = await this._infodeckGetData(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-preferredname') {
      dbResult = await this._infodeckUpdatePreferredName(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-pronouns') {
      dbResult = await this._infodeckUpdatePronouns(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-addnote') {
      dbResult = await this._infodeckAddNote(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-updatenote') {
      dbResult = await this._infodeckUpdateNote(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-deletenote') {
      dbResult = await this._infodeckDeleteNote(params, postData, userInfo);
            
    } else if (params.app == 'infodeck' && params.queryName == 'infodeck-mentorwelcome') {
      dbResult = await this._infodeckReplaceMentorProperty(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'student-property') {
      dbResult = await this._replaceStudentProperty(params, postData, userInfo);
  
    } else if (params.queryName == 'mentor-property') {
      dbResult = await this._replaceMentorProperty(params, postData, userInfo);
  
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
    
    } else if (params.queryName == 'term-remove') {
      dbResult = await this._removeTermData(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res, uploadType, userInfo) {
    var validTypes = new Set(['enrollment', 'mentor', 'studentflags', 'iep', '504', 'homeschooled']);

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
    console.log('_processExcelFile', uploadType);
    var thisObj = this;
    
    var dbResult = await thisObj._getRosterInfo(null, null, userInfo);
    if (!dbResult.success) {
      thisObj._sendFail(res, dbResult.details);
      return;
    }
    var currentRosterData = dbResult.data;
    console.log('currentRosterData', currentRosterData);

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._sendFail(res, 'error in form.parse: ' + JSON.stringify(err));
        return;
      }
      
      var origFileName = files.file.name;
      var filePath = files.file.path;
      console.log(origFileName, filePath);
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
    console.log('_processEnrollmentFile');
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
    console.log('_postExcelData', dataName);
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
    console.log(queryResults);
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
          'userid, student, term, section, startdate, enddate, email, affiliation, welcomeletter ' +
          ') values (' +
              userInfo.userId + ', ' +
              '"' + item.student + '", ' +
              '"' + item.term + '", ' +
              '"' + item.section + '", ' +
              '"' + thisObj._formatDate(item.startdate) + '", ' +
              '"' + thisObj._formatDate(item.enddate) + '", ' +
              '"' + item.email + '", ' +
              '"' + item.affiliation + '", ' +
              0 + ' ' +
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
    
    console.log(queryList);
    queryResults = await this._dbManager.dbQueries(queryList); 
    console.log(queryResults);

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
//          mentorItem.welcomelettersent ? '☑️' : '',

          studentItem.homeschooled ? '☑️' : '',
          enrollment.welcomeletter ? '☑️' : ''
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
  
  async _getStudentProperties(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "preferredname":
        'select p.studentname, p.preferredname ' +
        'from preferredname as p ' +
        'where p.userid = ' + userInfo.userId,
        
      "pronouns":
        'select p.studentname, p.pronouns ' +
        'from pronouns as p ' +
        'where p.userid = ' + userInfo.userId,
        
      "notes": 
        'select n.noteid, n.studentname, n.datestamp, n.notetext ' +
        'from note as n ' +
        'where n.userid = ' + userInfo.userId + ' ' +
        'order by n.datestamp ',
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var queryList2, queryResults2;
    queryList2 = {
      "eventoverride":
        'select e.student, e.section, e.enddate, e.notes ' +
        'from eventoverride as e, configuration as c ' + 
        'where e.configurationid = c.configurationid ' +
          'and c.userid = ' + userInfo.userId
    }
    
    queryResults2 = await this._dbManager_enddate.dbQueries(queryList2);    
    
    if (queryResults2.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = {...queryResults.data, ...queryResults2.data};
      
    } else {
      result.details = queryResults2.details;
    }

    return result;
  }
  
  async _getMentorProperties(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "mentorextra":
        'select m.mentorextraid, m.term, m.section, m.name, m.welcomelettersent ' +
        'from mentorextra as m ' +
        'where m.userid = ' + userInfo.userId
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data;

    return result;
  }
  
  async _getRosterInfo(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "raw_enrollment_data":
        'select e.student, e.term, e.section, e.startdate, e.enddate, e.email, e.affiliation, e.welcomeletter ' +
        'from enrollment as e ' +
        'where e.userid = ' + userInfo.userId,
        
      "raw_mentor_data":
        'select m.student, m.term, m.section, m.name, m.email, m.phone, m.affiliation, m.affiliationphone ' +
        'from mentor as m ' +
        'where m.userid = ' + userInfo.userId,
        
      "raw_guardian_data":
        'select g.student, g.term, g.section, g.name, g.email, g.phone, g.affiliation, g.affiliationphone ' +
        'from guardian as g ' +
        'where g.userid = ' + userInfo.userId,
        
      "raw_iep_data":
        'select a.student, a.term, a.section ' +
        'from iep as a ' +
        'where a.userid = ' + userInfo.userId,
        
      "raw_504_data":
        'select a.student, a.term, a.section ' +
        'from student504 as a ' +
        'where a.userid = ' + userInfo.userId,
        
      "raw_homeschooled_data":
        'select a.student, a.term, a.section ' +
        'from homeschooled as a ' +
        'where a.userid = ' + userInfo.userId,
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (queryResults.success) {
      for (var i = 0; i < queryResults.data.raw_enrollment_data.length; i++) {
        var item = queryResults.data.raw_enrollment_data[i];
        item.welcomeletter = (item.welcomeletter == 1);
      }
      
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
      
    } else if (postData.property == 'pronouns') {
      queryList = {
        "delete":
          'delete ' +
          'from pronouns ' +
          'where userid = ' + userInfo.userId + ' ' +
            'and studentname = "' + postData.student + '" ',
          
        "insert": 
          'insert ' +
          'into pronouns(userid, studentname, pronouns) ' + 
          'values (' + 
            userInfo.userId + ', ' +
            '"' + postData.student + '", ' +
            '"' + postData.value + '"' +
          ') '
      };
      
    } else if (postData.property == 'welcomeletter') {
      queryList = {
        "welcome": 
          'update enrollment ' +
          'set welcomeletter = ' + postData.welcomeletter + ' ' +
          'where term = "' + postData.term + '" ' +
            'and section = "' + postData.section + '" ' +
            'and student = "' + postData.student + '" '
      }
      
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
  
  async _replaceMentorProperty(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;    

    if (postData.property == 'welcomelettersent') {
      queryList = {};
      queryList["delete"] = 
        'delete ' +
        'from mentorextra ' +
        'where userid = ' + userInfo.userId + ' ' +
          //'and term = "' + postData.term + '" ' +
          'and section = "' + postData.section + '" ' +
          'and name = "' + postData.name + '" ';
      
      if (postData.welcomelettersent) {
        queryList["insert"] =  
          'insert ' +
          'into mentorextra (userid, term, section, name, welcomelettersent) ' + 
          'values (' + 
            userInfo.userId + ', ' +
            '"' + postData.term + '", ' +
            '"' + postData.section + '", ' +
            '"' + postData.name + '", ' +
            '1' +
          ') ';
      }
      
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
  
  async _removeTermData(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    if (userInfo.privilegeId > 1) {
      result.details = 'insufficient privileges';
      return result;
    }

    
    queryList = {
      "mentorextra": 
        'delete from mentorextra ' +
        'where term = "' + postData.term + '" ',

      "iep": 
        'delete from iep ' +
        'where term = "' + postData.term + '" ',

      "504": 
        'delete from student504 ' +
        'where term = "' + postData.term + '" ',

      "homeschooled": 
        'delete from homeschooled ' +
        'where term = "' + postData.term + '" ',

      "mentor": 
        'delete from mentor ' +
        'where term = "' + postData.term + '" ',

      "guardian": 
        'delete from guardian ' +
        'where term = "' + postData.term + '" ',

      "enrollment": 
        'delete from enrollment ' +
        'where term = "' + postData.term + '" ',
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
  
  async _infodeckGetData(params, postData) {
    var result = this._dbManager.queryFailureResult(); 
    
    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }
    
    var rosterResult = await this._getRosterInfo(null, null, {"userId": userId});
    if (!rosterResult.success) {
      result.details = rosterResult.details;
      return result;
    }
    
    var propertiesResult = await this._getStudentProperties(null, null, {"userId": userId});
    if (!propertiesResult.success) {
      result.details = propertiesResult.details;
      return result;
    }
    
    var mentorExtraResult = await this._getMentorProperties(null, null, {"userId": userId});
    if (!mentorExtraResult.success) {
      result.details = mentorExtraResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {
      "rosterinfo": rosterResult.data,
      "studentproperties": propertiesResult.data,
      "mentorproperties": mentorExtraResult.data.mentorextra
    }
    
    return result;
  }
  
  async _infodeckUpdatePreferredName(params, postData) {
    var result = this._dbManager.queryFailureResult(); 
    
    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }

    var updateResult = await this._replaceStudentProperty(
      { "app": 'roster-manager', "queryName": 'student-property' },
      {
        "student": postData.student,
        "property": 'preferredname',
        "value": postData.preferredname
      },
      {"userId": userId}
    );
    
    if (!updateResult.success) {
      result.details = updateResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = postData;
    
    return result;
  }

  async _infodeckUpdatePronouns(params, postData) {
    var result = this._dbManager.queryFailureResult(); 
    
    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }

    var updateResult = await this._replaceStudentProperty(
      { "app": 'roster-manager', "queryName": 'student-property' },
      {
        "student": postData.student,
        "property": 'pronouns',
        "value": postData.pronouns
      },
      {"userId": userId}
    );
    
    if (!updateResult.success) {
      result.details = updateResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = postData;
    
    return result;
  }

  async _infodeckAddNote(params, postData) {
    var result = this._dbManager.queryFailureResult(); 
    
    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }

    var updateResult = await this._addStudentNote(
      { "app": 'roster-manager', "queryName": 'student-note' },
      {
        "student": postData.student,
        "notetext": postData.notetext,
        "datestamp": postData.datestamp
      },
      {"userId": userId}
    );
    
    if (!updateResult.success) {
      result.details = updateResult.details;
      return result;
    }

    var propertiesResult = await this._getNotesForStudent(userId, postData.student);
    if (!propertiesResult.success) {
      result.details = propertiesResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = propertiesResult.data;
    
    return result;
  }

  async _infodeckUpdateNote(params, postData) {
    var result = this._dbManager.queryFailureResult(); 

    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }

    var updateResult = await this._updateStudentNote(
      { "app": 'roster-manager', "queryName": 'student-note' },
      {
        "noteid": postData.noteid,
        "student": postData.student,
        "notetext": postData.notetext,
        "datestamp": postData.datestamp        
      },
      {"userId": userId}
    );
    
    if (!updateResult.success) {
      result.details = deleteResult.details;
      return result;
    }

    var propertiesResult = await this._getNotesForStudent(userId, postData.student);
    if (!propertiesResult.success) {
      result.details = propertiesResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = propertiesResult.data;
    
    return result;
  }

  async _infodeckDeleteNote(params, postData) {
    var result = this._dbManager.queryFailureResult(); 
    
    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }

    var deleteResult = await this._deleteStudentNote(
      { "app": 'roster-manager', "queryName": 'student-note' },
      {
        "noteid": postData.noteid
      },
      {"userId": userId}
    );
    
    if (!deleteResult.success) {
      result.details = deleteResult.details;
      return result;
    }

    var propertiesResult = await this._getNotesForStudent(userId, postData.student);
    if (!propertiesResult.success) {
      result.details = propertiesResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = propertiesResult.data;
    
    return result;
  }

  async _infodeckReplaceMentorProperty(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var userId = await this._getUserIdFromAccessKey(postData.accesskey);
    if (!userId) {
      result.details = 'invalid access key';
      return result;
    }
    
    var dbResult = await this._replaceMentorProperty(null, postData, {"userId": userId});
    if (!dbResult.success) {
      result.details = dbResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = dbResult.data;
    
    return result;
  }
  
  async _getUserIdFromAccessKey(accesskey) {
    var query, queryResults;
    
    var query =
      'select ' + 
        'a.userid ' +
      'from accesskey as a ' +
      'where a.accesskey = "' + accesskey + '"';
       
    queryResults = await this._dbManager.dbQuery(query);
    
    var userId = null;
    if (queryResults.success  && queryResults.data.length == 1) userId = queryResults.data[0].userid;
    
    return userId;
  }
  
  async _getNotesForStudent(userId, student) {
    var query = 
      'select n.noteid, n.studentname, n.datestamp, n.notetext ' +
      'from note as n ' +
      'where n.userid = ' + userId + ' ' +
        'and n.studentname = "' + student + '" ';
      'order by n.datestamp ';

    return this._dbManager.dbQuery(query);      
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

  _formatNameFromMentorReport(origName, nameType, firstName, lastName) {
    /*
    var name = origName;
    
    var splitName = name.split(' ');
    if (splitName.length == 2) {
      name = splitName[1].trim() + ', ' + splitName[0].trim();
      
    } else if (splitName.length == 3) {
      if (splitName[1].trim() == '') {
        name = splitName[2].trim() + ', ' + splitName[0].trim();
      } else {
        name = splitName[2].trim() + ', ' + splitName[0].trim() + ' ' + splitName[1].trim();
      }
      
    } else if (splitName.length == 4) {
      name = splitName[3].trim() + ', ' + splitName[0].trim() + ' ' + splitName[1].trim() + ' ' + splitName[2].trim();
      
    } else if (splitName.length == 5) {
      name = splitName[1].trim() + ' ' + splitName[2].trim() + ' ' + splitName[3].trim() + ' ' + splitName[4] + ', ' + splitName[0];
    }
    */
    
    var name = lastName.trim() + ', ' + firstName.trim();
    
    return name;
  }
    
  _formatMentorEmail(origEmail) {
    var email = origEmail.replace('_MENTOR', '');
    
    return email;
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
  
  _formatDate(theDate) {
    if (typeof theDate == 'string') return theDate;
    
    var y = String(theDate.getFullYear()).padStart(4, '0');
    var m = String(theDate.getMonth() + 1).padStart(2, '0');
    var d = String(theDate.getDate()).padStart(2, '0');
    
    return y + '-' + m + '-' + d;
  }  
}
