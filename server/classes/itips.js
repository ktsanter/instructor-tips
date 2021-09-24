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
      
    } else if (params.queryName == 'tip-list') {
      dbResult = await this._getTipList(params, postData, userInfo, funcCheckPrivilege);
      
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
          'and a.userid = ' + userInfo.userId
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
