"use strict";
//---------------------------------------------------------------
// server-side for roster manager 
//---------------------------------------------------------------
// TODO: optionally strip _MENTOR from emails?
//---------------------------------------------------------------
const internal = {};

module.exports = internal.RosterManager = class {
  constructor(params) {
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
    
    this._tempDir = 'temp';
    
    this.colMentor_Student = 'Student_Name';
    this.colMentor_Section = 'Section_Name';
    this.colMentor_Term = 'Term_Name';
    this.colMentor_Mentor = 'Mentor/Guardian';
    this.colMentor_Email = 'Mentor Email';    
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res, callback) {
    var thisObj = this;
    var formName = req.params.formname;

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._failureCallback(req, res, 'error in form.parse: ' + JSON.stringify(err), callback);
        return;
      }

      var filePath;
      if (formName == 'mentor') {
        filePath = files['mentor-report-file'].path;        
      }

      if (!filePath) {
        thisObj._failureCallback(req, res, 'unrecognized request: ' + formName, callback);
        return;
      }

      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(filePath);
      workbook.clearThemes();
      
      if (formName == 'mentor') {
        thisObj._processMentorForm(req, res, workbook, fields, callback);
      }
    });
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
  
//------------------------------------------------------------------------------
// mentor report processing
//------------------------------------------------------------------------------
  _processMentorForm(req, res, workbook, fields, callback) {
    var thisObj = this;    
    var worksheet = workbook.getWorksheet(1);

    var requiredColumns = new Set([this.colMentor_Student, this.colMentor_Section, this.colMentor_Term, this.colMentor_Mentor, this.colMentor_Email]);
    var validate = this._verifyHeaderRow(worksheet.getRow(1), requiredColumns);
    if (!validate.success) {
      this._failureCallback(req, res, 'one or more expected columns is missing', callback);
      return;
    }
    
    var columnMapping = validate.columnInfo;
    
    var mentorData = this._collateMentorInfoByStudent(worksheet, columnMapping);
    this._addMentorsByStudentSheet(workbook, mentorData);
    
    mentorData = this._collateMentorInfoBySection(worksheet, columnMapping);
    this._addMentorsBySectionSheet(workbook, mentorData);
        
    this._successCallback(req, res, 'success', workbook, 'mentor-info.xlsx', callback);
  }
  
  _collateMentorInfoByStudent(worksheet, columnMapping) {
    var thisObj = this;      
    var mentorData = {};
    
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber != 1) {
        var student = row.getCell(columnMapping[thisObj.colMentor_Student]).value;
        student = thisObj._formatStudentName(student);
        if (!mentorData.hasOwnProperty(student)) {
          mentorData[student] = {};
        }
        
        var objStudent = mentorData[student];
        var term = row.getCell(columnMapping[thisObj.colMentor_Term]).value;
        if (!objStudent.hasOwnProperty(term)) {
          objStudent[term] = {};
        }
        
        var objStudentTerm = objStudent[term];
        var section = row.getCell(columnMapping[thisObj.colMentor_Section]).value;
        if (!objStudentTerm.hasOwnProperty(section)) {
          objStudentTerm[section] = [];
        }
        
        var arrStudentTermSection = objStudentTerm[section];
        arrStudentTermSection.push({
          mentorname: row.getCell(columnMapping[thisObj.colMentor_Mentor]).value,
          mentoremail: row.getCell(columnMapping[thisObj.colMentor_Email]).value,
        });        
      }
    });
    
    return mentorData;
  }
  
  _collateMentorInfoBySection(worksheet, columnMapping) {
    var thisObj = this;      
    var mentorData = {};
    
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber != 1) {
        var term = row.getCell(columnMapping[thisObj.colMentor_Term]).value;
        if (!mentorData.hasOwnProperty(term)) mentorData[term] = {};
        
        var objTerm = mentorData[term];
        var section = row.getCell(columnMapping[thisObj.colMentor_Section]).value;
        if (!objTerm.hasOwnProperty(section)) objTerm[section] = {mentorArray: []};
        
        var objSection = objTerm[section];
        var mentorName = row.getCell(columnMapping[thisObj.colMentor_Mentor]).value;
        var mentorEmail = row.getCell(columnMapping[thisObj.colMentor_Email]).value;
        objSection.mentorArray.push({name: mentorName, email: mentorEmail});            
      }
    });
    
    for (var term in mentorData) {
      var objTerm = mentorData[term];
      for (var section in objTerm) {
        var objSection = objTerm[section];
        
        var mentorSet = new Set();
        var emailSet = new Set();
        for (var i = 0; i < objSection.mentorArray.length; i++) {
          var mentor = objSection.mentorArray[i];
          mentorSet.add(mentor.name + '|' + mentor.email);
          emailSet.add(mentor.email);
        }
        
        var arrMentor = [];
        mentorSet.forEach(function(item, index) {
          var splitMentor = item.split('|');
          arrMentor.push({name: splitMentor[0], email: splitMentor[1]});
        });
        objSection.mentorArray = arrMentor;

        var combinedEmails = '';
        emailSet.forEach(function(item, index) {
          combinedEmails += item + ';';
        });
        objSection.combinedemail = combinedEmails;
      }
    }
    
    return mentorData;
  }
  
  _addMentorsByStudentSheet(workbook, mentorData) {
    var sheet = workbook.addWorksheet('mentors by student');
    sheet.columns = [ {width: 28}, {width: 35}, {width: 40}, {width: 18}, {width: 22}, {width: 35} ];
    sheet.addRow(['student', 'term', 'section', 'combined emails', 'mentor', 'email', 'additional...']);
    sheet.getRow(1).font = {bold: true};
    sheet.getRow(1).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};
    
    for (var student in mentorData) {
      var objStudent = mentorData[student];
      for (var term in objStudent) {
        var objTerm = objStudent[term];
        for (var section in objTerm) {

          var mentors = objTerm[section];
          var mentorRowData = [];
          var combinedEmails = '';
          for (var i = 0; i < mentors.length; i++) {
            mentorRowData.push(mentors[i].mentorname);
            mentorRowData.push(mentors[i].mentoremail);
            combinedEmails += mentors[i].mentoremail + ';';
          }
          
          var rowData = [student, term, section, combinedEmails];
          rowData = rowData.concat(mentorRowData);
          sheet.addRow(rowData);
        }
      }
    }
  }
  
  _addMentorsBySectionSheet(workbook, mentorData) {
    var sheet = workbook.addWorksheet('mentors by section');
    sheet.columns = [ {width: 50}, {width: 35} ];
    
    for (var term in mentorData) {
      var objTerm = mentorData[term];
      sheet.addRow([term]);
      sheet.getRow(sheet.rowCount).font = {bold: true};
      sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};
      
      for (var section in objTerm) {
        var objSection = objTerm[section];
        sheet.addRow([section, objSection.combinedemail]); 
        sheet.getRow(sheet.rowCount).getCell(1).font = {bold: true};
        
        for (var i = 0; i < objSection.mentorArray.length; i++) {
          var mentor = objSection.mentorArray[i];
          sheet.addRow([ mentor.name, mentor.email]);
        }

        sheet.addRow(['']);
      }
    }
  }

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
}
