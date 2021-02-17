"use strict";
//---------------------------------------------------------------
// Welcome letter interface (original)
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
    this._pugPath = params.pugPath;
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
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'mailmessage') {
      dbResult = await this._getMailMessage(params, postData, userInfo);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      console.log('doInsert: dummy');
        
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      console.log('doUpdate: dummy');
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      console.log('doDelete: dummy');
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getMailMessage(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var pugFileName = '';
    if (postData.audience == 'student') {
      pugFileName = this._pugPath + '/mailmessage-student.pug';
    } else if (postData.audience == 'mentor') {
      pugFileName = this._pugPath + '/mailmessage-mentor.pug';
    } else {
      result.details = 'invalid audience';
      return result;
    }
    
    if (!this._fileServices.existsSync(pugFileName)) {
      result.details = 'cannot read message file';
      return result;
    }
    
    var messageParams = {
      coursename: postData.coursename,
      coursekey: postData.coursekey,
      ap: postData.ap,
      audience: postData.audience,
      linktext: postData.linktext,
      haspasswords: postData.haspasswords
    };
    result.data = this._pug.renderFile(pugFileName, {params: messageParams});
    result.success = true;

    return result;
  }  

  
  async _getMailMessage2(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var pugFileName = '';
    if (postData.audience == 'student') {
      pugFileName = this._pugPath + '/mailmessage/student_mailmessage.pug';
    } else if (postData.audience == 'mentor') {
      pugFileName = this._pugPath + '/mailmessage/mentor_mailmessage.pug';
    } else {
      result.details = 'invalid audience';
      return result;
    }
    
    if (!this._fileServices.existsSync(pugFileName)) {
      result.details = 'cannot read message file';
      return result;
    }
    
    var messageParams = {
      coursename: postData.coursename,
      ap: postData.ap,
      audience: postData.audience,
      letterURL: postData.letterURL,
      haspasswords: postData.haspasswords
    };
    
    result.data = this._pug.renderFile(pugFileName, {params: messageParams});
    result.details = 'file rendered successfully';
    result.success = true;

    return result;
  }  

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------       
  _renderFail() {
    res.send('cannot access page: pgviewer')    
  }  
}
