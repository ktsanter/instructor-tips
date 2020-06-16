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
    this.SHOW_MESSAGES = true;
    
    this._dbManager = params.dbManager;
    this._mailer = params.mailer;
    this._commonmark = params.commonmark;
    this._pug = params.pug;
    this._appURL = params.appURL;
    this._fileServices = params.fileServices;
    this._HTMLToImage = params.HTMLToImage;
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
      console.log('no notification sent for ' + notificationInfo.username);
      return result;
    }
    
    var pugParams = {
      userTo: notificationInfo.username,
      userFrom: params.userInfo.userName,
      scheduleName: scheduleInfo.schedulename,
      comment: params.comment,
      appURL: this._appURL
    };      

    var rendered = this._pug.renderFile('./private/pug/schedule_share.pug', {shareInfo: pugParams});
    var imageFileName = 'share.png';
    var madeImageFile = await this._makeImage(rendered, imageFileName);  // need to randomize this name
    
    var mailResult = {success: false};
    
    if (this.DEBUG) {
      var fileName = 'log/share_' + params.userInfo.userId + '_' + params.userIdTo + '_' + params.scheduleId + '.html';
      this._fileServices.writeFile(fileName, rendered, function (err) {
        if (err) {
          console.log('MessageManagement: error writing ' + fileName);
          console.log(err);
        } else {
          console.log('MessageManagement: wrote ' + fileName);
        }
      });
    }

    if (this.DEBUG) {
      result.success = true;
      result.details = 'notification message sent';
      
    } else {
      mailResult = await this._mailer.sendMessage(
        notificationInfo.email, 
        'an InstructorTips schedule has been shared with you',
        '',
        '<img src="cid:' + (imageFileName + 'xxx') + '"/>',
        [{
          path: 'log/' + imageFileName,
          cid: imageFileName + 'xxx'
        }]
      ) 
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
      console.log('CronSchedule: user/tips lookup failed for user ' + userId);
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
    
    var rendered = this._pug.renderFile('./private/pug/schedule_reminder.pug', {notificationInfo: params});
    var imageFileName = 'reminder.png';
    var madeImageFile = await this._makeImage(rendered, imageFileName);  // need to randomize this name

    if (this.DEBUG) {
      var fileName = 'log/notification_' + userId + '.html';
      this._fileServices.writeFile(fileName, rendered, function (err) {
        if (err) {
          console.log('MessageManagement: error writing ' + fileName);
          console.log(err);
        } else {
          console.log('MessageManagement: wrote ' + fileName);
        }
      });
    }
        
    if (!this.DEBUG) {
      var imageHTML = '<img src="cid:' + (imageFileName + 'xxx') + '"/>';
      var imageAttachments = [{
        path: 'log/' + imageFileName,
        cid: imageFileName + 'xxx'
      }];
      var mailResult = await this._mailer.sendMessage(emailTo, msgSubject, '', imageHTML, imageAttachments);
      if (!mailResult.success) {
        console.log('MessageManagement: failed to send email to ' + emailTo);
        return false;
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
    console.log('MessageManagement._makeImage: ' + targetFileName);
    const browser = await this._HTMLToImage.launch()
    const page = await browser.newPage()
    await page.setViewport({
              width: 600,
              height: 120,
              deviceScaleFactor: 1,
            });            
    await page.setContent(html)
    await page.screenshot({path: 'log/' + targetFileName, fullPage: true})
    await browser.close()
    
    return true;
  }
    /*
 async function test() {
   var imgHTML = '<!DOCTYPE html> <html> <head> </head> <body> <div>hi there</div> </body> </html>';
   const browser = await puppeteer.launch()
   const page = await browser.newPage()
   await page.setViewport({
              width: 100,
              height: 100,
              deviceScaleFactor: 1,
            });            
   await page.setContent(imgHTML)
   await page.screenshot({path: 'log/test.png'})
   await browser.close() 
 }
 test();
 console.log('okay');
    
    */
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

