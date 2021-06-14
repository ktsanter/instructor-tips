"use strict";
//---------------------------------------------------------------
// Aardvark Studios admin tools interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------

const internal = {};

module.exports = internal.ASAdmin = class {
  constructor(params) {
    this.gMailer = params.gMailer;
    this.cronScheduler = params.cronScheduler
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  async adminTask(task, params, userInfo) {    
    var result = this._failResult(task + ' failed');
    
    if (task == 'get-mailer-debug') {
      result = this.gMailer.isDebugModeOn();
      
    }  else if (task == 'set-mailer-debug') {
      result = this.gMailer.setDebugMode(params.debugon);
      
    } else if (task == 'check-gmail-auth') {
      var result = await this.gMailer.checkGmailAuthorization();
      
    } else if (task == 'begin-gmail-auth') {
      var result = await this.gMailer.beginGmailAuthorization();
      
    } else if (task == 'finish-gmail-auth') {
      var result = await this.gMailer.finishGmailAuthorization(params.confirmcode);
      
    } else if (task == 'send-test-mail') {
      var result = await this.gMailer.sendTestMail(params);
      
    } else if (task == 'cron-status') {
      var result = await this._getCronStatus(params);
      
    } else if (task == 'cron-start') {
      var result = await this._setCronRunState(params, 'start');
      
    } else if (task == 'cron-stop') {
      var result = await this._setCronRunState(params, 'stop');
    } 
    
    return result;
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  _failResult(msg) {
    return {success: false, data: null, details: msg};
  }    
  
  _getCronStatus(params) {
    var result = this._failResult();
    
    var jobList = this.cronScheduler.listJobs();
    result.success = true;
    result.details = jobList.length + ' jobs scheduled';
    result.data = jobList;
    
    return result;
  }
  
  _setCronRunState(params, desiredRunState) {
    var result = this._failResult();
    
    var runStateSuccess = false;
    if (desiredRunState == 'start') runStateSuccess = this.cronScheduler.startJob(params.jobname);
    if (desiredRunState == 'stop') runStateSuccess = this.cronScheduler.stopJob(params.jobname);
    
    result.success = runStateSuccess;
    result.details = params.jobname + ': ' + desiredRunState;
    
    return result;
  }
}
