"use strict";
//---------------------------------------------------------------
// admin DB query interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminQuery = class {
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
  async doQuery(params, postData, sessionInfo) {
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
      
    } else if (params.queryName == 'tips') {
      dbResult = await this._getTips(params);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._getCategories(params);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._getTipCategories(params);
      
    } else if (params.queryName == 'tipusers') {
      dbResult = await this._getTipUsers(params);
      
    } else if (params.queryName == 'navbar') {
      dbResult = await this._getNavbar(params, sessionInfo);
      
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
        'select userid, username, usershortname, email, sharedschedule, pushreminders ' +
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
        {username: 'text'},
        {email: 'text'},
        {sharedschedule: 'text'},
        {pushreminders: 'text'}
      ],
      result.displayFields = ['usershortname', 'username', 'email', 'sharedschedule', 'pushreminders'];
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
          'c.calendarid, c.termid, c.schoolyear, c.starttype, c.week, date_format(c.firstday, "%Y-%m-%d") as firstday, ' +
          't.termid, t.termname ' +
        'from calendar as c, term as t ' +
        'where c.termid = t.termid ' +
        'order by c.schoolyear, t.termname, c.starttype, c.week, c.firstday ',
        
      terms:
        'select termid, termname ' +
        'from term ' +
        'order by termname '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'calendarid',
      result.insertUpdateFields = [
        {termid: 'foreignkey'},
        {schoolyear: 'text'},
        {week: 'text'},
        {firstday: 'text'},
        {starttype: 'text'}
      ],
      result.displayFields = ['schoolyear', 'termname', 'starttype', 'week', 'firstday'];
      result.data = queryResults.data.calendars,
      result.constraints = {
        foreignKeys: {
          termid: {data: 'terms', displayField: 'termname', allownull: false}
        },
        terms: queryResults.data.terms
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getTips(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      tips:
        'select ' +
          't.tipid, t.tiptext, t.common ' +
        'from tip2 as t ' +
        'order by t.tiptext '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipid',
      result.insertUpdateFields = [
        {tiptext: 'text'},
        {common: 'boolean'}
      ],
      result.displayFields = ['tiptext', 'common'];
      result.data = queryResults.data.tips,
      result.constraints = {};
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getCategories(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      categories:
        'select ' +
          'c.categoryid, c.categorytext ' +
        'from category as c ' +
        'order by c.categorytext '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'categoryid',
      result.insertUpdateFields = [
        {categorytext: 'text'}
      ],
      result.displayFields = ['categorytext'];
      result.data = queryResults.data.categories,
      result.constraints = {};
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getNavbar(params, sessionInfo) {
    var result = this._queryFailureResult();
    
    var allowAdmin = this._userManagement.isAtLeastPrivilegeLevel(sessionInfo, 'admin');
    result.success = true;
    result.details = 'query succeeded';
    result.data = {};
    result.data.navbar = {allowadmin: allowAdmin};

    return result;
  }
  
  async _getTipCategories(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      tipcategories: 
        'select tc.tipcategoryid, tc.tipid, tc.categoryid, t.tiptext, c.categorytext ' +
        'from tipcategory as tc, tip2 as t, category as c ' +
        'where tc.tipid = t.tipid ' +
        '  and tc.categoryid = c.categoryid ' +
        'order by t.tiptext, c.categorytext',
      tips: 
        'select tipid, tiptext ' +
        'from tip2 ' +
        'order by tiptext',
      categories:
        'select categoryid, categorytext ' +
        'from category ' +
        'order by categorytext'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipcategoryid',
      result.insertUpdateFields = [
        {tipid: 'foreignkey'},
        {categoryid: 'foreignkey'}
      ],      
      result.displayFields = ['tiptext', 'categorytext'];
      result.data = queryResults.data.tipcategories,
      result.constraints = {
        foreignKeys: {
          tipid: {data: 'tips', displayField: 'tiptext'},
          categoryid: {data: 'categories', displayField: 'categorytext'}
        },
        tips: queryResults.data.tips,
        categories: queryResults.data.categories
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  

  async _getTipUsers(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      tipusers: 
        'select tu.tipuserid, tu.tipid, tu.userid, t.tiptext, u.username ' +
        'from tipuser as tu, tip2 as t, user as u ' +
        'where tu.tipid = t.tipid ' +
        '  and tu.userid = u.userid ' +
        'order by u.username, t.tiptext',
      tips: 
        'select tipid, tiptext ' +
        'from tip2 ' +
        'order by tiptext',
      users:
        'select userid, username ' +
        'from user ' +
        'order by username'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipuserid',
      result.insertUpdateFields = [
        {tipid: 'foreignkey'},
        {userid: 'foreignkey'}
      ],      
      result.displayFields = ['username', 'tiptext'];
      result.data = queryResults.data.tipusers,
      result.constraints = {
        foreignKeys: {
          tipid: {data: 'tips', displayField: 'tiptext'},
          userid: {data: 'users', displayField: 'username'}
        },
        tips: queryResults.data.tips,
        users: queryResults.data.users
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
}
