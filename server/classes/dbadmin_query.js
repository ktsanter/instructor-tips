"use strict";
//---------------------------------------------------------------
// admin DB query interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminQuery = class {
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
  async doQuery(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
   
    if (params.queryName == 'privileges') {
      dbResult = await this._getPrivileges(params);
      
    } else if (params.queryName == 'users') {
      dbResult = await this._getUsers(params);
      
    } else if (params.queryName == 'userprivileges') {
      dbResult = await this._getUserPrivileges(params);
      
    } else if (params.queryName == 'termgroups') {
      dbResult = await this._getTermGroups(params);
      
    } else if (params.queryName == 'terms') {
      dbResult = await this._getTerms(params);
      
    } else if (params.queryName == 'courses') {
      dbResult = await this._getCourses(params);
      
    } else if (params.queryName == 'usercourses') {
      dbResult = await this._getUserCourse(params);
      
    } else if (params.queryName == 'calendars') {
      dbResult = await this._getCalendar(params);
      
    } else if (params.queryName == 'navbar') {
      dbResult = await this._getNavbar(params, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// general query functions
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
// specific query functions
//---------------------------------------------------------------
  async _getPrivileges(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      privileges: 
        'select privilegeid, privilegename ' + 
        'from privilege ' +
        'order by privilegename'
    };
    
    var queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'privilegeid',
      result.insertUpdateFields = [
        {privilegename: 'text'}
      ],
      result.displayFields = ['privilegename'],
      result.data = queryResults.data.privileges,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getUsers(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      users: 
        'select userid, username, usershortname ' +
        'from user ' +
        'order by username'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'userid',
      result.insertUpdateFields = [
        {usershortname: 'text'}, 
        {username: 'text'}
      ],
      result.displayFields = ['usershortname', 'username'];
      result.data = queryResults.data.users,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
    
  async _getUserPrivileges(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      userprivileges: 
        'select userprivilegeid, user.userid, username, privilege.privilegeid, privilegename ' +
        'from userprivilege, user, privilege ' +
        'where userprivilege.userid = user.userid ' +
        'and userprivilege.privilegeid = privilege.privilegeid ' + 
        'order by username, privilegename',
      users: 
        'select userid, usershortname, username ' +
        'from user ' +
        'order by username',
      privileges: 
        'select privilegeid, privilegename ' + 
        'from privilege ' +
        'order by privilegename'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'userprivilegeid',
      result.insertUpdateFields = [
        {userid: 'foreignkey'},
        {privilegeid: 'foreignkey'}
      ],      
      result.displayFields = ['username', 'privilegename'];
      result.data = queryResults.data.userprivileges,
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username'},
          privilegeid: {data: 'privileges', displayField: 'privilegename'}
        },
        users: queryResults.data.users,
        privileges: queryResults.data.privileges
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _getTermGroups(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      termgroups: 
        'select termgroupid, termgroupname, termlength ' +
        'from termgroup ' +
        'order by termgroupname'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'termgroupid',
      result.insertUpdateFields = [
        {termgroupname: 'text'},
        {termlength: 'text'}
      ],
      result.displayFields = ['termgroupname', 'termlength'];
      result.data = queryResults.data.termgroups,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getTerms(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      terms: 
        'select termid, termname, term.termgroupid, termgroup.termgroupname ' +
        'from term, termgroup ' +
        'where term.termgroupid = termgroup.termgroupid ' +
        'order by termname',
      termgroups:
        'select termgroupid, termgroupname ' +
        'from termgroup'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'termid',
      result.insertUpdateFields = [
        {termname: 'text'},
        {termgroupid: 'foreignkey'}
      ],
      result.displayFields = ['termname', 'termgroupname'];
      result.data = queryResults.data.terms,
      result.constraints = {
        foreignKeys: {
          termgroupid: {data: 'termgroups', displayField: 'termgroupname'}
        },
        termgroups: queryResults.data.termgroups
      };
 
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _getCourses(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      courses: 
        'select courseid, coursename, ap ' +
        'from course ' +
        'order by coursename'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'courseid',
      result.insertUpdateFields = [
        {coursename: 'text'},
        {ap: 'boolean'}
      ],
      result.displayFields = ['coursename', 'ap'];
      result.data = queryResults.data.courses,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getUserCourse(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      usercourses: 
        'select usercourseid, courseid, coursename, ap, termgroupid, termgroupname, userid, username ' +
        'from viewusercourse ' +
        'order by username, coursename, termgroupname ',

      courses: 
        'select courseid, coursename, ap ' +
        'from course ' +
        'order by coursename',
      termgroups: 
        'select termgroupid, termgroupname, termlength ' +
        'from termgroup ' +
        'order by termgroupname',
      users:
        'select userid, username ' +
        'from user ' +
        'order by username'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'usercourseid',
      result.insertUpdateFields = [
        {userid: 'foreignkey'},
        {courseid: 'foreignkey'},
        {termgroupid: 'foreignkey'}
      ],
      result.displayFields = ['username', 'coursename', 'termgroupname'];
      result.data = queryResults.data.usercourses,
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username', allownull: true},
          courseid: {data: 'courses', displayField: 'coursename', allownull: true},
          termgroupid: {data: 'termgroups', displayField: 'termgroupname'}
        },
        courses: queryResults.data.courses,
        termgroups: queryResults.data.termgroups,
        users: queryResults.data.users
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _getCalendar(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      calendars:
        'select ' +
          'c.calendarid, c.termid, c.schoolyear, c.starttype, c.week, c.firstday, ' +
          'tg.termgroupid, tg.termgroupname, ' +
          't.termid, t.termname ' +
        'from calendar as c, termgroup as tg, term as t ' +
        'where c.termid = t.termid ' +
          'and t.termgroupid = tg.termgroupid ' +
        'order by c.schoolyear, tg.termgroupname, t.termname, c.starttype, c.week, c.firstday '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'calendar',
      result.insertUpdateFields = [
        //{coursename: 'text'},
        //{ap: 'boolean'}
      ],
      result.displayFields = ['schoolyear', 'termgroupname', 'termname', 'starttype', 'week', 'firstday'];
      result.data = queryResults.data.calendars,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getNavbar(params, userInfo) {
    var result = this._queryFailureResult();
    
    var allowAdmin = (userInfo.privilegeLevel == 'admin' || userInfo.privilegeLevel == 'superadmin');
    result.success = true;
    result.details = 'query succeeded';
    result.data = {};
    result.data.navbar = {allowadmin: allowAdmin};

    return result;
  }
}
