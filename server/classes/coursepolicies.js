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
    this._tempFileManager = params.tempFileManager;
    this._tempDir = params.tempDir;
    this._fileservices = params.fileservices;
    this._path = params.path;
    this._mentorWelcomeTemplate = params.mentorWelcomeTemplate;

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
    let thisObj = this;
    
    let generalInfo = await this._getGeneralInfo();
    if (!generalInfo) {
      res.send('failed to get general info');
      return;
    }
    generalInfo = generalInfo.data;
        
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
      
      let courseInfo = JSON.parse(fields['export-data']).courseInfo;
      
      let outputDoc = await thisObj._makeOutputDoc(thisObj, generalInfo, courseInfo);
      if (!outputDoc) {
        res.send('failed to make welcome template output doc');
        return;
      }
      
      await thisObj._downloadOutputDoc(thisObj, res, outputDoc, courseInfo.name);
    });
  }
    
  async _makeOutputDoc(thisObj, generalData, courseData) {
    let result = null;
    
    if (!this._fileservices.existsSync(this._mentorWelcomeTemplate)) {
      const msg = 'CoursePolicies.exportMentorWelcomeTemplate, cannot read template file: ' + this._mentorWelcomeTemplate;
      console.log(msg);
      return result;
    }
    
    const isAPCourse = courseData.ap;
    const contactList = thisObj._makeContactList(generalData.contact);
    const resourceLinkList = thisObj._makeResourceLinkList(generalData.resourcelink);

    const data = {
      "mentor welcome template": '',  // remove marker in header
      
      "coursename": courseData.name,
      
      /*----------------------------------------------------------*/
      /* note: these are dummied and will ultimately be db-driven */
      /*----------------------------------------------------------*/
      "keypoints": [
        {"point": "There is a password-protected final exam. The password will be distributed to mentors early in the semester"},
        {"point": "Proctoring (if feasible) is required for the final exam, and strongly encouraged for the other tests and exams"},
        {"point": "etc."}
      ],
      
      "expected of student": [
        {"expectation": "Log in at least every school day."},
        {"expectation": "Be familiar with Michigan Virtual's AP Course Policy, especially concerning due dates and late penalties."},
        {"expectation": "Effectively manage time, using the pacing guide."},
        {"expectation": "Be familiar with our Academic Integrity Policy."},
        {"expectation": "Check SLP messages and the Teacher Feed every day."},
        {"expectation": "Be respectful and considerate when communicating and working with classmates."}
      ],
      
      "expected of instructor": [
        {"expectation": "Always treat students with respect and friendliness, doing my best to encourage their learning and growth."},
        {"expectation": "Respond to any communication 24 hours (not counting weekends and holidays)."},
        {"expectation": "Grade all assignments, providing solid feedback, within 72 hours (not counting weekends and holidays)."},
        {"expectation": "Provide progress reports at least monthly."},
        {"expectation": "Help explain difficult concepts and provide additional support material."},
        {"expectation": "Make weekly posts in the Teacher Feed, with tips, resources, and support."},
        {"expectation": "Be an active member of the class discussions."}
      ],
      
      "assessment list": [
        {"assessment": "midterm"},
        {"assessment": "final"}
      ]
      /*---------------- end of dummied data -------------------------*/
    };
    
    let data2 = {};

    for (let key in contactList) {
      const item = contactList[key];

      data[item.templatebase] = [{
        "first": item.templateFirst,
        "last": item.templateLast,
        "phone": item.templatePhone
      }];
      data[item.templatebase + ' email'] = item.templateEmailLink;
    }
    
    for (let key in resourceLinkList) {
      const item = resourceLinkList[key];

      data[key] = resourceLinkList[key].placeholder;
      data2[item.placeholderText] = item.replacementLink;
    }

    const templateFile = this._fileservices.readFileSync(this._mentorWelcomeTemplate);    
    const handler = new this._easyTemplate.TemplateHandler(templateFile, data);
    result = await handler.process(templateFile, data);

    let intermediateFileName = thisObj._tempFileManager.tmpNameSync({tmpdir: thisObj._tempDir, prefix: thisObj._tempPrefix});
    await thisObj._fileservices.writeFileSync(intermediateFileName, result);

    const intermediateFile = this._fileservices.readFileSync(intermediateFileName);
    const handler2 = new this._easyTemplate.TemplateHandler(intermediateFile, data2);
    result = await handler.process(intermediateFile, data2);

    return result;
  }
  
  _makeContactList(dbContactData) {
    const contactMap = {
      "mentor coordinator": "mentorSupport",
      "special populations coordinator": "specialPopulationsSupport"
    };
    
    let contactList = {};
    for (let i = 0; i < dbContactData.length; i++) {
      const contactItem = dbContactData[i];

      if (contactMap.hasOwnProperty(contactItem.contentdescriptor)) {
        contactList[contactMap[contactItem.contentdescriptor]] = {
          "descriptor": contactItem.contentdescriptor,
          "first": contactItem.firstname,
          "last": contactItem.lastname,
          "phone": contactItem.phone,
          "email": contactItem.email,
          
          "templatebase": contactItem.templatebase,
          "templateFirst": contactItem.firstname,
          "templateLast": contactItem.lastname,
          "templatePhone": contactItem.phone,
          "templateEmailLink": {
            _type: 'link',
            text: contactItem.email,
            target: 'mailto:' + contactItem.email
          }
        }
      }
    }
    
    return contactList;
  }
  
  _makeResourceLinkList(dbResourceLinkData) {
    const xmlPre = '<w:r><w:rPr> <w:color w:val="1B70C6"/><w:u w:val="single"/></w:rPr><w:t>';
    const xmlPost = '</w:t></w:r>';

    let resourceLinkList = {};
    
    for (let i = 0; i < dbResourceLinkData.length; i++) {
      const resourceItem = dbResourceLinkData[i];
      const placeholderText = 'placeholder: ' + resourceItem.templateitem;
      
      resourceLinkList[resourceItem.templateitem] = {
        "templateItem": resourceItem.templateitem,
        "linkText": resourceItem.linktext,
        "linkUrl": resourceItem.linkurl,
        
        "placeholderText": placeholderText,

        "placeholder": {
          _type: 'rawXml',
          xml: xmlPre + '{' + placeholderText + '}' + xmlPost,
          replaceParagraph: false
        },

        "replacementLink": {
          _type: 'link',
          text: resourceItem.linktext,
          target: resourceItem.linkurl
        }
      }
    }
    
    return resourceLinkList;
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
    
  async _getGeneralInfo() {
    let result = this._dbManager.queryFailureResult(); 
    let queryList, queryResults;
    
    queryList = {
      "contact":      
        'select contentdescriptor, firstname, lastname, phone, email, templatebase ' +
        'from contact',
        
      "resourcelink": 
        'select templateitem, linktext, linkurl ' +
        'from resourcelink'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'retrieved general info';
    result.data = queryResults.data;
    
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
