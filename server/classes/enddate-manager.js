"use strict";
//---------------------------------------------------------------
// server-side for End date manager
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.EndDateManager = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
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
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'configuration') {
      dbResult = await this._getConfiguration(params, postData, userInfo);
     
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'eventoverride') {
      dbResult = await this._insertEventOverride(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'eventoverride') {
      dbResult = await this._updateEventOverride(params, postData, userInfo);
    
    } else if (params.queryName == 'notification') {
      dbResult = await this._updateNotificationInfo(params, postData, userInfo);

    } else if (params.queryName == 'calendar') {
      dbResult = await this._updateCalendarInfo(params, postData, userInfo);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'eventoverride') {
      dbResult = await this._deleteEventOverride(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// public: enrollment file upload
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

//---------------------------------------------------------------
// public: export to Excel
//---------------------------------------------------------------  
  exportToExcel(req, res, callback) {
    var thisObj = this;

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._failureCallback(req, res, 'error in form.parse: ' + JSON.stringify(err), callback);
        return;
      }
      
      if (!fields.hasOwnProperty('export-data')) {
        thisObj._failureCallback(req, res, 'missing export data field', callback);
        return;
      }
      
      var exportData = JSON.parse(fields['export-data']);
      
      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      workbook.clearThemes();
      
      var sheet = workbook.addWorksheet('end dates');
      sheet.columns = [ 
        {width: 32}, 
        {width: 58}, 
        {width: 20, style: {alignment: {horizontal: 'center'}}}, 
        {width: 20, style: {alignment: {horizontal: 'center'}}}, 
        {width: 12, style: {alignment: {horizontal: 'center'}}} 
      ];
      sheet.addRow(['student', 'section', 'end date', 'enrollment end date', 'override']);
      sheet.getRow(1).font = {bold: true};
      sheet.getRow(1).fill = {type: 'pattern', pattern:'solid', fgColor:{argb:'CCCCCCCC'}};
      
      for (var i = 0; i < exportData.length; i++) {
        var item = exportData[i];
        sheet.addRow([
          item.student,
          item.section,
          item.enddate,
          item.enrollmentenddate,
          item.override ? '☑' : ''
        ]);
      }
      
      thisObj._successCallback(req, res, 'success', workbook, 'end-date-manager-export.xlsx', callback);      
   });
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getConfiguration(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    var configurationId = await this._getConfigurationIdForUser(userInfo);
    
    if (!configurationId) {
      query = 'call add_default_configuration(' + userInfo.userId + ')';
      
      queryResults = await this._dbManager.dbQuery(query);
      
      if (!queryResults.success) {
        result.details = queryResult.details;
        return result;
      }
      
      configurationId = queryResults.data[0][0].configurationid;
    }
    
    var queryList = {
      'configuration': 
        'select ' +
          'a.calendarid, a.emailnotification, a.emailnotificationminutes, a.popupnotification, a.popupnotificationminutes ' +
        'from configuration as a ' +
        'where configurationid = ' + configurationId,
        
      'eventoverride': 
        'select ' +
          'a.eventoverrideid, a.student, a.section, a.enddate, a.notes ' +
        'from eventoverride as a ' +
        'where a.configurationid = ' + configurationId
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
  
  async _insertEventOverride(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var query, queryResults;
    
    var configurationId = await this._getConfigurationIdForUser(userInfo);
    if (!configurationId) return result;
    
    query = 
      'insert into eventoverride(' +
        'configurationid, student, section, enddate, notes' +
       ') values (' +
         configurationId + ', ' +
         '"' + postData.student + '", ' +
         '"' + postData.section + '", ' +
         '"' + postData.enddate + '", ' +
         '"' + postData.notes + '"' +
       ')';
       
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }    
    
    return result;
  }  

  async _updateEventOverride(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var query, queryResults;
    
    var configurationId = await this._getConfigurationIdForUser(userInfo);
    if (!configurationId) return result;
    
    query = 
      'update eventoverride set ' +
        'enddate="' + postData.enddate + '", ' +
        'notes="' + postData.notes + '" ' +
      'where eventoverrideid=' + postData.overrideid;
       
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }    
    
    return result;
  }  

  async _deleteEventOverride(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var query, queryResults;
    
    var configurationId = await this._getConfigurationIdForUser(userInfo);
    if (!configurationId) return result;
    
    query = 
      'delete from eventoverride ' +
      'where eventoverrideid=' + postData.overrideid;
       
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }    
    
    return result;
  }  

  async _updateNotificationInfo(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var query, queryResults;
    
    var configurationId = await this._getConfigurationIdForUser(userInfo);
    if (!configurationId) return result;

    query = 
      'update configuration ' +
      'set ' +
        'emailnotification=' + (postData.emailnotification ? '1' : '0') + ', ' +
        'emailnotificationminutes=' + postData.emailnotificationminutes + ', ' +
        'popupnotification=' + (postData.popupnotification ? '1' : '0') + ', ' +
        'popupnotificationminutes=' + postData.popupnotificationminutes + ' ' +
      'where configurationid=' + configurationId;

    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }    
    
    return result;
  }  

  async _updateCalendarInfo(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var query, queryResults;

    var configurationId = await this._getConfigurationIdForUser(userInfo);
    if (!configurationId) return result;

    query = 
      'update configuration ' +
      'set ' +
        'calendarid="' + postData.calendarid + '" ' +
      'where configurationid=' + configurationId;

    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }    
    
    return result;
  }  

//---------------------------------------------------------------
// support queries
//--------------------------------------------------------------- 
  async _getConfigurationIdForUser(userInfo) {
    var query, queryResults;
    
    query = 
      'select a.configurationid ' +
      'from configuration as a ' +
      'where userid = ' + userInfo.userId;
      
    queryResults = await this._dbManager.dbQuery(query);   
    
    if (!queryResults.success || queryResults.data.length == 0) return null;
    return queryResults.data[0].configurationid;
  }

//---------------------------------------------------------------
// spreadsheet processing
//--------------------------------------------------------------- 
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
  
  _failureCallback(req, res, errorDescription, callback) {
    var result = {
      sucess: false,
      description: errorDescription,
      workbook: null,
      targetfilename: ''
    };
    
    callback(req, res, result);
  }
  
  _successCallback(req, res, message, workbookToSend, targetFileName, callback) {
    var result = {
      success: true,
      description: message,
      workbook: workbookToSend,
      targetfilename: targetFileName
    };
    
    callback(req, res, result);
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
