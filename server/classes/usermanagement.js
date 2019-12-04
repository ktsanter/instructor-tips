"use strict";
//---------------------------------------------------------------
// server-side user management 
// NOTE: this is a temporary implementation without security
//       or session management
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.UserManagement = class {
  constructor(mariadb, dbName) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: 'localhost',
      user: 'root',
      password: 'SwordFish002',
      connectionLimit: 5  
    });
    
    this._dbName = dbName;
    
    this._userInfo = {
      userId: null,
      userShortName: null,
      userName: null,
      privilegeLevel: null,
      privilegeId: null
    }      
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  getFullUserInfo() {
    var dbResult = this._queryFailureResult();
    
    dbResult.success = true;
    dbResult.details = 'getUser succeeded';
    dbResult.data = this._userInfo;
    
    return dbResult;
  }
  
  getUserInfo() {
    var dbResult = this._queryFailureResult();
    
    dbResult.success = true;
    dbResult.details = 'getUser succeeded';
    dbResult.data = {
      usershortname: this._userInfo.userShortName,
      username: this._userInfo.userName
    }
    
    return dbResult;
  }
  
  async getUserList() {
    var result = this._queryFailureResult();
    
    var query = 'select userid, usershortname, username ' +
                'from user ' +
                'order by username ';
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query  succeeded';
      result.data = queryResults.data;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  getUserInfo() {
    var dbResult = this._queryFailureResult();
    
    dbResult.success = true;
    dbResult.details = 'getUser succeeded';
    dbResult.data = {
      usershortname: this._userInfo.userShortName,
      username: this._userInfo.userName
    }
    
    return dbResult;
  }
  
  async setUser(params) {
    var dbResult = await this._getUserPrivileges(params);

    if (dbResult.success) {
      if (dbResult.data.length == 1) {
        dbResult.details = 'setUser succeeded';
        var data = dbResult.data[0];
        this._userInfo.userId = data.userid;
        this._userInfo.userShortName = data.usershortname;
        this._userInfo.userName = data.username;
        this._userInfo.privilegeLevel = data.privilegename;
        this._userInfo.privilegeId = data.privilegeid;
        
        dbResult.data = this._userInfo;
        
      } else {
        dbResult.success = false;
        dbResult.details = 'could not find user = \'' + params.userShortName + '\'';
        dbResult.data = null;
      }
    }
    return dbResult;
  }
  
  isAtLeastPrivilegeLevel(targetPrivilegeLevel) {
    var userPrivilegeLevel = 'none';
    if (this._userInfo) userPrivilegeLevel = this._userInfo.privilegeLevel;
    
    var levelRanks = {
      'none': -1,
      'instructor': 0,
      'lead': 1,
      'admin': 2,
      'superadmin': 3
    };
        
    var targetPrivilegeRank = levelRanks[targetPrivilegeLevel];
    var userPrivilegeRank = levelRanks[userPrivilegeLevel];

    return (userPrivilegeRank >= targetPrivilegeRank);
  }
  
//---------------------------------------------------------------
// general query functions
//---------------------------------------------------------------
  _queryFailureResult() {
    return {success: false, details: 'user management request failed', data: null};
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
  async _getUserPrivileges(params) {
    var result = this._queryFailureResult();
    
    var query = 'select user.userid, privilege.privilegeid, usershortname, username, privilegename ' +
                'from user, privilege, userprivilege ' +
                'where user.userid = userprivilege.userid ' +
                  'and privilege.privilegeid = userprivilege.privilegeid ' +
                  'and usershortname = "' + params.userShortName + '"';
    
    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query  succeeded';
      result.data = queryResults.data;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
}
