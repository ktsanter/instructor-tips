"use strict";
//---------------------------------------------------------------
// admin DB query interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.dbAdminQuery = class {
  constructor(mariadb, dbName, userManagement, hostName) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: hostName, //'localhost',
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
            
    } else if (params.queryName == 'tips') {
      dbResult = await this._getTips(params);
      
    } else if (params.queryName == 'categories') {
      dbResult = await this._getCategories(params);
      
    } else if (params.queryName == 'tipcategories') {
      dbResult = await this._getTipCategories(params);
      
    } else if (params.queryName == 'admin_schedules') {
      dbResult = await this._getSchedules(params);
      
    } else if (params.queryName == 'scheduletips') {
      dbResult = await this._getScheduleTips(params);
      
    } else if (params.queryName == 'controlstates') {
      dbResult = await this._getControlStates(params, sessionInfo);
      
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
        'select userid, username, usershortname, email ' +
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
        {email: 'text'}
      ],
      result.displayFields = ['usershortname', 'username', 'email'];
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
  
  async _getTips(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      tips:
        'select ' +
          't.tipid, t.tiptext, t.common, t.userid ' +
        'from tip as t ' +
        'order by t.tiptext ',
        
      users: 
        'select userid, usershortname, username ' +
        'from user ' +
        'order by username'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipid',
      result.insertUpdateFields = [
        {tiptext: 'text'},
        {common: 'boolean'},
        {userid: 'foreignkey'}        
      ],
      result.displayFields = ['tiptext', 'common', 'userid'];
      result.data = queryResults.data.tips,
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username'}
        },
        users: queryResults.data.users
      };
      
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
  
  async _getSchedules(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      schedules: 
        'select s.scheduleid, s.userid, s.schedulename, s.schedulelength, s.schedulestartdate, u.username ' +
        'from schedule as s, user as u ' +
        'where s.userid = u.userid ' + 
        'order by u.username, s.schedulename ',

      users:
        'select userid, username ' +
        'from user ' +
        'order by username'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'scheduleid',
      result.insertUpdateFields = [
        {userid: 'foreignkey'},
        {schedulename: 'text'},
        {schedulelength: 'text'},
        {schedulestartdate: 'text'}
      ],
      result.displayFields = ['schedulename', 'username', 'schedulelength', 'schedulestartdate'];
      result.data = queryResults.data.schedules,
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username', allownull: false}
        },
        users: queryResults.data.users
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _getScheduleTips(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      scheduletips: 
        'select st.scheduletipid, st.scheduleid, st.tipid, st.tipstate, ' +
        'st.schedulelocation, st.schedulelocationorder, ' + 
        's.schedulename ' +
        'from scheduletip as st, schedule as s ' +
        'where st.scheduleid = s.scheduleid ' +
        'order by s.schedulename, st.schedulelocation, st.schedulelocationorder ',

      schedules: 
        'select scheduleid, schedulename, userid ' +
        'from schedule ' +
        'order by userid, schedulename',
        
      tips: 
        'select tipid, tiptext ' +
        'from tip ' +
        'order by tiptext'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'scheduletipid',
      result.insertUpdateFields = [
        {scheduleid: 'foreignkey'},
        {tipid: 'foreignkey'},
        {tipstate: 'text'},
        {schedulelocation: 'text'},
        {schedulelocationorder: 'text'}
      ],
      result.displayFields = ['scheduleid', 'tipid', 'tipstate', 'schedulelocation', 'schedulelocationorder'];
      result.data = queryResults.data.scheduletips,
      result.constraints = {
        foreignKeys: {
          scheduleid: {data: 'schedules', displayField: 'schedulename', allownull: false},
          tipid: {data: 'tips', displayField: 'tiptext', allownull: false}
        },
        schedules: queryResults.data.schedules,
        tips: queryResults.data.tips
      };
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
        'from tipcategory as tc, tip as t, category as c ' +
        'where tc.tipid = t.tipid ' +
        '  and tc.categoryid = c.categoryid ' +
        'order by t.tiptext, c.categorytext',
      tips: 
        'select tipid, tiptext ' +
        'from tip ' +
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

  async _getControlStates(params) {
    var result = this._queryFailureResult();
    
    var queryList = {
      controlstates: 
        'select cs.controlstateid, cs.userid, cs.controlgroup, cs.state, u.username ' +
        'from controlstate as cs, user as u ' +
        'where cs.userid = .u.userid ' +
        'order by u.userid, cs.controlgroup ',

      users: 
        'select userid, username ' +
        'from user ' +
        'order by userid'
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'controlstateid',
      result.insertUpdateFields = [
        {userid: 'foreignkey'},
        {controlgroup: 'text'},
        {state: 'text'}
      ],
      result.displayFields = ['controlstateid', 'username', 'controlgroup', 'state'];
      result.data = queryResults.data.controlstates,
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username', allownull: false}
        },
        users: queryResults.data.users
      };
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
}
