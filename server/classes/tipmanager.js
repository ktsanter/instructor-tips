"use strict";
//---------------------------------------------------------------
// tip management DB interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.TipManager = class {
  constructor(mariadb, dbName) {
    this._mariadb = mariadb
    
    this._pool = mariadb.createPool({
      host: 'localhost',
      user: 'root',
      password: 'SwordFish002',
      connectionLimit: 5  
    });
    
    this._dbName = dbName;
  }
  
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();

    // tip manager queries
    if (params.queryName == 'tipschedule') {
      dbResult = await this._getTipSchedule(params, postData, userInfo);
      
    } else if (params.queryName == 'tipedit') {
      dbResult = await this._getTipEditData(params, postData, userInfo);
      
    } else if (params.queryName == 'tipmap') {
      dbResult = await this._getTipMapData(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }

    return dbResult;
  }

  async doInsert(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
   if (params.queryName == 'tip') {
      dbResult = await this._insertTip(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
    if (params.queryName == 'tip') {
      dbResult = await this._updateTip(params, postData);

    } else if (params.queryName == 'singletipstatus') {
      dbResult = await this._updateSingleTipStatus(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
   if (params.queryName == 'tip') {
      dbResult = await this._deleteTip(params, postData, userInfo);
      
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
  async _getTipSchedule(params, postData, userInfo) {
    var result = this._queryFailureResult();
   
    var statusA = '';
    var statusB = '';
    if (postData.unspecified) {
      statusA = 'a.tipstatusname is null ';      
    }
    if (postData.scheduled || postData.completed) {
      statusB = 'a.tipstatusname in (';
      if (postData.scheduled && postData.completed) {
        statusB += '"scheduled", "completed" ';
      } else if (postData.scheduled) {
        statusB += '"scheduled"';
      } else if (postData.completed) {
        statusB += '"completed"';
      }
      statusB += ') ';
    }
    
    var tipstatusCondition = ''
    if (statusA != '' && statusB != '') {
      tipstatusCondition = '(' + statusA + ' OR ' + statusB + ')';
    } else if (statusA != '') {
      tipstatusCondition = statusA;
    } else if (statusB != '') {
      tipstatusCondition = statusB;
    }

    var queryList = {};
    if (postData.general) {
      if (postData.shared) {
        queryList.generaltip_shared = 
          'select tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, generaltip_shared.generaltipid, NULL as coursetipid ' + 
          'from generaltip_shared ' + 
          'left outer join (' +
            'SELECT usertipstatusid, generaltipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user  ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON generaltip_shared.generaltipid = a.generaltipid ' + 
          'where generaltip_shared.termgroupname = "' + postData.termgroupname + '" ' + 
          'and ' + tipstatusCondition; 
       
      }
      if (postData.personal) {
        queryList.generaltip_personal = 
          'SELECT tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, generaltip_personal.generaltipid, NULL as coursetipid ' +
          'FROM generaltip_personal ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT usertipstatusid, generaltipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON generaltip_personal.generaltipid = a.generaltipid ' +
          'WHERE generaltip_personal.userid = ' + userInfo.userId + ' ' +
            'AND generaltip_personal.termgroupname = "' + postData.termgroupname + '" ' +
            'and ' + tipstatusCondition;
      }
    }
    
    if (postData.coursespecific) {
      if (postData.shared) {
        queryList.coursetip_shared =
          'SELECT tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, NULL AS generaltipid, coursetip_shared.coursetipid ' +
          'FROM coursetip_shared ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT usertipstatusid, coursetipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON coursetip_shared.coursetipid = a.coursetipid ' +
          'WHERE coursetip_shared.termgroupname = "' + postData.termgroupname + '" ' + 
            'AND coursetip_shared.coursename = "' + postData.coursename + '" ' +
            'AND ' + tipstatusCondition;
         
      }
      if (postData.personal) {
        queryList.coursetip_personal = 
          'SELECT tiptext, termgroupname, week, a.tipstatusname, a.usertipstatusid, NULL AS generaltipid, coursetip_personal.coursetipid ' +
          'FROM coursetip_personal ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT usertipstatusid, coursetipid, tipstatusname, user.userid, user.usershortname ' +
            'FROM usertipstatus, tipstatus, user ' +
            'WHERE usertipstatus.tipstatusid = tipstatus.tipstatusid ' +
              'AND user.userid = ' + userInfo.userId + ' ' +
              'AND user.userid = usertipstatus.userid ' +
            ') AS a ' +
          'ON coursetip_personal.coursetipid = a.coursetipid ' +
          'WHERE coursetip_personal.userid = ' + userInfo.userId + ' ' + 
            'AND coursetip_personal.termgroupname = "' + postData.termgroupname + '" ' + 
            'AND coursetip_personal.coursename = "' + postData.coursename + '" ' +
            'AND ' + tipstatusCondition;
      }
    }
    
    queryList.termlength = 
      'select termlength ' +
      'from termgroup ' +
      'where termgroupname = "' + postData.termgroupname + '" ';
      
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      var combinedRows = [];
      for (var key in queryResults.data) {
        if (key != 'termlength') {
          var qdata = queryResults.data[key];
          for (var i = 0; i < qdata.length; i++) {
            combinedRows.push(qdata[i]);
          }
        }
      }
      result.success = true;
      result.details = 'query succeeded';
      result.data = combinedRows;
      result.termlength = queryResults.data.termlength[0].termlength;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  

//----------------------------------------------------------
  async _getTipEditData(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList = {};
    
    if (postData.shared) {
      queryList.shared = 
        'SELECT tipid, tiptext, NULL as userid, NULL as username ' +
        'FROM tip ' + 
        'WHERE userid IS NULL ' +
        '  AND tiptext LIKE "%' + postData.searchtext + '%" ' +
        'ORDER BY tiptext ';
    }   
    
    if (postData.personal) {
      if (postData.user) {
        queryList.personal = 
          'SELECT tipid, tiptext, a.userid, a.username ' +
          'FROM tip ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT userid, username ' +
            'FROM user ' +
          ') AS a ' + 
          'ON tip.userid = a.userid ' + 
          'WHERE a.username = "' + postData.username + '" ' +
          '  AND tiptext LIKE "%' + postData.searchtext + '%" ' +
          'ORDER BY tiptext, a.username; ';
      
      } else {
        queryList.personal = 
          'SELECT tipid, tiptext, a.userid, a.username ' +
          'FROM tip ' +
          'LEFT OUTER JOIN ( ' +
            'SELECT userid, username ' +
            'FROM user ' +
          ') AS a ' + 
          'ON tip.userid = a.userid ' + 
          'WHERE tiptext LIKE "%' + postData.searchtext + '%" ' +
            'AND a.userid IS NOT NULL ' + 
          'ORDER BY tiptext, a.username; ';
      }
    }
    
    queryList.users = 
      'SELECT userid, username ' +
      'FROM user ' +
      'ORDER BY username ';
      
    var queryResults = await this._dbQueries(queryList);
    
    if (queryResults.success) {
      var combinedRows = [];
      for (var key in queryResults.data) {
        if (key != 'users') {
          var qdata = queryResults.data[key];
          for (var i = 0; i < qdata.length; i++) {
            combinedRows.push(qdata[i]);
          }
        }
      }
   
      result.success = true;
      result.details = 'query succeeded';
      result.primaryKey = 'tipid';
      result.insertUpdateFields = [
        {tiptext: 'textarea'},
        {userid: 'foreignkey'}
      ]
      result.displayFields = ['tiptext', 'username'];
      result.data = combinedRows;
      result.constraints = {
        foreignKeys: {
          userid: {data: 'users', displayField: 'username', allownull: true}
        },
        users: queryResults.data.users
      };

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
//----------------------------------------------------------
  async _getTipMapData(params, postData, userInfo) {
    var result = this._queryFailureResult();
    var queryList = {};
    
    var constraint = this._buildTipMappingConstraints_orig(postData);  
/*    
    queryList.alltips = 
      'SELECT tipid, generaltipid, coursetipid, tiptext, termgroupname, week, username, coursename ' + 
      'FROM alltipmapping_orig ' +
      constraint + ' ';
  */    
    var constraint = this._buildTipMappingConstraints(postData);
    queryList.tips = 
      'SELECT tipid, tiptext, termgroupname, week, username, coursename ' +
      'from viewmappedtip ' +
      constraint + ' ';
     
    queryList.termgroups = 
      'SELECT termgroupname, termlength ' +
      'FROM termgroup ' +
      'ORDER BY termgroupid ';
      
    console.log(queryList);
    var queryResults = await this._dbQueries(queryList);
    console.log(queryResults);
    
    if (queryResults.success) {   
      result.success = true;
      result.details = 'query succeeded';
      //var processedData = this._processMapResults(queryResults.data.alltips);
      var processedData = this._processMapResults(queryResults.data.tips);
      result.tips = processedData.tips;
      result.mapping = processedData.mapping;
      result.termgroups = queryResults.data.termgroups;

    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  _buildTipMappingConstraints_orig(postData) {
    var generalConstraint = '';
    if (postData.unmapped) generalConstraint = ' (generaltipid IS NULL and coursetipid IS NULL) ';
    if (postData.general != '') {
      if (generalConstraint) generalConstraint += ' OR ';
      generalConstraint += ' (generaltipid IS NOT NULL) ';
    }
    if (postData.coursespecific) {
      if (generalConstraint != '') generalConstraint += ' OR ';
      generalConstraint += ' (coursename = "' + postData.coursename + '" ) ';
    }
    if (!postData.unmapped && !postData.general && !postData.coursespecific) {
      generalConstraint = ' (FALSE) ';
    }
    if (generalConstraint != '') generalConstraint = ' (' + generalConstraint + ') ';
    
    var privateConstraint = '';
    if (postData.shared) privateConstraint = ' (username IS NULL) ';
    if (postData.personal) {
      if (privateConstraint != '') privateConstraint += ' OR ';
      privateConstraint += ' (username IS NOT NULL) ';
    }
    if (!postData.shared && !postData.personal) {
      privateConstraint = ' (FALSE) ';
    }
    if (privateConstraint != '') privateConstraint = ' (' + privateConstraint + ') ';
    
    var userConstraint = '';
    if (postData.user) userConstraint = ' (username = "' + postData.username + '") ';
    
    var searchConstraint = ' (tiptext like "%' + postData.searchtext + '%") ';

    var constraint = '';
    if (generalConstraint != '') constraint += generalConstraint;
    if (privateConstraint != '') {
      if (constraint != '') constraint += ' AND ';
      constraint += privateConstraint;
    }
    if (userConstraint != '') {
      if (constraint != '') constraint += ' AND ';
      constraint += userConstraint;
    }
    if (searchConstraint != '') {
      if (constraint != '') constraint += ' AND ';
      constraint += searchConstraint;
    }
    if (constraint != '') constraint = 'WHERE ' + constraint;
    
    return constraint;
  }
  
  _buildTipMappingConstraints(postData) {
    console.log('build...');
    console.log(postData);
    
    var generalConstraint = '';
    if (postData.unmapped) generalConstraint = ' (mappedtipid IS NULL) ';
    if (postData.general != '') {
      if (generalConstraint) generalConstraint += ' OR ';
      generalConstraint += ' (courseid IS NULL) ';
    }
    if (postData.coursespecific) {
      if (generalConstraint != '') generalConstraint += ' OR ';
      generalConstraint += ' (coursename = "' + postData.coursename + '" ) ';
    }
    if (!postData.unmapped && !postData.general && !postData.coursespecific) {
      generalConstraint = ' (FALSE) ';
    }
    if (generalConstraint != '') generalConstraint = ' (' + generalConstraint + ') ';
    console.log('generalConstraint: ' + generalConstraint);
    
    var privateConstraint = '';
    if (postData.shared) privateConstraint = ' (username IS NULL) ';
    if (postData.personal) {
      if (privateConstraint != '') privateConstraint += ' OR ';
      privateConstraint += ' (username IS NOT NULL) ';
    }
    if (!postData.shared && !postData.personal) {
      privateConstraint = ' (FALSE) ';
    }
    if (privateConstraint != '') privateConstraint = ' (' + privateConstraint + ') ';
    console.log('privateConstraint: ' + privateConstraint);
     
    var userConstraint = '';
    if (postData.user) userConstraint = ' (username = "' + postData.username + '") ';
    console.log('userConstraint: ' + userConstraint);
    
    var searchConstraint = ' (tiptext like "%' + postData.searchtext + '%") ';
    console.log('searchConstraint: ' + searchConstraint);

    var constraint = '';
    if (generalConstraint != '') constraint += generalConstraint;
    if (privateConstraint != '') {
      if (constraint != '') constraint += ' AND ';
      constraint += privateConstraint;
    }
    if (userConstraint != '') {
      if (constraint != '') constraint += ' AND ';
      constraint += userConstraint;
    }
    if (searchConstraint != '') {
      if (constraint != '') constraint += ' AND ';
      constraint += searchConstraint;
    }
    if (constraint != '') constraint = 'WHERE ' + constraint;
    console.log('constraint: ' + constraint);
    
    return constraint;
  }
  
  _processMapResults(mapData) {
    var tips = [];
    var mapping = {};
    
    for (var i = 0; i < mapData.length; i++) {
      var tip = mapData[i];
      
      if (!this._tipInArray(tip.tipid, tips)) {
        tips.push({tipid: tip.tipid, tiptext: tip.tiptext});
      }
      
      var termgroupName = tip.termgroupname;

      if (termgroupName != null) {
        if (!mapping.hasOwnProperty(tip.tipid)) {
          mapping[tip.tipid] = {};
        }
        var mapEntry = mapping[tip.tipid];
      
        if (!mapEntry.hasOwnProperty(termgroupName)) {
          mapEntry[termgroupName] = {};
        }
        var mapTermEntry = mapEntry[termgroupName];
        
        mapTermEntry = {
          week: tip.week,
          generaltipid: tip.generaltipid,
          coursetipid: tip.coursetipid,
          coursename: tip.coursename
        }
        mapEntry[termgroupName] = mapTermEntry;
        mapping[tip.tipid] = mapEntry;
      }
    }
    
    return {"tips": tips, "mapping": mapping};
  }
  
  _tipInArray(tipId, arr) {
    var inArray = false;
    
    for (var i = 0; i < arr.length && !inArray; i++) {
      inArray = (tipId == arr[i].tipid);
    }
    
    return inArray;
  }

//---------------------------------------------------------------
// specific insert methods
//---------------------------------------------------------------
    async _insertTip(params, postData, userInfo) {
    var result = this._queryFailureResult();
    
    var query = 'insert into tip (tiptext, userid) ' +
                'values (' +
                  '"' + postData.tiptext + '", ' + 
                  postData.userid + ' ' + 
                ')';
    
    var queryResults = await this._dbQuery(query);

    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }  
  
//---------------------------------------------------------------
// specific update methods
//---------------------------------------------------------------
  async _updateTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'update tip ' +
                'set ' +
                  'tiptext = "' + postData.tiptext + '", ' +
                  'userid = ' + postData.userid + ' ' +
                'where tipid = ' + postData.tipid;

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
  
  async _updateSingleTipStatus(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query;
    var queryResults;
    
    if (postData.tipstatusname == null) {
      queryResults = await this._deleteSingleTipStatus(params, postData, userInfo);
   
    } else {
      var tipStatusId = await this._getTipStatusId(postData.tipstatusname);
      
      if (postData.usertipstatusid == null) {
        query =
          'insert into usertipstatus (generaltipid, coursetipid, userid, tipstatusid) ' +
          'values (' +
            postData.generaltipid + ', ' +
            postData.coursetipid + ', ' +
            userInfo.userId + ', ' +
            tipStatusId + 
          ')';
          queryResults = await this._dbQuery(query);
      
      } else {
        query =
          'update usertipstatus ' +
          'set tipstatusid = ' + tipStatusId + ' ' +
          'where usertipstatusid = ' + postData.usertipstatusid;
        queryResults = await this._dbQuery(query);
      }
    }
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _deleteSingleTipStatus(params, postData, userInfo) {
    var query =
      'delete from usertipstatus ' +
      'where usertipstatusid = ' + postData.usertipstatusid;
    
    return await this._dbQuery(query);
  }
  
  async _getTipStatusId(tipstatusname) {
    var tipStatusId = null;
    
    var query = 
      'select tipstatusid ' +
      'from tipstatus ' +
      'where tipstatusname = "' + tipstatusname + '" ';
    
    var queryResults = await this._dbQuery(query);
    if (queryResults.success) {
      tipStatusId = queryResults.data[0].tipstatusid;
    }

    return tipStatusId;
  }
  
//---------------------------------------------------------------
// specific delete methods
//---------------------------------------------------------------
  async _deleteTip(params, postData) {
    var result = this._queryFailureResult();

    var query = 'delete from tip ' +
                'where tipid = ' + postData.tipid;

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
}
