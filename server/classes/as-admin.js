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
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  async adminTask(task, params, userInfo) {    
    var result = this._failResult(task + ' failed');
    
    if (task == 'get-mailer-debug') {
      return (this.gMailer.isDebugModeOn());
      
    }  else if (task == 'set-mailer-debug') {
      return this.gMailer.setDebugMode(params.debugon);
      
    } else if (task == 'check-gmail-auth') {
      return this.gMailer.checkGmailAuthorization();
    } 
    
    return result;
  }
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  _failResult(msg) {
    return {success: false, data: null, details: msg};
  }    
}
