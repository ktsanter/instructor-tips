"use strict";
//---------------------------------------------------------------
// Aardvark Studios admin tools interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------

const internal = {};

module.exports = internal.ASAdmin = class {
  constructor(params) {
    this.gMailer = params.gMailer;
    this.cronScheduler = params.cronScheduler;
    this.dbManager = params.dbManager;
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  async adminTask(task, params, userInfo) {    
    var result = this._failResult(task + ' failed');
    
    if (task == 'get-mailer-debug') {
      result = this.gMailer.isDebugModeOn();
      
    }  else if (task == 'set-mailer-debug') {
      result = this.gMailer.setDebugMode(params.debugon);
      
    } else if (task == 'check-gmail-auth') {
      //var result = await this.gMailer.checkGmailAuthorization();
      result.success = true;
      result.details = 'stubbed';
      result.data.authorized = false;
      
    } else if (task == 'begin-gmail-auth') {
      //var result = await this.gMailer.beginGmailAuthorization();
      result.success = true;
      result.details = 'stubbed';
      
    } else if (task == 'finish-gmail-auth') {
      //var result = await this.gMailer.finishGmailAuthorization(params.confirmcode);
      result.success = true;
      result.details = 'stubbed';
      
    } else if (task == 'send-test-mail') {
      //var result = await this.gMailer.sendTestMail(params);
      result.success = true;
      result.details = 'stubbed';
      
    } else if (task == 'cron-status') {
      var result = await this._getCronStatus(params);
      
    } else if (task == 'cron-start') {
      var result = await this._setCronRunState(params, 'start');
      
    } else if (task == 'cron-stop') {
      var result = await this._setCronRunState(params, 'stop');
      
    } else if (task == 'cron-forcejob') {
      var result = await this._forceCronJob(params);
      
    } else if (task == 'db-schemas') {
      var result = await this._getDBSchemas(params);
      
    } else if (task == 'db-tables') {
      var result = await this._getDBTables(params);
      
    } else if (task == 'db-columns') {
      var result = await this._getDBColumns(params);
      
    } else if (task == 'db-rows') {
      var result = await this._getDBRows(params);
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// private methods - general
//------------------------------ ---------------------------------
  _failResult(msg) {
    return {success: false, data: null, details: msg};
  }    
  
//---------------------------------------------------------------
// private methods - cron
//------------------------------ ---------------------------------
  _getCronStatus(params) {
    var result = this._failResult();
    
    var jobList = this.cronScheduler.listJobs();
    result.success = true;
    result.details = jobList.length + ' jobs scheduled';
    result.data = jobList;
    
    return result;
  }
  
  _setCronRunState(params, desiredRunState) {
    var result = this._failResult();
    
    var runStateSuccess = false;
    if (desiredRunState == 'start') runStateSuccess = this.cronScheduler.startJob(params.jobname);
    if (desiredRunState == 'stop') runStateSuccess = this.cronScheduler.stopJob(params.jobname);
    
    result.success = runStateSuccess;
    result.details = params.jobname + ': ' + desiredRunState;
    
    return result;
  }
  
  _forceCronJob(params) {
    var result = this._failResult();
    
    result.success = this.cronScheduler.forceJob(params.jobname);
    result.details = 'force cron job: ' + params.jobname;
    
    return result;
  }

//---------------------------------------------------------------
// private methods - db
//------------------------------ ---------------------------------
  async _getDBSchemas(params) {
    var result = this.dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    var queryList = {
      'schemata': 
        'select  ' +
          'a.schema_name ' +
        'from instructortips.whitelist_schema as a ' +
        'order by a.schema_name '
    };
    
    queryResults = await this.dbManager.dbQueries(queryList);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  async _getDBTables(params) {
    var result = this.dbManager.queryFailureResult(); 

    var query, queryResults;
    
    var queryList = {
      'tables': 
        'select ' +
          'a.table_name, a.table_type ' +
        'from instructortips.whitelist_table as a ' +
        'where a.table_schema = "' + params.dbname + '" ' + 
        'order by a.table_name '
    };
    
    queryResults = await this.dbManager.dbQueries(queryList);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
    
  async _getDBColumns(params) {
    var result = this.dbManager.queryFailureResult(); 

    var query, queryResults;
    
    var queryList = {
      'columns': 
        'select ' +
          'a.table_schema, a.table_name, a.column_name, a.column_type, a.column_key, a.is_nullable, a.is_private ' +
        'from instructortips.whitelist_column as a ' +
        'where a.table_schema = "' + params.dbname + '" ' + 
          'and a.table_name = "' + params.tablename + '" ' +
        'order by a.ordinal_position '
    };
    
    queryResults = await this.dbManager.dbQueries(queryList);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _getDBRows(params) {
    var result = this.dbManager.queryFailureResult(); 

    var query, queryResults;
    
    var fullTableName = params.dbname + '.' + params.tablename;
    
    var queryList = {
      'whitelist': 
        'select column_name, is_private ' +
        'from instructortips.whitelist_column ' +
        'where table_schema = "' + params.dbname + '" ' +
          'and table_name = "' + params.tablename + '" ',
          
      'rows': 
        'select ' +
          '* ' +
        'from ' + fullTableName + ' '
    };
    
    queryResults = await this.dbManager.dbQueries(queryList);  
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    var result = this._filterRowData(queryResults.data.rows, queryResults.data.whitelist);

    return result;
  }
  
  _filterRowData(unfilteredRowList, whitelistInfo) {
    var result = this.dbManager.queryFailureResult();
    
    var filteredRowList = [];
    for (var i = 0; i < unfilteredRowList.length; i++) {
      var unfilteredRow = unfilteredRowList[i];
      var filteredRow = {};
      
      for (var colName in unfilteredRow) {
        var isPrivate = this._getPrivacyInfo(whitelistInfo, colName);
        filteredRow[colName] = isPrivate ? '***' : unfilteredRow[colName];
      }
      
      filteredRowList.push(filteredRow)
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {"rows": filteredRowList};
    
    return result;
  }
  
  _getPrivacyInfo(whitelistInfo, colName) {
    var isPrivate = true;
    for (var i = 0; i < whitelistInfo.length; i++) {
      if (whitelistInfo[i].column_name == colName) isPrivate = (whitelistInfo[i].is_private != 0);
    }
    return isPrivate;
  }
}
