"use strict";
//---------------------------------------------------------------
// server-side for End date manager
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.EndDateManager = class {
  constructor(params) {
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
    
    this._tempDir = 'temp';

    this._colStudent = 'Student';
    this._colSection = 'Section';
    this._colEndDate = 'EndDate';
    this._requiredColumns = new Set([
      this._colStudent,
      this._colSection,
      this._colEndDate
    ]);
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res) {
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
      var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns);
      if (!validate.success) {
        thisObj._sendFail(req, res, 'missing one or more required columns');
        return;
      }
      
      var packagedValues = thisObj._packageEnrollmentValues(thisObj, worksheet, validate.columnInfo);
      
      if (!packagedValues.success) {
        thisObj._sendFail(req, res, 'failed to package enrollment values');
        return;
      }
      
      thisObj._sendSuccess(req, res, 'upload succeeded', packagedValues.data);
    });
  }
  
  _packageEnrollmentValues(thisObj, worksheet, columnMapping) {
    var result = {success: false, data: null};
    
    var enrollments = [];
    worksheet.eachRow({includeEmpty: true}, function(row, rowNumber) {
      var student = row.getCell(columnMapping[thisObj._colStudent]).value;
      var section = row.getCell(columnMapping[thisObj._colSection]).value;
      var endDate = row.getCell(columnMapping[thisObj._colEndDate]).value;

     if (student != thisObj._colStudent) {
        enrollments.push({
          "student": student,
          "section": section,
          "enddate": endDate
        });
     }
    });
    
    result.success = true;
    result.data = enrollments;
    
    return result;
  } 
  
//---------------------------------------------------------------
// result send methods
//--------------------------------------------------------------- 
  _sendFail(req, res, failMessage) {
    var result = {
      sucess: false,
      details: failMessage,
      data: null
    };
    
    res.send(result);
  }
  
  _sendSuccess(req, res, successMessage, dataValues) {
    if (!dataValues) dataValues = null;
    
    var result = {
      success: true,
      details: successMessage,
      data: dataValues
    };
    
    res.send(result);
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
}
