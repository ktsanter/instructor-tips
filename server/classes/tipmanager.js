"use strict";
//---------------------------------------------------------------
// tip management DB interface
//---------------------------------------------------------------
// TODO: text sanitizing for schedule name, share comment, tip text
//---------------------------------------------------------------
const internal = {};

module.exports = internal.TipManager = class {
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
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._queryFailureResult();

    if (params.queryName == 'profile') {
      dbResult = await this._getUserProfile(params, userInfo);
      
    } else if (params.queryName == 'schedule-list') {
      dbResult = await this._getScheduleList(params, postData, userInfo);
      
    } else if (params.queryName == 'controlstate-scheduling') {
      dbResult = await this._getControlState(params, postData, userInfo, 'scheduling');
      
    } else if (params.queryName == 'controlstate-filtering') {
      dbResult = await this._getControlState(params, postData, userInfo, 'filtering');
      
    } else if (params.queryName == 'schedule-details') {
      dbResult = await this._getScheduleDetails(params, postData, userInfo);
      
    } else if (params.queryName == 'tiplist') {
      dbResult = await this._getTipList(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'categorylist') {
      dbResult = await this._getCategoryList(params, postData, userInfo);
      
    } else if (params.queryName == 'userstosharewith') {
      dbResult = await this._getUsersToShareWith(params, postData, userInfo);
      
    } else if (params.queryName == 'sharedwithuser') {
      dbResult = await this._getSchedulesSharedWithUser(params, postData, userInfo);
      
    } else if (params.queryName == 'notification') {
      dbResult = await this._getNotificationInfo(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, gMailer, userInfo, funcCheckPrivilege) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._insertSchedule(params, postData, userInfo);
      
    } else if (params.queryName == 'addscheduleweek') {
      dbResult = await this._addScheduleWeek(params, postData, userInfo);
            
    } else if (params.queryName == 'shareschedule') {
      dbResult = await this._shareSchedule(params, postData, userInfo, gMailer);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._updateSchedule(params, postData, userInfo);

    } else if (params.queryName == 'controlstate-scheduling') {
      dbResult = await this._updateControlState(params, postData, userInfo, 'scheduling');

    } else if (params.queryName == 'controlstate-filtering') {
      dbResult = await this._updateControlState(params, postData, userInfo, 'filtering');

    } else if (params.queryName == 'notificationoptions') {
      dbResult = await this._updateUserNotificationOptions(params, postData, userInfo);
            
    } else if (params.queryName == 'tipstate') {
      dbResult = await this._updateScheduleTipState(params, postData, userInfo);
            
    } else if (params.queryName == 'movescheduletip') {
      dbResult = await this._moveScheduleTip(params, postData, userInfo);
            
    } else if (params.queryName == 'addscheduletip') {
      dbResult = await this._addScheduleTip(params, postData, userInfo, false);
            
    } else if (params.queryName == 'addtipandscheduletip') {
      dbResult = await this._addTipAndScheduleTip(params, postData, userInfo);
            
    } else if (params.queryName == 'tiptextandcategory') {
      dbResult = await this._updateTipTextAndCategory(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'sharedschedule') {
      dbResult = await this._acceptSharedSchedule(params, postData, userInfo);
            
    } else if (params.queryName == 'profile') {
      dbResult = await this._updateUserProfile(params, postData, userInfo);
      
    } else if (params.queryName == 'notification') {
      dbResult = await this._updateNotificationInfo(params, postData, userInfo);            
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._deleteSchedule(params, postData, userInfo);
            
    } else if (params.queryName == 'scheduletip') {
      dbResult = await this._deleteScheduleTip(params, postData, userInfo);
            
    } else if (params.queryName == 'removescheduleweek') {
      dbResult = await this._removeScheduleWeek(params, postData, userInfo);
            
    } else if (params.queryName == 'shareschedule') {
      dbResult = await this._deleteSharedSchedule(params, postData, userInfo);
            
    } else if (params.queryName == 'tip') {
      dbResult = await this._deleteTip(params, postData, userInfo, funcCheckPrivilege);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// general query methods
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
// specific query methods
//---------------------------------------------------------------
  async _getScheduleList(params, postData, userInfo) {
    var result = this._queryFailureResult(); 
    
    var queryList = {};

    queryList.schedules =
      'SELECT scheduleid, userid, schedulename, schedulelength, schedulestartdate ' +
      'FROM schedule ' +
      'WHERE userid = ' + userInfo.userId;
              
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.schedules = queryResults.data.schedules;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getControlState(params, postData, userInfo, controlGroup) {
    var result = this._queryFailureResult(); 
    
    var queryList = {};

    queryList.controlstate =
      'SELECT state ' +
      'FROM controlstate ' +
      'WHERE userid = ' + userInfo.userId + ' ' +
        'AND controlgroup = "' + controlGroup + '" ';
    
    var queryResults = await this._dbQueries(queryList);    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.controlstate = queryResults.data.controlstate;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getUserProfile(params, userInfo) {
    var result = this._queryFailureResult();   
    
    var queryList = {
      notificationoptions: 
        'select email ' +
        'from user ' +
        'where userid = ' + userInfo.userId + ' '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.notificationoptions[0],
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }    
  
  
  async _getScheduleDetails(params, postData, userInfo) {
    var result = this._queryFailureResult();   
    
    var queryList = {
      schedule: 
        'select ' +  
          's.schedulename, s.schedulelength, s.schedulestartdate ' + 
          'from schedule as s ' +
          'where s.scheduleid = ' + postData.scheduleid + ' ' +
            'and s.userid = ' + userInfo.userId + ' ',
            
      scheduledetails:
        'select ' +  
          'st.scheduletipid, st.tipstate, st.schedulelocation, st.schedulelocationorder, ' + 
          'vtc.common, vtc.userid, vtc.categorytext, ' +
          't.tipid, t.tiptext ' +
          'from schedule as s, scheduletip as st, tip as t, view_tipsandcategories as vtc ' +
          'where s.scheduleid = ' + postData.scheduleid + ' ' +
            'and s.userid = ' + userInfo.userId + ' ' +
            'and s.scheduleid = st.scheduleid ' +
            'and st.tipid = t.tipid ' +
            'and t.tipid = vtc.tipid '
    };
        
    var queryResults = await this._dbQueries(queryList);    
    if (queryResults.success) {
      var consolidatedDetails = this._consolidateTipCategories(queryResults.data.scheduledetails, userInfo);
      
      result.success = true;
      result.details = 'query succeeded';
      result.data = {
        schedule: queryResults.data.schedule[0],
        scheduledetails: this._orderScheduleDetails(consolidatedDetails, queryResults.data.schedule[0].schedulelength)
      };
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }     
  
  _consolidateTipCategories(scheduleTipList, userInfo) {
    var tipList = {};
    for (var i = 0; i < scheduleTipList.length; i++) {
      var tipId = scheduleTipList[i].tipid;
      tipList[tipId] = {};
    }
    
    for (var i = 0; i < scheduleTipList.length; i++) {
      var scheduleTip = scheduleTipList[i];
      var tip = tipList[scheduleTip.tipid];
      
      tip.tiptext = scheduleTip.tiptext;
      tip.common = scheduleTip.common;
      tip.userid = scheduleTip.userid;
      tip.editable = (!scheduleTip.common && scheduleTip.userid == userInfo.userId); 

      if (!tip.hasOwnProperty('categorySet')) tip.categorySet = new Set();
      var category = scheduleTip.categorytext;
      if (category) tip.categorySet.add(category);
      
      tipList[scheduleTip.tipid] = tip;
    }
    
    var consolidated = {}
    for (var i = 0; i < scheduleTipList.length; i++) {
      var scheduleTipId = scheduleTipList[i].scheduletipid;
      consolidated[scheduleTipId] = {}
    }
    for (var i = 0; i < scheduleTipList.length; i++) {
      var scheduleTip = scheduleTipList[i];
      var consolidatedScheduleTip = consolidated[scheduleTip.scheduletipid];
      
      delete scheduleTip.categorytext;
      scheduleTip.category = Array.from(tipList[scheduleTip.tipid].categorySet);
      scheduleTip.editable = tipList[scheduleTip.tipid].editable;
      
      consolidated[scheduleTip.scheduletipid] = scheduleTip;
    }
    
    var consolidatedArray = [];
    for (var id in consolidated) {
      consolidatedArray.push(consolidated[id]);
    }
    
    return consolidatedArray;
  }
  
  _orderScheduleDetails(details, scheduleLength) {
    var detailsByLocation = {};
    for (var i = 0; i <= scheduleLength; i++) {
      detailsByLocation[i] = [];
    }

    for (var i = 0; i < details.length; i++) {
      var item = details[i];
      detailsByLocation[item.schedulelocation].push(item);
    }
    
    var orderedDetails = {};
    for (var key in detailsByLocation) {
      orderedDetails[key] = detailsByLocation[key].sort(function(a, b) {
        if (a.schedulelocationorder > b.schedulelocationorder) {
          return 1;
        } else if (a.schedulelocationorder < b.schedulelocationorder) {
          return -1;
        }
        return 0;
      });        
    }
 
    return orderedDetails;
  }

  
  async _getTipList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._queryFailureResult();   
    
    var queryList = {
      tiplist: 
        // common tips and those owned by user
        'select ' +
          'vtc.tipid, vtc.tiptext, vtc.common, vtc.userid, vtc.categorytext, ' +
          'vtu.schedulecount, vtu.shareschedulecount ' + 
        'from view_tipsandcategories as vtc ' +
        'left outer join (' +
          'select tipid, schedulecount, shareschedulecount ' +
          'from view_tipusage ' +
        ') as vtu on (' +
          'vtc.tipid = vtu.tipid ' +
        ') ' +          
        'where (common  ' + 
           'or userid = ' + userInfo.userId + ') ' +
           'and tiptext like "%' + postData.search + '%" ' +           
           
        'union ' + 

        // tips used on one of the user's schedules (includes shared)
        'select ' +
          'tus.tipid, ' +
          'vtc.tiptext, vtc.common, vtc.userid, vtc.categorytext, ' + 
          'vtu.schedulecount, vtu.shareschedulecount ' + 
        'from view_tipsusedinschedule as tus, view_tipsandcategories as vtc ' + 
        'left outer join (' +
          'select tipid, schedulecount, shareschedulecount ' +
          'from view_tipusage ' +
        ') as vtu on (' +
          'vtc.tipid = vtu.tipid ' +
        ') ' +          
        'where tus.tipid = vtc.tipid ' + 
          'and tus.userid = ' + userInfo.userId + ' ' +
          'and vtc.tiptext like "%' + postData.search + '%" '
    };
    
    var queryResults = await this._dbQueries(queryList);    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = this._filterTipList(queryResults.data.tiplist, postData.keywords, postData.editing, userInfo, funcCheckPrivilege),
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  _filterTipList(tipList, keywords, editing, userInfo, funcCheckPrivilege) {
    var filteredList = [];
    
    var hasAdminPriv = funcCheckPrivilege(userInfo, 'admin');

    var consolidatedList = {};
    for (var i = 0; i < tipList.length; i++) {
      var tipItem = tipList[i];

      if (!consolidatedList[tipItem.tipid]) {
        consolidatedList[tipItem.tipid] = {
          tipid: tipItem.tipid,
          tiptext: tipItem.tiptext,
          common: tipItem.common,
          userid: tipItem.userid,
          categorylist: [],
          schedulecount: (tipItem.schedulecount ? tipItem.schedulecount : 0),
          shareschedulecount: (tipItem.shareschedulecount ? tipItem.shareschedulecount : 0)
        };
      }
      
      consolidatedList[tipItem.tipid].categorylist.push(tipItem.categorytext);
    }
    
    for (var id in consolidatedList) {
      var consolidatedItem = consolidatedList[id];
      var categorySet = new Set(consolidatedItem.categorylist);

      var passesFilter = true;
      if (editing) passesFilter = (!consolidatedItem.common && consolidatedItem.userid == userInfo.userId) || hasAdminPriv;
      
      for (var j = 0; j < keywords.length && passesFilter; j++) {
        passesFilter = categorySet.has(keywords[j]);
      }
      if (passesFilter) {
        filteredList.push({
          tipid: consolidatedItem.tipid,
          tiptext: consolidatedItem.tiptext,
          common: consolidatedItem.common,
          userid: consolidatedItem.userid,
          category: consolidatedItem.categorylist,
          schedulecount: consolidatedItem.schedulecount,
          shareschedulecount: consolidatedItem.shareschedulecount
        });
      }
    }
    
    return filteredList;
  }
  
  async _getCategoryList(params, postData, userInfo) {
    var result = this._queryFailureResult(); 
    
    var queryList = {};

    queryList.categorylist =
      'SELECT categorytext ' +
      'FROM category ' +
      'ORDER BY categorytext';
              
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.categorylist = queryResults.data.categorylist;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _getUsersToShareWith(params, postData, userInfo) {
    var result = this._queryFailureResult(); 
    
    var queryList = {};

    queryList.users =
      'select userid, username ' +
      'from user ' +
      'order by username ';
    
    var queryResults = await this._dbQueries(queryList);    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.users = queryResults.data.users;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _getSchedulesSharedWithUser(params, postData, userInfo) {
    var result = this._queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'ss.sharescheduleid, ss.comment, ss.datestamp, ' +
        's.scheduleid, s.schedulename, ' +
        'u.username ' +
      'from shareschedule as ss, schedule as s, user as u ' +
      'where ss.scheduleid = s.scheduleid ' +
        'and ss.userid_to = ' + userInfo.userId + ' ' +
        'and ss.userid_from = u.userid ' +
      'order by ss.datestamp desc';
        
    queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }    
    
  async _getNotificationInfo(params, postData, userInfo) {
    var result = this._queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      share:
        'select notificationon ' + 
        'from sharenotification ' +
        'where userid = ' + userInfo.userId,
        
      schedule:
        'select scheduleid, schedulename ' +
        'from schedule ' +
        'where userid = ' + userInfo.userId + ' ' +
        'order by scheduleid',
        
      schedulenotification:
        'select scheduleid, notificationtype ' +
        'from schedulenotification ' +
        'where userid = ' + userInfo.userId
    };

    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = {
        share: queryResults.data.share[0],
        schedule: this._consolidateScheduleNotifications(queryResults.data.schedule, queryResults.data.schedulenotification)
      };
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }    
  
  _consolidateScheduleNotifications(scheduleData, scheduleNotificationData) {
    var consolidated = {};
    for (var i = 0; i < scheduleData.length; i++) {
      var schedule = scheduleData[i];
      consolidated[schedule.scheduleid] = {
        schedulename: schedule.schedulename,
        notification: []
      }
    }
    
    for (var i = 0; i < scheduleNotificationData.length; i++) {
      var notification = scheduleNotificationData[i];
      consolidated[notification.scheduleid].notification.push(notification.notificationtype);
    }
    
    return consolidated;
  }

//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
  async _insertSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();  
    
    var query = 'insert into schedule (userid, schedulename, schedulelength, schedulestartdate) ' +
                'values (' +
                  userInfo.userId + ', ' + 
                  '"' + postData.schedulename + '", ' +
                  postData.schedulelength + ', ' + 
                '"' + postData.schedulestartdate + '" ' +                   
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      query = 'select scheduleid ' +
              'from schedule ' +
              'where schedulename = "' + postData.schedulename + '" ' +
              'and userid = ' + userInfo.userId;
      queryResults = await this._dbQuery(query);
      
      if (queryResults.success) {
        result.success = true;
        result.details = 'insert succeeded';
        result.data = queryResults.data[0];
        
      } else {
        result.details = queryResults.details;
      }
        
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _shareSchedule(params, postData, userInfo, gMailer) {
    var result = this._queryFailureResult();
    
    var query, queryResults;
       
    var dateStamp = this._getDateStamp();
    
    query = 
      'insert into shareschedule (scheduleid, userid_from, userid_to, comment, datestamp) ' + 
      'values (' +
        postData.scheduleid + ', ' +
        userInfo.userId + ', ' +
        postData.userid + ', ' +
        '"' + postData.comment + '", ' +
        '"' + dateStamp + '" ' +
      ') ';
      
    queryResults = await this._dbQuery(query);
    if (!queryResults) {
      result.details = queryResults.details;
      return result;
    }
    
    query =
      'select sharescheduleid ' +
      'from shareschedule ' +
      'where scheduleid = ' + postData.scheduleid + ' ' +
        'and userid_from = ' + userInfo.userId + ' ' +
        'and userid_to = ' + postData.userid + ' ' +
      'order by datestamp desc ';
    
    queryResults = await this._dbQuery(query);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var shareScheduleId = queryResults.data[0].sharescheduleid;

    query = 
      'insert into sharescheduletip (sharescheduleid, scheduletipid, tipid, tipstate, schedulelocation, schedulelocationorder) ' +
      'select ' + shareScheduleId + ' as sharescheduleid, scheduletipid, tipid, 0 as tipstate, schedulelocation, schedulelocationorder ' +
      'from scheduletip ' +
      'where scheduleid = ' + postData.scheduleid + ' ';
     
    queryResults = await this._dbQuery(query);
    if (!queryResults) {
      result.details = queryResults.details;
      return result;
    }
    
    queryResults = await this._notifyAboutSharedSchedule(postData.scheduleid, postData.comment, userInfo, postData.userid, gMailer);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succceeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _notifyAboutSharedSchedule(scheduleId, comment, userInfo, useridTo, gMailer) {
    var result = this._queryFailureResult();
    
    var queryList, queryResults;

    queryList = {
      notification:
        'select sn.notificationon, u.email ' +
        'from user as u, sharenotification as sn ' +
        'where u.userid = sn.userid ' +
          'and u.userid = ' + useridTo,
        
      schedule:
        'select schedulename ' +
        'from schedule ' +
        'where scheduleid = ' + scheduleId + ' ' +
          'and userid = ' + userInfo.userId,
    };
    
    queryResults = await this._dbQueries(queryList);
    if (!queryResults) {
      result.details = queryResults.details;
      return result;
    }    

    var notificationOn = queryResults.data.notification[0].notificationon;
    var emailTo = queryResults.data.notification[0].email;
    var scheduleName = queryResults.data.schedule[0].schedulename;

    if (!notificationOn) {
      result.success = true;
      result.details = 'no message sent - notification off';
      return result;
    }
    
    var bodyText = userInfo.userName + ' shared a schedule with you in the InstructorTips app.<br>';
    bodyText += '<em>name </em>: ' + scheduleName + '<br>';
    if (comment.length > 0) {
      bodyText += '<em>comment</em>: ' + comment + '<br>';
    } 
    
    var mailResult = await gMailer.sendMessage(
      emailTo, 
      'an Instructor Tips schedule has been shared with you',
      bodyText
    )
                
    if (mailResult.success) {
      result.success = true;
      result.details = 'notification message sent';
    } else {
      result.details = 'notification message failed';
    }
    
    return result;    
  }

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query = 'update schedule ' +
                'set ' +
                  'schedulename = "' + postData.schedulename + '", ' +
                  // don't allow length change here 'schedulelength = ' + postData.schedulelength + ', ' +
                  'schedulestartdate = "' + postData.schedulestartdate + '" ' +
                'where scheduleid = ' + postData.scheduleid;

    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _updateControlState(params, postData, userInfo, controlGroup) {
    var result = this._queryFailureResult();

    var query = 'update controlstate ' +
                'set ' +
                  'state = "' + this._sanitizeText(JSON.stringify(postData)) + '" ' +
                'where userid = ' + userInfo.userId + ' ' +
                '  and controlgroup = "' + controlGroup + '" ';
                
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _updateUserProfile(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;
    
    query =
      'update user ' +
      'set ' + 
        'email = "' + postData.email + '" ' +
      'where userid = ' + userInfo.userId + ' ';

    queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }
  
  async _updateScheduleTipState(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;
    
    query =
      'update scheduletip ' +
      'set ' + 
        'tipstate = ' + postData.tipstate + ' ' +
      'where scheduletipid = ' + postData.scheduletipid + ' ';
    
    queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }
  
  async _moveScheduleTip(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryResults;
        
    var deleteParams = {
      scheduletipid: postData.scheduletipid,
      scheduleid: postData.scheduleid,
      schedulelocation: postData.origschedulelocation,
      schedulelocationorder: postData.origschedulelocationorder
    };

    queryResults = await this._deleteScheduleTip(params, deleteParams, userInfo);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var addParams = postData;
    queryResults = await this._addScheduleTip(params, addParams, userInfo, true);
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
      
    return result;
   
  }
  
  async _addScheduleTip(params, postData, userInfo, bypassDuplicateTest) {
    var result = this._queryFailureResult();

    var queryList;
    var queryResults;
    
    if (!bypassDuplicateTest) {
      queryList = {
        checkforduplicate:
          'select scheduletipid ' +
          'from scheduletip ' +
          'where scheduleid = ' + postData.scheduleid + ' ' +
            'and tipid = ' + postData.tipid + ' ' +
            'and schedulelocation = ' + postData.schedulelocation
      };

      queryResults = await this._dbQueries(queryList);
      if (!queryResults.success) {
        result.details = queryResults.detail;
        return result;
      }
      
      if (queryResults.data.checkforduplicate.length > 0) {
        result.details = 'tip is already assigned to week';
        result.success = true;
        return result;
      }
    }

    queryList = {
      shift: 
        'update scheduletip ' +
        'set schedulelocationorder = schedulelocationorder + 1 ' +
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and schedulelocation = ' + postData.schedulelocation + ' ' +
          'and schedulelocationorder >= ' + postData.schedulelocationorder,

      makescheduletip:
        'insert into scheduletip (' +
          'scheduleid, tipid, tipstate, schedulelocation, schedulelocationorder ' +
        ') values (' +
          postData.scheduleid + ', ' +
          postData.tipid + ', ' +
          '0, ' + 
          postData.schedulelocation + ', ' +
          postData.schedulelocationorder +
        ')',

    }

    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
      
    return result;
  }
  
  async _addTipAndScheduleTip(params, postData, userInfo) {
    var result = this._queryFailureResult();
   
    var queryList = {
      checkforduplicate:
        'select tipid ' +
        'from tip ' +
        'where tiptext = "' + postData.tiptext + '" ' +
          'and (userid = ' + userInfo.userId + ' or common) '
    }
    
    var queryResults = await this._dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    } else if (queryResults.data.checkforduplicate.length > 0) {
      result.details = 'duplicate tip for user';
      return result;
    }
    
    queryList = {
      addTip: 
        'insert into tip (tiptext, userid, common) ' +
        'values (' +
          '"' + postData.tiptext + '", ' +
          userInfo.userId + ', ' +
          'FALSE' + ' ' +
        ')',
        
      getTipId:
        'select tipid ' +
        'from tip ' +
        'where tiptext = "' + postData.tiptext + '" ' +
          'and userid = ' + userInfo.userId
    };
            
    queryResults = await this._dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    postData.tipid = queryResults.data.getTipId[0].tipid;
    var addResult = await this._addTipCategory(params, postData, userInfo);
    
    if (!addResult.success) {
      result.details = addResult.details;
      return result;
    }

    addResult = await this._addScheduleTip(params, postData, userInfo, false);
    
    if (addResult.success) {
      result.success = true;
      result.details = 'update succeeded';
    } else {
      result.details = addResult.details;
    }
    
    return result;
  }
  
  async _updateTipTextAndCategory(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._queryFailureResult();
    var queryList, queryResults;
    
    queryList = {
      checkifeditable: 
        'select common, userid ' +
        'from view_tipsandcategories ' +
        'where tipid = ' + postData.tipid + ' '
    };

    queryResults = await this._dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    var qData = queryResults.data.checkifeditable[0];
    var hasAdminPriv = funcCheckPrivilege(userInfo, 'admin');    
    var editable = (!qData.common && qData.userid == userInfo.userId) || hasAdminPriv;

    if (!editable) {
      result.details = 'tip not editable by user';
      return result;
    }
    
    var origCategorySet = new Set(postData.origcategory);
    var newCategorySet = new Set(postData.category);
    var categoriesToRemove  = Array.from(this._difference(origCategorySet, newCategorySet));
    var categoriesToAdd = Array.from(this._difference(newCategorySet, origCategorySet));

    queryList = {
      tiptext: 
        'update tip ' + 
        'set tiptext = "' + postData.tiptext + '" ' +
        'where tipid = ' + postData.tipid,
    };
    
    if (categoriesToRemove.length > 0) {
      queryList.remove = 
        'delete from tipcategory ' +
        'where tipcategoryid in ( ' +
          'select tipcategoryid ' +
          'from tipcategory as tc, category as c ' +
          'where tc.categoryid = c.categoryid ' +
          '  and tc.tipid = ' + postData.tipid + ' '  +
          '  and c.categorytext ' + this._makeInClauseFromArray(categoriesToRemove, true) + ' ' +
        ')';
    }
    
    for (var i = 0; i < categoriesToAdd.length; i++) {
      var categoryText = categoriesToAdd[i];
      queryList['add' + i] = 
        'insert into tipcategory(tipid, categoryid) ' +
          'select ' + postData.tipid + ', categoryid ' +
          'from category as c ' +
          'where c.categorytext = "' + categoryText + '" ';
    }
    
    queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _acceptSharedSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList, queryResults;    

    queryList = {};
    
    queryList.schedule = 
      'select ' + 
        userInfo.userId + ' as userid, ' +
        '"' + postData.schedulename + '" as schedulename, ' +
        's.schedulelength, ' +
        's.schedulestartdate ' +
      'from schedule as s, shareschedule as ss ' +
      'where s.scheduleid = ss.scheduleid ' +
        'and ss.sharescheduleid = ' + postData.sharescheduleid;
        
    queryResults = await this._dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
     
    queryResults = await this._insertSchedule(params, queryResults.data.schedule[0], userInfo);
    if (!queryResults.success) {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate schedule name';
      }
      return result;
    }
    
    var newScheduleId = queryResults.data.scheduleid;

    var query = 
      'insert into scheduletip (scheduleid, tipid, tipstate, schedulelocation, schedulelocationorder) ' +
      'select ' + 
        newScheduleId + ' as scheduleid, ' +
        'tipid, tipstate, schedulelocation, schedulelocationorder ' +
      'from sharescheduletip ' +
      'where sharescheduleid = ' + postData.sharescheduleid + ' ';
      
    queryResults = await this._dbQuery(query);

    queryResults = await this._deleteSharedSchedule(params, postData, userInfo);
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _acceptSharedScheduleTips(params, postData, userInfo, newScheduleId) {
    var result = this._queryFailureResult();
    var query, queryResults;    
    
    var query = 
      'select sharescheduletipid, scheduletipid, tipid, 0 as tipstate, schedulelocation, previousitem, nextitem ' +
      'from sharescheduletip ' +
      'where sharescheduleid = ' + postData.sharescheduleid + ' ';
      
    queryResults = await this._dbQuery(query);
    if (!queryResults.success) {
      result.details = queryResults.detail;
      return result;
    }
    
    var organizedScheduleTips = this._organizeScheduleTips(queryResults.data);
    for (var stLocation in organizedScheduleTips) {
      var locationTips = organizedScheduleTips[stLocation];
      var prevItem = -1;
      
      for (var i = 0; i < locationTips.length && queryResults.success; i++) {
        var item = locationTips[i];
        var queryList = {
          makescheduletip:
            'insert into scheduletip (' +
              'scheduleid, tipid, tipstate, schedulelocation, previousitem, nextitem ' +
            ') values (' +
              postData.scheduleid + ', ' +
              postData.tipid + ', ' +
              '0, ' + 
              postData.schedulelocation + ', ' +
              prevItem + ', ' +
              '-1 ' + 
            ')',
            
          getscheduletip: 
            'select ' +
              'scheduletipid ' +
            'from scheduletip ' +
            'where scheduleid = ' + postData.scheduleid + ' ' +
              'and tipid = ' + postData.tipid + ' ' +
              'and schedulelocation = ' + postData.schedulelocation
        }
        
        queryResults = await this._dbQueries(queryList);
        
        if (queryResults.success) {
          var newItem = queryResults.data.getscheduletip[0].scheduletipid;
          if (i > 0) {
          var query = 
            'update scheduletip ' +
            'set nextitem = ' + prevItem + ' ' +
            'where scheduletipid = ' + newItem            
          };
        
          queryResults = await this._dbQuery(query);
          
          prevItem = newItem;
        }
      }
    }
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }
  
  _organizeScheduleTips(scheduleTips) {
    var organized = {};
    for (var i = 0; i < scheduleTips.length; i++) {
      var st = scheduleTips[i];
      var stLocation = st.schedulelocation;
      
      if (!organized.hasOwnProperty(stLocation)) organized[stLocation] = [];
      organized[stLocation].push(st);
    }
        
    for (var stLoc in organized) {
      var locScheduleTips = organized[stLoc];
      var ordered = [];
      
      var index = this._findIndexOfItemInList(-1, locScheduleTips, 'previousitem');
      ordered.push(locScheduleTips[index]);
      
      while ((index != null) && (locScheduleTips[index].nextitem != -1)) {
        index = this._findIndexOfItemInList(locScheduleTips[index].nextitem, locScheduleTips, 'scheduletipid');
        if (index != null) ordered.push(locScheduleTips[index]);
      }
      
      organized[stLoc] = ordered;
    }
    
    return organized;
  }
  
  _findIndexOfItemInList(id, arr, tipkey) {
    var index = null;
    
    for (var i = 0; i < arr.length && index == null; i++) {
      if (arr[i][tipkey] == id) index = i;
    }
    
    return index;
  }  
  
  _difference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
  }
  
  _makeInClauseFromArray(arr, quoted) {
    var clause = 'in (';
    var delim = quoted ? '"' : '';
    
    for (var i = 0; i < arr.length; i++) {
      if (i > 0) clause += ', ';
      clause += delim + arr[i] + delim;
    }
    
    clause += ') ';
    
    return clause;
  }
  
  async _acceptSharedSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList, queryResults;    

    queryList = {};
    
    queryList.schedule = 
      'select ' + 
        userInfo.userId + ' as userid, ' +
        '"' + postData.schedulename + '" as schedulename, ' +
        's.schedulelength, ' +
        's.schedulestartdate ' +
      'from schedule as s, shareschedule as ss ' +
      'where s.scheduleid = ss.scheduleid ' +
        'and ss.sharescheduleid = ' + postData.sharescheduleid;
        
    queryResults = await this._dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
     
    queryResults = await this._insertSchedule(params, queryResults.data.schedule[0], userInfo);
    if (!queryResults.success) {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate schedule name';
      }
      return result;
    }
    
    var newScheduleId = queryResults.data.scheduleid;

    var query = 
      'insert into scheduletip (scheduleid, tipid, tipstate, schedulelocation, schedulelocationorder) ' +
      'select ' + 
        newScheduleId + ' as scheduleid, ' +
        'tipid, tipstate, schedulelocation, schedulelocationorder ' +
      'from sharescheduletip ' +
      'where sharescheduleid = ' + postData.sharescheduleid + ' ';
      
    queryResults = await this._dbQuery(query);

    queryResults = await this._deleteSharedSchedule(params, postData, userInfo);
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _updateNotificationInfo(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList, queryResults;    
    
    queryList = {
      share:
        'update sharenotification ' +
        'set notificationon = ' + postData.share.notificationon + ' ' +
        'where userid = ' + userInfo.userId,
    };
    
    var scheduleList = postData.schedule;
    for (var scheduleId in scheduleList) {
      var schedule = scheduleList[scheduleId];

      queryList['remove' + scheduleId] = 
        'delete from schedulenotification ' +
        'where scheduleid = ' + scheduleId + ' ' +
          'and userid = ' + userInfo.userId + ' ';
      
      for (var i = 0; i < schedule.notification.length; i++) {
        var notificationText = schedule.notification[i];
        
        queryList['add' + scheduleId + '_' + i] = 
          'insert into schedulenotification (' +
            'userid, scheduleid, notificationtype ' +
          ') ' +
          'select ' +
            userInfo.userId + ', ' +
            scheduleId + ', ' +
            '"' + notificationText + '" as notificationtype'; 
      }
    }
    
    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }
  
  
  async _addTipCategory(params, postData, userInfo) {
    var result = this._queryFailureResult();
    
    var categoryList = postData.category;
    if (categoryList.length == 0) {
      result.success = true;
      return result;
    }
    
    var queryList = {};
    for (var i = 0; i < categoryList.length; i++) {
      queryList[i] = 
        'insert into tipcategory ( ' +
          'tipid, categoryid ' +
        ') select ' +
            postData.tipid + ' as tipid, ' +
            'categoryid ' +
          'from category ' + 
          'where categorytext = "' + postData.category[i] + '"';
    }
        
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'adding tip categories succeeeded';
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
    
  async _getScheduleTipLinks(scheduleTipId) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;
       
    query =
      'select previousitem, nextitem ' +
      'from scheduletip ' +
      'where ' + 
        'scheduletipid = ' + scheduleTipId;
        
    queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.data = {previousitem: queryResults.data[0].previousitem, nextitem: queryResults.data[0].nextitem};
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _addScheduleWeek(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var queryList;
    var queryResults;
    
    queryList = {
      updateLength:
        'update schedule ' +
        'set schedulelength = schedulelength + 1 ' +
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and userid = ' + userInfo.userId,
          
      updateLocations:
        'update scheduletip ' +
        'set schedulelocation = schedulelocation + 1 ' +
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and schedulelocation > ' + postData.afterweek + ' '
    };
    
    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      
    } else {
      result.details = queryResults.details;
    }    
  
    return result;
  }
  
//---------------------------------------------------------------
// specific delete methods
//---------------------------------------------------------------
  async _deleteSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query = 'delete from schedule ' +
                'where scheduleid = ' + postData.scheduleid + ' ' +
                  'and userid = ' + userInfo.userId ;

    var queryResults = await this._dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _deleteScheduleTip(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList, queryResults;
    
    queryList = {
      shift:
        'update scheduletip ' +
        'set schedulelocationorder = schedulelocationorder - 1 ' +
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and schedulelocation = ' + postData.schedulelocation + ' ' +
          'and schedulelocationorder > ' + postData.schedulelocationorder,
          
      remove: 
        'delete from scheduletip ' +
        'where scheduletipid = ' + postData.scheduletipid
    };
    
    queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
  async _removeScheduleWeek(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var queryList;
    var queryResults;
    
    queryList = {
      updateLength:
        'update schedule ' +
        'set schedulelength = schedulelength - 1 ' +
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and userid = ' + userInfo.userId,
          
      removeScheduleTips:
        'delete from scheduletip ' + 
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and schedulelocation = ' + postData.week,
          
      updateLocations:
        'update scheduletip ' +
        'set schedulelocation = schedulelocation - 1 ' +
        'where scheduleid = ' + postData.scheduleid + ' ' +
          'and schedulelocation > ' + postData.week + ' ',
          
    };
    
    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      
    } else {
      result.details = queryResults.details;
    }   
    
    return result;
  }

  async _deleteSharedSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var queryList;
    var queryResults;
    
    queryList = {
      shareschedule:
        'delete from shareschedule ' +
        'where sharescheduleid = ' + postData.sharescheduleid + 
        '  and userid_to = ' + userInfo.userId
    };
    
    queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

  async _deleteTip(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._queryFailureResult();

    var hasAdminPriv = funcCheckPrivilege(userInfo, 'admin');
    
    var queryList, queryResults;
    
    queryList = {
      tipusage:
        'select schedulecount, shareschedulecount  ' +
        'from view_tipusage ' +
        'where tipid = ' + postData.tipid,
        
      tipownership: 
        'select common, userid ' +
        'from tip ' +
        'where tipid = ' + postData.tipid
    };

    queryResults = await this._dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var tipUsage = queryResults.data.tipusage[0];
    var tipUsageCount = 0;
    if (tipUsage) tipUsageCount = tipUsage.schedulecount + tipUsage.shareschedulecount;
    
    var tipOwnership = queryResults.data.tipownership[0];
    var tipOwnerId = tipOwnership.userid;
    var commonTip = tipOwnership.common;
    
    if (!hasAdminPriv && (tipUsageCount > 0 || commonTip || tipOwnerId != userInfo.userId)) {
      result.details = 'cannot delete - insufficient privilege or tip in use';
      return result;
    }
    
    queryList = {
      deletetip: 
        'delete from tip ' +
        'where tipid = ' + postData.tipid
    }
    
    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');;
    
    // consider other cleaning e.g. <script> tags
    
    return cleaned;
  }
  
  _getDateStamp() {
    var now = new Date();
;
    var yr = now.getFullYear();
    var mo = ('00' + (now.getMonth() + 1)).slice(-2);
    var da = ('00' + now.getDate()).slice(-2);
    var hr = ('00' + now.getHours()).slice(-2);
    var mi = ('00' + now.getMinutes()).slice(-2);
    var se = ('00' + now.getSeconds()).slice(-2);
    
    var dateStamp = yr + '-' + mo + '-' + da + ' ' + hr + ':' + mi + ':' + se;
    
    return dateStamp;
  }
}
