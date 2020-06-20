"use strict";
//---------------------------------------------------------------
// server-side user management 
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.UserManagement = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._tempFileManager = params.tempFileManager;
    this._messageManager = params.messageManager;
    
    this._tempDir = 'temp';
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
    if (!userData.password || hashedEnteredPassword != userData.password) return false;
 
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
  
  async refreshUserInfo(sessionInfo) {
    var result = {success: false, details: 'error in refreshUserInfo'};
    
    var queryResults = await this._getInfoForUsername(sessionInfo.userInfo.userShortName);
    
    if (!queryResults.success) return result;
    
    sessionInfo.userInfo.userName = queryResults.data[0].username;
    
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

    var userId = queryResults.data[0].userid;

    var identifier = this._tempFileManager.tmpNameSync({tmpdir: this._tempDir})
    identifier = identifier.split('\\').pop().split('/').pop();

    var queryList = {
      pending: 
        'replace into resetpending(userid, expiration, identifier) ' +
        'values( ' +
          userId + ', ' +
          'date_add(now(), interval 1 day), ' +
          '"' + identifier + '"' + 
        ')',
        
      expiration: 
        'select expiration ' +
        'from resetpending ' +
        'where userid = ' + userId,
        
      resetpassword:
        'update user ' +
        'set password = null ' +
        'where userid = ' + userId
    }

    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var expiration = queryResults.data.expiration[0].expiration;
    
    if (!await this._messageManager.sendAccountResetNotification(userId, identifier, expiration)) {
      result.details = 'reset notification failed';
      return result;
    }
    
    result.success = true;
    result.details = 'reset request succeeded';

    return result;
  }
  
  async resetPendingRequest(postData) {
    var result = this._dbManager.queryFailureResult();    
    
    var query, queryList, queryResults;
    var userName = postData.userName;
    var hashedPassword = postData.hashedPassword;
    var identifier = postData.identifier;  

    query = 
      'select userid ' +
      'from user ' + 
      'where usershortname = "' + userName + '"';
      
    queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success ||queryResults.data.length == 0) {
      result.details='pending=true&invaliduser=true&id=' + identifier;
      return result;
    }

    var userId = queryResults.data[0].userid;
    
    query = 
      'select resetpendingid ' +
      'from resetpending ' +
      'where userid = ' + userId + ' ' +
        'and identifier = "' + identifier + '" ';
        
    queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success || queryResults.data.length == 0) {
      result.details='invalidpending=true';
      return result;
    }
    
    var resetPendingId = queryResults.data[0].resetpendingid;
    queryList = {
      deletePending:
        'delete ' +
        'from resetpending ' +
        'where resetpendingid = ' + resetPendingId,
        
      updatePassword:
        'update user ' +
        'set password = "' + hashedPassword + '" ' +
        'where userid = ' + userId
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details='invalidpending=true';
      return result;
    }

    result.success = true;
    result.details = 'pending reset complete';
    
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
  
  async clearExpiredRequests() {
    var result = this._dbManager.queryFailureResult();
    var query, queryResults;
    
    query =
      'delete ' +
      'from resetpending ' +
      'where NOW() > expiration ';
      
    queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'expired requests removed';
    } else {
      console.log('UserManagement.clearExpiredRequests failed');
      console.log(queryResults.details);
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
