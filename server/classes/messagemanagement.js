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
    this.DEBUG = false;  
    
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
    this._reminderPugFile = './private/pug/schedule_reminder.pug';
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
    
    var pugParams = {
      userTo: notificationInfo.username,
      userFrom: params.userInfo.userName,
      scheduleName: scheduleInfo.schedulename,
      comment: params.comment,
      appURL: this._appURL
    };      

    var rendered = this._pug.renderFile(this._sharePugFile, {shareInfo: pugParams});
    var imageFileName = this._tempFileMaker.tmpNameSync({tmpdir: this._tempDir}) + '.png'; 
    imageFileName = this._tempDir + '/' + imageFileName.split('\\').pop().split('/').pop();
 
    var madeImageFile = await this._makeImage(rendered, imageFileName);
    
    var mailResult = {success: false};
    
    if (this.DEBUG) {
      mailResult.success = true;
      result.success = true;
      result.details = 'notification message sent';
      
    } else {
      var msgSubject = 'an InstructorTips schedule has been shared with you';
      var imageFileRelativePath = imageFileName;
      var imageFileCID = imageFileName.split('\\').pop().split('/').pop() + 'xxx';
      
      var imageHTML = '<img src="cid:' + (imageFileCID) + '"/>';

      var imageAttachments = [{
        path: imageFileRelativePath,
        cid: imageFileCID
      }];

      var mailResult = await this._mailer.sendMessage(notificationInfo.email, msgSubject, '', imageHTML, imageAttachments); 
    }
    
    if (mailResult.success) {
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
    
    var emailTo = queryResults.data.user[0].email;
    var msgSubject = 'InstructorTips weekly reminder';
    
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
    
    var rendered = this._pug.renderFile(this._reminderPugFile, {notificationInfo: params});
    var imageFileName = this._tempFileMaker.tmpNameSync({tmpdir: this._tempDir}) + '.png'; 
    imageFileName = this._tempDir + '/' + imageFileName.split('\\').pop().split('/').pop();
    
    var madeImageFile = await this._makeImage(rendered, imageFileName);
  
    if (!this.DEBUG) {
      var imageFileRelativePath = imageFileName;
      var imageFileCID = imageFileName.split('\\').pop().split('/').pop() + 'xxx';
      
      var imageHTML = '<img src="cid:' + (imageFileCID) + '"/>';

      var imageAttachments = [{
        path: imageFileRelativePath,
        cid: imageFileCID
      }];
      
      var mailResult = await this._mailer.sendMessage(emailTo, msgSubject, '', imageHTML, imageAttachments);
      if (!mailResult.success) {
        console.log('MessageManagement: failed to send email to ' + emailTo);
        return false;
        
      } else {
        if (this._fileServices.existsSync(imageFileName)) this._fileServices.unlinkSync(imageFileName);
      }
    }
    
    return true;
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
    
  async _makeImage(html, targetFileName) {
    console.log('targetFileName: ' + JSON.stringify(targetFileName));
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
    
    return true;
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

