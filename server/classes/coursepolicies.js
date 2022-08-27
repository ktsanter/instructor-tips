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
    this._easyTemplate = params.easyTemplate
    //this._htmlToDocx = params.htmlToDocx;
    this._tempFileManager = params.tempFileManager;
    this._tempDir = params.tempDir;
    this._fileservices = params.fileservices;
    this._path = params.path;
    this._mentorWelcomeTemplate = params.mentorWelcomeTemplate;
    //this._pug = params.pug;
    //this._pugFileName = params.pugFileName;

    this._tempPrefix = 'mwelcome-';
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
    console.log('CoursePolicies.exportMentorWelcomeTemplate, stubbed');

    let thisObj = this;
    
    let form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        res.send('error in form.parse: ' + JSON.stringify(err));
        return;
      }

      if (!fields.hasOwnProperty('export-data')) {
        res.send('missing export data field');
        return;
      }
      
      let exportData = JSON.parse(fields['export-data']);
      
      let outputDoc = await thisObj._makeOutputDoc(thisObj, exportData);
      if (!outputDoc) {
        res.send('failed to make welcome template output doc');
        return;
      }
      
      await thisObj._downloadOutputDoc(thisObj, res, outputDoc, exportData.courseInfo.name);
    });
  }
  
  async _makeOutputDoc(thisObj, exportData) {
    let result = null;
    
    if (!this._fileservices.existsSync(this._mentorWelcomeTemplate)) {
      const msg = 'CoursePolicies.exportMentorWelcomeTemplate, cannot read template file: ' + this._mentorWelcomeTemplate;
      console.log(msg);
      return result;
    }
    
    const templateFile = this._fileservices.readFileSync(this._mentorWelcomeTemplate);
    
    const data = {
      "mentor welcome template": '',
      "coursename": exportData.courseInfo.name,
      "keypoints": [
        {"point": "There is a password-protected final exam. The password will be distributed to mentors early in the semester"},
        {"point": "Proctoring (if feasible) is required for the final exam, and strongly encouraged for the other tests and exams"}
      ],

      "mentor_support_full": "Katie Hansen",
      "mentor_support_first": "Katie",
      "mentor_support_phone": "(517) 664-5470",
      "mentor_support_email": "khansen2@michiganvirtual.org",

      "special_pop_full": "Tom Ballew",
      "special_pop_first": "Tom",
      "special_pop_phone": "(517) xxx-xxxx",
      "special_pop_email": "tballew@michiganvirtual.org"
      
    };
    
    const handler = new this._easyTemplate.TemplateHandler(templateFile, data);
    result = await handler.process(templateFile, data);
    
    return result;
  }
  
  async _downloadOutputDoc(thisObj, res, outputDoc, courseName) {
    let outputFileName = thisObj._tempFileManager.tmpNameSync({tmpdir: thisObj._tempDir, prefix: thisObj._tempPrefix});
    await thisObj._fileservices.writeFileSync(outputFileName, outputDoc);
    
    let downloadFileName = courseName + ' [mentor welcome template].docx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + downloadFileName);
    res.sendFile(outputFileName); 
  }
  
  clearTempWelcomeLetters() {
    console.log(this._getDateStamp() + ': CoursePolicies.clearTempWelcomeLetters');
    let ageLimitMS = 3 * 60 * 60 * 1000;
    let directory = this._tempDir;
    
    this._fileservices.readdir(directory, (err, files) => {
      if (err) {
        console.log(err);

      } else {
        for (let file of files) {
          if (file.indexOf(this._tempPrefix) >= 0) {
            let fullFileName = this._path.join(directory, file);

            this._fileservices.stat(fullFileName, (err, stats) => {
              if (err) { 
                console.log(err);

              } else {
                let dateCTime = new Date(stats.ctime);
                let fileAge = Date.now() - dateCTime.getTime();

                if (fileAge > ageLimitMS) {
                  this._fileservices.unlink(fullFileName, err => {
                    if (err) console.log(err);
                  });
                }
              }
            });
          }
        }
      }
    });
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
  
  _getDateStamp() {
    var now = new Date();
    return this._formatDateStamp(now);
  }
  
  _formatDateStamp(d) {
    var yr = d.getFullYear();
    var mo = ('00' + (d.getMonth() + 1)).slice(-2);
    var da = ('00' + d.getDate()).slice(-2);
    var hr = ('00' + d.getHours()).slice(-2);
    var mi = ('00' + d.getMinutes()).slice(-2);
    var se = ('00' + d.getSeconds()).slice(-2);
    var ms = ('000' + d.getMilliseconds()).slice(-3);
    
    var dateStamp = yr + '-' + mo + '-' + da + ' ' + hr + ':' + mi + ':' + se + '.' + ms;
    
    return dateStamp;
  }    
}
