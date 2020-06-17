"use strict";
//---------------------------------------------------------------
// task scheduler 
// package doc: https://www.npmjs.com/package/cron
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
const internal = {};

module.exports = internal.MessageManagement = class {
  constructor(params) {
    this.DEBUG = true;
    if (this.DEBUG) console.log('MessageManagement: debug mode is on');
    
    this._dbManager = params.dbManager;
    this._mailer = params.mailer;
    this._commonmark = params.commonmark;
    this._pug = params.pug;
    this._appURL = params.appURL;
    this._fileServices = params.fileServices;
    this._HTMLToImage = params.HTMLToImage;
    this._tempFileMaker = params.tempFileMaker;
    
    this._tempDir = 'temp';
    this._sharePugFile = './private/pug/schedule_share.pug';
    this._sharePugWrapperFile = './private/pug/schedule_share_wrapper.pug';
    this._reminderPugFile = './private/pug/schedule_reminder.pug';
    this._reminderPugWrapperFile = './private/pug/schedule_reminder_wrapper.pug';
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  async sendSharedScheduleNotification(params) {
    var result = this._dbManager.queryFailureResult();
    
    var queryList, queryResults;

    queryList = {
      notification:
        'select sn.notificationon, u.email, u.username ' +
        'from user as u, sharenotification as sn ' +
        'where u.userid = sn.userid ' +
          'and u.userid = ' + params.userIdTo,
        
      schedule:
        'select schedulename ' +
        'from schedule ' +
        'where scheduleid = ' + params.scheduleId + ' ' +
          'and userid = ' + params.userInfo.userId,
    };

    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults) {
      result.details = queryResults.details;
      return result;
    }    

    var notificationInfo = queryResults.data.notification[0];
    var scheduleInfo = queryResults.data.schedule[0];

    if (!notificationInfo.notificationon) {
      result.success = true;
      result.details = 'no message sent - notification off';
      return result;
    }
    
    var mailParams = {
      userTo: notificationInfo.username,
      userFrom: params.userInfo.userName,
      scheduleName: scheduleInfo.schedulename,
      comment: params.comment,
      appURL: this._appURL
    };      
    
    var mailResult = await this._prepAndSendMessage({
      id: params.userInfo.userId + '_' + params.userIdTo + '_' + params.scheduleId,
      emailTo: notificationInfo.email,
      subject: 'an InstructorTips schedule has been shared with you',
      pugFile: this._sharePugFile,
      pugWrapperFile: this._sharePugWrapperFile,
      pugParams: mailParams
    });
    
    if (mailResult) {
      result.success = true;
      result.details = 'notification message sent';
    } else {
      result.details = 'notification message failed';
      console.log('MessageManagement.sendSharedScheduleNotification: failed');
    }

    return result;
  }
  
  async sendSchedulePushNotifications() {    
    var query, queryResults;
    
    var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var today = daysOfWeek[new Date().getDay()];
    
    query =  
      'select ' +
        's.scheduleid, s.userid, s.schedulename, s.schedulelength, s.schedulestartdate,  ' +
        'jn.notificationtype ' +
      'from schedule as s ' +
      'join ( ' +
        'select n.scheduleid, n.userid, n.notificationtype ' +
        'from schedulenotification as n ' +
        'where n.notificationtype = "' + today + '" ' +
      ') as jn on ( ' +
        's.scheduleid = jn.scheduleid ' +
        'and s.userid = jn.userid ' +
      ') ';
    
    queryResults = await this._dbManager.dbQuery(query);
    if (!queryResults.success) {
      console.log('MessageManagement: query failed: ' + queryResults.details);
      return;
    }
    
    var scheduleInfo = queryResults.data;
    var schedulesByUser = {};
    for (var i = 0; i < scheduleInfo.length; i++) {
      var schedItem = scheduleInfo[i];
      if (!schedulesByUser.hasOwnProperty(schedItem.userid)) schedulesByUser[schedItem.userid] = [];
      schedulesByUser[schedItem.userid].push(schedItem);        
    }
    
    for (var userid in schedulesByUser) {
      var success = await this._sendScheduleNotificationForUser(userid, schedulesByUser[userid]);
      if (!success) {
        console.log('MessageManagement.sendSchedulePushNotifications: failed');
        return;
      }
    }
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  async _sendScheduleNotificationForUser(userId, scheduleInfoList) {
    var queryList, queryResults;

    queryList = {
      user: 
        'select email, username ' +
        'from user ' +
        'where userid = ' + userId,
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      console.log('MessageManagement: user/tips lookup failed for user ' + userId);
      return;
    }
    
    var emailToAddress = queryResults.data.user[0].email;
    
    var params = {
      appURL: this._appURL,
      userTo: queryResults.data.user[0].username,
      dateStamp: this._getDateStamp().slice(0,10),
      scheduleList: []
    };

    for (var i = 0; i < scheduleInfoList.length; i++) {
      var scheduleInfo = scheduleInfoList[i];
      var schedStartDate = new Date(scheduleInfo.schedulestartdate);
      var msFromStart = Date.now() - schedStartDate;
      var weeksFromStart = ((((msFromStart / 1000) / 60) / 60) / 24) / 7;
      var weekIndex = 0;
      if (weeksFromStart >= 0) weekIndex = Math.ceil(weeksFromStart);
      if (weekIndex > scheduleInfo.schedulelength) weekIndex = -1;
          
      queryList = {
        tips:
          'select st.tipid, t.tiptext, st.tipstate, st.schedulelocation ' +
          'from scheduletip as st, tip as t ' +
          'where st.scheduleid = ' + scheduleInfo.scheduleid + ' ' +
            'and st.schedulelocation <= ' + weekIndex + ' ' +
            //'and st.tipstate = 0 ' +
            'and st.tipid = t.tipid ' +
            'order by st.schedulelocation, st.schedulelocationorder '
      };
      
      queryResults = await this._dbManager.dbQueries(queryList);
      if (!queryResults.success) {
        console.log('MessageManagement: user/tips lookup failed for schedule ' + scheduleInfo.scheduleId);
        return false;
      }
            
      var organizedTips = this._organizeTipsByLocation(queryResults.data.tips);
      var scheduleInfo = {
        scheduleId: scheduleInfoList[i].scheduleid,
        scheduleName: scheduleInfoList[i].schedulename,
        scheduleStartDate: scheduleInfoList[i].schedulestartdate,
        tipList: organizedTips,
        upToDate: (Object.keys(organizedTips).length == 0),
        pastDue: weekIndex < 0
      };
      params.scheduleList.push(scheduleInfo);
    }
    
    return await this._prepAndSendMessage({
      id: userId,
      emailTo: emailToAddress,
      subject: 'InstructorTips weekly reminder',
      pugFile: this._reminderPugFile,
      pugWrapperFile: this._reminderPugWrapperFile,
      pugParams: params
    });
  }
  

  _organizeTipsByLocation(tipList) {
    var organized = {};
    
    for (var i = 0; i < tipList.length; i++) {
      var tip = tipList[i];
      if (tip.tipstate == 0) {
        if (!organized.hasOwnProperty(tip.schedulelocation)) organized[tip.schedulelocation] = [];
        tip.tiptext = this._convertToHTML(tip.tiptext);
        organized[tip.schedulelocation].push(tip);
      }
    }
    
    for (var key in organized) {
      var tipList = organized[key];
      var evenTip = true;
      for (var i = 0; i < tipList.length; i++) {
        tipList[i].evenTip = evenTip;
        evenTip = !evenTip;
      }
    }
    
    return organized;
  }

  async _prepAndSendMessage(params) {
    //--------------------------------------
    // expected in params
    //  id: "unique" id for debugging
    //  emailTo: (email address),
    //  subject: (subject text for email)
    //  pugFile: xxx,
    //  pugWrapperFile: xxx,
    //  pugParams: xxx
    //--------------------------------------

    console.log('MessageManagement._prepAndSendMessage');
    console.log(params);
    
    var rendered = this._pug.renderFile(params.pugFile, {params: params.pugParams});
    
    if (this.DEBUG) {
      var fileNameOnly = params.pugFile.split('\\').pop().split('/').pop();
      var fileNameWithoutExtension = fileNameOnly.split('.').pop();
      var debugFileName = 'log/' + fileNameWithoutExtension + '_' + params.id + '.html';
      this._fileServices.writeFile(debugFileName, rendered, function (err) {
        if (err) {
          console.log('MessageManagement._prepAndSendMessage: error writing ' + debugFileName);
          console.log(err);
        } else {
          console.log('MessageManagement._prepAndSendMessage: wrote ' + debugFileName);
        }
      });
    }    
    
    var imageFileName = this._tempFileMaker.tmpNameSync({tmpdir: this._tempDir}) + '.png'; 
    imageFileName = this._tempDir + '/' + imageFileName.split('\\').pop().split('/').pop();
    //var imageFileName = this._tempDir + '/' + params.imageFile;
    
    var madeImageFile = await this._makeImage(rendered, imageFileName);
    if (!madeImageFile) {
      console.log('MessageManagement._prepAndSendMessage: failed to make image file - ' + imageFileName);
      return false;
    }
    
    var imageFileRelativePath = imageFileName;
    var imageFileCID = imageFileName.split('\\').pop().split('/').pop() + 'xxx';

    var wrapperParams = {
      "imageFileCID": imageFileCID,
      "appURL": this._appURL
    }
    var renderedWrapper = this._pug.renderFile(params.pugWrapperFile, {params: wrapperParams});
    
    if (this.DEBUG) this._writeRenderedToFile(params.pugWrapperFile, params.id, renderedWrapper);    
    
    if (!this.DEBUG) {      
      // use pugWrapper here instead
      var imageHTML = 
        '<img src="cid:' + (imageFileCID) + '"/>' + 
        '<br><div>You can access InstructorTips at <a href=' + this._appURL + '>' + this._appURL + '</a></div>';

      var imageAttachments = [{
        path: imageFileRelativePath,
        cid: imageFileCID
      }];
      
      var mailResult = await this._mailer.sendMessage(params.emailTo, params.subject, '', imageHTML, imageAttachments);
      if (!mailResult.success) {
        console.log('MessageManagement._prepAndSendMessage: failed to send email to ' + emailTo);
        return false;
        
      } else {
        // this seems to break things for nodemailer
        //if (this._fileServices.existsSync(imageFileName)) this._fileServices.unlinkSync(imageFileName);
      }
    }
    
    return true;
  }
  
  _writeRenderedToFile(fileName, id, renderedHTML) {
    console.log(fileName);
    var fileNameOnly = fileName.split('\\').pop().split('/').pop();
    console.log(fileNameOnly);
    var fileNameWithoutExtension = fileNameOnly.split('.')[0];
    console.log(fileNameWithoutExtension);
    var debugFileName = 'log/' + fileNameWithoutExtension + '_' + id + '.html';
    console.log(debugFileName);
    
    this._fileServices.writeFile(debugFileName, renderedHTML, function (err) {
      if (err) {
        console.log('MessageManagement._prepAndSendMessage: error writing ' + debugFileName);
        console.log(err);
      } else {
        console.log('MessageManagement._prepAndSendMessage: wrote ' + debugFileName);
      }
    });
  }
  
  async _makeImage(html, targetFileName) {
    const browser = await this._HTMLToImage.launch()
    const page = await browser.newPage()
    await page.setViewport({
              width: 600,
              height: 120,
              deviceScaleFactor: 1,
            });            
    await page.setContent(html)
    await page.screenshot({path: targetFileName, fullPage: true})
    await browser.close()  
    
    var exists = this._fileServices.existsSync(targetFileName);

    return exists;
  }

//--------------------------------------------------------------
// callbacks
//--------------------------------------------------------------      
  
//--------------------------------------------------------------
// MarkDownToHTML
//--------------------------------------------------------------      
  _convertToHTML(str) {
    var reader = new this._commonmark.Parser();
    var writer = new this._commonmark.HtmlRenderer();
    
    var parsed = reader.parse(str);
    var result = writer.render(parsed);
    
    result = result.replace(/%%(.*?)%%/g, '<span style=\"background-color: #FFFF00\">$1</span>');
    
    //if (result.slice(0, 3) == '<p>' && result.slice(-5) == '</p>\n') {
    //  result = result.substring(3);
    //  result = result.substring(0, result.length-5);
    //}

    return result;
  }
  
//--------------------------------------------------------------
// utility
//--------------------------------------------------------------
  _getDateStamp() {
    var now = new Date();
;
    var yr = now.getFullYear();
    var mo = ('00' + (now.getMonth() + 1)).slice(-2);
    var da = ('00' + now.getDate()).slice(-2);
    var hr = ('00' + now.getHours()).slice(-2);
    var mi = ('00' + now.getMinutes()).slice(-2);
    var se = ('00' + now.getSeconds()).slice(-2);
    var ms = ('000' + now.getMilliseconds()).slice(-3);
    
    var dateStamp = yr + '-' + mo + '-' + da + ' ' + hr + ':' + mi + ':' + se + '.' + ms;
    
    return dateStamp;
  }
}

