"use strict";
//---------------------------------------------------------------
// GMailer2 interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------

const internal = {};

module.exports = internal.GMailer2 = class {
  constructor(params) {
    const {google} = require('googleapis');
    this._fileservices = params.fileservices;
    
    var googleAuth = null;

    // If modifying these scopes, delete token.json.
    const SCOPES = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose'
    ];
    
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = 'token.json';    

    this.setDebugMode(false);
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  setDebugMode(setDebugModeOn) {
    this.DEBUG = setDebugModeOn;
    console.log('GMailer2: debug mode is ' + (this.DEBUG ? 'on' : 'off'));
    
    return {success: true, data: {debugstate: this.DEBUG}, details: 'mailer debug state set'};
  }
  
  isDebugModeOn() {
    return {success: true, data: {debugstate: this.DEBUG}, details: 'mailer debug state'};
  }
  
  async checkGmailAuthorization() {
    return {success: true, data: {authorized: this.DEBUG}, details: 'debugging'};
  }
  
  async sendMessage(addresseeList, subjectText, bodyText, bodyHTML, attachments) {
    return this._failResult();
  }

  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  _failResult(msg) {
    return {success: false, data: null, details: msg};
  }    
}
