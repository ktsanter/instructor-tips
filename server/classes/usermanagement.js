"use strict";
//---------------------------------------------------------------
// server-side user management 
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.UserManagement = class {
  constructor(dbManager) {
    this._dbManager = dbManager;
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
  
  async _queryAllUserInfo() {
    var result = this._dbManager.queryFailureResult();
    
    var query = 'select user.userid, privilege.privilegeid, usershortname, username, privilegename ' +
                'from user, privilege, userprivilege ' +
                'where user.userid = userprivilege.userid ' +
                  'and privilege.privilegeid = userprivilege.privilegeid ';
    
    var queryResults = await this._dbManager.dbQuery(query);
    
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
