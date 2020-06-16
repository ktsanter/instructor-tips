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
    this.DEBUG = true;  
    this.SHOW_MESSAGES = true;
    
    this._cron = params.cron;
    this._messageManagement = params.messageManagement;
    
    this._jobList = {};
    this._createInitialJobs();
    this._startInitialJobs();
  }
  
  _createInitialJobs() {    
    this.createJob({
      jobName: 'schedulepush',
      fireTime: '*/1 * * * * *',  // change to once a day for prod

      funcOnTick: (function(me) {
        return async function() { 
          await me._messageManagement.sendSchedulePushNotifications(); 
          if (me.DEBUG) {
            console.log('CronScheduler: debug mode on => stopping job after one run');
            me.stopJob('schedulepush');
            return;
          }
        }
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
