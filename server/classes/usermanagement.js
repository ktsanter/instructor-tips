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
  
  async attemptLogin(sessionInfo, userName, enteredPassword) {
    this.logout(sessionInfo);
    
    var queryResults = await this._getInfoForUsername(userName);
    if (!queryResults.success) {
      console.log('UserManagement.attemptLogin: user lookup query failed');
      console.log(queryResults.details);
      return false;
    }
    
    var userDataList = queryResults.data;
    if (userDataList.length == 0) return false;  // no such user
    
    var userData = userDataList[0];
    if (enteredPassword != userData.password) return false;  // passwords don't match
 
    sessionInfo.userInfo = {
      userId: userData.userid,
      userShortName: userData.usershortname,
      userName: userData.username,
      privilegeLevel: userData.privilegename,
      privilegeId: userData.privilegeid
    };
    
    return true;
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
  
  async changePassword(postData, sessionInfo) {
    var result = this._dbManager.queryFailureResult();    
    console.log('UserManagement.changePassword');
    console.log(postData);
    console.log(sessionInfo.userInfo);

    var result = this._dbManager.queryFailureResult();
    
    var query = 'update user ' +
                 'set password = "' + postData.passwordHash + '" ' +
                 'where userid = ' + sessionInfo.userInfo.userId;
                 
    console.log(query);
    
    var queryResults = await this._dbManager.dbQuery(query);
    console.log('queryResults');
    console.log(queryResults);

    if (queryResults.success) {
      this.logout(sessionInfo);
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------    
  async _getInfoForUsername(userName) {
    var result = this._dbManager.queryFailureResult();
    
    var query = 'select ' +
                  'u.userid, u.usershortname, u.username, u.password, ' +
                  'p.privilegeid, p.privilegename ' +
                'from user as u, privilege as p, userprivilege as up ' +
                'where u.userid = up.userid ' +
                  'and p.privilegeid = up.privilegeid ' +
                  'and u.usershortname = "' + userName + '"';
    
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
