"use strict";
//---------------------------------------------------------------
// server-side for Who Teaches What
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.WhoTeachesWhat = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;        
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'assignments') {
      dbResult = await this._getAssignmentInfo(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      //dbResult = await this._replaceStudentProperty(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      //dbResult = await this._updateStudentNote(params, postData, userInfo);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      //dbResult = await this._deleteStudentNote(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res, uploadType, semester, userInfo) {
    var validTypes = new Set(['assignment']);

    if (validTypes.has(uploadType)) {
      this._processExcelFile(req, res, uploadType, semester, userInfo);
      
    } else {
      this._sendFail(res, 'unrecognized upload type: ' + uploadType);
    }
  }
  
//---------------------------------------------------------------
// private methods - file processing
//--------------------------------------------------------------- 
  async _processExcelFile(req, res, uploadType, semester, userInfo) {
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
       
      var processRoutingMap = {
        "assignment": thisObj._processAssignmentFile
      }
      
      if (processRoutingMap.hasOwnProperty(uploadType)) {
        processRoutingMap[uploadType](res, thisObj, workbook, semester, userInfo);

      } else {
        thisObj._sendFail(res, 'unrecognized upload type: ' + uploadType);
      }
    });
  }
  
//----------------------------------------------------------------------
// process specific Excel file
//----------------------------------------------------------------------
  async _processAssignmentFile(res, thisObj, workbook, semester, userInfo) {
    let uploadedData = {
      "cte_semester": null,
      "cte_trimester": null,
      "ap": null,
      "middleschool": null
    };
    
    let result = await thisObj._processCTEAssignments_semester(thisObj, workbook.getWorksheet('C & T'), semester);
    if (!result.success) {
      thisObj._sendFail(res, result.details);
      return;
    }
    uploadedData.cte_semester = result.data;

    result = await thisObj._processCTEAssignments_trimester(thisObj, workbook.getWorksheet('C & T'));
    if (!result.success) {
      thisObj._sendFail(res, result.details);
      return;
    }
    uploadedData.cte_trimester = result.data;

    result = await thisObj._processAPAssignments(thisObj, workbook.getWorksheet('AP'), semester);
    if (!result.success) {
      thisObj._sendFail(res, result.details);
      return;
    }
    uploadedData.ap = result.data;
    
    result = await thisObj._processMiddleSchoolAssignments(thisObj, workbook.getWorksheet('Middle School'), semester);
    if (!result.success) {
      thisObj._sendFail(res, result.details);
      return;
    }
    uploadedData.middleschool = result.data;
    
    let consolidatedData = thisObj._consolidateAssignmentData(uploadedData);

    result = await thisObj._postAssignmentData(consolidatedData);
    if (!result.success) {
      thisObj._sendFail(res, result.details);
      return;
    }

    thisObj._sendSuccess(res, 'assignment data posted', consolidatedData);
  }    
  
  async _processCTEAssignments_semester(thisObj, worksheet, semester) {
    const firstCourseRow = 3;
    const firstSemCol = 2;
    const lastSemCol = 11;
    
    let result = {success: false, details: 'failed to read CTE assignments', data: null};

    if (!worksheet) return result;
    
    let assignments = {};
    
    worksheet.eachRow({includeEmpty: false}, function (row, rowNumber) {
      const course = row.getCell(1).value;
      if (rowNumber >= firstCourseRow) {
        assignments[course] = [];
        let instructorSet = new Set();
        
        for (let i = firstSemCol; i <= lastSemCol; i++) {
          const instructor = row.getCell(i).value;
          if (instructor) {
            if (!instructorSet.has(instructor)) {
              instructorSet.add(instructor);
              assignments[course].push({"name": instructor, "term": semester});
            }
          }
        }
      }
    });
    
    result.success = true;
    result.details = 'processed CTE assignments';
    result.data = assignments;
    
    return result;
  }
  
  async _processCTEAssignments_trimester(thisObj, worksheet) {
    const firstCourseRow = 3;
    const trimesterColumns = {"T1": 13, "T2": 14, "T3": 15};
    
    let result = {success: false, details: 'failed to read CTE assignments', data: null};

    if (!worksheet) return result;
    
    let assignments = {};

    for (const triName in trimesterColumns) {
      worksheet.eachRow({includeEmpty: false}, function(row, rowNumber) {
        if (rowNumber >= firstCourseRow) {
          const course = row.getCell(1).value;
          const instructor = row.getCell(trimesterColumns[triName]).value;
          if (instructor) {
            if (!assignments.hasOwnProperty(course)) assignments[course] = [];
            assignments[course].push({"name": instructor, "term": triName});
          }
        }
      });
    }
    
    result.success = true;
    result.details = 'processed CTE assignments';
    result.data = assignments;
    
    return result;
  }
  
  async _processAPAssignments(thisObj, worksheet, semester) {
    const firstCol = 2;
    const lastCol = 12;
    let result = {success: false, details: 'failed to read AP assignments', data: null};

    if (!worksheet) return result;
    
    result = await thisObj._getExtraCourses('AP');
    if (!result.success) {
      result.details = 'failed to look up AP courses';
      return result;
    }
    
    let courseList = result.data;
    let assignments = {};
    for (let i = 0; i < courseList.length; i++) {
      assignments[courseList[i]] = null;
    }
    
    worksheet.eachRow({includeEmpty: false}, function (row, rowNumber) {
      const course = row.getCell(1).value;
      if (courseList.includes(course)) {
        assignments[course] = [];
        let instructorSet = new Set();

        for (let i = firstCol; i <= lastCol; i++) {
          const instructor = row.getCell(i).value;
          if (instructor) {
            if (!instructorSet.has(instructor)) {
              instructorSet.add(instructor);
              assignments[course].push({"name": instructor, "term": semester});
            }
          }
        }
      }
    });
    
    result.success = true;
    result.details = 'processed AP assignments';
    result.data = assignments;
    
    return result;
  }
  
  async _processMiddleSchoolAssignments(thisObj, worksheet, semester) {
    const firstCol = 2;
    const lastCol = 18;
    
    let result = {success: false, details: 'failed to read middle school assignments', data: null};

    if (!worksheet) return result;
    
    result = await thisObj._getExtraCourses('MS');
    if (!result.success) {
      result.details = 'failed to look up middle school courses';
      return result;
    }
    
    let courseList = result.data;
    let assignments = {};
    for (let i = 0; i < courseList.length; i++) {
      assignments[courseList[i]] = null;
    }
    
    worksheet.eachRow({includeEmpty: false}, function (row, rowNumber) {
      const course = row.getCell(1).value;
      if (courseList.includes(course)) {
        assignments[course] = []
        let instructorSet = new Set();
        
        for (let i = firstCol; i <= lastCol; i++) {
          const instructor = row.getCell(i).value;
          if (instructor) {
            if (!instructorSet.has(instructor)) {
              instructorSet.add(instructor);
              assignments[course].push({"name": instructor, "term": semester});
            }
          }
        }
      }
    });   
    
    result.success = true;
    result.details = 'processed middle school assignments';
    result.data = assignments;
    
    return result;
  }
  
  _consolidateAssignmentData(uploadedData) {
    let consolidatedData = [];
    
    for (const segment in uploadedData) {
      for (const course in uploadedData[segment]) {
        if (!consolidatedData.hasOwnProperty(course)) consolidatedData[course] = [];
        let assignments = uploadedData[segment][course];
        for (let i = 0; i < assignments.length; i++) {
          consolidatedData[course].push(assignments[i]);
        }
      }
    }
    
    return consolidatedData;
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
  
  async _getAssignmentInfo(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    let query, queryResults;
    
    query = 
      'select course, instructor, term ' +
      'from assignment';
    
    queryResults = await this._dbManager.dbQuery(query); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    let assignmentInfo = {};
    for (let i = 0; i < queryResults.data.length; i++) {
      let assignment = queryResults.data[i];
      let course = assignment.course;
      let instructor = assignment.instructor;
      let term = assignment.term;
      
      if (!assignmentInfo.hasOwnProperty(course)) assignmentInfo[course] = [];
      
      if (!assignmentInfo[course].hasOwnProperty(instructor)) assignmentInfo[course][instructor] = [];
      if (!assignmentInfo[course][instructor].includes(term)) assignmentInfo[course][instructor].push(term);
    }
    
    let collatedInfo = {}
    for (let course in assignmentInfo) {
      if (!collatedInfo.hasOwnProperty(course)) collatedInfo[course] = [];
      let courseInfo = assignmentInfo[course];
      for (let instructor in courseInfo) {
        let termInfo = courseInfo[instructor];
        collatedInfo[course].push({"name": instructor, "terms": termInfo});
      }
    }
    
    result.success = true;
    result.details = 'retrieved assignment info';
    result.data = collatedInfo;
    
    return result;
  }

  async _getExtraCourses(courseType) {
    let result = this._dbManager.queryFailureResult(); 
    let query, queryResults;
    
    query = 
      'select course ' +
      'from extracourse ' +
      'where coursetype = "' + courseType + '"';

    queryResults = await this._dbManager.dbQuery(query); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    let courseList = [];
    for (let i = 0; i < queryResults.data.length; i++) {
      courseList.push(queryResults.data[i].course);
    }
    
    return {success: true, details: 'looked up AP courses', data: courseList};   
  }

  async _postAssignmentData(assignmentData) {
    let result = {success: false, details: 'failed to post assignment data', data: null};
    let query, queryResults;
    
    query = 'delete from assignment';
    queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success) {
      result.details = 'failed to delete assignments';
      return result;
    }
    
    query = 'insert into assignment (course, instructor, term) values ';
    
    let n = 0;
    for (let course in assignmentData) {
      let assignmentList = assignmentData[course];
      for (let i = 0; i < assignmentList.length; i++) {
        let assignment = assignmentList[i];
        if (n > 0) query += ', ';
        query += 
          '(' +
            '"' + course + '", ' +
            '"' + assignment.name + '", ' +
            '"' + assignment.term + '" ' +
          ')';
          n++;
      }
    }
    
    queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success) {
      result.details = 'failed to insert assignments';
      return result;
    }
    
    result.success = true;
    result.details = 'posted assignments to DB';
    
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
}
