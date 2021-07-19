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
  async readRosterInfo() {
    dbResult = await SQLDBInterface.doGetQuery('roster-manager/query', 'rosterinfo', this.config.notice);

    if (!dbResult.success) {
      console.log('failed to read roster info', dbResult.details);
    }

    return dbResult;
  }
  
  async applyReportData(reportType, reportData, targetFileId) {
    if (reportType == 'enrollment') {
      return await this._applyEnrollmentReportData(reportData);
      
    } else if (reportType == 'mentor') {
      return await this._applyMentorReportData(reportData);
      
    } else if (reportType == 'iep') {
      return await this._applyIEPReportData(reportData);
      
    } else if (reportType == '504') {
      return await this._apply504ReportData(reportData);
      
    } else if (reportType == 'homeschooled') {
      return await this._applyHomeSchooledReportData(reportData);
      
    } else {
      return {success: false, details: 'unrecognized report type: ' + reportType, data: null};
    }
  }
  
  //--------------------------------------------------------------
  // private methods - apply report data
  //--------------------------------------------------------------   
  async _applyEnrollmentReportData(reportData) {
    const METHODNAME = 'DataIntegrator._applyEnrollmentReportData';
    
    return {
      success: true, 
      details: 'enrollment report uploaded successfully', 
      data: {
        "students": {
          "differences": reportData.differences.enrollment, 
          "headers": ['student', 'term', 'section']
        }
      }
    }
  }
  
  async _applyMentorReportData(reportData) {
    const METHODNAME = 'DataIntegrator._applyMentorReportData';

    return {
      success: true, 
      details: 'enrollment report uploaded successfully', 
      data: {
        "mentors": {
          "differences": reportData.differences.mentor, 
          "headers": ['student', 'term', 'section', 'mentor']
        },

        "guardians": {
          "differences": reportData.differences.guardian, 
          "headers": ['student', 'term', 'section', 'guardian']
        }
        
      }
    }
  }
  
  async _applyIEPReportData(reportData) {
    const METHODNAME = 'DataIntegrator._applyIEPReportData';
    
    return {
      success: true, 
      details: 'IEP report uploaded successfully', 
      data: {
        "students": {
          "differences": reportData.differences.iep, 
          "headers": ['student', 'term', 'section']
        }
      }
    }
  }
    
  async _apply504ReportData(reportData) {
    
    return {
      success: true, 
      details: '504 report uploaded successfully', 
      data: {
        "students": {
          "differences": reportData.differences.student504, 
          "headers": ['student', 'term', 'section']
        }
      }
    }
  }
  
  async _applyHomeSchooledReportData(reportData) {
    const METHODNAME = 'DataIntegrator._applyHomeSchooledReportData';
    
    return {
      success: true, 
      details: 'home schooled report uploaded successfully', 
      data: {
        "students": {
          "differences": reportData.differences.homeschooled, 
          "headers": ['student', 'term', 'section']
        }
      }
    }
  }
  
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
