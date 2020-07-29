"use strict";
//---------------------------------------------------------------
// Welcome letter interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.WelcomeLetter = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
    this._pug = params.pug;
    this._fileServices = params.fileServices;
  }
  
//---------------------------------------------------------------
// render landing page
//---------------------------------------------------------------
  async renderWelcomeLetter(params, pugFileNames) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = { 
      courseinfo:
        'select ' +
        '  courseid, coursename, ap ' +
        'from course ' +
        'where coursekey = "' + params.coursekey + '"'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success || queryResults.data.courseinfo.length == 0) {
      result.details = queryResults.details;
      return result;
    }
   
    var courseInfo = queryResults.data.courseinfo[0];
    
    queryList = {
      exams:
        'select e.examdescription ' +
        'from configuration as c, exam as e ' +
        'where c.courseid = ' + courseInfo.courseid + ' ' +
          'and c.examid = e.examid',

      proctoring:
        'select p.proctoringdescription ' +
        'from configuration as c, proctoring as p ' +
        'where c.courseid = ' + courseInfo.courseid + ' ' +
          'and c.proctoringid = p.proctoringid',

      retake:
        'select r.retakedescription ' +
        'from configuration as c, retake as r ' +
        'where c.courseid = ' + courseInfo.courseid + ' ' +
          'and c.retakeid = r.retakeid',

      resubmission:
        'select r.resubmissiondescription ' +
        'from configuration as c, resubmission as r ' +
        'where c.courseid = ' + courseInfo.courseid + ' ' +
          'and c.resubmissionid = r.resubmissionid',
          
      general:
        'select ap, student, mentor, keypoint ' +
        'from generalkeypoint ' +
        'where ap = ' + courseInfo.ap
    }

    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }    
    
    var keyPoints = [];
    if (queryResults.data.exams.length > 0) keyPoints.push(queryResults.data.exams[0].examdescription);
    if (queryResults.data.proctoring.length > 0) keyPoints.push(queryResults.data.proctoring[0].proctoringdescription);
    if (queryResults.data.retake.length > 0) keyPoints.push(queryResults.data.retake[0].retakedescription);
    if (queryResults.data.resubmission.length > 0) keyPoints.push(queryResults.data.resubmission[0].resubmissiondescription);
     
    var generalKeypoints = queryResults.data.general;
    for (var i = 0; i < generalKeypoints.length; i++) {
      if (params.audience == 'student' && generalKeypoints[i].student) {
        keyPoints.push(generalKeypoints[i].keypoint);
      } else if (params.audience == 'mentor' && generalKeypoints[i].mentor) {
        keyPoints.push(generalKeypoints[i].keypoint);
      }
    }
   
    var pugFile = pugFileNames.student;
    if (params.audience == 'mentor') pugFile = pugFileNames.mentor;
    var letterParams = {
      coursekey: params.coursekey,
      coursename: courseInfo.coursename,
      ap: courseInfo.ap,
      keypoints: keyPoints
    }
    
    if (this._fileServices.existsSync(pugFile)) {
      result.success = true;
      result.data = this._pug.renderFile(pugFile, {"params": letterParams});
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// render configuration page
//---------------------------------------------------------------
  async renderConfigurationPage(res, me, pugFileName, renderAndSendPug) {
    var queryList, queryResults;

    queryList = {
      exam:
        'select examid, examdescription ' +
        'from exam ' +
        'order by examdescription',
        
      proctoring:
        'select proctoringid, proctoringdescription ' +
        'from proctoring ' +
        'order by proctoringdescription',
        
      retake:
        'select retakeid, retakedescription ' +
        'from retake ' +
        'order by retakedescription',
        
      resubmission:
        'select resubmissionid, resubmissiondescription ' +
        'from resubmission ' +
        'order by resubmissiondescription'        
    }
    
    queryResults = await me._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      me._renderFail();
      return;
    }
    
    var pugOptions = {
      exam: queryResults.data.exam,
      proctoring: queryResults.data.proctoring,
      retake: queryResults.data.retake,
      resubmission: queryResults.data.resubmission
    };
    
    renderAndSendPug(res, 'welcome', pugFileName, {params: pugOptions});
  }
  
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'courselist') {
      dbResult = await this._getCourseList(params, postData, userInfo);

    } else if (params.queryName == 'course') {
      dbResult = await this._getCourse(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._insertCourse(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._updateCourse(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._deleteCourse(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getCourseList(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select courseid, coursekey, coursename, ap ' +
      'from course ' +
      'order by coursename';
      
    queryResults = await this._dbManager.dbQuery(query);    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _getCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var queryList, queryResults;
    
    queryList = {
      course: 
        'select courseid, coursekey, coursename, ap ' +
        'from course ' +
        'where courseid = ' + postData.courseid,
        
      configuration:
        'select configurationid, courseid, examid, proctoringid, retakeid, resubmissionid ' +
        'from configuration ' +
        'where courseid = ' + postData.courseid
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

  async _insertCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'insert into course(coursekey, coursename, ap) ' +
      'values (' +
        '"defaultkey", ' +
        '"' + postData.coursename + '", ' +
        'false ' +
      ')';
    
    queryResults = await this._dbManager.dbQuery(query);    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _updateCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
 
    var queryList, queryResults;
    
    var updatedExamId = (postData.examid) == '' ? 'null' : postData.examid;
    var updatedProctoringId = (postData.proctoringid) == '' ? 'null' : postData.proctoringid;
    var updatedRetakeId = (postData.retakeid) == '' ? 'null' : postData.retakeid;
    var updatedResubmissionId = (postData.resubmissionid) == '' ? 'null' : postData.resubmissionid;
    
    queryList = {
      course:
        'update course ' +
        'set ' +
          'coursekey = "' + postData.coursekey + '", ' +
          'ap = ' + postData.ap + ' ' +
        'where courseid = ' + postData.courseid,
      
      configuration: 
        'update configuration ' +
        'set ' +
          'examid = ' + updatedExamId + ', ' +
          'proctoringid = ' + updatedProctoringId + ', ' +
          'retakeid = ' + updatedRetakeId + ', ' +
          'resubmissionid = ' + updatedResubmissionId + ' ' +
        'where courseid = ' + postData.courseid
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

  async _deleteCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'delete from course  ' +
      'where courseid = ' + postData.courseid;
      
    queryResults = await this._dbManager.dbQuery(query);    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------       
  _renderFail() {
    res.send('cannot access page: pgviewer')    
  }  
}