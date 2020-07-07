"use strict";
//---------------------------------------------------------------
// GMail interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------

const internal = {};

module.exports = internal.GMailer = class {
  constructor(nodemailer, params) {
    this.setDebugMode(false);  // note: can be changed with outside call
    
    this._nodemailer = nodemailer;
    
    this._transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: params.user,
        pass: params.password     
      }
    });
    
    this._defaultSender = params.user;
    this._fileServices = params.fileServices;
  }
  
//---------------------------------------------------------------
// public methods - general messages
//---------------------------------------------------------------
  setDebugMode(setDebugModeOn) {
    this.DEBUG = setDebugModeOn;
    console.log('GMailer: debug mode is ' + (this.DEBUG ? 'on' : 'off'));
  }
  
  isDebugModeOn() {
    return this.DEBUG;
  }
  
  async sendMessage(addresseeList, subjectText, bodyText, bodyHTML, attachments) {
    var mailOptions = {
      from: this._defaultSender,
      to: addresseeList,
      subject: subjectText,
      text: bodyText,
      html: bodyHTML ? bodyHTML : bodyText
    };
    
    if (attachments && attachments.length > 0) {
      if (this._fileServices.existsSync(attachments[0].path)) {
        mailOptions.attachments = attachments;
      }
    }

    if (this.DEBUG) {
      console.log('GMailer.sendMessage: debug mode on => message to ' + addresseeList + ' not mailed');
      
    } else {
      this._transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log('GMailer.sendMessage error: ' + JSON.stringify(error));
          console.log(mailOptions);
          return {"success": false};
        }
      });     
    }
    
    return {"success": true};
  }  
}
