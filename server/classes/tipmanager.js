"use strict";
//---------------------------------------------------------------
// tip management DB interface
//---------------------------------------------------------------
// TODO: add logic based on user privileges
// TODO: text sanitizing for schedule name
//---------------------------------------------------------------
const internal = {};

module.exports = internal.TipManager = class {
  constructor(mariadb, dbName, userManagement) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: 'localhost',
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
  async doQuery(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();

    if (params.queryName == 'notificationoptions') {
      dbResult = await this._getUserNotificationOptions(params, userInfo);
      
    } else if (params.queryName == 'schedule-list') {
      dbResult = await this._getScheduleList(params, postData, userInfo);
      
    } else if (params.queryName == 'controlstate-scheduling') {
      dbResult = await this._getControlState(params, postData, userInfo, 'scheduling');
      
    } else if (params.queryName == 'controlstate-filtering') {
      dbResult = await this._getControlState(params, postData, userInfo, 'filtering');
      
    } else if (params.queryName == 'schedule-details') {
      dbResult = await this._getScheduleDetails(params, postData, userInfo);
      
    } else if (params.queryName == 'tiplist') {
      dbResult = await this._getTipList(params, postData, userInfo);
      
    } else if (params.queryName == 'categorylist') {
      dbResult = await this._getCategoryList(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, gMailer, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._insertSchedule(params, postData, userInfo);
      
    } else if (params.queryName == 'addscheduleweek') {
      dbResult = await this._addScheduleWeek(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo) {
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
      dbResult = await this._addScheduleTip(params, postData, userInfo);
            
    } else if (params.queryName == 'addtipandscheduletip') {
      dbResult = await this._addTipAndScheduleTip(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._deleteSchedule(params, postData, userInfo);
            
    } else if (params.queryName == 'scheduletip') {
      dbResult = await this._deleteScheduleTip(params, postData, userInfo);
            
    } else if (params.queryName == 'removescheduleweek') {
      dbResult = await this._removeScheduleWeek(params, postData, userInfo);
            
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
  
  async _getUserNotificationOptions(params, userInfo) {
    var result = this._queryFailureResult();   
    
    var queryList = {
      notificationoptions: 
        'select sharedschedule, pushreminders, email ' +
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
          'st.scheduletipid, st.tipstate, st.schedulelocation, st.previousitem, st.nextitem, ' +
          't.tipid, t.tiptext ' +
          'from schedule as s, scheduletip as st, tip as t ' +
          'where s.scheduleid = ' + postData.scheduleid + ' ' +
            'and s.userid = ' + userInfo.userId + ' ' +
            'and s.scheduleid = st.scheduleid ' +
            'and st.tipid = t.tipid ',
        
    };
        
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = {
        schedule: queryResults.data.schedule[0],
        scheduledetails: this._orderScheduleDetails(queryResults.data.scheduledetails, queryResults.data.schedule[0].schedulelength)
      };
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
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
      orderedDetails[key] = this._orderSingleWeek(detailsByLocation[key]);
    }
 
    return orderedDetails;
  }
  
  _orderSingleWeek(items) {
    var ordered = [];
    
    var firstItem = null;
    for (var i = 0; i < items.length && !firstItem; i++) {
      if (items[i].previousitem == -1) firstItem = items[i];
    }
    if (firstItem) {
      ordered.push(firstItem);
      var currentItem = firstItem;
      while (currentItem.nextitem != -1) {
        var nextItem = this._findItemById(items, currentItem.nextitem);
        if (nextItem != null) {
          ordered.push(nextItem);
          currentItem = nextItem;
        } else {
          break; // something wrong with the linked list
        }
      }
    }   
    
    return ordered;
  }
  
  _findItemById(items, id) {
    var item = null;
    for (var i = 0; i < items.length && !item; i++) {
      if (items[i].scheduletipid == id) item = items[i];
    }

    return item;
  }
  
  async _getTipList(params, postData, userInfo) {
    var result = this._queryFailureResult();   
    
    console.log(postData);

    var queryList = {
      tiplist: 
        // common tips and those owned by user
        'select tipid, tiptext, common, userid ' + 
        'from view_tipsandcategories ' + 
        'where common  ' + 
           'or userid = ' + userInfo.userId + ' ' + 
           
        'union ' + 

        // tips used on one of the user's schedules (includes shared)
        'select tus.tipid, vtc.tiptext, vtc.common, vtc.userid ' + 
        'from view_tipsusedinschedule as tus, view_tipsandcategories as vtc ' + 
        'where tus.tipid = vtc.tipid ' + 
          'and tus.userid = ' + userInfo.userId + ' '
    };
    
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.tiplist,
      result.constraints = {};
    } else {
      result.details = queryResults.details;
    }
    
    return result;
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
              'where schedulename = "' + postData.schedulename + '" ';
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

//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query = 'update schedule ' +
                'set ' +
                  'schedulename = "' + postData.schedulename + '", ' +
                  'schedulelength = ' + postData.schedulelength + ', ' +
                  'schedulestartdate = "' + postData.schedulestartdate + '" ' +
                'where scheduleid = ' + postData.scheduleid;

    var queryResults = await this._dbQuery(query);
    console.log('_updateSchedule: deal with changed schedule length');

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
  
  async _updateUserNotificationOptions(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;
    
    query =
      'update user ' +
      'set ' + 
        'sharedschedule = ' + postData.sharedschedule + ', ' +
        'pushreminders = ' + postData.pushreminders + ', ' +
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

    var query, queryList;
    var queryResults;

    var scheduleTipId = postData.scheduletipid;
    var moveAfterId = postData.moveafterid;
    var moveBeforeId = postData.movebeforeid;
    var newLocation = postData.schedulelocation;
    
    if (scheduleTipId == moveBeforeId || scheduleTipId == moveAfterId) {
      result.success = false;
      result.data = null;
      result.details = "move failed: id=" + scheduleTipId + " after=" + moveAfterId + " before=" + moveBeforeId;
      return result;
    }
    
    queryResults = await this._unlinkScheduleTip(scheduleTipId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    queryResults = await this._linkScheduleTip(scheduleTipId, newLocation, moveAfterId, moveBeforeId);
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }
  
  async _addScheduleTip(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var queryList;
    var queryResults;
    
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

    queryList = {
      makescheduletip:
        'insert into scheduletip (' +
          'scheduleid, tipid, tipstate, schedulelocation, previousitem, nextitem ' +
        ') values (' +
          postData.scheduleid + ', ' +
          postData.tipid + ', ' +
          '0, ' + 
          postData.schedulelocation + ', ' +
          '-1, ' +
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
    if (!queryResults.success) {
      result.details = queryResults.detail;
      return result;
    }
    
    var scheduleTipId = queryResults.data.getscheduletip[0].scheduletipid;
    
    queryResults = await this._linkScheduleTip(scheduleTipId, postData.schedulelocation, postData.moveafterid, postData.movebeforeid);
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
    
    var queryList;
    var queryResults;
    
    queryList = {
      checkforduplicate:
        'select tipid ' +
        'from tip ' +
        'where tiptext = "' + postData.tiptext + '" ' +
          'and userid = ' + userInfo.userId
    }
    
    queryResults = await this._dbQueries(queryList);
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
    var addResult = await this._addScheduleTip(params, postData, userInfo);
    
    if (addResult.success) {
      result.success = true;
      result.details = 'update succeeded';
    } else {
      result.details = addResult.details;
    }
    
    return result;
  }
  
  async _unlinkScheduleTip(scheduleTipId) {
    var result = this._queryFailureResult();
    
    var query, queryList;
    
    var queryResults = await this._getScheduleTipLinks(scheduleTipId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var previousId = queryResults.data.previousitem;
    var nextId = queryResults.data.nextitem;
    
    // remove from current linked list
    if (previousId == -1 && nextId == -1) {
      // nothing to do
      
    } else if (previousId == -1) {
      // get next item and make it first
      queryList = {
        q1: 
          'update scheduletip ' +
          'set previousitem = -1 ' +
           'where scheduletipid = ' + nextId
      };
      
    } else if (nextId == -1) {
      // get previous item and make it last
      queryList = {
        q1: 
          'update scheduletip ' +
          'set nextitem = -1 ' +
           'where scheduletipid = ' + previousId
      };
      
    } else {
      // hook up previous and next items
      queryList = {
        q1:
          'update scheduletip ' +
          'set nextitem = ' + nextId + ' ' +
           'where scheduletipid = ' + previousId,
        q2:
          'update scheduletip ' +
          'set previousitem = ' + previousId + ' ' + 
           'where scheduletipid = ' + nextId
      };
    }

    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      
    } else {
      result.details = queryResults.details;
    }    

    return result;
  }
  
  async _linkScheduleTip(scheduleTipId, scheduleLocation, afterId, beforeId) {
    var result = this._queryFailureResult();
    
    var queryList;
    var queryResults;
    
    if (afterId == -1 && beforeId == -1) {
      // add as only item in list
      queryList = {
        q1:
          'update scheduletip ' +
          'set ' +
            'schedulelocation = ' + scheduleLocation + ', ' +
            'previousitem = -1, ' +
            'nextitem = -1 ' +
          'where scheduletipid = ' + scheduleTipId
      };
      
    } else if (afterId == -1) {
      // add as first item in list
      queryList = {
        q1:
          'update scheduletip ' + 
          'set ' +
            'schedulelocation = ' + scheduleLocation + ', ' +
            'previousitem = -1, ' +
            'nextitem = ' + beforeId + ' ' +
          'where scheduletipid = ' + scheduleTipId,
          
        q2:
          'update scheduletip ' + 
          'set ' +
            'previousitem = ' + scheduleTipId + ' ' +
          'where scheduletipid = ' + beforeId
      };
      
    } else if (beforeId == -1) {
      // add as last item in list
      queryList = {
        q1:
          'update scheduletip ' + 
          'set ' +
            'schedulelocation = ' + scheduleLocation + ', ' +
            'previousitem = ' + afterId + ', ' +
            'nextitem = -1 ' +
          'where scheduletipid = ' + scheduleTipId,
          
        q2:
          'update scheduletip ' + 
          'set ' +
            'nextitem = ' + scheduleTipId + ' ' +
          'where scheduletipid = ' + afterId
      };
      
    } else {
      // add between two items in list
      queryList = {
        q1:
          'update scheduletip ' + 
          'set ' +
            'schedulelocation = ' + scheduleLocation + ', ' +
            'previousitem = ' + afterId + ', ' +
            'nextitem = ' + beforeId + ' ' +
          'where scheduletipid = ' + scheduleTipId,
          
        q2:
          'update scheduletip ' + 
          'set ' +
            'nextitem = ' + scheduleTipId + ' ' +
          'where scheduletipid = ' + afterId,
          
        q3:
          'update scheduletip ' + 
          'set ' +
            'previousitem = ' + scheduleTipId + ' ' +
          'where scheduletipid = ' + beforeId
          
      };
    }
    
    queryResults = await this._dbQueries(queryList);
    if (queryResults.success) {
      result.success = true;
      
    } else {
      console.log(queryResults);
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
 
    var scheduleTipId = postData.scheduletipid;
    
    var queryResults = await this._unlinkScheduleTip(scheduleTipId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var query = 'delete from scheduletip ' +
                'where scheduletipid = ' + scheduleTipId;
    
    queryResults = await this._dbQuery(query);
    
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

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');;
    
    // consider other cleaning e.g. <script> tags
    
    return cleaned;
  }
}
