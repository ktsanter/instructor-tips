"use strict";
//---------------------------------------------------------------
// server-side DB delete interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminDelete = class {
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
  async doDelete(params, postData) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'privileges') {
      dbResult = await this._deletePrivilege(params, postData);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._deleteUser(params, postData);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._deleteUserPrivilege(params, postData);
      
    } else if (params.queryName == 'termgroups') {
      dbResult = await this._deleteTermGroup(params, postData);
      
    } else if (params.queryName == 'terms') {
      dbResult = await this._deleteTerm(params, postData);
      
    } else if (params.queryName == 'courses') {
      dbResult = await this._deleteCourse(params, postData);
      
    } else if (params.queryName == 'usercourses') {
      dbResult = await this._deleteUserCourse(params, postData);
      
    } else if (params.queryName == 'calendars') {
      dbResult = await this._deleteCalendar(params, postData);
      
    } else if (params.queryName == 'schoolyear-calendar') {
      dbResult = await this._deleteSchoolYearCalendar(params, postData);
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._deleteTip(params, postData);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._deleteCategory(params, postData);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._deleteTipCategory(params, postData);
      
    } else if (params.queryName == 'tipusers') {
      dbResult = await this._deleteTipUser(params, postData);
      
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
  async _deletePrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from privilege ' +
                'where privilegeid = ' + postData.privilegeid;
    
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
  
  async _deleteUser(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from user ' +
                'where userid = ' + postData.userid;
    
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
    
  async _deleteUserPrivilege(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from userprivilege ' +
                'where userprivilegeid = ' + postData.userprivilegeid;
    
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

  async _deleteTermGroup(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from termgroup ' +
                'where termgroupid = ' + postData.termgroupid;
    
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

  async _deleteTerm(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from term ' +
                'where termid = ' + postData.termid;
    
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

  async _deleteCourse(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from course ' + 
                'where courseid = ' + postData.courseid;
                
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
  
  async _deleteUserCourse(params, postData) {
    var result = this._queryFailureResult();
    
    var query = 'delete from usercourse ' +
                'where usercourseid = ' + postData.usercourseid;
                
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

  async _deleteCalendar(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from calendar ' +
                'where calendarid = ' + postData.calendarid;

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

  async _deleteSchoolYearCalendar(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from calendar ' +
                'where schoolyear = "' + postData.schoolyear + '" ';

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
  
  async _deleteTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tip2 ' +
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
  
  async _deleteCategory(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from category ' +
                'where categoryid = ' + postData.categoryid;

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
  
  async _deleteTipCategory(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tipcategory ' +
                'where tipcategoryid = ' + postData.tipcategoryid;

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
  
  
  async _deleteTipUser(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tipuser ' +
                'where tipuserid = ' + postData.tipuserid;

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
}
