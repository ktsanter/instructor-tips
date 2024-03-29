"use strict";
//---------------------------------------------------------------
// server-side for ITips
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.ITips = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;  
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'schedule-list') {
      dbResult = await this._getScheduleList(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'schedule-data') {
      dbResult = await this._getScheduleData(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'tip-list') {
      dbResult = await this._getTipList(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'schedules-using-tip') {
      dbResult = await this._getSchedulesUsingTip(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'user-list') {
      dbResult = await this._getUserList(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'pending-shares') {
      dbResult = await this._getPendingShares(params, postData, userInfo, funcCheckPrivilege);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._insertSchedule(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'tip') {
      dbResult = await this._insertTip(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'add-tip-to-week') {
      dbResult = await this._addTipToWeek(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'remove-tip-from-week') {
      dbResult = await this._removeTipFromWeek(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'share-schedule') {
      dbResult = await this._insertSharedSchedule(params, postData, userInfo, funcCheckPrivilege);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._updateSchedule(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'tip') {
      dbResult = await this._updateTip(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'change-tip-state') {
      dbResult = await this._changeTipState(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'accept-shared-schedule') {
      dbResult = await this._acceptSharedSchedule(params, postData, userInfo, funcCheckPrivilege);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._deleteSchedule(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'tip') {
      dbResult = await this._deleteTip(params, postData, userInfo);
    
    } else if (params.queryName == 'shared-schedule') {
      dbResult = await this._deleteSharedSchedule(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------      
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------    
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  

  async _getScheduleList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      schedule:
        'select ' + 
          's.scheduleid, s.schedulename, s.schedulelength, s.schedulestart ' + 
        'from schedule as s ' +
        'where s.userid = ' + userInfo.userId + ' ' +
        'order by s.schedulename'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.schedule;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _insertSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryResults;
    
    query = 
      'call add_schedule(' + 
        userInfo.userId + ', ' +
        '"' + postData.schedulename + '", ' +
            + postData.schedulelength + ', ' +
        '"' + postData.schedulestart + '" ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = queryResults.data[0][0];

    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }

    return result;
  }  

  async _updateSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryResults;
    
    query = 
      'update schedule ' + 
      'set ' +
        'schedulename = "' + postData.schedulename + '", ' +
        'schedulestart = "' + postData.schedulestart + '" ' +
      'where ' +
        'scheduleid = ' + postData.scheduleid + ' and ' +
        'userid = ' + userInfo.userId;
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }

    return result;
  }  
  
  async _deleteSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryResults;
    
    query = 
      'delete from schedule ' + 
      'where ' +
        'scheduleid = ' + postData.scheduleid + ' and ' +
        'userid = ' + userInfo.userId;
   
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _getScheduleData(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      schedule:
        'select ' + 
          'a.scheduleid, a.schedulelength, a.schedulestart ' +
          'from schedule as a ' +
        'where a.userid = ' + userInfo.userId + ' ' +
          'and a.scheduleid = ' + postData.scheduleid,
          
      tips:
        'select a.tipid, a.weekindex, a.tipstate, b.tipcontent ' +
        'from schedule_tip as a, tip as b ' +
        'where a.scheduleid = ' + postData.scheduleid + ' ' +
          'and a.tipid = b.tipid'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var scheduleInfo = queryResults.data.schedule[0];
    var tipInfo = queryResults.data.tips;
    var scheduleData = this._consolidateScheduleData(scheduleInfo, tipInfo);
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = scheduleData;
    
    return result;
  }
  

  async _getTipList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      tiplistwithtags:
        'select ' + 
          'a.tipid, a.tipcontent, b.tagcontent ' + 
        'from tip as a, tag as b, tip_tag as c ' +
        'where a.userid = ' + userInfo.userId + ' ' +
          'and a.tipid = c.tipid ' +
          'and b.tagid = c.tagid ',
          
      tiplistwithouttags:
        'select ' +
          'a.tipid, a.tipcontent, null as tagcontent ' +
        'from tip as a ' +
        'where a.userid = ' + userInfo.userId + ' ' +
          'and a.tipid not in (' +
            'select tipid from tip_tag ' +
          ')',
          
      usagecount: 
        'select b.tipid, count(b.schedule_tipid) as "usagecount" ' +
        'from schedule as a, schedule_tip as b ' +
        'where a.scheduleid = b.scheduleid ' +
          'and a.userid = ' + userInfo.userId + ' ' +
        'group by b.tipid'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.detail;
      return result;
    }

    var originalTipList = queryResults.data.tiplistwithtags.concat(queryResults.data.tiplistwithouttags);
    var tipList = this._consolidateTipList(originalTipList, queryResults.data.usagecount);
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = tipList;

    return result;
  }

  async _insertTip(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryList, queryResults;
    
    query = 
      'call add_tip(' + 
        userInfo.userId + ', ' +
        '"' + postData.tipcontent + '" ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
      return result;
    }

    var tipId = queryResults.data[0][0].tipid;
    
    queryResults = await this._updateTagsForUser(postData.taglist, userInfo.userId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    queryResults = await this._setTagsForTip(tipId, postData.taglist, userInfo.userId);
    if (!queryResults.success) {
      result = queryResults.details;
      return result;
    }
        
    result.success = true;
    result.details = 'insert succeeded';
    result.data = tipId;

    return result;
  }  

  async _updateTip(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryList, queryResults;
    
    query = 
      'update tip set ' + 
        'tipcontent = "' + postData.tipcontent + '" ' +
      'where ' +
        'tipid = ' + postData.tipid;
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
      return result;
    }

    queryResults = await this._updateTagsForUser(postData.taglist, userInfo.userId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    queryResults = await this._setTagsForTip(postData.tipid, postData.taglist, userInfo.userId);
    if (!queryResults.success) {
      result = queryResults.details;
      return result;
    }
        
    result.success = true;
    result.details = 'update succeeded';
    result.data = postData.tipid;

    return result;
  }  

  async _deleteTip(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'delete from tip ' + 
      'where ' +
        'tipid = ' + postData.tipid + ' and ' +
        'userid = ' + userInfo.userId;
   
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _addTipToWeek(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'insert into schedule_tip ( ' +
        'scheduleid, weekindex, tipid, tipstate ' +
      ') values (' +
        postData.scheduleid + ', ' +
        postData.weekindex + ', ' +
        postData.tipid + ', ' +
        '"unchecked"' +
      ')'        

    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
      if (queryResults.details.code == 'ER_DUP_ENTRY') {
        result.details = 'duplicate';
      }
    }

    return result;
  }  

  async _removeTipFromWeek(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'delete from schedule_tip ' +
      'where scheduleid = ' + postData.scheduleid + ' ' +
        'and weekindex = ' + postData.weekindex + ' ' +
        'and tipid = ' + postData.tipid

    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'removal succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _changeTipState(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var query, queryResults;
    var tipState = postData.value ? 'checked' : 'unchecked';
    
    query = 
      'update schedule_tip ' + 
      'set ' +
        'tipstate = "' + tipState + '" ' +
      'where scheduleid = ' + postData.scheduleid + ' ' +
          'and weekindex = ' + postData.weekindex + ' ' +
          'and tipid = ' + postData.tipid
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'tip state change succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _getSchedulesUsingTip(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      usage:
        'select a.scheduleid, a.schedulename, b.weekindex ' +
        'from schedule as a, schedule_tip as b ' +
        'where a.scheduleid = b.scheduleid ' +
          'and b.tipid = ' + postData.tipid
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.detail;
      return result;
    }

    var originalList = queryResults.data.usage;

    var consolidated = {};
    for (var i = 0; i < originalList.length; i++) {
      var row = originalList[i];
      
      if (!consolidated.hasOwnProperty(row.scheduleid)) {
        consolidated[row.scheduleid] = {
          "scheduleid": row.scheduleid,
          "schedulename": row.schedulename,
          "weeks": []
        }
      }

      consolidated[row.scheduleid].weeks.push(row.weekindex);
    }
    
    var consolidatedArray = [];
    for (var key in consolidated) {
      consolidatedArray.push(consolidated[key]);
    }

    consolidatedArray = consolidatedArray.sort(function(a,b) {
      return a.schedulename.toLowerCase().localeCompare(b.schedulename.toLowerCase());
    });
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = consolidatedArray;

    return result;
  }

  async _getUserList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      schedule:
        'select ' + 
          'a.userid, a.username ' + 
        'from instructortips.user as a ' +
        'order by a.username '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.schedule;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _insertSharedSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryList, queryResults;
    
    query = 
      'call add_shared_schedule (' + 
        postData.scheduleid + ', ' +
        userInfo.userId + ', ' +
        postData.shareWithUserId + ', ' +
        '"' + postData.comment + '" ' +
      ') ';

    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'insert succeeded';

    return result;
  }  

  async _getPendingShares(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      shared_schedules:
        'select ' + 
          'a.shared_scheduleid, a.sharedon, a.schedulename, a.sharedby, a.sharecomment ' + 
        'from shared_schedule as a ' +
        'where a.userid = ' + userInfo.userId + ' ' +
        'order by a.sharedon '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data.shared_schedules;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _deleteSharedSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'delete from shared_schedule ' + 
      'where ' +
        'shared_scheduleid = ' + postData.scheduleid + ' and ' +
        'userid = ' + userInfo.userId;
   
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = queryResults.data;

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  

  async _acceptSharedSchedule(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    console.log('\n----------------------------------');    
    console.log('_acceptSharedSchedule');
    console.log(params);
    console.log(postData);
    
    var interimResult = await this._getSharedScheduleInfo(postData.scheduleid, userInfo.userId);
    if (!interimResult.success) {
      result.details = interimResult.details;
      return result;
    }
    var scheduleInfo = interimResult.scheduleinfo;
    scheduleInfo.schedulename = postData.schedulename;
    var sharedTips = interimResult.sharedtips;
    
    interimResult = await this._makeNewScheduleFromShared(scheduleInfo, userInfo.userId);
    console.log('interimResult (_makeNewScheduleFromShared)', interimResult);
    if (!interimResult.success) {
      result.details = interimResult.details;
      return result;
    }
    var newScheduleId = interimResult.newscheduleid;

    interimResult = await this._incorporateSharedTips(userInfo.userId, newScheduleId, sharedTips);
    console.log('interimResult (_incorporateSharedTips)', interimResult);
    if (!interimResult.success) {
      result.details = interimResult.details;
      return result;
    }
    
    interimResult = await this._deleteSharedSchedule(null, {"scheduleid": postData.scheduleid}, {"userid": userInfo.userId});
    console.log('interimResult (_deleteSharedSchedule)', interimResult);
    if (!interimResult.success) {
      result.details = interimResult.details;
      return result;
    }
    
    result.success = true;
    result.details = 'shared schedule accepted';
    
    return result;
  }

//----------------------------------------------------------------------
// support methods and queries
//----------------------------------------------------------------------  
  _consolidateTipList(tipAndTagList, usageCountList) {  
    var objTipList = {};
    for (var i = 0; i < tipAndTagList.length; i++) {
      var item = tipAndTagList[i];
      if (!objTipList.hasOwnProperty(item.tipid)) objTipList[item.tipid] = {
        "tipid": item.tipid,
        "tipcontent": item.tipcontent,
        "taglist": []
      }

      if (item.tagcontent) {
        objTipList[item.tipid].taglist.push(item.tagcontent);
      }
    }
    
    var consolidated = [];
    for (var key in objTipList) {
      var tipInfo = objTipList[key];
      
      var tipId = tipInfo.tipid;
      var usageCount = 0
      for (var i = 0; i < usageCountList.length; i++) {
        if (tipId == usageCountList[i].tipid) {
          usageCount = usageCountList[i].usagecount;
          break;
        }
      }
      
      tipInfo.usagecount = usageCount;
      consolidated.push(tipInfo);
    }
    
    return consolidated;
  }
  
  async _updateTagsForUser(tagList, userId) {
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    
    queryList = {};
    for (var i = 0; i < tagList.length; i++) {
      var tagContent = tagList[i];
      
      queryList['tagindex_' + i] = 
        'insert into tag (userid, tagcontent) ' +
        'values (' +
          userId + ', ' +
          '"' + tagContent + '"' +
        ') on duplicate key update tagcontent = "' + tagContent + '"';
    }
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update tags succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _setTagsForTip(tipId, tagList, userId) {
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    
    var inClause = '';
    for (var i = 0; i < tagList.length; i++) {
      if (i > 0) inClause += ', ';
      inClause += '"' + tagList[i] + '"';
    }
    
    queryList = {
      removetags:
        'delete from tip_tag ' +
        'where tipid = ' + tipId,
    }
    
    if (tagList.length > 0) {
      queryList.addtags = 
        'insert into tip_tag (tipid, tagid) ' +
        'select a.tipid, b.tagid ' +
        'from tip as a, tag as b ' +
        'where a.tipid = ' + tipId + ' ' +
          'and a.userid = ' + userId + ' ' +
          'and b.userid = ' + userId + ' ' +
          'and b.tagcontent in (' + inClause + ')'
    }
        
    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result = queryResults.details;
      return result;
    }
        
    result.success = true;
    result.details = 'tag setting for tip succeeded';
    result.data = tipId;

    return result;
  }
  
  _consolidateScheduleData(scheduleInfo, tipInfo) {
    var weeklyTips = [];
    for (var i = 0; i < scheduleInfo.schedulelength; i++) {
      weeklyTips.push([]);
    }
    for (var i = 0; i < tipInfo.length; i++) {
      var tipItem = tipInfo[i];
      weeklyTips[tipItem.weekindex].push({
        "tipid": tipItem.tipid,
        "tipcontent": tipItem.tipcontent,
        "tipstate": tipItem.tipstate
      });
    }      
    
    var consolidated = {
      "scheduleid": scheduleInfo.scheduleid,
      "schedulelength": scheduleInfo.schedulelength,
      "schedulestart": scheduleInfo.schedulestart,
      "tiplist": weeklyTips
    }
    
    return consolidated;
  }

  async _getSharedScheduleInfo(sharedScheduleId, userId) {
    var result = this._dbManager.queryFailureResult();

    var queryList, queryResults;
    
    queryList = {
      scheduleinfo: 
        'select a.schedulelength, a.schedulestart ' +
        'from shared_schedule as a ' +
        'where a.shared_scheduleid = ' + sharedScheduleId + ' ' +
          'and a.userid = ' + userId,
          
      sharedtips: 
        'select a.weekindex, a.tipcontent ' +
        'from shared_schedule_tip as a ' +
        'where a.shared_scheduleid = ' + sharedScheduleId
    };

    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = '_getSharedScheduleInfo succeeded';
    result.scheduleinfo = queryResults.data.scheduleinfo[0];
    result.sharedtips = queryResults.data.sharedtips;
    
    return result;
  }    

  async _makeNewScheduleFromShared(scheduleInfo, userId) {
    var result = this._dbManager.queryFailureResult();  
    console.log('\n_makeNewScheduleFromShared', scheduleInfo, userId);

    var interimResult = await this._insertSchedule(null, scheduleInfo, {"userId": userId});
    console.log(interimResult);
    if (!interimResult.success) {
      result.details = interimResult.details;
      return result;
    }
    
    result.success = true;
    result.details = '_makeNewScheduleFromShared succeeded';
    result.newscheduleid = interimResult.data.scheduleid;
    
    return result;
  }    

  async _incorporateSharedTips(userId, scheduleId, tipList) {
    /*
      - iterate through shared tips, adding if new or linking to existing
    */
    console.log('\n_incorporateSharedTips', userId, scheduleId, tipList);
    console.log('this is where I left off');
    
    var result = this._dbManager.queryFailureResult();  
    result.details = '_incorporateSharedTips failed';
    
    return result;
  }    

//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _sendFail(res, failMessage) {
    var result = {
      sucess: false,
      details: failMessage,
      data: null
    };
    
    res.send(result);
  }
  
  _sendSuccess(res, successMessage, dataValues) {
    if (!dataValues) dataValues = null;
    
    var result = {
      success: true,
      details: successMessage,
      data: dataValues
    };
    
    res.send(result);
  }  
}
