"use strict";
//---------------------------------------------------------------
// server-side DB update interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminUpdate = class {
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
  async doUpdate(params, postData) {
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
      
    } else if (params.queryName == 'schoolyear-calendar') {
      dbResult = await this._updateSchoolYearCalendar(params, postData);
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._updateTip(params, postData);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._updateCategory(params, postData);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._updateTipCategory(params, postData);
      
    } else if (params.queryName == 'tipusers') {
      dbResult = await this._updateTipUser(params, postData);
      
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

    var sharedScheduleOption = 0;
    if (postData.sharedschedule == '1') sharedScheduleOption = 1;
    var pushRemindersOption = 0;
    if (postData.pushreminders == '1') pushRemindersOption = 1;
    
    var query = 'update user ' + 
                'set ' + 
                  'usershortname = "' + postData.usershortname + '", ' +
                  'username = "' + postData.username + '", ' +
                  'email = "' + postData.email + '", ' +
                  'sharedschedule = ' + sharedScheduleOption + ', ' +
                  'pushreminders = ' + pushRemindersOption + ' ' +
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
  
  async _updateSchoolYearCalendar(params, postData) {
    var result = this._queryFailureResult();

    var queryList = {};
    for (var i = 0; i < postData.updateData.length; i++) {
      var item = postData.updateData[i];
      queryList[item.calendarid] = 
        'update calendar ' +
        'set firstday = "' + item.firstday + '" ' +
        'where calendarid = ' + item.calendarid + ' '
    }
        
    var queryResults = await this._dbQueries(queryList);

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
    
    var query = 'update tip2 ' +
                'set ' +
                  'tiptext = "' + postData.tiptext + '", ' + 
                  'common = ' + (postData.common ? 1 : 0) + ' ' + 
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
    
  async _updateCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update category ' +
                'set ' +
                  'categorytext = "' + postData.categorytext + '" ' + 
                'where categoryid = ' + postData.categoryid;
    
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

  async _updateTipCategory(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update tipcategory ' +
                'set ' +
                  'tipid = ' + postData.tipid + ', ' + 
                  'categoryid = ' + postData.categoryid + ' ' +
                'where tipcategoryid = ' + postData.tipcategoryid;
    
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
  
  async _updateTipUser(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'update tipuser ' +
                'set ' +
                  'tipid = ' + postData.tipid + ', ' + 
                  'userid = ' + postData.userid + ' ' +
                'where tipuserid = ' + postData.tipuserid;
    
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
