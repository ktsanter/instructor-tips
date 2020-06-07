"use strict";
//---------------------------------------------------------------
// GMail interface
//---------------------------------------------------------------
// TODO:
//---------------------------------------------------------------

const internal = {};

module.exports = internal.GMailer = class {
  constructor(nodemailer) {
    this._nodemailer = nodemailer;
    
    this._transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ktsanter3@gmail.com',
        pass: 'vjrnyrnhpcayggoo'
      }
    });
    
    this._defaultSender = 'ktsanter3@gmail.com';
  }
  
//---------------------------------------------------------------
// send test message
//---------------------------------------------------------------
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

  async sendMessage(addresseeList, subjectText, bodyText) {
    var mailOptions = {
      from: this._defaultSender,
      to: addresseeList,
      subject: subjectText,
      text: bodyText,
      html: bodyText
    };
    
    this._transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      }
    });    
    
    return {"success": true};
  }
}
