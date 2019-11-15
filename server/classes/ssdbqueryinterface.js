"use strict";
//---------------------------------------------------------------
// server-side DB query interface
//---------------------------------------------------------------
// TODO: finish implementing getCourseTermsForUser
//---------------------------------------------------------------
const internal = {};

module.exports = internal.ssDBQueryInterface = class {
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
    
    // admin queries    
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
      
    } else if (params.queryName == 'courseterms') {
      dbResult = await this._getCourseTerms(params);
      
    } else if (params.queryName == 'tipstatuses') {
      dbResult = await this._getTipStatuses(params);
      
    // tip manager queries
    } else if (params.queryName == 'allcourseterms') {
      dbResult = await this._getAllCourseTerms();
      
    } else if (params.queryName == 'coursetermsforuser') {
      dbResult = await this._getCourseTermsForUser(userInfo);
      
    } else if (params.queryName == 'tipschedule') {
      dbResult = await this._getTipSchedule(params, postData, userInfo);
      
    } else if (params.queryName == 'tipedit') {
      dbResult = await this._getTipEditData(params, postData, userInfo);
      
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
  
  async _getCourseTerms(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      courseterms: 
        'select coursetermid, course.courseid, coursename, ap, termgroup.termgroupid, termgroupname ' +
        'from courseterm, course, termgroup ' +
        'where courseterm.courseid = course.courseid ' +
        'and courseterm.termgroupid = termgroup.termgroupid ' +
        'order by coursename, termgroupname',
      courses: 
        'select courseid, coursename, ap ' +
        'from course ' +
        'order by coursename',
      termgroups: 
        'select termgroupid, termgroupname, termlength ' +
        'from termgroup ' +
        'order by termgroupname'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'coursetermid',
      result.insertUpdateFields = [
        {courseid: 'foreignkey'},
        {termgroupid: 'foreignkey'}
      ],
      result.displayFields = ['coursename', 'termgroupname'];
      result.data = queryResults.data.courseterms,
      result.constraints = {
        foreignKeys: {
          courseid: {data: 'courses', displayField: 'coursename'},
          termgroupid: {data: 'termgroups', displayField: 'termgroupname'}
        },
        courses: queryResults.data.courses,
        termgroups: queryResults.data.termgroups
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _getTipStatuses(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      tipstatuses: 
        'select tipstatusid, tipstatusname ' +
        'from tipstatus ' +
        'order by tipstatusname'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipstatusid',
      result.insertUpdateFields = [
        {tipstatusname: 'text'}
      ],
      result.displayFields = ['tipstatusname'];
      result.data = queryResults.data.tipstatuses,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getUserTipFilter(postData, userInfo) {
    var result = this._queryFailureResult();
    
    var queryList = {
      usertipfilter: 
        'select tipfilter ' +
        'from usertipfilter ' +
        'where userid = "' + userInfo.userId + '" ' +
        'and tipfiltertype = "' + postData.tipfiltertype + '" '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      if (queryResults.data.usertipfilter.length > 0) {
        result.data = JSON.parse(queryResults.data.usertipfilter[0].tipfilter);
      } else {
        result.data = null;
      }
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getAllCourseTermgroups() {
    var result = this._queryFailureResult();
    
    var queryList = {};
    queryList.allcourseterms = 
      'select coursename, termgroupname ' + 
      'from courseterm, course, termgroup ' + 
      'where courseterm.courseid = course.courseid ' + 
        'and courseterm.termgroupid = termgroup.termgroupid';
        
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    return result;
  }    
  
  async _getCourseTermsForUser(userInfo) {
    var result = this._queryFailureResult();
    
    var queryList = {};
    queryList.coursetermsforuser = 
      'select coursename, termgroupname, termname ' + 
      'from courseterm, course, termgroup, term ' + 
      'where courseterm.courseid = course.courseid ' + 
        'and courseterm.termgroupid = termgroup.termgroupid ' + 
        'and termgroup.termgroupid = term.termgroupid ' +
        'order by coursename, termgroupname, termname ';
        
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.coursetermsforuser,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    return result;
  }     

  async _getTipSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();
   
    var statusA = '';
    var statusB = '';
    if (postData.unspecified) {
      statusA = 'a.tipstatusname is null ';      
    }
    if (postData.scheduled || postData.completed) {
      statusB = 'a.tipstatusname in (';
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

    var queryList = {};
    if (postData.general) {
      if (postData.shared) {
        queryList.generaltip_shared = 
          'select tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, generaltip_shared.generaltipid, NULL as coursetipid ' + 
          'from generaltip_shared ' + 
          'left outer join (' +
            'SELECT usertipstatusid, generaltipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user  ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON generaltip_shared.generaltipid = a.generaltipid ' + 
          'where generaltip_shared.termgroupname = "' + postData.termgroupname + '" ' + 
          'and ' + tipstatusCondition; 
       
      }
      if (postData.personal) {
        queryList.generaltip_personal = 
          'SELECT tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, generaltip_personal.generaltipid, NULL as coursetipid ' +
          'FROM generaltip_personal ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT usertipstatusid, generaltipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON generaltip_personal.generaltipid = a.generaltipid ' +
          'WHERE generaltip_personal.userid = ' + userInfo.userId + ' ' +
            'AND generaltip_personal.termgroupname = "' + postData.termgroupname + '" ' +
            'and ' + tipstatusCondition;
      }
    }
    
    if (postData.coursespecific) {
      if (postData.shared) {
        queryList.coursetip_shared =
          'SELECT tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, NULL AS generaltipid, coursetip_shared.coursetipid ' +
          'FROM coursetip_shared ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT usertipstatusid, coursetipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON coursetip_shared.coursetipid = a.coursetipid ' +
          'WHERE coursetip_shared.termgroupname = "' + postData.termgroupname + '" ' + 
            'AND coursetip_shared.coursename = "' + postData.coursename + '" ' +
            'AND ' + tipstatusCondition;
         
      }
      if (postData.personal) {
        queryList.coursetip_personal = 
          'SELECT tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, NULL AS generaltipid, coursetip_personal.coursetipid ' +
          'FROM coursetip_personal ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT usertipstatusid, coursetipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON coursetip_personal.coursetipid = a.coursetipid ' +
          'WHERE coursetip_personal.userid = ' + userInfo.userId + ' ' + 
            'AND coursetip_personal.termgroupname = "' + postData.termgroupname + '" ' + 
            'AND coursetip_personal.coursename = "' + postData.coursename + '" ' +
            'AND ' + tipstatusCondition;
      }
    }
    
    queryList.termlength = 
      'select termlength ' +
      'from termgroup ' +
      'where termgroupname = "' + postData.termgroupname + '" ';
      
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      var combinedRows = [];
      for (var key in queryResults.data) {
        if (key != 'termlength') {
          var qdata = queryResults.data[key];
          for (var i = 0; i < qdata.length; i++) {
            combinedRows.push(qdata[i]);
          }
        }
      }
      result.success = true;
      result.details = 'query succeeded';
      result.data = combinedRows;
      result.termlength = queryResults.data.termlength[0].termlength;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  

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
      if (postData.user) {
        queryList.personal = 
          'SELECT tipid, tiptext, a.userid, a.username ' +
          'FROM tip ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT userid, username ' +
            'FROM user ' +
          ') AS a ' + 
          'ON tip.userid = a.userid ' + 
          'WHERE a.username = "' + postData.username + '" ' +
          '  AND tiptext LIKE "%' + postData.searchtext + '%" ' +
          'ORDER BY tiptext, a.username; ';
      
      } else {
        queryList.personal = 
          'SELECT tipid, tiptext, a.userid, a.username ' +
          'FROM tip ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT userid, username ' +
            'FROM user ' +
          ') AS a ' + 
          'ON tip.userid = a.userid ' + 
          'WHERE tiptext LIKE "%' + postData.searchtext + '%" ' +
            'AND a.userid IS NOT NULL ' + 
          'ORDER BY tiptext, a.username; ';
      }
    }
          
    queryList.users = 
      'SELECT userid, username ' +
      'FROM user ' +
      'ORDER BY username ';
      
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
          userid: {data: 'users', displayField: 'username', allownull: true}
        },
        users: queryResults.data.users
      };

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
}
