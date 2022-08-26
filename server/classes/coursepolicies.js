"use strict";
//---------------------------------------------------------------
// server-side for Course policies
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.CoursePolicies = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;  
    this._formManager = params.formManager;    
    this._htmlToDocx = params.htmlToDocx;
    this._tempFileManager = params.tempFileManager;
    this._tempDir = params.tempDir;
    this._fileservices = params.fileservices;
    this._path = params.path;
    this._pug = params.pug;
    this._pugFileName = params.pugFileName;
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'dummy') {
      //dbResult = await this._getAssignmentInfo(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      //dbResult = await this._replaceStudentProperty(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      //dbResult = await this._updateStudentNote(params, postData, userInfo);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      //dbResult = await this._deleteAssignmentInfo(params, postData, userInfo);
    
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------  
  async exportMentorWelcomeTemplate(req, res, userInfo) {
    let thisObj = this;
    let result = {
      "success": false,
      "description": "download failed",
      "targetfilename": null
    }
    
    let form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        result.description = 'error in form.parse: ' + JSON.stringify(err);
        res.send(result);
        return;
      }

      if (!fields.hasOwnProperty('export-data')) {
        result.description = 'missing export data field';
        res.send(result);
        return;
      }
      
      let exportData = JSON.parse(fields['export-data']);
      let welcomeTemplateHTML = thisObj._makeMentorWelcomeHTML(exportData.courseInfo);
      if (!welcomeTemplateHTML) {
        result.description = 'failed to make welcome template HTML';
        res.send(result);
      }

      //res.send(welcomeTemplateHTML);  // shortcut here for testing directly
      //return;
      
      await thisObj._downloadMentorWelcomeLetter(thisObj, res, welcomeTemplateHTML, exportData.courseInfo.name);
    });
  }
  
  _makeMentorWelcomeHTML(courseInfo) {
    let params = {
      "courseName": courseInfo.name
    }
    let html = this._pug.renderFile(this._pugFileName, {"params": params});
      
    return html;
  }
  
  async _downloadMentorWelcomeLetter(thisObj, res, html, courseName) {
    let docx = thisObj._htmlToDocx.asBlob(html);

    let fileName = thisObj._tempFileManager.tmpNameSync({tmpdir: thisObj._tempDir});
    
    try {
      await thisObj._fileservices.writeFileSync(fileName, docx);
      
      let downloadFileName = courseName + ' [mentor welcome template].docx';
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader("Content-Disposition", "attachment; filename=" + downloadFileName);
      res.sendFile(fileName); 
      
    } catch(err) {
      console.log(err);
      res.send(JSON.stringify(err));
    }       
  }
  
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
