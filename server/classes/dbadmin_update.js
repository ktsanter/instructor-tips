"use strict";
//---------------------------------------------------------------
// server-side DB update interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminUpdate = class {
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
  async doUpdate(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'privileges') {
      dbResult = await this._updatePrivilege(params, postData);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._updateUser(params, postData);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._updateUserPrivilege(params, postData);
      
    } else if (params.queryName == 'termgroups') {
      dbResult = await this._updateTermGroup(params, postData);
      
    } else if (params.queryName == 'terms') {
      dbResult = await this._updateTerm(params, postData);
      
    } else if (params.queryName == 'courses') {
      dbResult = await this._updateCourse(params, postData);
      
    } else if (params.queryName == 'usercourses') {
      dbResult = await this._updateUserCourse(params, postData);
      
    } else if (params.queryName == 'calendars') {
      dbResult = await this._updateCalendar(params, postData);
      
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

//---------------------------------------------------------------
// specific query functions
//---------------------------------------------------------------
  async _updatePrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update privilege ' +
                'set ' +
                  'privilegename = "' + postData.privilegename + '" ' + 
                'where privilegeid = ' + postData.privilegeid;
    
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
  
  async _updateUser(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update user ' + 
                'set ' + 
                  'usershortname = "' + postData.usershortname + '", ' +
                  'username = "' + postData.username + '" ' +
                'where userid = ' + postData.userid;
                
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
    
  async _updateUserPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update userprivilege ' + 
                'set ' + 
                  'userid = ' + postData.userid + ', ' +
                  'privilegeid = ' + postData.privilegeid + ' ' +
                'where userprivilegeid = ' + postData.userprivilegeid;
    
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

  async _updateTermGroup(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update termgroup ' +
                'set ' +
                  'termgroupname = "' + postData.termgroupname + '", ' +
                  'termlength = ' + postData.termlength + ' ' +
                'where termgroupid = ' + postData.termgroupid;
    
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

  async _updateTerm(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update term ' +
                'set ' +
                  'termname = "' + postData.termname + '", ' +
                  'termgroupid = ' + postData.termgroupid + ' ' +
                'where termid = ' + postData.termid;
    
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

  async _updateCourse(params, postData) {
    var result = this._queryFailureResult();

    var query = 'update course ' +
                'set ' + 
                  'coursename = "' + postData.coursename + '", ' + 
                  'ap = ' + postData.ap + ' ' +
                'where courseid = ' + postData.courseid;

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
  
  async _updateUserCourse(params, postData) {
    var result = this._queryFailureResult();

    var query = 'update usercourse ' +
                'set ' +
                  'userid = ' + postData.userid + ', ' + 
                  'courseid = ' + postData.courseid + ', ' +
                  'termgroupid = ' + postData.termgroupid + ' ' +
                'where coursetermid = ' + postData.coursetermid;

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

  async _updateCalendar(params, postData) {
    var result = this._queryFailureResult();

    var query = 'update calendar ' +
                'set ' +
                  'termid = ' + postData.termid + ',' +
                  'schoolyear = "' + postData.schoolyear + '", ' +
                  'week = ' + postData.week + ', ' +
                  'firstday = "' + postData.firstday + '", ' +
                  'starttype = "' + postData.starttype + '" ' +
                'where calendarid = ' + postData.calendarid;
                
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
}
