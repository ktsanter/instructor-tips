//-------------------------------------------------------------------
// DataIntegrator
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class DataIntegrator {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async readCurrentSheetInfo(targetFileId) {
    var sheetsToRead = ['raw_enrollment_data', 'raw_mentor_data', 'raw_guardian_data', 'raw_iep_data', 'raw_504_data'];
    var result = await this._readSheetData(targetFileId, sheetsToRead);
    if (!result.success) return this._failResult(result.details);
    
    return result;
  }
  
  async applyReportData(reportType, reportData, targetFileId) {
    var result = await this.readCurrentSheetInfo(targetFileId);
    if (!result.success) return result;
    
    if (reportType == 'enrollment') {
      return await this._applyEnrollmentReportData(reportData, targetFileId, result.data);
      
    } else if (reportType == 'mentor') {
      return await this._applyMentorReportData(reportData, targetFileId, result.data);
      
    } else if (reportType == 'iep') {
      return await this._applyIEPReportData(reportData, targetFileId, result.data);
      
    } else if (reportType == '504') {
      return await this._apply504ReportData(reportData, targetFileId, result.data);
      
    } else {
      return {success: false, details: 'unrecognized report type: ' + reportType, data: null};
    }
  }
  
  //--------------------------------------------------------------
  // private methods - read sheet info
  //--------------------------------------------------------------   
  async _readSheetData(targetFileId, sheetsToRead) {
    const METHODNAME = 'DataIntegrator._readSheetData';
    
    var sheetDataAsObj = {};

    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return result;
    
    var sheetsInSpreadsheet = [];
    for (var i = 0; i < sheetsToRead.length; i++) {
      var sheetName = sheetsToRead[i];
      if (result.sheetSet.has(sheetName)) sheetsInSpreadsheet.push(sheetName)
      sheetDataAsObj[sheetName] = [];
    }
    
    var result = await this.config.googleDrive.getRanges(targetFileId, sheetsInSpreadsheet);
    if (!result.success) return result;
    
    var sheetData = {};
    for (var i = 0; i < sheetsInSpreadsheet.length; i++) {
      sheetData[sheetsInSpreadsheet[i]] = result.data[i].values;
    }
    
    for (var sheetKey in sheetData) {
      var singleSheet = sheetData[sheetKey];
      var objList = [];

      if (singleSheet.length > 0) {
        var headerRow = singleSheet[0];
        for (var i = 1; i < singleSheet.length; i++) {
          var objRow = {}
          for (var j = 0; j < headerRow.length; j++) {
            objRow[headerRow[j]] = singleSheet[i][j];
          }
          objList.push(objRow);
        }
      }
      
      sheetDataAsObj[sheetKey] = objList;
    }
    
    result.data = sheetDataAsObj;
    
    return result;
  }
  
  //--------------------------------------------------------------
  // private methods - apply report data
  //--------------------------------------------------------------   
  async _applyEnrollmentReportData(reportData, targetFileId, currentFileData) {
    const METHODNAME = 'DataIntegrator._applyEnrollmentReportData';
    var targetSheets = ['raw_enrollment_data'];
    
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return this._failResult(result.details);
    
    result = await this._addOrClearSheets(targetFileId, targetSheets, result.sheetSet);
    if (!result.success) return this._failResult(result.details);
    
    var enrollmentDifferences = this._packageDifferences(
      currentFileData.raw_enrollment_data, 
      reportData.enrollments,
      (item) => {return item.student + '\t' + item.term_section}
    );
    
    var rawEnrollmentData = this._packageRawData(reportData.enrollments);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[0], rawEnrollmentData);
    if (!result.success) return this._failResult(result.details);   
    
    return {
      success: true, 
      details: 'enrollment report uploaded successfully', 
      data: {
        "students": {
          "differences": enrollmentDifferences, 
          "headers": ['student', 'term', 'section']
        }
      }
    };
  }
  
  async _applyMentorReportData(reportData, targetFileId, currentFileData) {
    const METHODNAME = 'DataIntegrator._applyMentorReportData';
    var targetSheets = ['raw_mentor_data', 'raw_guardian_data'];

    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return this._failResult(result.details);
   
    result = await this._addOrClearSheets(targetFileId, targetSheets, result.sheetSet);
    if (!result.success) return this._failResult(result.details);

    var mentorDifferences = this._packageDifferences(
      currentFileData.raw_mentor_data, 
      reportData.mentors,
      (item) => {return item.student + '\t' + item.term_section + '\t' + item.name}
    );

    var guardianDifferences = this._packageDifferences(
      currentFileData.raw_guardian_data, 
      reportData.guardians,
      (item) => {return item.student + '\t' + item.term_section + '\t' + item.name}
    );

    var rawMentorData = this._packageRawData(reportData.mentors);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[0], rawMentorData);
    if (!result.success) return this._failResult(result.details);
    
    var rawGuardianData = this._packageRawData(reportData.guardians);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[1], rawGuardianData);
    if (!result.success) return this._failResult(result.details);   
    
    return {
      success: true, 
      details: 'mentor/guardian report uploaded successfully', 
      data: {
        "mentors": {
          "differences": mentorDifferences, 
          "headers": ['student', 'term', 'section', 'mentor']
        },
        "guardians": {
          "differences": guardianDifferences, 
          "headers": ['student', 'term', 'section', 'guardian']
        }
      }
    };
  }
  
  async _applyIEPReportData(reportData, targetFileId, currentFileData) {
    const METHODNAME = 'DataIntegrator._applyIEPReportData';
    
    var targetSheets = ['raw_iep_data'];
    
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return this._failResult(result.details);
    
    result = await this._addOrClearSheets(targetFileId, targetSheets, result.sheetSet);
    if (!result.success) return this._failResult(result.details);
    
    var differences = this._packageDifferences(
      currentFileData.raw_iep_data, 
      reportData.iep,
      (item) => {return item.student + '\t' + item.term_section}
    );
    
    var rawIEPData = this._packageRawData(reportData.iep);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[0], rawIEPData);
    if (!result.success) return this._failResult(result.details);   
    
    return {
      success: true, 
      details: 'IEP report uploaded successfully', 
      data: {
        "students": {
          "differences": differences, 
          "headers": ['student', 'term', 'section']
        }
      }
    };
  }
  
  async _apply504ReportData(reportData, targetFileId, currentFileData) {
    const METHODNAME = 'DataIntegrator._apply504ReportData';
    
    var targetSheets = ['raw_504_data'];
    
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return this._failResult(result.details);
    
    result = await this._addOrClearSheets(targetFileId, targetSheets, result.sheetSet);
    if (!result.success) return this._failResult(result.details);
    
    var differences = this._packageDifferences(
      currentFileData.raw_504_data, 
      reportData["504"],
      (item) => {return item.student + '\t' + item.term_section}
    );
    
    var raw504Data = this._packageRawData(reportData["504"]);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[0], raw504Data);
    if (!result.success) return this._failResult(result.details);   
    
    return {
      success: true, 
      details: '504 report uploaded successfully', 
      data: {
        "students": {
          "differences": differences, 
          "headers": ['student', 'term', 'section']
        }
      }
    };
  }

  async _addOrClearSheets(targetFileId, targetSheets, existingSheetSet) {
    var result = {success: true, details: 'no sheets to add or clear', data: null};
    
    for (var i = 0; i < targetSheets.length && result.success; i++) {
      var targetSheet = targetSheets[i];
      if (existingSheetSet.has(targetSheet)) {
        result = await this.config.googleDrive.clearRange(targetFileId, targetSheet);
      } else {
        result = await this.config.googleDrive.addSheet(targetFileId, targetSheet);
      }
    }
    
    return result;
  }
  
  _packageRawData(rawData) {
    var  packageRawData = [];
    
    if (rawData.length == 0) return packageRawData;
    
    var rawDataProperties = [];
    var firstRow = rawData[0];
    for (var key in firstRow) {
      rawDataProperties.push(key);
    }
    
    packageRawData.push(rawDataProperties);
    for (var i = 0; i < rawData.length; i++) {
      var rowData = [];
      for (var j = 0; j < rawDataProperties.length; j++) {
        rowData.push(rawData[i][rawDataProperties[j]]);
      }
      packageRawData.push(rowData);
    }
    
    return packageRawData;
  }
  
  _packageEnrollmentData(enrollments) {
    var studentData = [];
    var studentProperties = ['student', 'term', 'section', 'startdate', 'enddate', 'affiliation', 'email'];
    var dateProperties = new Set(['startdate', 'enddate']);
    for (var i = 0; i < enrollments.length; i++) {
      var enrollment = enrollments[i];
      var rowData = [];
      for (var j = 0; j < studentProperties.length; j++) {
        var val = enrollment[studentProperties[j]]
        if (dateProperties.has(studentProperties[j])) val = val.slice(0,10);
        rowData.push(val);
      }
      studentData.push(rowData);
    }
    
    studentData = studentData.sort( (a,b) => {return (a[0] + a[1] + a[2]).localeCompare(b[0] + b[1] + b[2]); });
    studentData.unshift(studentProperties);    
    
    return studentData;
  }
  
  _packageMentorByStudentData(mentorsByStudent) {
    var mentorByStudentData = [];
    var mentorByStudentProperties = ['student', 'mentor', 'email', 'additional...'];
    
    for (var student in mentorsByStudent) {
      var mentorItems = mentorsByStudent[student];
      var rowData = [ mentorItems[0].student ];
      
      for (var i = 0; i < mentorItems.length; i++) {
        var item = mentorItems[i];
        rowData.push(item.name);
        rowData.push(item.email);
      }
        
      mentorByStudentData.push(rowData);
    }

    mentorByStudentData = mentorByStudentData.sort( (a,b) => { return a[0].localeCompare(b[0]); });
    mentorByStudentData.unshift(mentorByStudentProperties);
    
    return mentorByStudentData;    
  }
  
  _packageMentorBySectionData(mentorsBySection) {
    var termSet = new Set();
    var termSections = {};
    for (var key in mentorsBySection) {
      var item = mentorsBySection[key];
      var term = item[0].term;
      var section = item[0].section;
      termSet.add(term);
      if (!termSections.hasOwnProperty(term)) termSections[term] = [];
      termSections[term].push(section);
    }

    var termList = Array.from(termSet).sort();
    
    var mentorBySectionData = [];
    var mentorBySectionProperties = ['name', 'email'];
    
    mentorBySectionData.push(['term', 'section', 'name', 'email']);

    for (var i = 0; i < termList.length; i++) {
      var term = termList[i];
      var sectionList = termSections[term].sort();
      for (var j = 0; j < sectionList.length; j++) {
        var section = sectionList[j];
        var sectionData = [];
        var sectionEmails = '';
        
        var mentorData = mentorsBySection[term + '\t' + section];
        for (var k = 0; k < mentorData.length; k++) {
          var mentorInfo = mentorData[k];
          sectionData.push([term, section, mentorInfo.name, mentorInfo.email]);
          sectionEmails += mentorInfo.email + '; ';
        }
        
        sectionData.unshift([term, section, 'all', sectionEmails]);
        sectionData.push([]);
        
        mentorBySectionData = mentorBySectionData.concat(sectionData);
      }
    }
        
    return mentorBySectionData;    
  }

  _packageGuardianData(guardiansByStudent) {
    var guardianData = [];
    var guardianProperties = ['student', 'guardian', 'email', 'additional...'];
    
    for (var student in guardiansByStudent) {
      var guardianItems = guardiansByStudent[student];
      var rowData = [ guardianItems[0].student ];
      
      for (var i = 0; i < guardianItems.length; i++) {
        var item = guardianItems[i];
        rowData.push(item.name);
        rowData.push(item.email);
      }
        
      guardianData.push(rowData);
    }

    guardianData = guardianData.sort( (a,b) => { return a[0].localeCompare(b[0]); });
    guardianData.unshift(guardianProperties);  

    return guardianData;    
  }
  
  _packageDifferences(originalData, newData, funcMakeKey) {
    var differences = [];
    
    for (var i = 0; i < originalData.length; i++) {
      var item = originalData[i];
      var searchResult = this._findObjInList(item, funcMakeKey(item), newData, funcMakeKey)
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
      var searchResult = this._findObjInList(item, funcMakeKey(item), originalData, funcMakeKey)
      if (!searchResult.found) {
        differences.push({"key": funcMakeKey(item), "item": item, "reason": 'added'});
      }
    }

    return differences;
  }
  
  _findObjInList(obj, objKey, list, funcMakeKey) {
    var searchResult = {"found": false};
    
    for (var i = 0; i < list.length && !searchResult.found; i++) {
      var listItem = list[i];
      var listItemKey = funcMakeKey(listItem);
      if (objKey == listItemKey) {
        searchResult.found = true;
        searchResult.exactMatch = this._shallowEqual(obj, listItem);
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
      if (object1[key] !== object2[key]) {
        return false;
      }
    }

    return true;
  }  
  
  async _formatSheets(spreadsheetId, sheetTitles) {
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: spreadsheetId});
    if (!result.success) return this._failResult(result.details);
    var sheetInfo = result.sheetInfo;
     
    for (var i = 0; i < sheetTitles.length  && result.success; i++) {
      var sheetId = this._getSheetId(sheetTitles[i], sheetInfo);
      result = await this.config.googleDrive.formatHeaderRow(spreadsheetId, sheetId);
    }
    return result;
  }

  async _hideSheets(spreadsheetId, sheetTitles) {
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: spreadsheetId});
    if (!result.success) return this._failResult(result.details);
    var sheetInfo = result.sheetInfo;
     
    var sheetTitleSet = new Set(sheetTitles);
    var sheetIds = [];
    for (var i = 0; i < sheetInfo.length; i++) {
      if (sheetTitleSet.has(sheetInfo[i].title)) sheetIds.push(sheetInfo[i].id);
    }
    
    result = await this.config.googleDrive.hideSheets(spreadsheetId, sheetIds, true);
    
    return result;
  }
  
  _getSheetId(sheetTitle, sheetInfo) {
    var id = null;
    for (var i = 0; i < sheetInfo.length && !id; i++) {
      if (sheetInfo[i].title == sheetTitle) id = sheetInfo[i].id;
    }
    return id;
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _failResult(msg, methodName) {
    if (methodName) msg += ' in ' + methodName;
    
    return {
      success: false,
      details: msg,
      data: null
    };
  }
}
