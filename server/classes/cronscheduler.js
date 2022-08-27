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
  constructor(params) {
    this.DEBUG = false;  
    if (this.DEBUG) console.log('CronScheduler: debug mode is on');

    this._cron = params.cron;
    this._messageManagement = params.messageManagement;
    this._userManagement = params.userManagement;
    this._coursePolicies = params.coursePolicies;
    
    this._jobList = {};
    this._createInitialJobs();
    this._startInitialJobs();
  }
  
  _createInitialJobs() {
    //---------------------------------------
    // weekly schedule reminder emails    
    //---------------------------------------
    this.createJob({
      jobName: 'schedulepush',
      fireTime: (this.DEBUG ? '*/5 * * * * *' : '0 0 6 */1 * *'),  // once a day at 6:00 for prod, once after 5 seconds for debug

      funcOnTick: (function(me) {
        return async function() { 
          await me._messageManagement.sendSchedulePushNotifications(); 
          if (me.DEBUG) {
            console.log('CronScheduler: debug mode on => stopping "schedulepush" after one run');
            me.stopJob('schedulepush');
            return;
          }
        }
      })(this),

      funcOnComplete: null,
      start: false,
      timeZone: 'America/Detroit'
    });
    
    //---------------------------------------
    // clear expired account reset requests    
    //---------------------------------------
    this.createJob({
      jobName: 'clearexpiredrequests',
      fireTime: (this.DEBUG ? '*/10 * * * * *' : '0 10 */1 * * *'),  // hourly at 10 minutes past the hour for prod, once after 10 seconds for debug

      funcOnTick: (function(me) {
        return async function() { 
          var result = await me._userManagement.clearExpiredRequests(); 
          if (me.DEBUG) {
            console.log('CronScheduler: debug mode on => stopping "clearexpiredrequests" after one run');
            me.stopJob('clearexpiredrequests');
            return;
          }
        }
      })(this),

      funcOnComplete: null,
      start: false,
      timeZone: 'America/Detroit'
    });
      
    //---------------------------------------
    // clear temp mentor welcome letters
    //---------------------------------------
    this.createJob({
      jobName: 'cleartempwelcomeletters',
      fireTime: '0 20 */6 * * *',  // every 6 hours at 20 past the hour

      funcOnTick: (function(me) {
        return async function() { 
          var result = await me._coursePolicies.clearTempWelcomeLetters(); 
          if (me.DEBUG) {
            console.log('CronScheduler: debug mode on => stopping "cleartempwelcomeletters" after one run');
            me.stopJob('cleartempwelcomeletters');
            return;
          }
        }
      })(this),

      funcOnComplete: null,
      start: false,
      timeZone: 'America/Detroit'
    });
  }
      
    //---------------------------------------
    // kick off jobs
    //---------------------------------------
  _startInitialJobs() {
    this.startJob('schedulepush');
    this.startJob('clearexpiredrequests');
    this.startJob('cleartempwelcomeletters');
  }

//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  createJob(jobParams) {
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
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.startJob: **error: failed to start job ' + jobName + ' ' + this._getDateStamp());
      return false;
    }
    
    this._jobList[jobName].job.start();
    return true;
  }
  
  stopJob(jobName) {
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.stopJob: **error: failed to stop job ' + jobName + ' ' + this._getDateStamp());
      return false;
    }
    
    this._jobList[jobName].job.stop();
    return true;
  }
  
  stopAllJobs() {
    for (var jobName in this._jobList) {
      this.stopJob(jobName);
    }
  }
  
  isRunning(jobName) {
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.isRunning: **error job does not exist ' + jobName + ' ' + this._getDateStamp());
      return false;
    }
    
    return this._jobList[jobName].job.running;
  }
  
  listJobs() {
    var jobStatus = [];

    for (var jobName in this._jobList) {
      var job = this._jobList[jobName];
      jobStatus.push({
        "jobName": jobName,
        "running": job.job.running,
        "fireTime": job.params.fireTime
      });
    }

    return jobStatus;
  }
  
  forceJob(jobName) {
    if (!this._jobExists(jobName)) {
      console.log('CronScheduler.forceJob: **error: failed to force run of job ' + jobName + ' ' + this._getDateStamp());
      return false;
    }
    
    this._jobList[jobName].params.funcOnTick();
    
    return true;
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  _jobExists(jobName) {
    return this._jobList.hasOwnProperty(jobName);
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
