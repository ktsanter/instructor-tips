"use strict";
//---------------------------------------------------------------
// server-side DB insert interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminInsert = class {
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
// query dispatcher
//---------------------------------------------------------------
  async doInsert(params, postData, userInfo) {
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
        await conn.query(sql);
        dbResult.success = true;
        dbResult.details = 'db request succeeded';
        
    } catch (err) {
      dbResult.details = err;
      //throw err;
      
    } finally {
      if (conn) conn.release();
    }
    
    return dbResult;
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
}
