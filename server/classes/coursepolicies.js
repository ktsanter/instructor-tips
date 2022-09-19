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
    this._pug = params.pug;

    this._tempPrefix = 'mwelcome-';
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'general-info') {
      dbResult = await this._getGeneralInfo();
            
    } else if (params.queryName == 'course-info') {
      dbResult = await this._getCourseInfo();
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'contact') {
      dbResult = await this._insertContact(params, postData, userInfo);
  
    } else if (params.queryName == 'expectation') {
      dbResult = await this._insertExpectation(params, postData, userInfo);
  
    } else if (params.queryName == 'keypoint') {
      dbResult = await this._insertKeypoint(params, postData, userInfo);
  
    } else if (params.queryName == 'resourcelink') {
      dbResult = await this._insertResourcelink(params, postData, userInfo);
  
    } else if (params.queryName == 'course') {
      dbResult = await this._insertCourse(params, postData, userInfo);
  
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'contact') {
      dbResult = await this._updateContact(params, postData, userInfo);

    } else if (params.queryName == 'expectation') {
      dbResult = await this._updateExpectations(params, postData, userInfo);

    } else if (params.queryName == 'keypoint') {
      dbResult = await this._updateKeypoints(params, postData, userInfo);

    } else if (params.queryName == 'resourcelink') {
      dbResult = await this._updateResourcelink(params, postData, userInfo);

    } else if (params.queryName == 'course') {
      dbResult = await this._updateCourse(params, postData, userInfo);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'contact') {
      dbResult = await this._deleteContact(params, postData, userInfo);
    
    } else if (params.queryName == 'expectation') {
      dbResult = await this._deleteExpectation(params, postData, userInfo);
    
    } else if (params.queryName == 'keypoint') {
      dbResult = await this._deleteKeypoint(params, postData, userInfo);
    
    } else if (params.queryName == 'resourcelink') {
      dbResult = await this._deleteResourcelink(params, postData, userInfo);
    
    } else if (params.queryName == 'course') {
      dbResult = await this._deleteCourse(params, postData, userInfo);
    
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
      
      const parsedParams = JSON.parse(fields['export-data']);
      const courseInfo = parsedParams.courseInfo;
      courseInfo.format = parsedParams.format;
      const templateDoc = thisObj._mentorWelcomeTemplate[parsedParams.format];
      
      let outputDoc = await thisObj._makeOutputDoc(thisObj, generalInfo, courseInfo, templateDoc);
      if (!outputDoc) {
        res.send('failed to make welcome template output doc');
        return;
      }
      
      const fileTypeLookup = {
        "msword": 'docx',
        "html": 'html'
      };
      let outputFileType = fileTypeLookup[courseInfo.format];
      
      await thisObj._downloadOutputDoc(thisObj, res, outputDoc, courseInfo.name, outputFileType);
    });
  }
    
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------  
  async _makeOutputDoc(thisObj, generalData, courseData, templateDoc) {
    let result = null;
    
    if (!this._fileservices.existsSync(templateDoc)) {
      const msg = 'CoursePolicies.exportMentorWelcomeTemplate, cannot read template file: ' + templateDoc;
      console.log(msg);
      return result;
    }
    
    if (courseData.format == 'html') {
      result = this._makeOutputHTMLDoc(thisObj, generalData, courseData, templateDoc)
      return result;
    }
    
    const isAPCourse = courseData.ap;
    const contactList = thisObj._makeContactList(generalData.contact);
    const resourceLinkList = thisObj._makeResourceLinkList(generalData.resourcelink, isAPCourse);
    const expectationList = thisObj._makeExpectationList(generalData.expectationsStudent, generalData.expectationsInstructor, isAPCourse);
    const assessmentsRaw = courseData.assessments;
    const assessmentsClean = assessmentsRaw.replace(/'/g, '"');
    const assessmentList = JSON.parse(courseData.assessments.replace(/'/g, '"'));   

    const data = {
      "mentor welcome template": '',  // remove marker in header
      "bullet": '●',
      
      "coursename": courseData.name,
      
      "expected of student": [],
      "expected of instructor": [],
      "keypoints": [],
      "assessment list": [],
    };
    
    let data2 = {
      "bullet": '●',
    };
    
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

      data[key] = item.replacementLink;
      data2[key] = item.replacementLink;
    }
    
    for (let i = 0; i < expectationList.student.length; i++) {
      data["expected of student"].push({"expectation": expectationList.student[i]}); 
    }

    for (let i = 0; i < expectationList.instructor.length; i++) {
      data["expected of instructor"].push({"expectation": expectationList.instructor[i]}); 
    }
    
    for (let i = 0; i < courseData.keypoints.length; i++) {
      data["keypoints"].push({"point": courseData.keypoints[i]});
    }

    for (let i = 0; i < assessmentList.length; i++) {
      data["assessment list"].push({"assessment": assessmentList[i]});
    }

    const templateFile = this._fileservices.readFileSync(templateDoc);    
    const handler = new this._easyTemplate.TemplateHandler(templateFile, data);
    result = await handler.process(templateFile, data);

    let intermediateFileName = thisObj._tempFileManager.tmpNameSync({tmpdir: thisObj._tempDir, prefix: thisObj._tempPrefix});
    await thisObj._fileservices.writeFileSync(intermediateFileName, result);

    const intermediateFile = this._fileservices.readFileSync(intermediateFileName);
    const handler2 = new this._easyTemplate.TemplateHandler(intermediateFile, data2);
    result = await handler.process(intermediateFile, data2);

    return result;
  }
  
  _makeOutputHTMLDoc(thisObj, generalData, courseData, pugFileName) {
    const isAPCourse = (courseData.ap == 1);
    const contactList = thisObj._makeContactList(generalData.contact);
    const resourceLinks = thisObj._makeResourceLinkList(generalData.resourcelink, isAPCourse);

    const keypointList = thisObj._replacePlaceholders(courseData.keypoints, resourceLinks);
    
    let exp = generalData.expectationsStudent.filter(function(a) {
      const result = 
        (a.restriction == 'none') ||
        (a.restriction == 'ap' && isAPCourse) ||
        (a.restriction == 'non-ap' && !isAPCourse);       
      return result;
    }).sort(function (a,b) {
      return a.ordering - b.ordering;
    }).map(function(a) {
      return a.expectationtext;
    });
    const expectationsStudent = thisObj._replacePlaceholders(exp, resourceLinks);

    exp = generalData.expectationsInstructor.filter(function(a) {
      const result = 
        (a.restriction == 'none') ||
        (a.restriction == 'ap' && isAPCourse) ||
        (a.restriction == 'non-ap' && !isAPCourse);       
      return result;
    }).sort(function (a,b) {
      return a.ordering - b.ordering;
    }).map(function(a) {
      return a.expectationtext;
    });
    const expectationsInstructor = thisObj._replacePlaceholders(exp, resourceLinks);

    const assessmentsRaw = courseData.assessments;
    const assessmentsClean = assessmentsRaw.replace(/'/g, '"');
    const assessmentList = JSON.parse(courseData.assessments.replace(/'/g, '"'));   

    const params = {
      "courseData": courseData,
      "generalData": generalData,
      "keypointList": keypointList,
      "expectationsStudent": expectationsStudent,
      "expectationsInstructor": expectationsInstructor,
      "resourceLinks": resourceLinks,
      "contactList": contactList,
      "assessmentList": assessmentList
    }
        
    return thisObj._pug.renderFile(pugFileName, {"params": params});
  }
  
  _replacePlaceholders(itemList, resourceList) {
    let replacedList = [];
    
    for (let i = 0; i < itemList.length; i++) {
      let item = itemList[i];
      const matches = item.match(/{(.*?)}/g);

      let replaced = item;
      if (matches != null) {
        for (let j = 0; j < matches.length; j++) {
          const placeholder = matches[j].slice(1, -1);
          const replacement = resourceList[placeholder];
          if (replacement != null) {
            const rtext = '<a href="' + replacement.linkUrl + ' target="_blank">' + replacement.linkText + '</a>';
            replaced = item.replace(matches[j], rtext);
          }
        }
      }
      
      replacedList.push(replaced);
    }
    
    return replacedList;
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
            target: 'mailto:' + contactItem.email,
            useLinkStyling: true
          }
        }
      }
    }
    
    return contactList;
  }
  
  _makeResourceLinkList(dbResourceLinkData, isAPCourse) {
    let resourceLinkList = {};
    
    for (let i = 0; i < dbResourceLinkData.length; i++) {
      const resourceItem = dbResourceLinkData[i];
      const include = (
        resourceItem.restriction == 'none' ||
        (resourceItem.restriction == 'ap' && isAPCourse) ||
        (resourceItem.restriction == 'non-ap' && !isAPCourse)
      );
      
      if (include) {
        resourceLinkList[resourceItem.templateitem] = {
          "templateItem": resourceItem.templateitem,
          "linkText": resourceItem.linktext,
          "linkUrl": resourceItem.linkurl,
          
          "replacementLink": {
            _type: 'link',
            text: resourceItem.linktext,
            target: resourceItem.linkurl,
            useLinkStyling: true
          }
        }
      }
    }
    
    return resourceLinkList;
  }
  
  _makeExpectationList(expectationsStudent, expectationsInstructor, isAPCourse) {
    let expectationList = {
      "student": [],
      "instructor": []
    };
    
    for (let i = 0; i < expectationsStudent.length; i++) {
      const item = expectationsStudent[i];
      let include = (
        (item.restriction == 'none') ||
        (item.restriction == 'ap' && isAPCourse) ||
        (item.restriction == 'non-ap' && !isAPCourse)
      );

      if (include) expectationList.student.push(item.expectationtext);
    }
    
    for (let i = 0; i < expectationsInstructor.length; i++) {
      const item = expectationsInstructor[i];
      let include = (
        (item.restriction == 'none') ||
        (item.restriction == 'ap' && isAPCourse) ||
        (item.restriction == 'non-ap' && !isAPCourse)
      );

      if (include) expectationList.instructor.push(item.expectationtext);
    }
    
    return expectationList;
  }

  async _downloadOutputDoc(thisObj, res, outputDoc, courseName, fileType) {
    let outputFileName = thisObj._tempFileManager.tmpNameSync({tmpdir: thisObj._tempDir, prefix: thisObj._tempPrefix});
    await thisObj._fileservices.writeFileSync(outputFileName, outputDoc);
    
    let downloadFileName = courseName + ' [mentor welcome template].' + fileType;

    if (fileType == 'docx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    } else if (fileType == 'html') {
      res.setHeader('Content-Type', 'text/html');
    }

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
      "expectationsStudent":
        'select expectationid, expectationtext, restriction, ordering ' +
        'from expectation ' +
        'where target = "student" ',
        
      "expectationsInstructor":
        'select expectationid, expectationtext, restriction, ordering ' +
        'from expectation ' +
        'where target = "instructor" ',        

      "keypoints":
        'select keypointid, category, keypointtext ' +
        'from keypoint ',        

      "contact":      
        'select contactid, contentdescriptor, firstname, lastname, phone, email, templatebase ' +
        'from contact',
        
      "resourcelink": 
        'select resourcelinkid, templateitem, restriction, linktext, linkurl ' +
        'from resourcelink',
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
  
  async _getCourseInfo() {
    let result = this._dbManager.queryFailureResult(); 
    let queryList, queryResults;
    
    queryList = {
      "course":      
        'select courseid, coursename, ap, assessments ' +
        'from course',
        
      "keypoints": 
        'select a.coursename, b.keypointid, b.keypointtext, c.ordering ' +
        'from course as a, keypoint as b, coursekeypoint as c ' +
        'where a.courseid = c.courseid ' +
          'and b.keypointid = c.keypointid '
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'retrieved course info';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _insertExpectation(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "expectation":      
        'insert into expectation (' +
          'target, restriction, ordering, expectationtext ' +
        ') values (' +
          '"' + postData.target + '", ' +
          '"' + postData.restriction + '", ' +
          0 + ', ' +
          '"' + postData.expectationtext + '" ' +
        ')'
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'inserted expectation';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _updateExpectations(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    let expectationInfo = postData;

    queryList = {};
    for (let i = 0; i < expectationInfo.length; i++) {
      const expectation = expectationInfo[i];
      queryList['expectation' + i] =
        'update expectation ' +
        'set ' + 
          'target = "' + expectation.target + '", ' +
          'restriction = "' + expectation.restriction + '", ' +
          'ordering = ' + expectation.ordering + ', ' +
          'expectationtext = "' + expectation.expectationtext + '" ' +
        'where expectationid = ' + expectation.expectationid
    }

    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'updated expectations';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _deleteExpectation(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "expectation":      
        'delete from expectation ' +
        'where expectationid = ' + postData.expectationid + ' '
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'deleted expectation';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _insertKeypoint(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "keypoint":      
        'insert into keypoint (' +
          'category, keypointtext ' +
        ') values (' +
          '"' + postData.category + '", ' +
          '"' + postData.keypointtext + '" ' +
        ')'
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'inserted keypoint';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _updateKeypoints(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    let keypointInfo = postData;

    queryList = {};
    for (let i = 0; i < keypointInfo.length; i++) {
      const keypoint = keypointInfo[i];
      queryList['keypoint' + i] =
        'update keypoint ' +
        'set ' + 
          'category = "' + keypoint.category + '", ' +
          'keypointtext = "' + keypoint.keypointtext + '" ' +
        'where keypointid = ' + keypoint.keypointid
    }

    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'updated keypoints';
    result.data = queryResults.data;
    
    return result;
  }

  async _deleteKeypoint(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "keypoint":      
        'delete from keypoint ' +
        'where keypointid = ' + postData.keypointid + ' '
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'deleted keypoint';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _insertResourcelink(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "resourcelink":      
        'insert into resourcelink (' +
          'templateitem, restriction, linktext, linkurl ' +
        ') values (' +
          '"' + postData.templateitem + '", ' +
          '"none", ' + 
          '"[tbd]", ' +
          '"[tbd]" ' +
        ')'
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'inserted resourcelink';
    result.data = queryResults.data;
    
    return result;
  }

  async _updateResourcelink(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "resourcelink":
        'update resourcelink ' +
        'set ' +
          'templateitem = "' + postData.templateitem + '", ' +
          'restriction = "' + postData.restriction + '", ' +
          'linktext = "' + postData.linktext + '", ' +
          'linkurl = "' + postData.linkurl + '" ' +
        'where resourcelinkid = ' + postData.resourcelinkid
    }
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
        
    result.success = true;
    result.details = 'updated resourcelink';
    result.data = queryResults.data;
    
    return result;
  }
    
  async _deleteResourcelink(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "resourcelink":      
        'delete from resourcelink ' +
        'where resourcelinkid = ' + postData.resourcelinkid + ' '
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'deleted resource link';
    result.data = queryResults.data;
    
    return result;
  }

  async _insertContact(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "contact":      
        'insert into contact (' +
          'contentdescriptor, firstname, lastname, phone, email, templatebase ' +
        ') values (' +
          '"' + postData.contentDescriptor + '", ' +
          '"[tbd]", ' +
          '"[tbd]", ' +
          '"[tbd]", ' +
          '"[tbd]", ' +
          '"[tbd]" ' +
        ')'
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'inserted contact';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _updateContact(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "contactid":      
        'select contactid ' +
        'from contact ' +
        'where contentdescriptor = "' + postData.original.contentdescriptor + '" '
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success || queryResults.data.contactid.length == 0) {
      result.details = 'cannot find contentdescriptor';
      return result;
    }
    
    const contactId = queryResults.data.contactid[0].contactid;
    
    queryList = {
      "update":
        'update contact ' +
        'set ' + 
          'contentdescriptor = "' + postData.updated.contentdescriptor + '", ' +
          'firstname = "' + postData.updated.firstname + '", ' +
          'lastname = "' + postData.updated.lastname + '", ' +
          'phone = "' + postData.updated.phone + '", ' +
          'email = "' + postData.updated.email + '", ' +
          'templatebase = "' + postData.updated.templatebase + '" ' +
        'where contactid = ' + contactId
    }
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'updated contact';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _deleteContact(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "contact":      
        'delete from contact ' +
        'where contentdescriptor = "' + postData.contentDescriptor + '" '
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'deleted contact';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _insertCourse(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "course":      
        'insert into course (' +
          'coursename, ap, assessments ' +
        ') values (' +
          '"' + postData.coursename + '", ' +
          0 + ', ' +
          '"" ' +
        ')'
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'inserted keypoint';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _updateCourse(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "course":
        'update course ' +
        'set ' +
          'coursename = "' + postData.coursename + '", ' +
          'ap = ' + postData.ap + ', ' +
          'assessments = "' + postData.assessments + '" ' +
        'where courseid = ' + postData.courseid,
        
      "deletekeypoints":
        'delete from coursekeypoint ' +
        'where courseid = ' + postData.courseid
    }
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    queryList = {};
    
    const keypointList = postData.keypointlist; 
    if (keypointList.length > 0) {
      for (let i = 0; i < keypointList.length; i++) {
        queryList['keypoint' + i] = 
          'insert into coursekeypoint ( ' +
            'courseid, keypointid, ordering ' +
          ') values (' +
            postData.courseid + ', ' +
            keypointList[i].keypointid + ', ' +
            keypointList[i].ordering + ' ' +
          ')';
      }
      
      queryResults = await this._dbManager.dbQueries(queryList);
      
      if (!queryResults.success) {
        result.details = queryResults.details;
        return result;
      }  
    }
    
    result.success = true;
    result.details = 'updated course';
    result.data = queryResults.data;
    
    return result;
  }
  
  async _deleteCourse(params, postData, userInfo) {
    let result = this._dbManager.queryFailureResult(); 
    
    let queryList, queryResults;
    
    queryList = {
      "course":      
        'delete from course ' +
        'where courseid = ' + postData.courseid + ' '
    };

    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }  
    
    result.success = true;
    result.details = 'deleted keypoint';
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
  
  _getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
  
    return month + '/' + day + '/' + year;
  }  
}
