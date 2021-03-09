"use strict";
//---------------------------------------------------------------
// Welcome letter interface (version 2)
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.WelcomeLetterV2 = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
    this._pug = params.pug;
    this._fileServices = params.fileServices;
    this._pugPath = params.pugPath;
    this._commonmark = params.commonmark;
  }
  
//---------------------------------------------------------------
// render landing page v2
//---------------------------------------------------------------
  async renderWelcomeLetter(params, pugFileNames) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = { 
      courseinfo:
        'select ' +
        '  courseid, coursename, ap, haspasswords ' +
        'from course ' +
        'where courseid = "' + params.courseid + '"'
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
   
    for (var i = 0; i < keyPoints.length; i++) {
      keyPoints[i] = this._markdownToHTML(keyPoints[i]);
    }
   
    var pugFile = pugFileNames.student;
    if (params.audience == 'mentor') pugFile = pugFileNames.mentor;
    var letterParams = {
      coursekey: params.coursekey,
      coursename: courseInfo.coursename,
      ap: courseInfo.ap,
      haspasswords: courseInfo.haspasswords,
      keypoints: keyPoints
    }
    
    if (this._fileServices.existsSync(pugFile)) {
      result.success = true;
      result.data = this._pug.renderFile(pugFile, {"params": letterParams});
    }
  
    return result;
  }
  
//---------------------------------------------------------------
// render configuration page v2
//---------------------------------------------------------------
  async renderConfigurationPage(res, me, pugFileName, renderAndSendPug, userManagement, userInfo) {
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
      resubmission: queryResults.data.resubmission,
      allowoptionsediting: userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')
    };
    
    renderAndSendPug(res, 'welcome', pugFileName, {params: pugOptions});
  }
  
//---------------------------------------------------------------
// dispatchers v2
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'courselist') {
      dbResult = await this._getCourseList(params, postData, userInfo);
            
    } else if (params.queryName == 'mailmessage') {
      dbResult = await this._getMailMessage(params, postData, userInfo);
            
    } else if (params.queryName == 'optionvalues') {
      dbResult = await this._getOptionValues(params, postData, userInfo);
                        
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._insertCourse(params, postData, userInfo);

    } else if (params.queryName == 'optionvalues'&& funcCheckPrivilege(userInfo, 'admin')) {
      dbResult = await this._insertOptionValues(params, postData, userInfo);
        
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._updateCourse(params, postData, userInfo);
    
    } else if (params.queryName == 'optionvalues' && funcCheckPrivilege(userInfo, 'admin')) {
      dbResult = await this._updateOptionValues(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'course') {
      dbResult = await this._deleteCourse(params, postData, userInfo);
    
    } else if (params.queryName == 'optionvalues'&& funcCheckPrivilege(userInfo, 'admin')) {
      dbResult = await this._deleteOptionValues(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods v2
//---------------------------------------------------------------
  async _getCourseList(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.courseid, a.coursename, a.ap, a.haspasswords, ' +
        'b.configurationid, b.examid, b.proctoringid, b.retakeid, b.resubmissionid ' +
      'from course as a, configuration as b ' +
      'where userid = ' + userInfo.userId + ' ' +
        'and a.courseid = b.courseid ' +
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

  async _insertCourse(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'call add_default_course(' +
         userInfo.userId + ', ' +
         '"' + postData.coursename + '"' +
      ')';
    
    queryResults = await this._dbManager.dbQuery(query);    
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data[0][0];
      
    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }
    
    return result;
  }

  async _insertOptionValues(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 

    var query, queryResults;
    
    query = 
      'call add_default_optionvalues(' +
         '"' + postData.tableName + '" ' +
      ')';
    
    queryResults = await this._dbManager.dbQuery(query);    
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data[0][0];
      
    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
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
          'coursename = "' + postData.coursename + '", ' +
          'ap = ' + postData.ap + ', ' +
          'haspasswords = ' + postData.haspasswords + ' ' +
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
      if (queryResults.details.toLowerCase().includes('duplicate entry')) {
        result.details = 'duplicate';
      } else {
        result.details = queryResults.details;
      }
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
  
  async _deleteOptionValues(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'delete from ' + postData.tableName + ' ' +
      'where ' + postData.columnName + ' = ' + postData.columnValue;

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
  
  async _getMailMessage(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var pugFileName = '';
    if (postData.audience == 'student') {
      pugFileName = this._pugPath + '/mixins/mailmessage/student_mailmessage.pug';
    } else if (postData.audience == 'mentor') {
      pugFileName = this._pugPath + '/mixins/mailmessage/mentor_mailmessage.pug';
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
  
  async _getOptionValues(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    var queryChoices = {
      exams:
        'select a.examid, a.examdescription, b.usagecount ' +
        'from exam as a ' +
        'left outer join (' +
          'select examid, count(examid) as usagecount ' +
          'from configuration ' +
          'group by examid ' +
        ') as b ' +
          'on a.examid = b.examid ' +
        'order by a.examdescription ',

      proctoring:
        'select a.proctoringid, a.proctoringdescription, b.usagecount ' +
        'from proctoring as a ' +
        'left outer join (' +
          'select proctoringid, count(proctoringid) as usagecount ' +
          'from configuration ' +
          'group by proctoringid ' +
        ') as b ' +
          'on a.proctoringid = b.proctoringid ' +
        'order by a.proctoringdescription ',

      retakes:
        'select a.retakeid, a.retakedescription, b.usagecount ' +
        'from retake as a ' +
        'left outer join (' +
          'select retakeid, count(retakeid) as usagecount ' +
          'from configuration ' +
          'group by retakeid ' +
        ') as b ' +
          'on a.retakeid = b.retakeid ' +
        'order by a.retakedescription ',

      resubmission:
        'select a.resubmissionid, a.resubmissiondescription, b.usagecount ' +
        'from resubmission as a ' +
        'left outer join (' +
          'select resubmissionid, count(resubmissionid) as usagecount ' +
          'from configuration ' +
          'group by resubmissionid ' +
        ') as b ' +
          'on a.resubmissionid = b.resubmissionid ' +
        'order by a.resubmissiondescription ',
          
      general:
        'select a.generalkeypointid, a.ap, a.student, a.mentor, a.keypoint, b.usagecount ' +
        'from generalkeypoint as a, coursecount as b ' +
        'where a.ap = b.ap ' + 
        'order by a.generalkeypointid '
    };
    
    query = queryChoices[postData.editorKey];
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    
    if (postData.editorKey == 'general') {
      for (var i = 0; i < queryResults.data.length; i++) {
        var row = queryResults.data[i];
        if (!(row.ap || row.student || row.mentor)) {
          queryResults.data[i].usagecount = 0;
        }
      }
    }
  
    var tableLookup = {
      "exams": 'exam',
      "proctoring": 'proctoring',
      "retakes": 'retake',
      "resubmission": 'resubmission',
      "general": 'generalkeypoint'
    };
      
    var tableInfo = await this._getTableInfo(tableLookup[postData.editorKey]);
    
    if (tableInfo) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = {};
      result.data.tabledata = queryResults.data;
      result.data.tableinfo = tableInfo;
      
    } else {
      result.details = 'failed to get table info for ' + postData.editorKey;
    }

    return result;
  }

  async _getTableInfo(tableName) {
    var result = null; 
    
    var query, queryResults;
    
    var query =
        'select ' + 
          't.table_name, t.column_name, t.data_type, t.column_type, ' + 
          't.is_nullable, t.column_key, t.character_maximum_length ' +
        'from options_tableinfo as t ' +
        'where t.table_name = "' + tableName + '" ' +
        'order by t.column_name ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success) return result;

    var collated = {};
    for (var i = 0; i < queryResults.data.length; i++) {
      var row = queryResults.data[i];
      
      collated[row.column_name] = {
        "tableName": row.table_name,
        "columnName": row.column_name,
        "primaryKey": row.column_key == 'PRI',
        "dataType": row.data_type,
        "columnType": row.column_type,
        "nullable": row.is_nullable == 'YES',
        "maxColumnLength": row.character_maximum_length
      }
    }
    
    result = collated;

    return result;
  }

  async _updateOptionValues(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    query = 
      'update ' + postData.tableName + ' ' +
      'set ' +
        postData.columnName + ' = ' + postData.columnValue + ' ' +
      'where ' +
        postData.primaryKey.columnName + ' = ' + postData.primaryKey.columnValue;
        

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
// other support methods
//---------------------------------------------------------------       
  _renderFail() {
    res.send('cannot access page: welcome letter configuration')    
  }  
   
  _markdownToHTML(str) {
    var reader = new this._commonmark.Parser();
    var writer = new this._commonmark.HtmlRenderer();
    
    var parsed = reader.parse(str);
    var result = writer.render(parsed);
    
    result = result.replace(/%%(.*?)%%/g, '<span style=\"background-color: #FFFF00\">$1</span>');
    
    result = result.replace(/\x0A/g, '');  // remove line feeds
    result = result.replace(/^<p>(.*)<\/p>$/, '$1'); // remove enclosing paragraph tags

    return result;
  }  
}
