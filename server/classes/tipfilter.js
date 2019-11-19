"use strict";
//---------------------------------------------------------------
// tip filter DB interface
//---------------------------------------------------------------
// TODO: add logic based on user privileges
//---------------------------------------------------------------

const internal = {};

module.exports = internal.TipFilter = class {
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
// query dispatcher
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
        
    if (params.queryName == 'scheduling') {
      dbResult = await this._getSchedulingTipFilter(params, userInfo);
      
    } else if (params.queryName == 'editing') {
      dbResult = await this._getEditingTipFilter(params, userInfo);
      
    } else if (params.queryName == 'mapping') {
      dbResult = await this._getMappingTipFilter(params, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// update dispatcher
//---------------------------------------------------------------
  async doUpdate(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
    
    dbResult = await this._updateTipFilter(params, postData, userInfo);
    
    return dbResult;
  }

//---------------------------------------------------------------
// general query methods
//---------------------------------------------------------------
  _queryFailureResult() {
    return {success: false, details: 'db query failed', data: null};
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
// general purpose filter methods
//---------------------------------------------------------------
  async _getFilter(userInfo, filterType, defaultFilter) {
    var result = this._queryFailureResult();

    var filterQuery = 
        'select tipfilter ' +
        'from usertipfilter ' +
        'where userid = "' + userInfo.userId + '" ' +
        'and tipfiltertype = "' + filterType + '" ';

    var queryResult = await this._dbQuery(filterQuery);
    if (queryResult.success) {
      if (queryResult.data.length == 0) {
        queryResult = await this._insertFilter(userInfo, filterType, defaultFilter);
        if (queryResult.success) queryResult = await this._dbQuery(filterQuery);
      }
      
      if (queryResult.success) {
        result.success = true;
        result.details = 'filter retrieval succeeded';
        result.tipfilter = JSON.parse(queryResult.data[0].tipfilter);
      } else {
        result.details = queryResult.details;
      }
      
    } else {
      result.details = queryResult.details;
    }
    
    return result;
  }
  
  async _insertFilter(userInfo, filterType, filter) {
    var query = 
      'insert into usertipfilter (tipfilter, userid, tipfiltertype) ' +
      'values (' +
        '\'' + JSON.stringify(filter) + '\', ' + 
        '"' + userInfo.userId + '", ' + 
        '"' + filterType + '" ' +
      ')';

    return await this._dbQuery(query);
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getSchedulingTipFilter(params, userInfo) {
    var result = this._queryFailureResult();

    var filter = {
      coursespecific: true,
      coursename: '',
      termgroupname: 'semester',
      user: true,
      username: userInfo.userName,
      unspecified: true,
      completed: true,
      scheduled: true
    };
    
    var tipUIConfig = {
      courseTermGroup: ['coursename', 'termgroupname'],
      tipstatusGroup: ['unspecified', 'scheduled', 'completed'],
      userGroup: ['username'],
      groupOrder: ['courseTermGroup', 'tipstatusGroup']
     };
     
     if (userInfo.privilegeLevel == 'admin' || userInfo.privilegeLevel == 'superadmin') {
       tipUIConfig.groupOrder = ['courseTermGroup', 'userGroup', 'tipstatusGroup'];
     }

    var queryResultForFilter = await this._getFilter(userInfo, 'scheduling', filter);
    if (!queryResultForFilter.success) {
      result.details = queryResultForFilter.details;

    } else {      
      var queryList = {
        courses: 
          'select coursename ' + 
          'from course ' + 
          'order by coursename ',
            
        users:
          'select username ' +
          'from user ' +
          'order by username ',
          
        termgroups:
          'select termgroupname ' +
          'from termgroup ' +
          'order by termgroupid '
      };
      
      var queryResults = await this._dbQueries(queryList);
      
      if (queryResults.success) {
        result.success = true;
        result.details = 'query succeeded';
        result.tipfilter = queryResultForFilter.tipfilter;
        result.courses = queryResults.data.courses;
        result.users = queryResults.data.users;
        result.termgroups = queryResults.data.termgroups;
        result.uiconfig = tipUIConfig;
        
      } else {
        result.details = queryResults.details;      
      }
    }
    
    return result;
  } 
  
  //--------------------------------------------------------------
  async _getEditingTipFilter(params, userInfo) {
    var result = this._queryFailureResult();

    var filter = {
      shared: false,
      personal: true,
      user: true,
      username: userInfo.userName,
      searchtext: ''
    };
    
    var tipUIConfig = {
      publicOrPrivateGroup: ['shared', 'personal'],
      userGroup: ['user', 'username'],
      searchGroup: ['searchtext'],
      groupOrder: ['searchGroup']
     };
     
     if (userInfo.privilegeLevel == 'admin' || userInfo.privilegeLevel == 'superadmin') {
       filter.shared = true;
       filter.user = false;
       tipUIConfig.groupOrder = ['publicOrPrivateGroup', 'userGroup', 'searchGroup'];
     }

    var queryResultForFilter = await this._getFilter(userInfo, 'editing', filter);
    if (!queryResultForFilter.success) {
      result.details = queryResultForFilter.details;

    } else {      
      var queryList = {
        users: 
          'select username ' + 
          'from user ' + 
          'order by username '
      };
      
      var queryResults = await this._dbQueries(queryList);
      
      if (queryResults.success) {
        result.success = true;
        result.details = 'query succeeded';
        result.tipfilter = queryResultForFilter.tipfilter;
        result.users = queryResults.data.users;
        result.uiconfig = tipUIConfig;
        
      } else {
        result.details = queryResults.details;      
      }
    }
    
    return result;
  }
  
  //--------------------------------------------------------------  
  async _getMappingTipFilter(params, userInfo) {
    var result = this._queryFailureResult();

    var filter = {
      unmapped: true,
      general: true,
      coursespecific: true,
      coursename: '',
      shared: true,
      personal: true,
      user: false,
      username: '',
      searchtext: ''
    };
    
    var tipUIConfig = {
      generalOrCourseGroup: ['unmapped', 'general', 'coursespecific', 'coursename'],    
      publicOrPrivateGroup: ['shared', 'personal'],
      userGroup: ['user', 'username'],
      searchGroup: ['searchtext'],
      groupOrder: ['generalOrCourseGroup', 'publicOrPrivateGroup', 'userGroup', 'searchGroup']
     };

    var queryResultForFilter = await this._getFilter(userInfo, 'mapping', filter);
    if (!queryResultForFilter.success) {
      result.details = queryResultForFilter.details;

    } else {      
      var queryList = {
        courses: 
          'select coursename ' + 
          'from course ' + 
          'order by coursename ',
          
        users: 
          'select username ' + 
          'from user ' + 
          'order by username '
      };
      
      var queryResults = await this._dbQueries(queryList);
      
      if (queryResults.success) {
        result.success = true;
        result.details = 'query succeeded';
        result.tipfilter = queryResultForFilter.tipfilter;
        result.courses = queryResults.data.courses;
        result.users = queryResults.data.users;
        result.uiconfig = tipUIConfig;
        
      } else {
        result.details = queryResults.details;      
      }
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// update methods
//---------------------------------------------------------------
  async _updateTipFilter(params, postData, userInfo) {
    var result = this._queryFailureResult();

    var query = 'update usertipfilter ' +
                'set ' +
                  'tipfilter = \'' + JSON.stringify(postData.tipfilter) + '\' ' +
                'where userid = ' + userInfo.userId + ' ' +
                'and tipfiltertype = "' + postData.tipfiltertype + '" ';
                
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
}
