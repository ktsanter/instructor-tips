"use strict";

//------------------------------------------
// environment variables
//------------------------------------------
const THIS_PORT =getEnv('THIS_PORT', true);


const MARIA_HOST = getEnv('MARIA_HOST', true);
const MARIA_USER = getEnv('MARIA_USER', true);
const MARIA_PASSWORD = getEnv('MARIA_PASSWORD', true);
const MARIA_DBNAME_INSTRUCTORTIPS = getEnv('MARIA_DBNAME_INSTRUCTORTIPS', true);
const MARIA_DBNAME_TREASUREHUNT = getEnv('MARIA_DBNAME_TREASUREHUNT', true);

const SESSION_HOST = getEnv('SESSION_HOST', true);
const SESSION_USER = getEnv('SESSION_USER', true);
const SESSION_PASSWORD = getEnv('SESSION_PASSWORD', true);
const SESSION_DBNAME = getEnv('SESSION_DBNAME', true);
const SESSION_SECRET = getEnv('SESSION_SECRET', true);

const INSTRUCTORTIPS_URL = getEnv('INSTRUCTORTIPS_URL', true);

const PASSWORD_SALT = getEnv('PASSWORD_SALT', true);

const EMAIL_USER = getEnv('EMAIL_USER', true);
const EMAIL_PASSWORD = getEnv('EMAIL_PASSWORD', true);

function getEnv(varName, required) {
  var value = process.env[varName];
  if (required && !value) {
    console.log('couldn\'t retrieve value for ' + varName + ', exiting app...');
    process.exit(100);
  }
  return value;
}
    
//------------------------------------------
// configure express for the app
//------------------------------------------
const express = require('express')
var path = require('path')

const app = express()

//------------------------------------------
// configure favicon
//------------------------------------------
var favicon = require('serve-favicon')
app.use(favicon('favicon.ico'))

//------------------------------------------
// body parsers
//------------------------------------------
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); // for form data

//------------------------------------------
// file services
//------------------------------------------
const fileservices = require('fs');

//------------------------------------------
// mariadb management
//------------------------------------------
const mariadb = require('mariadb')

const mariadbParams_InstructorTips = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_INSTRUCTORTIPS /*, 
    connectionLimit: 5 */
};
    
const mariadbParams_TreasureHunt = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_TREASUREHUNT /*, 
    connectionLimit: 5 */
};
    
const mariaDBManagerClass = require('./classes/mariadb_management')
const mariaDBManager_InstructorTips = new mariaDBManagerClass(mariadbParams_InstructorTips);
const mariaDBManager_TreasureHunt = new mariaDBManagerClass(mariadbParams_TreasureHunt);
    
//------------------------------------------
// session management
//------------------------------------------
var session = require('express-session')
var mySQL = require('mysql')
var MySQLStore = require('express-mysql-session')(session);

var mysqlPool = mySQL.createPool({
    host: SESSION_HOST,
    user: SESSION_USER,
    password: SESSION_PASSWORD,
    database: SESSION_DBNAME
});

const MS_PER_HOUR = 60 * 60 * 1000;

var sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 1 * MS_PER_HOUR,
    createDatabaseTable: true  
  }, 
  mysqlPool
);

app.use(session({
  secret: SESSION_SECRET,
  cookie: {maxAge: 24 * MS_PER_HOUR}, 
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}))

app.use(function (req, res, next) {
  if (!req.session.userInfo) {
    userManagement.initializeUserInfo(req.session);
  }

  next()
})

//------------------------------------------
// temp file management
//------------------------------------------
const tmp = require('tmp');

//------------------------------------------
// email management
//------------------------------------------
var nodemailer = require('nodemailer');
const gMailerClass = require('./classes/gmailer');
const gMailer = new gMailerClass(nodemailer, {user: EMAIL_USER, password: EMAIL_PASSWORD, fileServices: fileservices});

//------------------------------------------
// Pug management
//------------------------------------------
const pug = require('pug')

//------------------------------------------
// html-to-image management
//------------------------------------------
const puppeteer = require('puppeteer');
 
//------------------------------------------
// message management
//------------------------------------------
var commonmark = require('commonmark');
const messageManagementClass = require('./classes/messagemanagement')
const messageManagement = new messageManagementClass({
  "dbManager": mariaDBManager_InstructorTips, 
  "mailer": gMailer, 
  "commonmark": commonmark, 
  "pug": pug, 
  "appURL": INSTRUCTORTIPS_URL, 
  "fileServices": fileservices,
  "HTMLToImage": puppeteer,
  "tempFileMaker": tmp,
  "baseDir": __dirname,
  "pugFiles": {
    sharePugFile : path.join(__dirname, 'private', '/instructortips/pug/schedule_share.pug'),
    sharePugWrapperFile : path.join(__dirname, 'private', '/instructortips/pug/schedule_share_wrapper.pug'),
    
    reminderPugFile : path.join(__dirname, 'private', '/instructortips/pug/schedule_reminder.pug'),
    reminderPugWrapperFile : path.join(__dirname, 'private', '/instructortips/pug/schedule_reminder_wrapper.pug'),

    resetPugFile : path.join(__dirname, 'private', '/instructortips-login/pug/reset_notification.pug')
  }
});

//------------------------------------------
// user management
//------------------------------------------
const userManagementClass = require('./classes/usermanagement')
const userManagement = new userManagementClass({dbManager: mariaDBManager_InstructorTips, tempFileManager: tmp, messageManager: messageManagement});

//------------------------------------------
// cron management
//------------------------------------------
var cron = require('cron');
const cronSchedulerClass = require('./classes/cronscheduler')
const cronScheduler = new cronSchedulerClass({
  "cron": cron, 
  "messageManagement": messageManagement,
  "userManagement": userManagement
});

//------------------------------------------
// InstructorTips admin query objects
//------------------------------------------
const dbAdminQueryClass = require('./classes/dbadmin_query')
const dbAdminQuery = new dbAdminQueryClass(userManagement, mariaDBManager_InstructorTips);

const dbAdminInsertClass = require('./classes/dbadmin_insert')
const dbAdminInsert = new dbAdminInsertClass(userManagement, mariaDBManager_InstructorTips);

const dbAdminUpdateClass = require('./classes/dbadmin_update')
const dbAdminUpdate = new dbAdminUpdateClass(userManagement, mariaDBManager_InstructorTips);

const dbAdminDeleteClass = require('./classes/dbadmin_delete')
const dbAdminDelete = new dbAdminDeleteClass(userManagement, mariaDBManager_InstructorTips);

//------------------------------------------
// InstructorTips general query objects
//------------------------------------------
const dbTipManagerClass = require('./classes/tipmanager')
const dbTipManager = new dbTipManagerClass(userManagement, mariaDBManager_InstructorTips, messageManagement);

//------------------------------------------
// TreasureHunt general query objects
//------------------------------------------
const dbTreasureHuntClass = require('./classes/treasurehunt')
const dbTreasureHunt = new dbTreasureHuntClass(userManagement, mariaDBManager_TreasureHunt);

const dbTreasureHuntLandingClass = require('./classes/treasurehunt_landing');
const dbTreasureHuntLanding = new dbTreasureHuntLandingClass({
  "dbManager": mariaDBManager_TreasureHunt,
  "userManagement": userManagement,
  "commonmark": commonmark, 
  "pug": pug,
  "fileServices": fileservices  
});

//------------------------------------------
// DB manager lookup
//------------------------------------------
var dbManagerLookup = {
  "instructortips": dbTipManager,
  "usermanagement": dbTipManager,
  "tipmanager": dbTipManager,
  "treasurehunt": dbTreasureHunt
};

//------------------------------------------------------
// app specific routing and queries
//------------------------------------------------------
app.get('/instructortips', function (req, res) {
  var loggedin = userManagement.isLoggedIn(req.session);

  if (loggedin) {
    res.sendFile(path.join(__dirname, 'private', '/instructortips/html/instructortips.html'))
    
  } else {
    res.redirect('/instructortips/login');
  }
})

app.get('/treasurehunt', function (req, res) {
  res.redirect('/treasurehunt-configuration');
})

app.get('/treasurehunt-landing/:projectid', async function (req, res) {
  var fileName = path.join(__dirname, 'private', 'treasurehunt-landing/pug/treasurehunt-landing.pug');
  var result = await dbTreasureHuntLanding.renderLandingPage(req.params, fileName);
  if (result.success) {
    res.send(result.data);
    
  } else {
    sendFailedAccess(res, fileName);
  }
})

app.post('/treasurehunt/landing/check-answer', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    res.send(await dbTreasureHuntLanding.checkAnswer(req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

//------------------------------------------------------
// user management, login, logout, etc.
//------------------------------------------------------
app.get('/instructortips/login', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', '/instructortips-login/html/login.html'))
})

app.post('/usermanagement/login_attempt', async function (req, res) {
  var loginSuccess = await userManagement.attemptLogin(req.session, req.body.userName, req.body.hashedPassword);
 
  if (loginSuccess) {
    res.redirect('/instructortips');

  } else {
    res.redirect('/instructortips/login?retry=true');
  }
})
  
app.get('/usermanagement/logout', function (req, res) {
  userManagement.logout(req.session);
  res.redirect('/instructortips/login');
})

app.get('/usermanagement/createaccount', function (req, res) {
  res.redirect('/instructortips/login?createaccount=true');
})

app.post('/usermanagement/createaccount_attempt', async function (req, res) {
  var result = await userManagement.createAccount(req.body);
  
  if (result.success) {
    res.redirect('/instructortips/login');
  } else {
    res.redirect('/instructortips/login?createaccount=true&' + result.details);
  }
}) 

app.get('/usermanagement/resetaccount', function (req, res) {
  res.redirect('/instructortips/login?resetaccount=true');
})

app.post('/usermanagement/resetaccount_attempt', async function (req, res) {
  var result = await userManagement.resetRequest(req.body);
  
  if (result.success) {
    res.redirect('/instructortips/login');    
  } else {
    res.redirect('/instructortips/login?resetaccount=true&' + result.details);
  }
}) 

app.post('/usermanagement/pendingaccount_attempt', async function (req, res) {
  var result = await userManagement.resetPendingRequest(req.body);
  
  if (result.success) {
    res.redirect('/instructortips/login');    
  } else {
    res.redirect('/instructortips/login?' + result.details);
  }
}) 

app.post('/usermanagement/passwordchange', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
    var result = await userManagement.changePassword(req.body, req.session);
    if (result.success) {
      userManagement.logout(req.session);
      result.data = {};
      result.data.redirectURL = '/instructortips/login';
    }
    
    res.send(result);
  }
}) 

app.get('/usermanagement/passwordsalt', function (req, res) {
  var result = {
    success: true,
    details: 'query succeeded',
    data: {salt: PASSWORD_SALT}
  };
  
  res.send(result);  
})  

app.get('/usermanagement/getuser', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
    res.send(userManagement.queryUserInfo(req.session));

  } else {
    res.send(_failedRequest('get'));
  }
})  

app.get('/usermanagement/refreshuser', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {;
    res.send(await userManagement.refreshUserInfo(req.session));

  } else {
    res.send(_failedRequest('get'));
  }
})  

//------------------------------------------------------
// common scripts and CSS
//------------------------------------------------------
app.get('/styles/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'common/styles/' + req.params.stylesheet))
})

app.get('/scripts/:scriptfile', function (req, res) {
  if (req.params.scriptfile.slice(-3) != '.js') req.params.scriptfile += '.js';
  res.sendFile(path.join(__dirname, 'private', 'common/scripts/' + req.params.scriptfile))
})

//------------------------------------------------------
// app specific scripts, CSS, and pug
//------------------------------------------------------
app.get('/:app', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', req.params.app + '/html/' + req.params.app + '.html'))
})

app.get('/styles/:app/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', req.params.app + '/styles/' + req.params.stylesheet))
})

app.get('/scripts/:app/:scriptfile', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', req.params.app + '/scripts/' + req.params.scriptfile))
})

app.get('/pug/:app/:pugfile', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', req.params.app + '/pug/' + req.params.pugfile))
})

app.get('/images/:app/:imagefile', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', req.params.app + '/images/' + req.params.imagefile))
})

app.get('/subpage/:app/:helptype', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', req.params.app + '/pug/help_' + req.params.helptype + '.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName);
})

//------------------------------------------------------
// protected queries
//------------------------------------------------------
app.get('/admin/query/:queryName',  async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor') && req.params.queryName == 'navbar') {
    res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));

  } else if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin') && req.params.queryName == 'cronstatus') {
    res.send({
      success: true, 
      details: 'cronstatus', 
      data: {
        scheduleNotificationsRunning: cronScheduler.isRunning('schedulepush'),
        clearExpiredRequestisRunning: cronScheduler.isRunning('clearexpiredrequests'),
        mailerDebugMode: gMailer.isDebugModeOn()
      }});

  } else if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
    res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));
    
  } else {
    res.send(_failedRequest('get'));
  }
})

app.post('/admin/insert/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
    res.send(await dbAdminInsert.doInsert(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/update/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin') && req.params.queryName == 'cronstatus') {
    if (req.body.enablePushNotifications) {
      cronScheduler.startJob('schedulepush');
    } else {
      cronScheduler.stopJob('schedulepush');
    }
    if (req.body.enableClearExpired) {
      cronScheduler.startJob('clearexpiredrequests');
    } else {
      cronScheduler.stopJob('clearexpiredrequests');
    }

    gMailer.setDebugMode(req.body.setMailerDebugMode);
    res.send({
      success: true, 
      details: 'cronstatus', 
      data: {
        enablePushNotifications: cronScheduler.isRunning('schedulepush'),
        enableClearExpired: cronScheduler.isRunning('clearexpiredrequests'),
        setMailerDebugMode: gMailer.isDebugModeOn()
      }
    });

  } else if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
    res.send(await dbAdminUpdate.doUpdate(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/delete/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
    res.send(await dbAdminDelete.doDelete(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.get('/:app/query/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    var dbManager = dbManagerLookup[req.params.app];
    res.send(await dbManager.doQuery(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('get'));
  }
})

app.post('/:app/query/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    var dbManager = dbManagerLookup[req.params.app];
    res.send(await dbManager.doQuery(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/:app/insert/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    var dbManager = dbManagerLookup[req.params.app];
    res.send(await dbManager.doInsert(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/:app/update/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    var dbManager = dbManagerLookup[req.params.app];
    res.send(await dbManager.doUpdate(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/:app/delete/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    var dbManager = dbManagerLookup[req.params.app];
    res.send(await dbManager.doDelete(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

//------------------------------------------------------
// utility
//------------------------------------------------------
function sendFileIfExists(res, fileName) {
  if (fileservices.existsSync(fileName)) {
    res.sendFile(fileName);
  } else {
    sendFailedAccess(res, fileName); 
  }
}

function renderAndSendPugIfExists(res, app, pugFileName) {
  if (fileservices.existsSync(pugFileName)) {
    res.send(pug.renderFile(pugFileName));
  } else {
    sendFailedAccess(res, pugFileName); 
  }
}

function sendFailedAccess(res, fileName) {
  res.send('cannot access page: ' + fileName);
}

function _failedRequest(requestType) {
  return {success: false, details: requestType + ' failed'};
}

//------------------------------------------
// boilerplate responses for failed requests
//------------------------------------------
app.get('/*', function(req, res) {
  console.log('\nfailed to GET: ' + req.params[0]);
  res.send('cannot GET: ' + req.params[0]);
});

//------------------------------------------------------
// start up
//------------------------------------------------------
app.listen(THIS_PORT, () => console.log('app listening on port ' + THIS_PORT))
