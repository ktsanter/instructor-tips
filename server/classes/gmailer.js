"use strict";
//---------------------------------------------------------------
// GMail interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------

const internal = {};

module.exports = internal.GMailer = class {
  constructor(nodemailer, credentials) {
    this._nodemailer = nodemailer;
    this.DEBUG = true;  
    
    this._transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: credentials.user,
        pass: credentials.password     
      }
    });
    
    this._defaultSender = credentials.user;
  }
  
//---------------------------------------------------------------
// public methods - general messages
//---------------------------------------------------------------
  async sendMessage(addresseeList, subjectText, bodyText, bodyHTML, attachments) {
    var mailOptions = {
      from: this._defaultSender,
      to: addresseeList,
      subject: subjectText,
      text: bodyText,
      html: bodyHTML ? bodyHTML : bodyText
    };
    
    if (attachments) {
      mailOptions.attachments = attachments;
    }

    if (this.DEBUG) {
      console.log('GMailer.sendMessage: debug mode on -> message to ' + addresseeList + ' not mailed');
      
    } else {
      this._transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log('GMailer.sendMessageerror: ' + JSON.stringify(error));
          return {"success": false};
        }
      });     
    }
    
    return {"success": true};
  }  

  async sendTestMessage(reqParams, resBody) {
    var emailSuccessful = false;
    
    var mailOptions = {
      from: this._defaultSender,
      to: 'ktsanter@gmail.com',
      subject: 'test of sending email using express.js',
      text: 'That was easy!',
      html: 'That was <strong>easy!</strong>'
    };
    
    let info = await this._transporter.sendMail(mailOptions);
    console.log(info);
    emailSuccessful = (info.accepted && info.accepted.length > 0);
    
    return {success: emailSuccessful};
  }
}
