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
  
  async attemptLogin(sessionInfo, userName, hashedEnteredPassword) {
    this.logout(sessionInfo);
    
    if (hashedEnteredPassword.length == 0) return false;
    
    var queryResults = await this._getInfoForUsername(userName);
    if (!queryResults.success) {
      console.log('UserManagement.attemptLogin: user lookup query failed');
      console.log(queryResults.details);
      return false;
    }
    
    var userDataList = queryResults.data;
    if (userDataList.length == 0) return false;  // no such user
    
    var userData = userDataList[0];
    if (hashedEnteredPassword != userData.password) return false;
 
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
    
    var query = 'update user ' +
                 'set password = "' + postData.passwordHash + '" ' +
                 'where userid = ' + sessionInfo.userInfo.userId;
    
    var queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      this.logout(sessionInfo);
      result.success = true;
      result.details = 'password change succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async resetRequest(postData) {
    var result = this._dbManager.queryFailureResult();    
    var userName = postData.userName;
    
    var query = 
      'select userid ' +
      'from user ' + 
      'where usershortname = "' + userName + '"';
      
    var queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.data.length == 0) {
      result.details = 'invaliduser=true';
      return result;
    }

    console.log('UserManagement.resetRequest: finish implementation');

    result.success = true;
    result.details = 'reset request succeeded';

    return result;
  }
  
  async createAccount(postData) {
    var result = this._dbManager.queryFailureResult();    
    
    var userName = postData.userName;
    var hashedPassword = postData.hashedPassword;
    
    var query = 
      'select userid ' +
      'from user ' + 
      'where usershortname = "' + userName + '"';
      
    var queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.data.length > 0) {
      result.details = 'invaliduser=true';
      return result;
    }    

    var queryList = {
      user:
        'insert into user(usershortname, username, email, password) ' +
        'values (' +
          '"' + userName + '", ' +
          '"' + userName + '", ' +
          '""' + ', ' +
          '"' + hashedPassword + '" ' +
        ')',
    };    
    
    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      console.log('UserManagement.createAccount failed');
      console.log(postData);
      console.log(queryResults.details);
      result.details = 'queryfailed=true';
    } else {      
      result.success = true;
      result.details = 'account created';
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
