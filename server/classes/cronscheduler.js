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
  constructor(cron, dbManager, mailer, commonmark, pug, appURL) {
    this.DEBUG = true;  
    this.SHOW_MESSAGES = true;
    
    this._cron = cron;
    this._dbManager = dbManager;
    this._mailer = mailer;
    this._commonmark = commonmark;
    this._pug = pug;
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
    if (this.SHOW_MESSAGES) console.log('CronScheduler.createJob: ' + jobParams.jobName + ' ' + jobParams.fireTime + ' ' + this._getDateStamp());

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
    if (this.SHOW_MESSAGES) console.log('CronScheduler.startJob: ' + jobName + ' ' + this._getDateStamp());
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.startJob: **error: failed to start job ' + jobName + ' ' + this._getDateStamp());
      return false;
    }
    
    this._jobList[jobName].job.start();
    return true;
  }
  
  stopJob(jobName) {
    if (this.SHOW_MESSAGES) console.log('CronScheduler.stopJob: ' + jobName + ' ' + this._getDateStamp());
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.stopJob: **error: failed to stop job ' + jobName + ' ' + this._getDateStamp());
      return false;
    }
    
    this._jobList[jobName].job.stop();
    return true;
  }
  
  stopAllJobs() {
    if (this.SHOW_MESSAGES) console.log('CronScheduler.stopAllJobs: ' + ' ' + this._getDateStamp());
    for (var jobName in this._jobList) {
      this.stopJob(jobName);
    }
  }
  
  isRunning(jobName) {
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.isRunning: **error job does not exist ' + jobName + ' ' + this._getDateStamp());
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
    if (this.DEBUG) {
      console.log('CronScheduler._doSchedulePushNotifications: debug mode on -> stopping job after one run');
      me.stopJob('schedulepush');
    }
    
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
    var schedulesByUser = {};
    for (var i = 0; i < scheduleInfo.length; i++) {
      var schedItem = scheduleInfo[i];
      if (!schedulesByUser.hasOwnProperty(schedItem.userid)) schedulesByUser[schedItem.userid] = [];
      schedulesByUser[schedItem.userid].push(schedItem);        
    }
    
    for (var userid in schedulesByUser) {
      await me._sendScheduleNotification(me, userid, schedulesByUser[userid]);
    }
  }

  async _sendScheduleNotification(me, userId, scheduleInfoList) {
    var queryList, queryResults;

    queryList = {
      user: 
        'select email, username ' +
        'from user ' +
        'where userid = ' + userId,
    };
    
    queryResults = await me._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      console.log('CronSchedule: user/tips lookup failed for user ' + userId);
      return;
    }
    
    var emailTo = queryResults.data.user[0].email;
    var msgSubject = 'InstructorTips weekly reminder';
    
    var params = {
      appURL: me._appURL,
      userTo: queryResults.data.user[0].username,
      dateStamp: me._getDateStamp().slice(0,10),
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
      
      queryResults = await me._dbManager.dbQueries(queryList);
      if (!queryResults.success) {
        console.log('CronSchedule: user/tips lookup failed for schedule ' + scheduleInfo.scheduleId);
        return;
      }
            
      var organizedTips = me._organizeTipsByLocation(queryResults.data.tips);
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
    
    console.log('params');
    console.log(params);
    console.log('pug');
    var rendered = this._pug.renderFile('./private/pug/schedule_reminder.pug', {notificationInfo: params});
    console.log(rendered);
    
//    var mailResult = await me._mailer.sendMessage(emailTo, msgSubject, msgBodyText, msgBodyHTML);
//    if (!mailResult.success) {
//      console.log('CronScheduler: failed to send email');
//    }    
  }
  
  _organizeTipsByLocation(tipList) {
    var organized = {};
    
    for (var i = 0; i < tipList.length; i++) {
      var tip = tipList[i];
      if (tip.tipstate == 0) {
        if (!organized.hasOwnProperty(tip.schedulelocation)) organized[tip.schedulelocation] = [];
        organized[tip.schedulelocation].push(tip);
      }
    }
    
    return organized;
  }
    
//--------------------------------------------------------------
// message formatters
//--------------------------------------------------------------

  
//--------------------------------------------------------------
// MarkDownToHTML
//--------------------------------------------------------------      
  _convertToHTML(str, commonmark) {
    var reader = new commonmark.Parser();
    var writer = new commonmark.HtmlRenderer();
    
    var parsed = reader.parse(str);
    var result = writer.render(parsed);
    
    result = result.replace(/%%(.*?)%%/g, '<span style=\"background-color: #FFFF00\">$1</span>');
    
    if (result.slice(0, 3) == '<p>' && result.slice(-5) == '</p>\n') {
      result = result.substring(3);
      result = result.substring(0, result.length-5);
    }

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

