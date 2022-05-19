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
        
    // Excel column names for walkthrough data (partial - these are the first few fixed columns)
    this.colWalkthrough_Course_Section = 'Course/ Section Title';
    this.colWalkthrough_CreatedBy = 'Created By';
    this.colWalkthrough_InstructorName = 'Instructor Name';
    this._requiredColumns_Walkthrough = new Set([
      this.colWalkthrough_Course_Section,
      this.colWalkthrough_CreatedBy,
      this.colWalkthrough_InstructorName
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
    console.log('WalkthroughAnalyzer.processUploadedFile');
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
    console.log('WalkthroughAnalyzer._processExcelFile');
    var thisObj = this;

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
        "walkthrough": thisObj._processWalkthroughFile
      }
      
      if (processRoutingMap.hasOwnProperty(uploadType)) {
        processRoutingMap[uploadType](res, thisObj, worksheet, userInfo);

      } else {
        thisObj._sendFail(res, 'unrecognized upload type: ' + uploadType);
      }
    });
  }
  
  //----------------------------------------------------------------------
  // process specific Excel file
  //----------------------------------------------------------------------
  async _processWalkthroughFile(res, thisObj, worksheet, userInfo) {
    console.log('_processWalkthroughFile');
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_Walkthrough);
    if (!validate.success) {
      console.log('missing columns', validate);
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    
    var result = await thisObj._getWalkthroughCriteria();
    if (!result.success) {
      console.log('failed to retrieve walkthrough criteria');
      thisObj._sendFail(res, 'failed to retrieve walkthrough criteria');
    }
    var criteriaSet = result.data.criteriaSet;
    
    result = thisObj._packageUploadedWalkthroughValues(thisObj, worksheet, criteriaSet);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
    }
    
    console.log('uploaded walkthrough data', result.data);
    
    /*
    var result = await thisObj._postExcelData(thisObj, 'walkthrough', uploadedData, userInfo);
    if (!result.success) {
      thisObj._sendFail(res, '** failed to post walkthrough values');
      return;
    }
    */
    result.success = true;
    result.data = {"dummy": "dummy walkthrough results"};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }
  
  //-----------------------------------------------------------------
  // package data from specific uploaded file
  //-----------------------------------------------------------------
  _packageUploadedWalkthroughValues(thisObj, worksheet, criteriaSet) {
    console.log('WalkthroughAnalyzer._packageUploadedWalkthroughValues');
    console.log(criteriaSet);
    var result = {success: false, data: null};
    
    var walkthroughInfo = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      if (rowNumber == 1) {
        for (var i = 0; i < row._cells.length; i++) {
          var colTitle = row.getCell(i + 1).value;
          if (criteriaSet.has(colTitle)) {
            console.log(colTitle);
          }
        }
      }
        
      //console.log(rowNumber, row.getCell(1).value);
      /*
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
      */
    });
    
    result.success = true;
    result.data = {
      "walkthrough": walkthroughInfo
    };
    
    console.log('result', result);
    return result;
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
  
  async _getWalkthroughCriteria(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "criteria":
        'select a.criterionid, a.criteriontext, b.domainid, b.domainnumber, b.domaindescription  ' +
        'from criterion as a, domaininfo as b ' +
        'where a.domainid = b.domainid '
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var criteriaSet = new Set();
    for (var i = 0; i < queryResults.data.criteria.length; i++) {
      criteriaSet.add(queryResults.data.criteria[i].criteriontext);
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = {}
    result.data.criteria = queryResults.data.criteria;  
    result.data.criteriaSet = criteriaSet;

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
