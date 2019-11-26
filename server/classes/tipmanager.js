"use strict";
//---------------------------------------------------------------
// tip management DB interface
//---------------------------------------------------------------
// TODO: add logic based on user privileges
//---------------------------------------------------------------
const internal = {};

module.exports = internal.TipManager = class {
  constructor(mariadb, dbName) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: 'localhost',
      user: 'root',
      password: 'SwordFish002',
      connectionLimit: 5  
    });
    
    this._dbName = dbName;
  }
  
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();

    // tip manager queries
    if (params.queryName == 'tipcourses-usercourses') {
      dbResult = await this._getUserCourses(params, postData, userInfo);
      
    } else if (params.queryName == 'tipschedule') {
      dbResult = await this._getTipSchedule(params, postData, userInfo);
      
    } else if (params.queryName == 'tipschedule-tiplist') {
      dbResult = await this._getTipScheduleTipList(params, postData, userInfo);
      
    } else if (params.queryName == 'tipschedule-addtip') {
      dbResult = await this._addTipToSchedule(params, postData, userInfo);
      
    } else if (params.queryName == 'tipedit') {
      dbResult = await this._getTipEditData(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
   if (params.queryName == 'tip') {
      dbResult = await this._insertTip(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'tipcourses-usercourses') {
      dbResult = await this._updateUserCourse(params, postData, userInfo);

    } else if (params.queryName == 'tip') {
      dbResult = await this._updateTip(params, postData);

    } else if (params.queryName == 'singletipstatus') {
      dbResult = await this._updateSingleTipStatus(params, postData, userInfo);
            
    } else if (params.queryName == 'tipschedule-updatetiptext') {
      dbResult = await this._updateTiptext(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
   if (params.queryName == 'tip') {
      dbResult = await this._deleteTip(params, postData, userInfo);
      
    } else if (params.queryName == 'tipschedule-unmaptip') {
      dbResult = await this._unmapTip(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// general query methods
//---------------------------------------------------------------
  _queryFailureResult() {
    return {success: false, details: 'db query failed', data: null, constraints: null};
  }
      
  async _dbQueries(queryList) {
    var queryResults = {
      success: true,
      details: 'queries succeeded',
      data: {}
    };
    
    for (var key in queryList) {
      var singleResult = await this._dbQuery(queryList[key]);
      if (!singleResult.success) {
        queryResults.success = false;
        queryResults.details = 'DB query failed (' + key +') ' + singleResult.details;
        
      } else {
        queryResults.data[key] = singleResult.data;
      }
    }
          
    return queryResults;
  }  

  async _dbQuery(sql) {
    var conn;
    var dbResult = this._queryFailureResult();

    try {
        conn = await this._pool.getConnection();
        await conn.query('USE ' + this._dbName);
        const rows = await conn.query(sql);
        dbResult.success = true;
        dbResult.details = 'db request succeeded';
        dbResult.data = [];
        for (var i = 0; i < rows.length; i++) {
          dbResult.data.push(rows[i]);
        }
        
    } catch (err) {
      dbResult.details = err;
      //throw err;
      
    } finally {
      if (conn) conn.release();
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getUserCourses(params, postData, userInfo) {
    var result = this._queryFailureResult();   

    var queryList = {};
    queryList.usercourses = 
      'select ' +
        'usercourse.usercourseid, usercourse.courseid, usercourse.termgroupid, ' +
        'course.coursename, course.ap, ' + 
        'termgroup.termgroupname ' +
      'from usercourse, course, termgroup ' +
      'where usercourse.courseid = course.courseid ' +
        'and usercourse.termgroupid = termgroup.termgroupid ' +
        'and usercourse.userid = ' + userInfo.userId + ' ';
      
    queryList.courses = 
      'select courseid, coursename, ap ' +
        'from course ' +
        'order by coursename ';
        
    queryList.termgroups = 
      'select termgroupid, termgroupname ' +
      'from termgroup ' +
      'order by termgroupid ';
              
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';

      result.usercourses = queryResults.data.usercourses;
      result.courses = queryResults.data.courses;
      result.termgroups = queryResults.data.termgroups;

    } else {
      result.details = queryResults.details;
    }
        
    return result;
  }

  async _getTipSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult(); 

    var queryList = {};
    var showTipStatus = false;
    
    if (postData.adm_allcourse) {
      queryList.tipschedule = this._getQuery_AdminAllCourse(postData, userInfo);
      
    } else if (postData.adm_course) {
      queryList.tipschedule = this._getQuery_AdminUserCourse(postData, userInfo);
      
    } else if (postData.allcourse) {
      queryList.tipschedule = this._getQuery_AllCourse(postData, userInfo);
      
    } else if (postData.course) {
      showTipStatus = true;
      queryList.tipschedule = this._getQuery_UserCourse(postData, userInfo);
    }

    queryList.usercourse =
      'SELECT usercourseid ' +
      'FROM usercourse ' +
      'WHERE userid = ' + userInfo.userId + ' ' +
        'AND courseid IN (SELECT courseid FROM course WHERE coursename = "' + postData.coursename + '") ' +
        'AND termgroupid IN (SELECT termgroupid FROM termgroup WHERE termgroupname = "' + postData.termgroupname + '") ';
        
    queryList.termlength = 
      'select termlength ' +
      'from termgroup ' +
      'where termgroupname = "' + postData.termgroupname + '" ';
      
    queryList.calendar =
      'select c.schoolyear, tg.termgroupname, t.termname, c.week, c.firstday, c.starttype ' +
      'from calendar as c, termgroup as tg, term as t ' +
      'where c.termid = t.termid ' +
        'and t.termgroupid = tg.termgroupid ' +
        'and c.schoolyear = "' + postData.calendar.schoolyear + '" ' +
        'and tg.termgroupname = "' + postData.termgroupname + '" ' +
        'and t.termname = "' + postData.calendar[postData.termgroupname] + '" ';
        
    queryList.isapcourse = 
      'select ap from ' +
      'course ' +
      'where coursename = "' + postData.coursename + '" ';
      
    var queryResults = await this._dbQueries(queryList);
          
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.tipschedule = queryResults.data.tipschedule;
      result.termlength = queryResults.data.termlength[0].termlength;
      result.calendar = queryResults.data.calendar;
      result.showtipstatus = showTipStatus;
      
      result.isapcourse = false;
      if (postData.course) {
        result.usercourseexists = (queryResults.data.usercourse.length > 0);
        if (!postData.adm_allcourse && !postData.adm_course) {
          result.isapcourse = (queryResults.data.isapcourse.length > 0 && queryResults.data.isapcourse[0].ap == 1);
        }
      } else {
        result.usercourseexists = true;
      }

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  _getQuery_AdminAllCourse(postData, userInfo) {
    var query = 
      'select mappedtipid, tiptext, week ' +
      'from viewmappedtip ' +
      'where userid is null ' +
        'and courseid is null ' +
        'and termgroupname = "' + postData.termgroupname + '" ';
      
    return query;
  }
  
  _getQuery_AdminUserCourse(postData, userInfo) {
    var query = 
      'select mappedtipid, tiptext, week ' +
      'from viewmappedtip ' +
      'where userid is null ' +
        'and coursename = "' + postData.adm_coursename + '" ' +
        'and termgroupname = "' + postData.termgroupname + '" ';
      
    return query;
  }

  _getQuery_AllCourse(postData, userInfo) {
    var query = 
      'select vmt.mappedtipid, vmt.userid, vmt.username, vmt.courseid, vmt.coursename, vmt.termgroupid, vmt.termgroupname, vmt.tiptext, vmt.week ' +
      'FROM viewmappedtip as vmt ' +
      'WHERE userid = ' + userInfo.userId + ' ' +
        'AND courseid IS NULL ' +
        'AND termgroupname = "' + postData.termgroupname + '" ';
        
    return query;
  }

  _getQuery_UserCourse(postData, userInfo) {
    var tipstatusCondition = this._buildTipSchedulingConstraints(postData);
    
    var query = 
      'select vmt.mappedtipid, vmt.userid, vmt.username, vmt.courseid, vmt.coursename, vmt.termgroupid, vmt.termgroupname, vmt.tiptext, vmt.week, uts.tipstatusname, uts.usertipstatusid ' +
      'from viewmappedtip as vmt ' +
      'left outer join ( ' +
        'select tipstatusname, mappedtipid, for_usercourseid, userid, usertipstatusid ' +
        'from usertipstatus ' +
      ') as uts on ( ' +
        'vmt.mappedtipid = uts.mappedtipid ' +
        'and uts.userid = ' + userInfo.userId + ' ' +
        'and uts.for_usercourseid = (' + 
          'select usercourseid ' +
          'from usercourse, course ' +
          'where usercourse.courseid = course.courseid ' +
            'and usercourse.userid = ' + userInfo.userId + ' ' +
            'and course.coursename = "' + postData.coursename + '" ' +
            'and usercourse.termgroupid = ( ' +
              'select termgroupid  ' +
              'from termgroup ' +
              'where termgroupname = "' + postData.termgroupname + '" ' +
            ') ' +
          ') ' +
      ') ' +
      'where (vmt.userid IS NULL or vmt.userid = ' + userInfo.userId + ')  ' +
        'and (vmt.courseid is NULL or vmt.coursename = "' + postData.coursename + '")  ' +
        'and vmt.termgroupname = "' + postData.termgroupname + '" ' +
        tipstatusCondition;
    
    return query;
  }

  _buildTipSchedulingConstraints(postData) {
    var statusA = '';
    var statusB = '';
    if (postData.unspecified) {
      statusA = 'uts.tipstatusname is null ';      
    }
    if (postData.scheduled || postData.completed) {
      statusB = 'uts.tipstatusname in (';
      if (postData.scheduled && postData.completed) {
        statusB += '"scheduled", "completed" ';
      } else if (postData.scheduled) {
        statusB += '"scheduled"';
      } else if (postData.completed) {
        statusB += '"completed"';
      }
      statusB += ') ';
    }
    
    var tipstatusCondition = ''
    if (statusA != '' && statusB != '') {
      tipstatusCondition = '(' + statusA + ' OR ' + statusB + ')';
    } else if (statusA != '') {
      tipstatusCondition = statusA;
    } else if (statusB != '') {
      tipstatusCondition = statusB;
    }
    
    if (tipstatusCondition == '') tipstatusCondition = '(FALSE) ';
    tipstatusCondition = ' AND ' + tipstatusCondition;
    
    return tipstatusCondition;
  }
  
//----------------------------------------------------------
  async _getTipScheduleTipList(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList = {};
    
    if (postData.adm_allcourse || postData.adm_course) {
      queryList.tips = 
        'select tipid, tiptext ' +
        'from tip ' +
        'where userid is null ' +
        'and tipid not in ( ' +
          'select tipid ' +
          'from viewmappedtip ' +
          'where ( ' +
            '(userid is null and courseid is null and week = ' + postData.week + ') or ' +
            '(userid is not null) or ' +
            '(courseid is not null) ' +
          ') ' +
        ') ';
      
    } else if (postData.course) {
      queryList.tips = 
        'select tipid, tiptext ' +
        'from tip ' +
        'where userid = ' + userInfo.userId + ' ' +
        'and tipid not in ( ' +
          'select tipid ' +
          'from viewmappedtip ' +
          'where ( ' +
            '(userid = ' + userInfo.userId + ' and coursename = "' + postData.coursename + '" and week = ' + postData.week + ') or ' +
            '(userid is null) or ' +
            '(courseid is null) ' +
          ') ' +
        ') ';
      
    } else {
      queryList.tips = 
        'select tipid, tiptext ' +
        'from tip ' +
        'where userid = ' + userInfo.userId + ' ' +
        'and tipid not in ( ' +
          'select tipid  ' +
          'from viewmappedtip ' +
          'where ( ' +
            '(userid is null) or ' +
            '(courseid is null) or ' +
            '(userid = ' + userInfo.userId + ' and coursename = "' + postData.coursename + '" and week = ' + postData.week + ') ' +
          ') ' +
        ') ';
    }
      
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {   
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.tips;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
//----------------------------------------------------------
  async _addTipToSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var query;
    var queryResults;
    
    var filter = postData.filter;
    var weekNumber = postData.week;
        
    var tipId;
    var userIdSelection;
    var courseIdSelection;

    if (postData.addData.addType == 'existing') {
      tipId = postData.addData.addValue;

    } else {
      var tipText = postData.addData.addValue;
      
      if (filter.adm_allcourse || filter.adm_course) {
        userIdSelection = ' NULL '
      } else {
        userIdSelection = ' ' + userInfo.userId + ' ';
      }
      
      query = 
        'insert into tip (tiptext, userid) ' +
        'select ' +
          '"' + tipText + '", ' +
          userIdSelection;
          
      queryResults = await this._dbQuery(query);
      
      if (queryResults.success) {
        if (filter.adm_allcourse || filter.adm_course) {
          userIdSelection = ' userid is NULL '
        } else {
          userIdSelection = ' userid = ' + userInfo.userId + ' ';
        }
        
        query = 
          'select tipid ' +
          'from tip ' +
          'where tiptext = "' + tipText + '" ' +
            'and ' + userIdSelection;
    
        queryResults = await this._dbQuery(query);
        if (queryResults.success) {
          tipId = queryResults.data[0].tipid;
        }          
      }
    }

    if (tipId) {   
      if (filter.adm_allcourse) {
        userIdSelection = ' userid is NULL ';
        courseIdSelection = ' courseid is NULL ';
        
      } else if (filter.adm_course) {
        userIdSelection = ' userid is NULL ';
        courseIdSelection = 'courseid in (select courseid from course where coursename = "' + filter.adm_coursename + '") ';
        
      } else if (filter.allcourse) {
        userIdSelection = ' userid = ' + userInfo.userId + ' ';
        courseIdSelection = ' courseid is NULL ';
        
      } else {
        userIdSelection = ' userid = ' + userInfo.userId + ' ';
        courseIdSelection = 'courseid in (select courseid from course where coursename = "' + filter.coursename + '") ';
      }

      query = 
        'INSERT INTO mappedtip (usercourseid, tipid, week) ' +
          'SELECT usercourseid, ' + tipId + ', ' + weekNumber + ' ' +
          'from usercourse ' +
          'where ' + courseIdSelection + ' ' +
          'and ' + userIdSelection + ' ' +
          'and termgroupid in (select termgroupid from termgroup where termgroupname = "' + filter.termgroupname + '") ';
        
      queryResults = await this._dbQuery(query);
      
      if (queryResults.success) {   
        result.success = true;
        result.details = 'query succeeded';
        result.data = queryResults.data.tips;

      } else {
        result.details = queryResults.details;
      }
    }
    
    return result;
  }
  
//----------------------------------------------------------
  async _getTipEditData(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList = {};
    
    if (postData.shared) {
      queryList.shared = 
        'SELECT tipid, tiptext, NULL as userid, NULL as username ' +
        'FROM tip ' + 
        'WHERE userid IS NULL ' +
        '  AND tiptext LIKE "%' + postData.searchtext + '%" ' +
        'ORDER BY tiptext ';
    }   
    
    if (postData.personal) {
      queryList.personal = 
        'SELECT tipid, tiptext, tip.userid, username ' +
        'FROM tip, user ' +
        'where tip.userid = user.userid ' + 
          'and tiptext LIKE "%' + postData.searchtext + '%" ' +
          'AND tip.userid = ' + userInfo.userId + ' ' + 
        'ORDER BY tiptext, username ';
    }
    
    if (postData.personal_notowned) {
      queryList.personal_notowned = 
        'SELECT tipid, tiptext, tip.userid, username ' +
        'FROM tip, user ' +
        'where tip.userid = user.userid ' + 
          'and tiptext LIKE "%' + postData.searchtext + '%" ' +
          'AND tip.userid != ' + userInfo.userId + ' ' + 
        'ORDER BY tiptext, username ';
    }
    
    if (postData.shared) {
      queryList.users = 
        'SELECT userid, username ' +
        'FROM user ' +
        'ORDER BY username ';
        
    } else {
      queryList.users = 
        'SELECT userid, username ' +
        'FROM user ' +
        'WHERE userid = ' + userInfo.userId + ' ' +
        'ORDER BY username ';
    }
      
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      var combinedRows = [];
      for (var key in queryResults.data) {
        if (key != 'users') {
          var qdata = queryResults.data[key];
          for (var i = 0; i < qdata.length; i++) {
            combinedRows.push(qdata[i]);
          }
        }
      }
   
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipid';
      result.insertUpdateFields = [
        {tiptext: 'textarea'},
        {userid: 'foreignkey'}
      ]
      result.displayFields = ['tiptext', 'username'];
      result.data = combinedRows;
      
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username', allownull: postData.shared}
        },
        users: queryResults.data.users
      };

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
    async _insertTip(params, postData, userInfo) {
    var result = this._queryFailureResult();
    
    var userId = userInfo.userId;
    if (userInfo.privilegeLevel == 'admin' || userInfo.privilegeLevel == 'superadmin') {
      userId = postData.userid;
    }
    
    var query = 'insert into tip (tiptext, userid) ' +
                'values (' +
                  '"' + postData.tiptext + '", ' + 
                  userId + ' ' + 
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateUserCourse(params, postData, userInfo) {
    var result = this._queryFailureResult();
     
    var query;
    
    if (postData.selected) {
      query =
        'insert into usercourse (userid, courseid, termgroupid) ' +
        'values ( ' +
          userInfo.userId + ', ' +
          postData.course.courseid + ', ' +
          postData.termgroup.termgroupid + ' ' +
        ') ';
        
    } else {
      query =
        'delete from usercourse ' +
        'where userid = ' + userInfo.userId + ' ' +
          'and courseid = ' + postData.course.courseid + ' ' +
          'and termgroupid = ' + postData.termgroup.termgroupid + ' ';
    }
             
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _updateTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'update tip ' +
                'set ' +
                  'tiptext = "' + postData.tiptext + '", ' +
                  'userid = ' + postData.userid + ' ' +
                'where tipid = ' + postData.tipid;

    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _updateSingleTipStatus(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;

    if (postData.tipstatusname == null) {
      queryResults = await this._deleteSingleTipStatus(params, postData, userInfo);
   
    } else {
      if (postData.usertipstatusid == null) {
        query =
          'insert into usertipstatus (mappedtipid, userid, tipstatusname, for_usercourseid) ' +
          'select ' +
            postData.mappedtipid + ', ' + 
            userInfo.userId + ', ' +
            '"' + postData.tipstatusname + '", ' +
            'usercourseid ' + 
            'from usercourse ' +
            'where userid = ' + userInfo.userId + ' ' +
            'and courseid in ( ' +
            '  select courseid from course where coursename = "' + postData.for_coursename + '" ' +
            '  and termgroupid = ' + postData.termgroupid + 
            ') ';
          queryResults = await this._dbQuery(query);
      
      } else {
        query =
          'update usertipstatus ' +
          'set tipstatusname = "' + postData.tipstatusname + '" ' +
          'where usertipstatusid = ' + postData.usertipstatusid;
        queryResults = await this._dbQuery(query);
      }
    }
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
   async _updateTiptext(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;
    
    query =
      'update tip ' +
      'set tiptext = "' + postData.tiptext + '" ' +
      'where tipid in ( ' +
        'select tipid ' +
        'from mappedtip ' +
        'where mappedtipid = ' + postData.mappedtipid + ' ' +
      ') ';

    queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }
      
//---------------------------------------------------------------
// specific delete methods
//---------------------------------------------------------------
  async _deleteTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tip ' +
                'where tipid = ' + postData.tipid;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _unmapTip(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var query;
    var queryResults;
    
    query = 
      'delete from mappedtip ' +
      'where mappedtipid = ' + postData.mappedtipid + ' ';
    
    queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }

    return result;    
  }

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  async _deleteSingleTipStatus(params, postData, userInfo) {
    var query =
      'delete from usertipstatus ' +
      'where usertipstatusid = ' + postData.usertipstatusid;
    
    return await this._dbQuery(query);
  }
}
