"use strict";
//---------------------------------------------------------------
// server-side for roster manager 
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.RosterManager = class {
  constructor(params) {
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
    
    this._tempDir = 'temp';
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res, callback) {
    var thisObj = this;
    var formName = req.params.formname;
    var result = {
      success: false, 
      formname: formName,
      description: 'error in processUploadedFile',
      workbook: null
    };

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
          console.log('err in form.parse');
          console.log(err);
          result.description += ': ' + JSON.stringify(err);
          callback(req, res, result);
          return;
      }

      var filePath;
      if (formName == 'mentor') {
        filePath = files['mentor-report-file'].path;        
      }

      if (!filePath) {
        result.description = 'unrecognized request: ' + formName;
        callback(req, res, result);
        return;
      }

      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      if (formName == 'mentor') {
        thisObj._processMentorForm(req, res, result, workbook, fields, callback);
      }
    });
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------    
  _processMentorForm(req, res, result, workbook, fields, callback) {
    var worksheet = workbook.getWorksheet(1);
    var requiredColumns = new Set([
      'Student_Name',
      'Section_Name',
      'Term_Name',
      'Mentor/Guardian',
      'Mentor Email'
    ]);

    var validate = this._verifyHeaderRow(worksheet.getRow(1), requiredColumns);
    if (!validate.success) {
      result.success = false;
      result.description = 'one or more expected columns is missing';
      callback(req, res, result);
      return;
    }
    
    var columnMapping = validate.columnInfo;
    console.log(columnMapping);
    
    var row = worksheet.getRow(14);
    var cell = row.getCell(6);

    result.success = true;
    result.description = cell.value;
    result.workbook = workbook;
    
    console.log(fields);
    
    callback(req, res, result);

          /*
          var worksheet = workbook.getWorksheet(1);
          var row = worksheet.getRow(5);
          row.getCell(1).value = 5; // A5's value set to 5
          row.commit();
          return workbook.xlsx.writeFile('new.xlsx');
          */        
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
}
