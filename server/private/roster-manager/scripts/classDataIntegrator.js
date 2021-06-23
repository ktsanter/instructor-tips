//-------------------------------------------------------------------
// DataIntegrator
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class DataIntegrator {
  constructor(config) {
    this.config = config
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async readCurrentSheetInfo(targetFileId) {
    var sheetsToRead = ['raw_enrollment_data', 'raw_mentor_data', 'raw_guardian_data'];
    var result = await this._readSheetData(targetFileId, sheetsToRead);
    if (!result.success) return this._failResult(result.details);
    
    console.log(result);
    console.log('what to do if sheet does not exist yet?');
    console.log('turn raw data into object format like what comes from server');
    
    return {success: true, details: 'so far, so good', data: null};
  }
  
  async applyReportData(reportType, reportData, targetFileId) {
    console.log('compare to current and report differences');
    if (reportType == 'enrollment') {
      return await this._applyEnrollmentReportData(reportData, targetFileId);
      
    } else if (reportType == 'mentor') {
      return await this._applyMentorReportData(reportData, targetFileId);
      
    } else {
      return {success: false, details: 'unrecognized report type: ' + reportType, data: null};
    }
  }
  
  //--------------------------------------------------------------
  // private methods - read sheet info
  //--------------------------------------------------------------   
  async _readSheetData(targetFileId, sheetsToRead) {
    const METHODNAME = 'DataIntegrator._readSheetData';
    
    var result = await this.config.googleDrive.getRanges(targetFileId, sheetsToRead);
    if (!result.success) return result;
    
    var sheetData = {};
    for (var i = 0; i < sheetsToRead.length; i++) {
      sheetData[sheetsToRead[i]] = result.data[i];
    }
    result.data = sheetData;
    
    return result;
  }
  
  //--------------------------------------------------------------
  // private methods - apply report data
  //--------------------------------------------------------------   
  async _applyEnrollmentReportData(reportData, targetFileId) {
    const METHODNAME = 'DataIntegrator._applyEnrollmentReportData';
    var targetSheets = ['students', 'raw_enrollment_data'];
    
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return this._failResult(result.details);
    
    result = await this._addOrClearSheets(targetFileId, targetSheets, result.sheetSet);
    if (!result.success) return this._failResult(result.details);
    
    var studentData = this._packageEnrollmentData(reportData.enrollments);    
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[0], studentData);
    if (!result.success) return this._failResult(result.details);
    
    var rawEnrollmentData = this._packageRawData(reportData.enrollments);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[1], rawEnrollmentData);
    if (!result.success) return this._failResult(result.details);
    
    result = await this._formatSheets(targetFileId, targetSheets);
    if (!result.success) return this._failResult(result.details);    
    
    return {success: true, details: 'enrollment report uploaded successfully', data: null};
  }
  
  async _applyMentorReportData(reportData, targetFileId) {
    console.log(reportData);
    const METHODNAME = 'DataIntegrator._applyMentorReportData';
    var targetSheets = ['mentors by student', 'mentors by section', 'guardians', 'raw_mentor_data', 'raw_guardian_data'];

    var result = await this.config.googleDrive.getSpreadsheetInfo({id: targetFileId});
    if (!result.success) return this._failResult(result.details);
   
    result = await this._addOrClearSheets(targetFileId, targetSheets, result.sheetSet);
    if (!result.success) return this._failResult(result.details);
    
    var mentorByStudentData = this._packageMentorByStudentData(reportData.mentorsByStudent);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[0], mentorByStudentData);
    if (!result.success) return this._failResult(result.details);
    
    var mentorBySectionData = this._packageMentorBySectionData(reportData.mentorsByTermSection);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[1], mentorBySectionData);
    if (!result.success) return this._failResult(result.details);
    
    var guardianData = this._packageGuardianData(reportData.guardiansByStudent);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[2], guardianData);
    if (!result.success) return this._failResult(result.details);

    var rawMentorData = this._packageRawData(reportData.mentors);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[3], rawMentorData);
    if (!result.success) return this._failResult(result.details);
    
    var rawGuardianData = this._packageRawData(reportData.guardians);
    result = await this.config.googleDrive.writeRange(targetFileId, targetSheets[4], rawGuardianData);
    if (!result.success) return this._failResult(result.details);
    
    result = await this._formatSheets(targetFileId, targetSheets);
    if (!result.success) return this._failResult(result.details);    
    
    return {success: true, details: 'mentor/guardian report uploaded successfully', data: null};
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
  
  async _formatSheets(spreadsheetId, sheetTitles) {
    var result = await this.config.googleDrive.getSpreadsheetInfo({id: spreadsheetId});
    if (!result.success) return this._failResult(result.details);
    var sheetInfo = result.sheetInfo;
     
    for (var i = 0; i < sheetTitles.length  && result.success; i++) {
      var sheetId = this._getSheetId(sheetTitles[i], sheetInfo);
      result = await this.config.googleDrive.formatHeaderRow(spreadsheetId, sheetId);
    }
    return result;;
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
