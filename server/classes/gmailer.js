"use strict";
//---------------------------------------------------------------
// GMailer interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------

const internal = {};

module.exports = internal.GMailer = class {
  constructor(params) {
    console.log('GMailer stubbed');
    return;
    /*
    this.fsp = require('fs').promises;    
    this.google = params.google;
    this.mimetext = require('mimetext');  // https://www.npmjs.com/package/mimetext
    
    this.googleAuth = null;
    
    this.googleCredentialsPath = 'google-credentials.json';

    // The tokenPath file stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    this.tokenPath = 'token.json';    

    // If modifying these scopes, delete the tokenPath file and
    // rerun the authorization flow
    this.scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose'
    ];
    
    this.setDebugMode(false);
    this.sender = 'ksanter@mivu.org';
    
    this._testAuth();
    */
  }
  
  async _testAuth() {
    /*
    var authTestResult = await this.checkGmailAuthorization();
    if (!authTestResult.success || !authTestResult.data.authorized) {
      console.log('** Gmail authorization failed: ' + authTestResult.details);
    }
    */
  }
  
//---------------------------------------------------------------
// public methods
//---------------------------------------------------------------
  setDebugMode(setDebugModeOn) {
    this.DEBUG = setDebugModeOn;
    console.log('GMailer: debug mode is ' + (this.DEBUG ? 'on' : 'off'));
    
    return {success: true, data: {debugstate: this.DEBUG}, details: 'mailer debug state set'};
  }
  
  isDebugModeOn() {
    return {success: true, data: {debugstate: this.DEBUG}, details: 'mailer debug state'};
  }
  
  async checkGmailAuthorization() {
    console.log('GMailer.checkGmailAuthorization stubbed');
    
    var result = this._failResult();
    result.success = true;
    result.details = 'stubbed';
    result.data = {authorized: false};
    return result;
    
    /*
    var credentialsResult = await this._getCredentials(); 
    if (!credentialsResult.success) {
      result.details = credentialsResult.err;
      return result;
    } 

    var credentials = credentialsResult.credentials;
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new this.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    var tokenResult = await this._getTokenContents();
    if (!tokenResult.success) {
      result.success = true;
      result.details = tokenResult.err;
      result.data = {authorized: false};
      return result;
    }
      
    var tokenContents = tokenResult.tokencontents;
    oAuth2Client.setCredentials(tokenContents);
    this.googleAuth = oAuth2Client;
    result.details = 'authorized';
    result.success = true;
    result.data = {authorized: true}
      
    return result;
    */
  }
  
  async beginGmailAuthorization() {
    console.log('GMailer.beginGmailAuthorization stubbed');
    
    var result = this._failResult();
    result.success = true;
    result.details = 'stubbed';
    return result;
    
  /*
    var credentialsResult = await this._getCredentials(); 
    if (!credentialsResult.success) {
      result.details = credentialsResult.err;
      return result;
    } 
    
    var credentials = credentialsResult.credentials;
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    this.googleAuth = new this.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    
    const authUrl = this.googleAuth.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes
    });
    
    result.success = true;
    result.data = {"authorizationurl": authUrl};
    result.details = 'authorization URL generated';
    
    return result;
    */
  }
  
  async finishGmailAuthorization(confirmCode) {
    console.log('GMailer.finishGmailAuthorization stubbed');
    
    var result = this._failResult();
    result.success = true;
    result.details = 'stubbed';
    return result;
    
/*    
    var result = this._failResult();
    
    var getTokenResult = await this._getTokenFromConfirmCode(confirmCode);
    if (!getTokenResult.success) {
      result.details = getTokenResult.err;
      return result;
    }
    
    this.googleAuth.setCredentials(getTokenResult.token);
    
    var writeTokenResult = await this._writeToken(getTokenResult.token);
    if (!writeTokenResult.success) {
      result.details = writeTokenResult.err;
      return result;
    }

    result.success = true;
    result.details = 'confirm complete';
    
    return result;
    */
  }
  
  async sendTestMail(params) {
    //return this._sendMessage(params);
  }
  
  async sendMessage(params) {
    //return this._sendMessage(params);
  }
  
  async sendDummy(params) {
    //return this._sendMessageDebug(params);
  }
  
  /*
  async sendMessage(addresseeList, subjectText, bodyText, bodyHTML, attachments) {
    return this._failResult();
  }
  */
  
//---------------------------------------------------------------
// private methods
//---------------------------------------------------------------
  _failResult(msg) {
    return {success: false, data: null, details: msg};
  }

/*
  async _getCredentials() {
    var result = {sucess: false, credentials: null, err: 'failed to get credentials'};

    await this.fsp.readFile(this.googleCredentialsPath)
      .then(function(contents, err) {
        result.success = true;
        result.credentials = JSON.parse(contents);
        result.err = null;
      })
      .catch(function(err) {
        result.success = false;
        result.credentials = null;
        result.err = err;
      });

    return result;
  }
  
  async _getTokenContents() {
    var result = {success: false, tokencontents: null, err: 'failed to get token contents'};
    
    await this.fsp.readFile(this.tokenPath)
      .then(function(contents) {
        result.success = true;
        result.tokencontents = JSON.parse(contents);
        result.err = null;
      })
      .catch(function(err) {
        result.success = false;
        result.tokencontents = null;
        result.err = err;
      });
      
    return result;
  }
  
  async _getTokenFromConfirmCode(confirmCode) {
    var result = {success: false, token: null, err: 'failed to get token from confirm code'};
    
    await this.googleAuth.getToken(confirmCode)
      .then(function(token) {
        result.success = true;
        result.token = token.tokens;
        result.err = null;
      })
      .catch(function(err) {
        result.success = false;
        result.token = null;
        result.err = 'failed to get token from confirm code';
      });
      
    return result;
  }
  
  async _writeToken(token) {
    var result = {success: false, err: 'failed to write token'};
    
    await this.fsp.writeFile(this.tokenPath, JSON.stringify(token))
      .then(function() {
        result.success = true;
        result.err = null;
      })
      .catch(function(err) {
        result.success = false;
        result.err = err;
      });
          
    return result;
  }

  async _sendMessage(params) {
    if (this.DEBUG) return this._sendMessageDebug(params);
    
    var result = this._failResult();

    var message = new this.mimetext();
    message.setSender(this.sender);
    message.setRecipient(params.recipient);
    message.setSubject(params.subject);
    message.setMessage(params.message);
    
    try {
      var gmail = this.google.gmail({ version: 'v1', auth: this.googleAuth });
      await gmail.users.messages
        .send({
          userId: 'me',
          requestBody: {
            raw: message.asEncoded()
          }
        })
        .then(function(gmailResult) {
          result.success = true;
          result.details = 'message sent';
          result.data = message.getSubject();
          
        })
        .catch(function(err) {
          result.details = 'failed to send email(1) ' + JSON.stringify(err);
        });
        
    } catch(err) {
      result.details = 'failed to send email(2) ' + JSON.stringify(err);
    }
      
    return result;
  }
  
  _sendMessageDebug(params) {
    console.log('Gmailer._sendMessageDebug');
    console.log(params);
    return {success: true, details: 'debug mode is on', data: null};
  }
  */
}
