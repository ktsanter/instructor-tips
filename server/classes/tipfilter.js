"use strict";
//---------------------------------------------------------------
// tip filter DB interface
//---------------------------------------------------------------
// TODO: add logic based on user privileges
//---------------------------------------------------------------

const internal = {};

module.exports = internal.TipFilter = class {
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
// query dispatcher
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo) {
    var dbResult = this._queryFailureResult();
        
    if (params.queryName == 'scheduling') {
      dbResult = await this._getSchedulingTipFilter(params, userInfo);
      
    } else if (params.queryName == 'editing') {
      dbResult = await this._getEditingTipFilter(params, userInfo);

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
  async _getFilter(filterType, defaultFilter, userInfo) {
    var result = this._queryFailureResult();
    
    var filterQuery = 
        'select tipfilter ' +
        'from usertipfilter ' +
        'where userid = "' + userInfo.userId + '" ' +
        'and tipfiltertype = "' + filterType + '" ';
    
    var queryResult = await this._dbQuery(filterQuery);
    
    if (queryResult.success) {
      if (queryResult.data.length == 0) {
        queryResult = await this._insertFilter(filterType, defaultFilter);
        
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
  
  async _insertFilter(filterType, filter, userInfo) {
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
      termgroupname: 'semester',
      allow_adm: false,
      use_adm: false,
      adm_allcourse: false,
      adm_course: false,
      adm_coursename: '',
      allcourse: true,
      course: false,
      coursename: '',
      unspecified: true,
      completed: true,
      scheduled: true,
      calendar: {schoolyear: '2019-2020', semester: 'Sem 1', trimester: 'Tri 1', summer: 'Summer'}
    };
    
    var tipUIConfig = {
      termgroupGroup: ['termgroupname', 'calendarui'],
      courseGroup: ['use_adm', 'adm_coursetoggle', 'coursetoggle', 'unspecified', 'scheduled', 'completed'],
      groupOrder: ['termgroupGroup', 'courseGroup']
    };
     
    if (this._userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
      filter.allow_adm = true;
    }

    var queryResultForFilter = await this._getFilter('scheduling', filter, userInfo);
    
    if (!queryResultForFilter.success) {
      result.details = queryResultForFilter.details;

    } else {                
      var queryList = {
        termgroups: 
          'select termgroupname, termlength ' +
          'from termgroup ' +
          'order by termgroupid ',
          
        courses:
          'select distinct course.coursename ' +
          'from usercourse, course ' +
          'where usercourse.courseid = course.courseid ' +
            'and usercourse.userid = ' + userInfo.userId + ' ' + 
            'order by course.coursename ',
            
        adm_courses:
          'select distinct course.coursename ' +
          'from usercourse, course ' +
          'where usercourse.courseid = course.courseid ' +
            'and usercourse.userid is null ' + 
            'order by course.coursename ',
            
        schoolyears:
          'select distinct schoolyear ' +
          'from calendar',
          
        terms:
          'select termgroupname, termname ' +
          'from termgroup as tg, term as t ' +
          'where tg.termgroupid = t.termgroupid ' +
          'order by termgroupname, termname '
      };
      
      var queryResults = await this._dbQueries(queryList);
      
      if (queryResults.success) {
        result.success = true;
        result.details = 'query succeeded';
        result.tipfilter = queryResultForFilter.tipfilter;
        result.termgroups = queryResults.data.termgroups;
        result.adm_courses = queryResults.data.adm_courses;
        result.courses = queryResults.data.courses;
        result.calendaroptions = {
          schoolyears: queryResults.data.schoolyears,
          terms: queryResults.data.terms
        };
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
      personal_notowned: false,
      searchtext: ''
    };
    
    var tipUIConfig = {
      publicOrPrivateGroup: ['shared', 'personal', 'personal_notowned'],
      searchGroup: ['searchtext'],
      groupOrder: ['searchGroup']
     };
     
     if (this._userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
       filter.shared = true;
       filter.personal_notowned = true;
       tipUIConfig.groupOrder = ['publicOrPrivateGroup', 'searchGroup'];
     }

    var queryResultForFilter = await this._getFilter('editing', filter, userInfo);

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
  
//---------------------------------------------------------------
// update methods
//---------------------------------------------------------------
  async _updateTipFilter(params, postData, userInfo) {
    var result = this._queryFailureResult();
    
    postData.tipfilter.searchtext = this._sanitizeText(postData.tipfilter.searchtext);
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
  
//---------------------------------------------------------------
// utility methods
//---------------------------------------------------------------
  _sanitizeText(str) {
    var cleaned = str;
    
    if (cleaned) {
      cleaned = str.replace(/"/g, '\\"');
    }
    
    // consider other cleaning e.g. <script> tags
    
    return cleaned;
  }  
}
