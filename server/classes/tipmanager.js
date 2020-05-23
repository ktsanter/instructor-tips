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
      
    } else if (params.queryName == 'schedule-details') {
      dbResult = await this._getScheduleDetails(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, gMailer, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._insertSchedule(params, postData, userInfo);
      
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

    } else if (params.queryName == 'notificationoptions') {
      dbResult = await this._updateUserNotificationOptions(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'schedule') {
      dbResult = await this._deleteSchedule(params, postData, userInfo);
            
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
          'st.tipstate, st.schedulelocation, ' +
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
        scheduledetails: queryResults.data.scheduledetails
      };
      result.constraints = {};
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
    
    var state = '{' +
      '\\"scheduleid\\": ' + postData.scheduleid + ', ' + 
      '\\"showbrowse\\": ' + postData.showbrowse + 
    '}'

    var query = 'update controlstate ' +
                'set ' +
                  'state = "' + state + '" ' +
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
  
//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');;
    
    // consider other cleaning e.g. <script> tags
    
    return cleaned;
  }
}
