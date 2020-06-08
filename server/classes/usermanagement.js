"use strict";
//---------------------------------------------------------------
// server-side user management 
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.UserManagement = class {
  constructor(mariadb, dbName, hostName) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: hostName, //'localhost',
      user: 'root',
      password: 'SwordFish002',
      connectionLimit: 5  
    });
    
    this._dbName = dbName;    
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------  
  getUserInfo(sessionInfo) {
    return sessionInfo.userInfo;
  }
  
  initializeUserInfo(sessionInfo) {
    sessionInfo.userInfo = {userId: -1};
  }
  
  async attemptLogin(sessionInfo, userName, userPassword) {
    var success = false;
    
    this.logout(sessionInfo);
    
    var queryResult = await this._queryAllUserInfo();
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
    this.initializeUserInfo(sessionInfo);
  }
  
  isLoggedIn(sessionInfo) {
    var userInfo = this.getUserInfo(sessionInfo);
    return (userInfo && userInfo.userId >= 0);
  }  
  
  isAtLeastPrivilegeLevel(userInfo, targetPrivilegeLevel) {
    var userPrivilegeLevel = userInfo.privilegeLevel;
    
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
  
  queryUserInfo(sessionInfo) {
    var result = {
      success: true,
      userInfo: this.getUserInfo(sessionInfo)
    };
    
    return result;
  }  
  
  changePassword(postData, sessionInfo) {
    console.log('change password');
    console.log(postData);
    console.log(sessionInfo.userInfo);
    this.logout(sessionInfo);
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
  async _queryAllUserInfo() {
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
