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
    this.colMentor_Role = 'Role';
    this.colMentor_Mentor = 'Mentor/Guardian';
    this.colMentor_Email = 'Mentor Email';
    
    this.colEnrollment_Student = 'Student';
    this.colEnrollment_Section = 'Section';
    this.colEnrollment_Email = 'StudentEmail';
    this.colEnrollment_StartDate = 'StartDate';
    this.colEnrollment_EndDate = 'EndDate';
    this.colEnrollment_Affiliation = 'Affiliation';
    this.colEnrollment_Term = 'LMSTerm';
    
    this.tabname = {
      mentorsByStudent: 'mentors by student',
      guardiansByStudent: 'guardians by student',
      mentorsBySection: 'mentors by section',
      mentorcomparison: 'new-old comparison',
      
      enrollment: 'enrollments',
      enrollmentcomparison: 'new-old comparison'
    };
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
      var filePathCompare;
      var fileName;
      var fileNameCompare;
      
      if (formName == 'mentor') {
        filePath = files['mentor-report-file'].path;
        fileName = files['mentor-report-file'].name;
        
        var fileCompare = files['mentor-report-file2' ];
        if (fileCompare && fileCompare.name != '') {
          filePathCompare = fileCompare.path;
          fileNameCompare = fileCompare.name;
        }

      } else if (formName == 'enrollment') {
        filePath = files['enrollment-report-file'].path;
        fileName = files['enrollment-report-file'].name;
        
        var fileCompare = files['enrollment-report-file2' ];
        if (fileCompare && fileCompare.name != '') {
          filePathCompare = fileCompare.path;
          fileNameCompare = fileCompare.name;
        }
      }

      if (!filePath) {
        thisObj._failureCallback(req, res, 'unrecognized request: ' + formName, callback);
        return;
      }

      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(filePath);
      workbook.clearThemes();
      
      var workbookCompare;
      if (filePathCompare) {
        workbookCompare = new exceljs.Workbook();
        await workbookCompare.xlsx.readFile(filePathCompare);
      }
      
      if (formName == 'mentor') {
        thisObj._processMentorForm(req, res, workbook, workbookCompare, fileName, fileNameCompare, fields, callback);
        
      } else if (formName == 'enrollment') {
        thisObj._processEnrollmentForm(req, res, workbook, workbookCompare, fileName, fileNameCompare, fields, callback);
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
  _processMentorForm(req, res, workbook, workbookCompare, filename, filenamecompare, fields, callback) {
    var thisObj = this;    
    var worksheet = workbook.getWorksheet(1);

    var requiredColumns = new Set([
      this.colMentor_Student, 
      this.colMentor_Section, 
      this.colMentor_Term, 
      this.colMentor_Role,
      this.colMentor_Mentor, 
      this.colMentor_Email
    ]);
    
    var validate = this._verifyHeaderRow(worksheet.getRow(1), requiredColumns);
    if (!validate.success) {
      this._failureCallback(req, res, 'one or more expected columns is missing', callback);
      return;
    }
    
    var columnMapping = validate.columnInfo;
    
    var mentorData = this._collateMentorInfoByStudent(worksheet, columnMapping);
    this._addMentorsByStudentSheet(workbook, mentorData);
    this._addGuardiansByStudentSheet(workbook, mentorData);
    
    mentorData = this._collateMentorInfoBySection(worksheet, columnMapping);
    this._addMentorsBySectionSheet(workbook, mentorData);
    
    if (workbookCompare) {
      var worksheetCompare = workbookCompare.getWorksheet(1);
      
      var validate = this._verifyHeaderRow(worksheetCompare.getRow(1), requiredColumns);
      if (!validate.success) {
        this._failureCallback(req, res, 'one or more expected columns is missing on comparison sheet', callback);
        return;
      }
      
      var mentorDataToCompare = this._collateMentorInfoBySection(worksheetCompare, columnMapping);
      var mentorBySectionDifferences = this._collateMentorBySectionDifferences(mentorData, mentorDataToCompare);
      this._addMentorComparison(workbook, worksheet, worksheetCompare, filename, filenamecompare, columnMapping, mentorBySectionDifferences);
    }
        
    this._successCallback(req, res, 'success', workbook, 'collated-mentor-guardian-report.xlsx', callback);
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
          objStudentTerm[section] = {mentor: [], guardian: []};
        }
        
        var arrStudentTermSectionMentor = objStudentTerm[section].mentor;
        var arrStudentTermSectionGuardian = objStudentTerm[section].guardian;

        var role = row.getCell(columnMapping[thisObj.colMentor_Role]).value;
        if (role == 'MENTOR') {
          arrStudentTermSectionMentor.push({
            mentorname: row.getCell(columnMapping[thisObj.colMentor_Mentor]).value,
            mentoremail: row.getCell(columnMapping[thisObj.colMentor_Email]).value,
          });        

        } else if (role == 'GUARDIAN') {
          arrStudentTermSectionGuardian.push({
            guardianname: row.getCell(columnMapping[thisObj.colMentor_Mentor]).value,
            guardianemail: row.getCell(columnMapping[thisObj.colMentor_Email]).value,
          });        
        }
      }
    });
    
    return mentorData;
  }
  
  _collateMentorInfoBySection(worksheet, columnMapping) {
    var thisObj = this;      
    var mentorData = {};
    
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      var role = row.getCell(columnMapping[thisObj.colMentor_Role]).value;
      if (rowNumber != 1 && role == 'MENTOR') {
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
  
  _collateMentorBySectionDifferences(mentorDataNew, mentorDataOld) {    
    var result = { added: [], removed: [] };
    
    var mentorSetNew = new Set();
    for (var term in mentorDataNew) {
      for (var section in mentorDataNew[term]) {
        for (var i = 0; i < mentorDataNew[term][section].mentorArray.length; i++) {
          var mentorName = mentorDataNew[term][section].mentorArray[i].name;
          mentorSetNew.add( [term, section, mentorName].join('~|~') );
        }
      }
    }

    var mentorSetOld = new Set();
    for (var term in mentorDataOld) {
      for (var section in mentorDataOld[term]) {
        for (var i = 0; i < mentorDataOld[term][section].mentorArray.length; i++) {
          var mentorName = mentorDataOld[term][section].mentorArray[i].name;
          mentorSetOld.add( [term, section, mentorName].join('~|~') );
        }
      }
    }
    
    var difference1 = new Set(
      [...mentorSetNew].filter(x => !mentorSetOld.has(x)));

    var difference2 = new Set(
      [...mentorSetOld].filter(x => !mentorSetNew.has(x)));

    difference1.forEach(function(item ,index) {
      result.added.push(item.split('~|~'));
    });
    difference2.forEach(function(item, index) {
      result.removed.push(item.split('~|~'));
    });

    return result;
  }
  
  _addMentorsByStudentSheet(workbook, mentorData) {
    var sheet = this._createOrReplaceSheet(workbook, this.tabname.mentorsByStudent);
    
    // convert mentorData to array and sort by student, term, section
    var arrMentorData = [];
    for (var student in mentorData) {
      var objStudent = mentorData[student];

      for (var term in objStudent) {
        var objTerm = objStudent[term];

        for (var section in objTerm) {
          var mentors = objTerm[section].mentor;
          var mentorRowData = [];

          for (var i = 0; i < mentors.length; i++) {
            mentorRowData.push(mentors[i].mentorname);
            mentorRowData.push(mentors[i].mentoremail);
          }
          
          arrMentorData.push([student, term, section].concat(mentorRowData));
        }
      }
    }
    
    arrMentorData = arrMentorData.sort(function(a, b) {
      var compare = a[0].localeCompare(b[0]);
      if (compare != 0) return compare;

      var compare = a[1].localeCompare(b[1]);
      if (compare != 0) return compare;

      return a[2].localeCompare(b[2]);
    });
    
    sheet.columns = [ {width: 28}, {width: 35}, {width: 40}, {width: 18}, {width: 33}, {width: 18} ];
    sheet.addRow(['student', 'term', 'section', 'mentor', 'email', 'additional...']);
    sheet.getRow(1).font = {bold: true};
    sheet.getRow(1).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    for (var i = 0; i < arrMentorData.length; i++) {
      sheet.addRow(arrMentorData[i]);
    }
  }
  
  _addGuardiansByStudentSheet(workbook, mentorData) {
    var sheet = this._createOrReplaceSheet(workbook, this.tabname.guardiansByStudent);
    
    // convert mentorData to array and sort by student, term, section
    var arrGuardianData = [];
    for (var student in mentorData) {
      var objStudent = mentorData[student];

      for (var term in objStudent) {
        var objTerm = objStudent[term];

        for (var section in objTerm) {
          var guardians = objTerm[section].guardian;
          var guardianRowData = [];

          for (var i = 0; i < guardians.length; i++) {
            guardianRowData.push(guardians[i].guardianname);
            guardianRowData.push(guardians[i].guardianemail);
          }
          
          arrGuardianData.push([student, term, section].concat(guardianRowData));
        }
      }
    }
    
    arrGuardianData = arrGuardianData.sort(function(a, b) {
      var compare = a[0].localeCompare(b[0]);
      if (compare != 0) return compare;

      var compare = a[1].localeCompare(b[1]);
      if (compare != 0) return compare;

      return a[2].localeCompare(b[2]);
    });
    
    sheet.columns = [ {width: 28}, {width: 35}, {width: 40}, {width: 18}, {width: 33}, {width: 18} ];
    sheet.addRow(['student', 'term', 'section', 'guardian', 'email', 'additional...']);
    sheet.getRow(1).font = {bold: true};
    sheet.getRow(1).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    for (var i = 0; i < arrGuardianData.length; i++) {
      sheet.addRow(arrGuardianData[i]);
    }
  }

  _addMentorsBySectionSheet(workbook, mentorData) {
    var sheet = this._createOrReplaceSheet(workbook, this.tabname.mentorsBySection);
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
        
        objSection.mentorArray = objSection.mentorArray.sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });

        for (var i = 0; i < objSection.mentorArray.length; i++) {
          var mentor = objSection.mentorArray[i];
          sheet.addRow([ mentor.name, mentor.email]);
        }


        sheet.addRow(['']);
      }
    }
  }
  
  _addMentorComparison(workbook, wsNew, wsOld, filenameNew, filenameOld, columnMapping, mentorBySectionDifferences) {
    var newMentorData = new Set(this._stringifyMentorData(wsNew, columnMapping));
    var oldMentorData = new Set(this._stringifyMentorData(wsOld, columnMapping));
    
    var difference1 = new Set(
      [...newMentorData].filter(x => !oldMentorData.has(x)));

    var difference2 = new Set(
      [...oldMentorData].filter(x => !newMentorData.has(x)));
      
    var arr1 = this._unstringifyMentorData(difference1);
    var arr2 = this._unstringifyMentorData(difference2);

    var sheet = this._createOrReplaceSheet(workbook, this.tabname.mentorcomparison);
    sheet.columns = [ {width: 45}, {width: 50}, {width: 25}, {width: 12}, {width: 25} ];

    // additions (by student)    
    sheet.addRow(['Additions (by student)', 'records in ' + filenameNew + ' but not in ' + filenameOld]);
    sheet.getRow(sheet.rowCount).font = {size: 12, bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.addRow(['term', 'section', 'student', 'role', 'name']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    for (var i = 0; i < arr1.length; i++) {
      var item = arr1[i];
      sheet.addRow([item.term, item.section, item.student, item.role, item.name]);
    }

    sheet.addRow(['']);

    // removals (by student)
    sheet.addRow(['Removals (by student)', 'records in ' + filenameOld + ' but not in ' + filenameNew]);
    sheet.getRow(sheet.rowCount).font = {size: 12, bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.addRow(['term', 'section', 'student', 'mentor']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    for (var i = 0; i < arr2.length; i++) {
      var item = arr2[i];
      sheet.addRow([item.term, item.section, item.student, item.mentor]);
    }

    sheet.addRow(['']);

    // additions (by mentor)
    sheet.addRow(['Additions (by mentor)', 'records in ' + filenameNew + ' but not in ' + filenameOld]);
    sheet.getRow(sheet.rowCount).font = {size: 12, bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.addRow(['term', 'section', 'mentor']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};
    for (var i = 0; i < mentorBySectionDifferences.added.length; i++) {
      sheet.addRow(mentorBySectionDifferences.added[i]);
    }

    sheet.addRow(['']);

    // removals (by mentor)
    sheet.addRow(['Removals (by mentor)', 'records in ' + filenameOld + ' but not in ' + filenameNew]);
    sheet.getRow(sheet.rowCount).font = {size: 12, bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.addRow(['term', 'section', 'mentor']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};
    for (var i = 0; i < mentorBySectionDifferences.removed.length; i++) {
      sheet.addRow(mentorBySectionDifferences.removed[i]);
    }
  }
  
  _stringifyMentorData(worksheet, columnMapping) {
    var thisObj = this;      
    var mentorData = [];
    
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber != 1) {
        var student = row.getCell(columnMapping[thisObj.colMentor_Student]).value;
        var term = row.getCell(columnMapping[thisObj.colMentor_Term]).value;
        var section = row.getCell(columnMapping[thisObj.colMentor_Section]).value;
        var role = row.getCell(columnMapping[thisObj.colMentor_Role]).value;
        var name = row.getCell(columnMapping[thisObj.colMentor_Mentor]).value;
        
        mentorData.push(student + '~|~' + term + '~|~' + section + '~|~' + role + '~|~' + name);
        
      }
    });
    
    return mentorData;
  }  
  
  _unstringifyMentorData(mentorData) {
    var arrMentorData = [];
    
    mentorData.forEach(function(item, index) {
      var splitData = item.split('~|~');
      arrMentorData.push({
        student: splitData[0],
        term: splitData[1],
        section: splitData[2],
        role: splitData[3],
        name: splitData[4]
      });
    });
    
    arrMentorData = arrMentorData.sort(function(a, b) {
      var compare = a.term.localeCompare(b.term);
      if (compare != 0) return compare;

      compare = a.section.localeCompare(b.section);
      if (compare != 0) return compare;

      compare = a.student.localeCompare(b.student);
      if (compare != 0) return compare;
      
      compare = a.role.localeCompare(b.role);
      if (compare != 0) return compare;
      
      return a.name.localeCompare(b.name);
    });
    
    return arrMentorData;
  }
  
//------------------------------------------------------------------------------
// enrollment report processing
//------------------------------------------------------------------------------
  _processEnrollmentForm(req, res, workbook, workbookCompare, filename, filenamecompare, fields, callback) {
    var thisObj = this;    
    var worksheet = workbook.getWorksheet(1);

    var requiredColumns = new Set([
      this.colEnrollment_Student, 
      this.colEnrollment_Section, 
      this.colEnrollment_Email, 
      this.colEnrollment_StartDate, 
      this.colEnrollment_EndDate, 
      this.colEnrollment_Affiliation,
      this.colEnrollment_Term
    ]);
    
    var validate = this._verifyHeaderRow(worksheet.getRow(1), requiredColumns);
    if (!validate.success) {
      this._failureCallback(req, res, 'one or more expected columns is missing', callback);
      return;
    }
    
    var columnMapping = validate.columnInfo;

    var enrollmentData = this._collateEnrollmentInfo(worksheet, columnMapping);
    this._addEnrollmentSheet(workbook, enrollmentData);

    if (workbookCompare) {
      var worksheetCompare = workbookCompare.getWorksheet(1);

      var validate = this._verifyHeaderRow(worksheetCompare.getRow(1), requiredColumns);
      if (!validate.success) {
        this._failureCallback(req, res, 'one or more expected columns is missing on comparison sheet', callback);
        return;
      }

      this._addEnrollmentComparison(workbook, worksheet, worksheetCompare, filename, filenamecompare, columnMapping);
    }

    this._successCallback(req, res, 'success', workbook, 'collated-enrollment-report.xlsx', callback);
  }
  
  _collateEnrollmentInfo(worksheet, columnMapping) {
    var thisObj = this;
    var enrollmentData = [];
    
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber != 1) {
        enrollmentData.push({
          student:     row.getCell( columnMapping[thisObj.colEnrollment_Student] ).value,
          term:        row.getCell( columnMapping[thisObj.colEnrollment_Term] ).value,
          section:     row.getCell( columnMapping[thisObj.colEnrollment_Section] ).value,
          startdate:   row.getCell( columnMapping[thisObj.colEnrollment_StartDate] ).value,
          enddate:     row.getCell( columnMapping[thisObj.colEnrollment_EndDate] ).value,
          affiliation: row.getCell( columnMapping[thisObj.colEnrollment_Affiliation] ).value,
          email:       row.getCell( columnMapping[thisObj.colEnrollment_Email] ).value
        });
      }
    });
    
    enrollmentData = enrollmentData.sort(function(a, b) {
      var compare = a.student.localeCompare(b.student);
      if (compare != 0) return compare;
      
      compare = a.term.localeCompare(b.term);
      if (compare != 0) return compare;
      
      return a.section.localeCompare(b.section);
    });
    
    return enrollmentData;
  }
  
  _addEnrollmentSheet(workbook, enrollmentData) {
    var sheet = this._createOrReplaceSheet(workbook, this.tabname.enrollment);
    sheet.columns = [ {width: 30}, {width: 30}, {width: 40}, {width: 15}, {width: 15}, {width: 35}, {width: 40} ]
    
    sheet.addRow(['student', 'term', 'section', 'startdate', 'enddate', 'affiliation', 'email']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};
    
    for (var i = 0; i < enrollmentData.length; i++) {
      var enrollment = enrollmentData[i];
      sheet.addRow([
        enrollment.student,
        enrollment.term,
        enrollment.section,
        this._formatDate(enrollment.startdate),
        this._formatDate(enrollment.enddate),
        enrollment.affiliation,
        enrollment.email
      ]);
    }
  }
  
  _addEnrollmentComparison(workbook, wsNew, wsOld, filenameNew, filenameOld, columnMapping) {
    var newEnrollmentData = new Set(this._stringifyEnrollmentData(wsNew, columnMapping));
    var oldEnrollmentData = new Set(this._stringifyEnrollmentData(wsOld, columnMapping));
        
    var difference1 = new Set(
      [...newEnrollmentData].filter(x => !oldEnrollmentData.has(x)));

    var difference2 = new Set(
      [...oldEnrollmentData].filter(x => !newEnrollmentData.has(x)));
    
    var arr1 = this._unstringifyEnrollmentData(difference1);
    var arr2 = this._unstringifyEnrollmentData(difference2);

    var sheet = this._createOrReplaceSheet(workbook, this.tabname.enrollmentcomparison);
    sheet.columns = [ {width: 30}, {width: 30}, {width: 40}, {width: 15}, {width: 15}, {width: 35}, {width: 40} ]
    
    sheet.addRow(['Additions', 'records in ' + filenameNew + ' but not in ' + filenameOld]);
    sheet.getRow(sheet.rowCount).font = {size: 12, bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.addRow(['student', 'term', 'section', 'startdate', 'enddate', 'affiliation', 'email']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    for (var i = 0; i < arr1.length; i++) {
      var item = arr1[i];
      var startDate = this._formatDate(item.startdate);
      var endDate = this._formatDate(item.enddate);
      
      sheet.addRow([item.student, item.term, item.section, startDate, endDate, item.affiliation, item.email]);
    }

    sheet.addRow(['']);

    sheet.addRow(['Removals', 'records in ' + filenameOld + ' but not in ' + filenameNew]);
    sheet.getRow(sheet.rowCount).font = {size: 12, bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    sheet.addRow(['student', 'term', 'section', 'startdate', 'enddate', 'affiliation', 'email']);
    sheet.getRow(sheet.rowCount).font = {bold: true};
    sheet.getRow(sheet.rowCount).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};

    for (var i = 0; i < arr2.length; i++) {
      var item = arr2[i];
      var startDate = this._formatDate(item.startdate);
      var endDate = this._formatDate(item.enddate);
      
      sheet.addRow([item.student, item.term, item.section, startDate, endDate, item.affiliation, item.email]);
    }
  }
  
  _stringifyEnrollmentData(worksheet, columnMapping) {
    var thisObj = this;      
    var enrollmentData = [];
    
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber != 1) {
        var student = row.getCell(columnMapping[thisObj.colEnrollment_Student]).value;
        var term = row.getCell(columnMapping[thisObj.colEnrollment_Term]).value;
        var section = row.getCell(columnMapping[thisObj.colEnrollment_Section]).value;
        var startdate = row.getCell(columnMapping[thisObj.colEnrollment_StartDate]).value;
        var enddate = row.getCell(columnMapping[thisObj.colEnrollment_EndDate]).value;
        var affiliation = row.getCell(columnMapping[thisObj.colEnrollment_Affiliation]).value;
        var email = row.getCell(columnMapping[thisObj.colEnrollment_Email]).value;
        
        enrollmentData.push(student + '~|~' + term + '~|~' + section + '~|~' + startdate + '~|~' + enddate + '~|~' + affiliation + '~|~' + email);
      }
    });
    
    return enrollmentData;
  }
  
  _unstringifyEnrollmentData(enrollmentData) {
    var arrEnrollmentData = [];
    
    enrollmentData.forEach(function(item, index) {
      var splitData = item.split('~|~');
      arrEnrollmentData.push({
        student: splitData[0],
        term: splitData[1],
        section: splitData[2],
        startdate: splitData[3],
        enddate: splitData[4],
        affiliation: splitData[5],
        email: splitData[6]
      });
    });
    
    arrEnrollmentData = arrEnrollmentData.sort(function(a, b) {
      var compare = a.term.localeCompare(b.term);
      if (compare != 0) return compare;

      compare = a.section.localeCompare(b.section);
      if (compare != 0) return compare;

      compare = a.student.localeCompare(b.student);
      if (compare != 0) return compare;
      
      return a.mentor.localeCompare(b.enddate);
    });
    
    return arrEnrollmentData;
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
