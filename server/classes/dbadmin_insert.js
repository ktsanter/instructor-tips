"use strict";
//---------------------------------------------------------------
// server-side DB insert interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminInsert = class {
  constructor(mariadb, dbName, userManagement) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: 'localhost',
      user: 'root',
      password: 'SwordFish002',
      connectionLimit: 5  
    });
    
    this._dbName = dbName;
    this._userManagement = userManagement;
  }
  
//---------------------------------------------------------------
// query dispatcher
//---------------------------------------------------------------
  async doInsert(params, postData) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'privileges') {
      dbResult = await this._insertPrivilege(params, postData);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._insertUser(params, postData);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._insertUserPrivilege(params, postData);
      
    } else if (params.queryName == 'termgroups') {
      dbResult = await this._insertTermGroup(params, postData);
      
    } else if (params.queryName == 'terms') {
      dbResult = await this._insertTerm(params, postData);
      
    } else if (params.queryName == 'courses') {
      dbResult = await this._insertCourse(params, postData);
      
    } else if (params.queryName == 'usercourses') {
      dbResult = await this._insertUserCourse(params, postData);
      
    } else if (params.queryName == 'calendars') {
      dbResult = await this._insertCalendar(params, postData);
      
    } else if (params.queryName == 'schoolyear-calendar') {
      dbResult = await this._insertSchoolYearCalendar(params, postData);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._insertCategory(params, postData);
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._insertTip(params, postData);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._insertTipCategory(params, postData);
      
    } else if (params.queryName == 'tipusers') {
      dbResult = await this._insertTipUser(params, postData);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// general query functions
//---------------------------------------------------------------
  _queryFailureResult() {
    return {success: false, details: 'db insert failed', data: null};
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

//---------------------------------------------------------------
// specific query functions
//---------------------------------------------------------------
  async _insertPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into privilege (privilegename) ' +
                'values (' +
                  '"' + postData.privilegename + '"' + 
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
  
  async _insertUser(params, postData) {
    var result = this._queryFailureResult();
    
    var sharedScheduleOption = 0;
    if (postData.sharedschedule == '1') sharedScheduleOption = 1;
    var pushRemindersOption = 0;
    if (postData.pushreminders == '1') pushRemindersOption = 1;
    
    var query = 'insert into user (usershortname, username, email, sharedschedule, pushreminders) ' +
                'values (' +
                  '"' + postData.usershortname + '", ' + 
                  '"' + postData.username + '",' + 
                  '"' + postData.email + '", ' +
                  sharedScheduleOption + ', ' +
                  pushRemindersOption +
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
    
  async _insertUserPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into userprivilege (userid, privilegeid) ' +
                'values (' +
                  '"' + postData.userid + '", ' + 
                  '"' + postData.privilegeid + '"' + 
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

  async _insertTermGroup(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into termgroup (termgroupname, termlength) ' +
                'values (' +
                  '"' + postData.termgroupname + '", ' + 
                  '"' + postData.termlength + '"' + 
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

  async _insertTerm(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into term (termname, termgroupid) ' +
                'values (' +
                  '"' + postData.termname + '", ' + 
                  '"' + postData.termgroupid + '"' + 
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

  async _insertCourse(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into course (coursename, ap) ' +
                'values (' +
                  '"' + postData.coursename + '", ' + 
                  '' + postData.ap + '' + 
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
  
  async _insertUserCourse(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into usercourse (userid, courseid, termgroupid) ' +
                'values (' +
                  '' + postData.userid + ', ' +
                  '' + postData.courseid + ', ' + 
                  '' + postData.termgroupid + '' + 
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
  
  async _insertCalendar(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into calendar (termid, schoolyear, week, firstday, starttype) ' +
                'values (' +
                  '' + postData.termid + ', ' +
                  '"' + postData.schoolyear + '", ' + 
                  '' + postData.week + ', ' + 
                  '"' + postData.firstday + '", ' + 
                  '"' + postData.starttype + '" ' + 
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
  
  async _insertSchoolYearCalendar(params, postData) {
    var result = this._queryFailureResult();
    var startTypeList = {
      'semester': ['start1', 'start2', 'ap'],
      'trimester':['start1', 'start2'],
      'summer': ['start1']
    }
    
    var query = 
      'select ' +
        'tg.termgroupname, tg.termlength, ' +
        't.termid, t.termname ' +
      'from termgroup as tg, term as t ' +
      'where tg.termgroupid = t.termgroupid ';
      
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      var schoolYearName = postData.schoolyear;
      var defaultFirstDay = '2000-01-01';
      var queryList = {};
      
      for (var i = 0; i < queryResults.data.length; i++) {
        var termInfo = queryResults.data[i];
        var arrStartTypes = startTypeList[termInfo.termgroupname];
        
        for (var j = 0; j < arrStartTypes.length; j++) {
          var startType = arrStartTypes[j];
          
          for (var week = 1; week <= termInfo.termlength; week++) {
            queryList[i + '-' + j + '-' + week] = 
              'insert into calendar (termid, schoolyear, week, firstday, starttype) ' +
              'values ( ' +
                termInfo.termid + ', ' +
                '"' + schoolYearName + '", ' +
                week + ', ' +
                '"' + defaultFirstDay + '", ' +
                '"' + startType + '" ' +                
              ') ';
          }

          queryList[i + '-' + j + '-start'] = 
            'insert into calendar (termid, schoolyear, week, firstday, starttype) ' +
            'values ( ' +
              termInfo.termid + ', ' +
              '"' + schoolYearName + '", ' +
              998 + ', ' +
              '"' + defaultFirstDay + '", ' +
              '"' + startType + '" ' +                
            ') ';
          

          queryList[i + '-' + j + '-end'] = 
            'insert into calendar (termid, schoolyear, week, firstday, starttype) ' +
            'values ( ' +
              termInfo.termid + ', ' +
              '"' + schoolYearName + '", ' +
              999 + ', ' +
              '"' + defaultFirstDay + '", ' +
              '"' + startType + '" ' +                
            ') ';          
        }
      }
      
      queryResults = await this._dbQueries(queryList);
    }
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _insertTip(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into tip2 (tiptext, common) ' +
                'values (' +
                  '"' + postData.tiptext + '", ' + 
                  (postData.common ? 1 : 0) + ' ' +
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
  
  async _insertCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into category (categorytext) ' +
                'values (' +
                  '"' + postData.categorytext + '"' + 
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
  
  async _insertTipCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into tipcategory (tipid, categoryid) ' +
                'values (' +
                  postData.tipid + ', ' + 
                  postData.categoryid + 
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
  
  async _insertTipUser(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'insert into tipuser (tipid, userid) ' +
                'values (' +
                  postData.tipid + ', ' + 
                  postData.userid + 
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
}
