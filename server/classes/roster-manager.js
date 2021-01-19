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
  processUploadedFile(req) {
      console.log('processUploadedFile');
      
      var form = new this._formManager.IncomingForm();
      form.parse(req, function(err, fields, files) {
          var filePath = files['roster-file'].path;
          const exceljs = require('exceljs');
          var workbook = new exceljs.Workbook();
          workbook.xlsx.readFile(filePath)
              .then(function() {
                  var worksheet = workbook.getWorksheet(1);
                  var row = worksheet.getRow(14);
                  var cell = row.getCell(6);
                  console.log(cell.value);
                  /*
                  var worksheet = workbook.getWorksheet(1);
                  var row = worksheet.getRow(5);
                  row.getCell(1).value = 5; // A5's value set to 5
                  row.commit();
                  return workbook.xlsx.writeFile('new.xlsx');
                  */
              })          
      });
      
      return true;
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------    
    
}
