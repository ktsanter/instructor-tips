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
  "tempFileMaker": tmp
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

//----------------------------------------------------------------------------------------------------------------------
// GET and POST requests
//----------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------
// scripts and style sheets
//------------------------------------------------------
app.get('/styles/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'styles/' + req.params.stylesheet))
})

app.get('/scripts/:script', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'scripts/' + req.params.script))
})

//------------------------------------------------------
// login/logout and main page for InstructorTips
//------------------------------------------------------
app.get('/instructortips/instructortips.html', function (req, res) {
  var loggedin = userManagement.isLoggedIn(req.session);

  if (loggedin) {
    res.sendFile(path.join(__dirname, 'private', '/instructortips/instructortips.html'))
  } else {
    res.redirect('/instructortips/login.html');
  }
})

app.get('/instructortips/login.html', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', '/instructortips/login.html'))
})

app.post('/usermanagement/login_attempt', async function (req, res) {
  var loginSuccess = await userManagement.attemptLogin(req.session, req.body.userName, req.body.hashedPassword);
 
  if (loginSuccess) {
    res.redirect('/instructortips/instructortips.html');
  } else {
    res.redirect('/instructortips/login.html?retry=true');
  }
})
  
app.get('/usermanagement/logout', function (req, res) {
  userManagement.logout(req.session);
  res.redirect('/instructortips/login.html');
})

app.get('/usermanagement/createaccount', function (req, res) {
  res.redirect('/instructortips/login.html?createaccount=true');
})

app.post('/usermanagement/createaccount_attempt', async function (req, res) {
  var result = await userManagement.createAccount(req.body);
  
  if (result.success) {
    res.redirect('/instructortips/login.html');
  } else {
    res.redirect('/instructortips/login.html?createaccount=true&' + result.details);
  }
}) 

app.get('/usermanagement/resetaccount', function (req, res) {
  res.redirect('/instructortips/login.html?resetaccount=true');
})

app.post('/usermanagement/resetaccount_attempt', async function (req, res) {
  var result = await userManagement.resetRequest(req.body);
  
  if (result.success) {
    res.redirect('/instructortips/login.html');    
  } else {
    res.redirect('/instructortips/login.html?resetaccount=true&' + result.details);
  }
}) 

app.post('/usermanagement/pendingaccount_attempt', async function (req, res) {
  var result = await userManagement.resetPendingRequest(req.body);
  
  if (result.success) {
    res.redirect('/instructortips/login.html');    
  } else {
    res.redirect('/instructortips/login.html?' + result.details);
  }
}) 

app.post('/usermanagement/passwordchange', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
    var result = await userManagement.changePassword(req.body, req.session);
    if (result.success) {
      userManagement.logout(req.session);
      result.data = {};
      result.data.redirectURL = '/instructortips/login.html';
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

//------------------------------------------------------
// InstructorTips admin GET
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

//------------------------------------------------------
// InstructorTips admin POST
//------------------------------------------------------
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

//------------------------------------------------------
// InstructorTips general GET
//------------------------------------------------------
app.get('/styles/instructortips/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'styles/instructortips/' + req.params.stylesheet))
})

app.get('/scripts/instructortips/:scriptfile', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'scripts/instructortips/' + req.params.scriptfile))
})

app.get('/tipmanager/query/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    res.send(await dbTipManager.doQuery(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('get'));
  }
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
// InstructorTips general POST
//------------------------------------------------------
app.post('/tipmanager/query/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);

  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    res.send(await dbTipManager.doQuery(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/insert/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    req.body.appURL = INSTRUCTORTIPS_URL;    
    res.send(await dbTipManager.doInsert(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/update/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    res.send(await dbTipManager.doUpdate(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/delete/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    res.send(await dbTipManager.doDelete(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

//------------------------------------------------------
// InstructorTips help
//------------------------------------------------------
app.get('/help/:helpfile', function (req, res) {
  sendFileIfExists(res, path.join(__dirname, 'private', 'help/' + req.params.helpfile));
})

app.get('/styles/help/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'styles/help/' + req.params.stylesheet))
})

app.get('/scripts/help/:scriptfile', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'scripts/help/' + req.params.scriptfile))
})

app.get('/help/images/:helpfile', function (req, res) {
  sendFileIfExists(res, path.join(__dirname, 'private', 'help/images/' + req.params.helpfile))
})

app.get('/help/subpages/:helpfile', function (req, res) {
  var helpFileInfo = req.params.helpfile.split('.');
  if (helpFileInfo[1] != 'html') {
    sendFailedAccess(res);
    return;
  }

  renderAndSendPugIfExists(res, path.join(__dirname, 'private', 'help/' + helpFileInfo[0] + '.pug'));
})

//------------------------------------------------------
// TreasureHunt general
//------------------------------------------------------
app.get('/treasurehunt/:treasurehuntfile', function (req, res) {
  sendFileIfExists(res, path.join(__dirname, 'private', 'treasurehunt/' + req.params.treasurehuntfile));
})

app.get('/styles/treasurehunt/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'styles/treasurehunt/' + req.params.stylesheet))
})

app.get('/scripts/treasurehunt/:scriptfile', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'scripts/treasurehunt/' + req.params.scriptfile))
})

//------------------------------------------------------
// TreasureHunt queries
//------------------------------------------------------
app.get('/treasurehunt/query/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    res.send(await dbTreasureHunt.doQuery(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('get'));
  }
})

app.post('/treasurehunt/query/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    res.send(await dbTreasureHunt.doQuery(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/treasurehunt/insert/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    res.send(await dbTreasureHunt.doInsert(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/treasurehunt/update/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    res.send(await dbTreasureHunt.doUpdate(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/treasurehunt/delete/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {    
    res.send(await dbTreasureHunt.doDelete(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel));

  } else {
    res.send(_failedRequest('post'));
  }
})

//------------------------------------------------------
// TreasureHunt landing page
//------------------------------------------------------

app.get('/treasurehunt/landing/:projectid', async function (req, res) {
  var result = await dbTreasureHuntLanding.renderLandingPage(req.params, path.join(__dirname, 'private', 'treasurehunt/landing.pug'));
  if (result.success) {
    res.send(result.data);
  } else {
    sendFailedAccess(res);
  }
})


//------------------------------------------------------
// utility
//------------------------------------------------------
function sendFileIfExists(res, fileName) {
  if (fileservices.existsSync(fileName)) {
    res.sendFile(fileName);
  } else {
    sendFailedAccess(res); 
  }
}

function renderAndSendPugIfExists(res, pugFileName) {
  if (fileservices.existsSync(pugFileName)) {
    res.send(pug.renderFile(pugFileName));
  } else {
    sendFailedAccess(res); 
  }
}

function sendFailedAccess(res) {
  res.send('cannot access page');
}

//------------------------------------------
// boilerplate responses for failed requests
//------------------------------------------
function _failedRequest(requestType) {
  return {success: false, details: requestType + ' failed'};
}

//------------------------------------------------------
// start up
//------------------------------------------------------
app.listen(THIS_PORT, () => console.log('app listening on port ' + THIS_PORT))
