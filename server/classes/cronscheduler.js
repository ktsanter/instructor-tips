"use strict";
//---------------------------------------------------------------
// task scheduler 
// package doc: https://www.npmjs.com/package/cron
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------
// CronTime pattern
//   seconds: 0-59
//   minutes: 0-59
//   hours: 0-23
//   day of Month: 1-31
//   months: 0-11 (Jan-Dec)
//   day of Week: 0-6 (Sun-Sat)
//
//  */n => "every nth", e.g.
//     0 */2 * * * runs every 2nd minute, on the minute
//---------------------------------------------------------------
const internal = {};

module.exports = internal.CronScheduler = class {
  constructor(cron, dbManager, mailer, commonmark, appURL) {
    this._showMessages = true;
    
    this._cron = cron;
    this._dbManager = dbManager;
    this._mailer = mailer;
    this._commonmark = commonmark;
    this._appURL = appURL;
    
    this._jobList = {};
    this._createInitialJobs();
    this._startInitialJobs();
  }
  
  _createInitialJobs() {    
    this.createJob({
      jobName: 'schedulepush',
      fireTime: '*/1 * * * * *',  // change to once a day for prod

      funcOnTick: (function(me) {
        return function() { me._doSchedulePushNotifications(me); }
      })(this),

      funcOnComplete: null,
      start: false,
      timeZone: 'America/Detroit'
    });
  }
      
  _startInitialJobs() {
    this.startJob('schedulepush');
  }

//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  createJob(jobParams) {
    if (this._showMessages) console.log('CronScheduler: createJob ' + jobParams.jobName + ' ' + jobParams.fireTime + ' ' + this._getDateStamp());

    var job = new this._cron.CronJob(
      jobParams.fireTime,
      jobParams.funcOnTick,
      jobParams.funcOnComplete,
      jobParams.start,
      jobParams.timeZone
    );
    
    this._jobList[jobParams.jobName] = {
      "job": job,
      params: jobParams
    };
  }
  
  startJob(jobName) {
    if (this._showMessages) console.log('CronScheduler: startJob ' + jobName + ' ' + this._getDateStamp());
    if (!this._jobExists(jobName)) {
      console.log('**failed to start job: ' + jobName);
      return false;
    }
    
    this._jobList[jobName].job.start();
    return true;
  }
  
  stopJob(jobName) {
    if (this._showMessages) console.log('CronScheduler: stopJob ' + jobName + ' ' + this._getDateStamp());
    if (!this._jobExists(jobName)) {
      console.log('**failed to stop job: ' + jobName);
      return false;
    }
    
    this._jobList[jobName].job.stop();
    return true;
  }
  
  stopAllJobs() {
    if (this._showMessages) console.log('CronScheduler: stopAllJobs' + ' ' + this._getDateStamp());
    for (var jobName in this._jobList) {
      this.stopJob(jobName);
    }
  }
  
  isRunning(jobName) {
    if (!this._jobExists(jobName)) {
      console.log('**isRunning: job does not exist: ' + jobName);
      return false;
    }
    
    return this._jobList['schedulepush'].job.running;
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  _jobExists(jobName) {
    return this._jobList.hasOwnProperty(jobName);
  }
  
//--------------------------------------------------------------
// callbacks
//--------------------------------------------------------------      
  async _doSchedulePushNotifications(me) {
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
    
    queryResults = await me._dbManager.dbQuery(query);
    if (!queryResults.success) {
      console.log('*** query failed: ' + queryResults.details);
      return;
    }

    var scheduleInfo = queryResults.data;
    for (var i = 0; i < scheduleInfo.length; i++) {
      await me._sendScheduleNotification(me, scheduleInfo[i]);
    }
    
    /*-- while testing --*/
    me.stopJob('schedulepush');
  }

  async _sendScheduleNotification(me, scheduleInfo) {
    var schedStartDate = new Date(scheduleInfo.schedulestartdate);
    var msFromStart = Date.now() - schedStartDate;
    var weeksFromStart = ((((msFromStart / 1000) / 60) / 60) / 24) / 7;
    var weekIndex = 0;
    if (weeksFromStart >= 0) weekIndex = Math.ceil(weeksFromStart);
    if (weekIndex > scheduleInfo.schedulelength) weekIndex = -1;
    
    var queryList, queryResults;
    
    queryList = {
      user: 
        'select email ' +
        'from user ' +
        'where userid = ' + scheduleInfo.userid,
        
      tips:
        'select st.tipid, t.tiptext ' +
        'from scheduletip as st, tip as t ' +
        'where st.scheduleid = ' + scheduleInfo.scheduleid + ' ' +
          'and st.schedulelocation = ' + weekIndex + ' ' +
          'and st.tipstate = 0 ' +
          'and st.tipid = t.tipid ' +
          'order by st.schedulelocation, st.schedulelocationorder '
    };
    
    queryResults = await me._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      console.log('CronSchedule: user/tips lookup failed for schedule ' + scheduleInfo.scheduleId);
      return;
    }
    
    var email = queryResults.data.user[0].email;
    var tips = queryResults.data.tips;

    me._sendNotificationEmail(me, {
      appURL: me._appURL,
      scheduleName: scheduleInfo.schedulename,
      email: queryResults.data.user[0].email,
      tipList: queryResults.data.tips,
      beforeBeginning: weekIndex == 0,
      pastEnd: weekIndex < 0
    });
  }
  
  _sendNotificationEmail(me, params) {
    var htmlURL = '<a href=' + params.appURL + '>instructorTips</a>';
    var destEmail = params.email;
    var msgSubject = 'InstructorTips weekly reminder';
    var msgBody = '';
    
    msgBody += '<div>';
    msgBody +=   'This is a weekly reminder from ' + htmlURL + ' for "' + params.scheduleName + '"';
    msgBody += '</div>';
    
    if (params.pastEnd) {
      msgBody += '<div>';
      msgBody +=   'The current date is later than the end date for your schedule so there are no reminders. ';
      msgBody +=   'You can use the Notification option in InstructorTips to disable notifications for this schedule.';
      msgBody += '</div>';
      
    } else if (params.tipList.length == 0) {
      msgBody += '<div>';
      msgBody +=   'There are no incomplete tips for this week. ';
      msgBody += '</div>';
      
    } else {
      if (params.beforeBeginning) {
        msgBody += '<div>';
        msgBody +=   'Note: these tips are from the "before the term starts" section of your schedule. ';
        msgBody += '</div>';
      }
      
      msgBody += '<div>';
      msgBody += '<div>';
      msgBody +=   'These tips for the week have yet to be marked complete: ';
      msgBody += '</div>';

      var htmlTips = '';
      for (var i = 0; i < params.tipList.length; i++) {
        var tipText = params.tipList[i].tiptext;
        htmlTips += '<div>';
        htmlTips += me._convertToHTML(tipText, me._commonmark);
        htmlTips += '</div>';
      }
      msgBody += htmlTips;
      
      msgBody += '</div>'
    }
    
    console.log('\nto: ' + params.email);    
    console.log('subject: ' + msgSubject);
    console.log('body:\n' + msgBody);
  }
  
  
//--------------------------------------------------------------
// MarkDownToHTML
//--------------------------------------------------------------      
  _convertToHTML(str, commonmark) {
    var reader = new commonmark.Parser();
    var writer = new commonmark.HtmlRenderer();
    
    var parsed = reader.parse(str);
    var result = writer.render(parsed);
    
    var firstThree = result.substring(0,3);
    var lastFive = result.substring(result.length-5, result.length);
    if (firstThree == '<p>' && lastFive == '</p>\n') {
      result = result.substring(3);
      result = result.substring(0, result.length-5);
    }

    //result = CronScheduler._replaceAll(result, '&amp;amp;', '&');

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

