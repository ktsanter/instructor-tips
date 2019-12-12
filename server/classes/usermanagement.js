"use strict";
//---------------------------------------------------------------
// server-side user management 
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
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  getUserId(sessionInfo) { return sessionInfo.userInfo.userId; };
  getUserName(sessionInfo) { return sessionInfo.userInfo.userName; };
  getUserShortName(sessionInfo) { return sessionInfo.userInfo.userShortName; };
  getPrivilegeLevel(sessionInfo) { return sessionInfo.userInfo.privilegeLevel; }
  
  isLoggedIn(sessionInfo) {
    return (sessionInfo.userInfo && this.getUserId(sessionInfo) >= 0);
  }
  
  async attemptLogin(sessionInfo, userName, userPassword) {
    var success = false;
    
    this.logout(sessionInfo);
    
    var queryResult = await this._getAllUserInfo();
    if (queryResult.success) {
      
      if (userPassword == 'okay') {
        var found = false;
        for (var i = 0; i < queryResult.data.length && !found; i++) {
          var userRow = queryResult.data[i];
          
          if (userName == userRow.usershortname) {
            sessionInfo.userInfo = {
              userId: userRow.userid,
              userShortName: userRow.usershortname,
              userName: userRow.username,
              privilegeLevel: userRow.privilegename,
              privilegeId: userRow.privilegeid
            };
            
            found = true;
            success = true;
          }
        }
      }
    }
    
    return success;
  }
  
  logout(sessionInfo) {
    sessionInfo.userInfo = {userId: -1};
  }
  
  isAtLeastPrivilegeLevel(sessionInfo, targetPrivilegeLevel) {
    var userPrivilegeLevel = this.getPrivilegeLevel(sessionInfo);
    
    var levelRanks = {
      'instructor': 0,
      'lead': 1,
      'admin': 2,
      'superadmin': 3
    };
        
    var targetPrivilegeRank = levelRanks[targetPrivilegeLevel];
    var userPrivilegeRank = levelRanks[userPrivilegeLevel];

    return (userPrivilegeRank >= targetPrivilegeRank);
  }
  
  getUserInfo(sessionInfo) {
    var result = {
      success: true,
      data: {
        usershortname: this.getUserShortName(sessionInfo),
        username: this.getUserName(sessionInfo)
      }
    };
    
    return result;
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
  async _getAllUserInfo() {
    var result = this._queryFailureResult();
    
    var query = 'select user.userid, privilege.privilegeid, usershortname, username, privilegename ' +
                'from user, privilege, userprivilege ' +
                'where user.userid = userprivilege.userid ' +
                  'and privilege.privilegeid = userprivilege.privilegeid ';
    
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
