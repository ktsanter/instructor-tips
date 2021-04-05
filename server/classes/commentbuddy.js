"use strict";
//---------------------------------------------------------------
// CommentBuddy
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.CommentBuddy = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
    this._fileServices = params.fileServices;
    this._pug = params.pug;
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
    
    this._tempDir = 'temp';
  }
    
//---------------------------------------------------------------
// dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'comments') {
      dbResult = await this._getComments(params, postData, userInfo);
            
    } else if (params.queryName == 'accesskey') {
      dbResult = await this._getAccessKey(params, postData, userInfo);
            
    } else if (params.queryName == 'preset-comment') {
      dbResult = await this._getPresetComment(params, postData, userInfo);
            
    } else if (params.queryName == 'client-comments') {
      dbResult = await this._getClientComments(params, postData);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'default-comment') {
      dbResult = await this._insertDefaultComment(params, postData, userInfo);
  
    } else if (params.queryName == 'comment') {
      dbResult = await this._insertComment(params, postData, userInfo);
  
    } else if (params.queryName == 'preset-comment') {
      dbResult = await this._setPresetComment(params, postData);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'comment') {
      dbResult = await this._updateComment(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'comment') {
      dbResult = await this._deleteComment(params, postData, userInfo);
    
    } else if (params.queryName == 'preset-comment') {
      dbResult = await this._deletePresetComment(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }

//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------
  async _getComments(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.commentid, a.tags, a.hovertext, a.commenttext as "comment" ' +
      'from comment as a ' +
      'where userid = ' + userInfo.userId;
      
    queryResults = await this._dbManager.dbQuery(query);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _getPresetComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.commenttext as "comment" ' +
      'from presetcomment as a ' +
      'where userid = ' + userInfo.userId;
      
    queryResults = await this._dbManager.dbQuery(query);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _getClientComments(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    var query =
      'select ' + 
        'a.userid ' +
      'from accesskey as a ' +
      'where a.accesskey = "' + postData.accesskey + '"';
       
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success  || queryResults.data.length != 1) {
      result.details = 'invalid access key';
      return result;
    }
    
    var userId = queryResults.data[0].userid;

    query = 
      'select ' +
        'a.commentid, a.tags, a.hovertext, a.commenttext as "comment" ' +
      'from comment as a ' +
      'where userid = ' + userId;
      
    queryResults = await this._dbManager.dbQuery(query);   

    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }

  async _getAccessKey(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' +
        'a.accesskey ' +
      'from accesskey as a ' +
      'where userid = ' + userInfo.userId;
      
    queryResults = await this._dbManager.dbQuery(query);   
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    if (queryResults.data.length == 0) {
      if ( !(await this._generateAccessKey(userInfo.userId)) ) {
        result.success = false;
        result.details = 'failed to generate access key';
        
      } else {
        queryResults = await this._dbManager.dbQuery(query);
      }
    }
    
    if (queryResults.success && queryResults.data.length > 0) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data[0];
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  async _generateAccessKey(userId) {
    var charList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    var key = '';
    for (var i = 0; i < 24; i++) {
      if (i != 0 && i % 4 == 0) key += '-';
      var randIndex = Math.floor(Math.random() * charList.length);
      key += charList.charAt(randIndex);
    }

    var query, queryResults;
    
    query = 
      'insert ' +
      'into accesskey (accesskey, userid) ' +
      'values (' +
        '"' + key + '", ' +
        userId +
      ') ';
      
    queryResults = await this._dbManager.dbQuery(query);   
    
    return queryResults.success;
  }

  async _updateComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;

    var hierarchyData = postData.hierarchy;
    
    query = 
      'update comment ' +
      'set ' +
        'tags = "' + postData.tags + '", ' +
        'hovertext = "' + postData.hovertext + '", ' +
        'commenttext = "' + postData.comment + '" ' +
      'where commentid = ' + postData.commentid;

    queryResults = await this._dbManager.dbQuery(query);    
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      result.data = queryResults.data;
      
    } else {
      result.details = queryResults.details;
    }

    return result;
  }
  
  async _insertDefaultComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    query = 
      'call add_default_comment(' + 
        userInfo.userId + ' ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = queryResults.data[0][0];

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _insertComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();  
    
    var query, queryResults;
    
    var commentText = postData.comment;
    commentText = commentText.replace(/"/g, '\\\"');
    
    query = 
      'call add_comment(' + 
        userInfo.userId + ', ' +
        '"' + commentText + '" ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';
      result.data = queryResults.data[0][0];

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _setPresetComment(params, postData) {
    var result = this._dbManager.queryFailureResult();  
    var query, queryResults;
    
    var query =
      'select ' + 
        'a.userid ' +
      'from accesskey as a ' +
      'where a.accesskey = "' + postData.accesskey + '"';
       
    queryResults = await this._dbManager.dbQuery(query);
    
    if (!queryResults.success  || queryResults.data.length != 1) {
      result.details = 'invalid access key';
      return result;
    }
    
    var userId = queryResults.data[0].userid;
    var commentText = postData.preset;
    commentText = commentText.replace(/"/g, '\\\"');
    
    query = 
      'replace into presetcomment (' + 
        'userid, commenttext ' +
      ') values (' +
        userId + ', ' +
        '"' + commentText + '" ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'insert succeeded';

    } else {
      result.details = queryResults.details;
    }

    return result;
  }  
  
  async _deleteComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryResults;
    
    query = 
      'delete from comment ' +
      'where commentid = ' + postData.commentid + ' ' +
        'and userid = ' + userInfo.userId;
         
    var queryResults = await this._dbManager.dbQuery(query);
    if (queryResults.success) {
      result.success = true;
      result.details = 'delete succeeded';
      result.data = null;
    } else {
      result.details = queryResults.details;
    }

    return result;
  }    
  
  async _deletePresetComment(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult();
    
    var query, queryResults;
    
    query = 
      'delete from presetcomment ' +
      'where userid = ' + userInfo.userId;
         
    var queryResults = await this._dbManager.dbQuery(query);
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
// form processing
//---------------------------------------------------------------       
  async processForm(req, res, callback, userInfo) {
    var thisObj = this;
    var formName = req.params.formname;
    
    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._failureCallback(req, res, 'error in form.parse: ' + JSON.stringify(err), callback);
        return;        
      }
      
      if (formName == 'download') {
        thisObj._processDownloadForm(req, res, callback, userInfo);

      } else if (formName == 'upload-standard') {
        thisObj._processUploadStandardForm(req, res, callback, userInfo, files);
        
      } else if (formName == 'upload-classic') {
        thisObj._processUploadClassicForm(req, res, callback, userInfo, files);
        
      } else {
        thisObj._failureCallback(req, res, 'unrecognized request: ' + formName, callback);
        return;
      }
    });
  }  
  
  _failureCallback(req, res, errorDescription, callback) {
    var result = {
      sucess: false,
      formname: req.params.formname,
      description: errorDescription
    };
    
    callback(req, res, result);
  }
  
  async _processDownloadForm(req, res, callback, userInfo) {
    var result = await this._getComments(null, null, userInfo);
    if (!result.success) {
      this._failureCallback(req, res, 'failed to retrieve data', callback);
      return;
    }
    
    var commentData = result.data;
    const exceljs = require('exceljs');
    var workbook = new exceljs.Workbook();
    workbook.clearThemes();
    
    var sheet = workbook.addWorksheet('commentbuddy-data');
    sheet.addRow(['tags', 'hovertext', 'comment']);
    for (var i = 0; i < commentData.length; i++) {
      var rowData = commentData[i];
      sheet.addRow([rowData.tags, rowData.hovertext, rowData.comment]);
    }

    var fileName = 'commentbuddy-data.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    await workbook.xlsx.write(res);

    res.end();      
  }
  
  async _processUploadStandardForm(req, res, callback, userInfo, files) {
    const exceljs = require('exceljs');
    
    var filePath = files.uploadStandardFile.path;
    var workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);
    var sheet = workbook.worksheets[0];
    
    // validate column names
    var row1 = sheet.getRow(1);    
    if ( 
      (row1.getCell(1).value != 'tags') || 
      (row1.getCell(2).value != 'hovertext') ||
      (row1.getCell(3).value != 'comment') ) {
      this._failureCallback(req, res, 'unexpected column name(s)', callback);
      return;
    }
    
    // get comment data and insert into DB
    var queryList = {};
    for (var i = 2; i <= sheet.actualRowCount; i++) {
      var row = sheet.getRow(i);
      queryList[i] = this._makeSQLForCommentInsert({
        tags: row.getCell(1).value,
        hovertext: row.getCell(2).value,
        comment: row.getCell(3).value,
        userid: userInfo.userId
      })
    }
    
    var queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      this._failureCallback(req, res, 'insert failed: ' + queryResults.details, callback);
      return;      
    }
    
    // write summary results
    var sheet = workbook.addWorksheet('upload summary');
    workbook.clearThemes();
    var addedCommentCount = Object.keys(queryResults.data).length;
    var timeNow = new Date();
    var timeStamp = timeNow.toLocaleDateString('en-US') + ' ' + timeNow.toLocaleTimeString('en-US');
    sheet.columns = [ {width: 18}, {width: 24} ];
    sheet.addRow(['comments added', addedCommentCount]);
    sheet.addRow(['time/date', timeStamp]);

    // return summary workbook
    var resultFileName = 'commentbuddy-upload-summary.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + resultFileName);

    await workbook.xlsx.write(res);

    res.end();
  }

  async _processUploadClassicForm(req, res, callback, userInfo, files) {
    const exceljs = require('exceljs');
    
    var MarkdownIt = require('markdown-it');
    var md = new MarkdownIt();
    
    var filePath = files.uploadClassicFile.path;
    var workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);
    var sheet = workbook.worksheets[0];
    
    // note we're assuming the columns are: tags, comment, hovertext
    
    // get comment data and insert into DB
    var query = 
      'begin not atomic ' +
        'declare exit handler for SQLEXCEPTION ' +
          'begin ' +
          'rollback; ' +
          'get diagnostics condition 1 @sqlstate = RETURNED_SQLSTATE, ' +
            '@errno = MYSQL_ERRNO, @text = MESSAGE_TEXT; ' +
            'set @full_error = CONCAT("ERROR ", @errno, " (", @sqlstate, "): ", @text); ' +
          'select false as success, @full_error as errdetails, @spreadsheet_row as ssrow; ' +          
        'end; ' +
        'start transaction; ';

    for (var i = 2; i <= sheet.actualRowCount; i++) {
      var row = sheet.getRow(i);
      var comment = row.getCell(2).value;

      if (typeof comment != 'string') {
        if (comment.hasOwnProperty('result')) {
          if (comment.result.hasOwnProperty('error')) {
            comment = '*error in formula*';
            
          } else {
            comment = comment.result;
          }
          
        } else {
          comment = '*unable to reproduce*';
        }
      }

      var renderedComment = md.render(comment);
      renderedComment = renderedComment.replace(/"/g, '\\\"');
      
      query += 'set @spreadsheet_row = ' + i + '; ';
      query += this._makeSQLForCommentInsert({
        tags: row.getCell(1).value,
        comment: renderedComment,
        hovertext: row.getCell(3).value,
        userid: userInfo.userId
      }) + '; ';
    }

    query += 
        'commit; ' +
        'select true as success; ' +
      'end'
    
    var queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success) {
      this._failureCallback(req, res, 'insert failed: ' + queryResults.details, callback);
      return;      
    }

    var data = queryResults.data[0][0];
    if (!data.success == 1) {
      this._failureCallback(req, res, {errdetails: data.errdetails, ssrow: data.ssrow}, callback);
      return;
    }
    
    var addedCommentCount = sheet.actualRowCount - 1;

    // write summary results
    var sheet = workbook.addWorksheet('upload summary');
    workbook.clearThemes();
    var timeNow = new Date();
    var timeStamp = timeNow.toLocaleDateString('en-US') + ' ' + timeNow.toLocaleTimeString('en-US');
    sheet.columns = [ {width: 18}, {width: 24} ];
    sheet.addRow(['comments added', addedCommentCount]);
    sheet.addRow(['time/date', timeStamp]);

    // return summary workbook
    var resultFileName = 'commentbuddy-upload-summary.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + resultFileName);

    await workbook.xlsx.write(res);

    res.end();
  }
  
  _makeSQLForCommentInsert(commentData) {
    var tags = commentData.tags;
    var hovertext = commentData.hovertext;
    var comment = commentData.comment;
    
    if (tags == null) tags = '';
    if (hovertext == null) hovertext = '';
    if (comment == null) comment = '';
    
    var sql = 
      'insert into comment (' +
        'userid, tags, hovertext, commenttext ' +
      ') values (' +
        commentData.userid + ', ' +
        '"' + tags + '", ' +
        '"' + hovertext + '", ' +
        '"' + comment + '"' + 
      ')';
        
      return sql;
  }

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------       
  _renderFail() {
    res.send('cannot access page: welcome letter configuration')    
  }  
}
