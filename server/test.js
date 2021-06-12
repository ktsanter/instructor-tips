const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const MIMEText = require('mimetext')  // https://www.npmjs.com/package/mimetext

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

// Load client secrets from a local file.
fs.readFile('google-credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), authorizeCallback);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    googleAuth = oAuth2Client;
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function authorizeCallback() {
  console.log('authorizeCallback');
}

//------------------------------------------
// configure express and cors for the app
//------------------------------------------
const express = require('express');
var path = require('path');

const app = express();

if ((process.env.NODE_ENV || 'development') == 'development') {
    const cors = require('cors');
    var corsOptions = {
      origin: '*'
    }
    app.use(cors(corsOptions));
}

//------------------------------------------
// handle queries
//------------------------------------------
app.get('/getmessages', function (req, res) {
  getInboxMessages(googleAuth, res);
})

app.get('/sendmessage', function (req, res) {
  sendMessage(googleAuth, res);
})

//------------------------------------------
// test mail stuff
//------------------------------------------
function sendMessage(oauth2Client, res) {
  const message = new MIMEText()
  message.setSender('ksanter@mivu.org')
  message.setRecipient('ktsanter@gmail.com')
  message.setSubject('Newsletter #55 Ready 🤖')
  message.setMessage('Hi <b>buddy!</b>.')
   
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  gmail.users.messages
    .send({
      userId: 'me',
      requestBody: {
        raw: message.asEncoded()
      }
    })
    .then(function(result) {
      res.send( {success: true, details: 'OK', data: message.getSubject()} );
      
    })
    .catch(function(err) {
      console.log('catch');
      console.log(err);
      return res.send( {success: false, details: err, data: null} );
    })
}

function getInboxMessages(oauth2Client, res) {
  console.log('getInboxMessages');

  const gmail = google.gmail({"version": 'v1', "auth": oauth2Client});
  gmail.users.messages.list({
      userId: 'me'
      
  }, (err, response) => {
      var messageCount = response.data.messages.length;
      var formattedResults = {};
      for (var i = 0; i < messageCount; i++) {
        getMessage(oauth2Client, response.data.messages[i].id, messageCount, formattedResults, allMessagesFormatted, res);
      }
  });
}

function getMessage(oauth2Client, messageId, messageCount, formattedResults, callback, res) {
  const gmail = google.gmail({"version": 'v1', "auth": oauth2Client});
  gmail.users.messages.get({
      "userId": "me",
      "id": messageId,
      "format": "full"    
      
  }, (err, response) => {
    formattedResults[messageId] = {};
    formattedResults[messageId].labelIds = response.data.labelIds;
    
    if (response.data.labelIds.includes('INBOX')) {
      var headers = response.data.payload.headers;
      var txtFrom, txtTo, txtSubject;
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].name == 'From') txtFrom = headers[i].value;
        if (headers[i].name == 'To') txtTo = headers[i].value;
        if (headers[i].name == 'Subject') txtSubject = headers[i].value;
      }

      formattedResults[messageId].from = txtFrom;
      formattedResults[messageId].to = txtTo;
      formattedResults[messageId].subject = txtSubject;
      formattedResults[messageId].snippet = response.data.snippet;
      
      var parts = response.data.payload.parts;
      formattedResults[messageId].parts = [];
      for (var i = 0; i < parts.length; i++) {
        //var strBody = Buffer.from(parts[i].body.data, 'base64').toString();
        var strBody = myAToB(parts[i].body.data);

        formattedResults[messageId].parts.push({
          "header0": parts[i].headers[0].value,
          "body": strBody
        });
      }
    }
    
    if (messageCount == Object.keys(formattedResults).length) callback(formattedResults, res);
  });
}

function allMessagesFormatted(result, res) {
  var inboxResults = {};
  for (var messageId in result) {
    var messageInfo = result[messageId];
    if (messageInfo.labelIds.includes('INBOX')) {
      inboxResults[messageId] = messageInfo;
    }
  }
  
  var html = '<h3>Inbox messages</h3>';
  
  for (var id in inboxResults) {
    var message = inboxResults[id];
    
    html += '<table>';
    
    html += makeTableRow('id', id);
    html += makeTableRow('from', message.from);
    html += makeTableRow('to', message.to);
    html += makeTableRow('subject', message.subject);

    for (var i = 0; i < message.parts.length; i++) {
      var part = message.parts[i];
      html += makeTableRow(part.header0, part.body);
    }

    html += '</table>';
    
    html += '<br>';
  }
  
  res.send(html);
}

//------------------------------------------
// utility
//------------------------------------------
function makeTableRow(label, value) {
  var html = '<tr>';
  
  html += '<td>' + label + '</td>';
  html += '<td>' + value + '</td>';
  
  html += '</tr>';
  
  return html;
}

function myBToA(data) {
  return Buffer.from(data, 'utf8').toString();
}

function myAToB(raw) {
  return Buffer.from(raw, 'base64').toString();
}

function nullMessage(val) {
  if (val == null) return 'null'
  else return 'not null';
}

//------------------------------------------
// boilerplate responses for failed requests
//------------------------------------------
app.use(function(err, req, res, next) {
  console.error(err.stack);
  console.log('\nerror: ' + req.originalUrl);
  res.status(err.status || 500).send('(node server test) Error ' + (err.status || 500) + ': ' + req.originalUrl);
});

//------------------------------------------------------
// start up
//------------------------------------------------------
app.listen(8000, () => console.log('app listening on port ' + 8000))
