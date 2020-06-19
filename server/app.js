"use strict";

//------------------------------------------
// environment variables
//------------------------------------------
const THIS_PORT =getEnv('THIS_PORT', true);
const THIS_HOST = getEnv('THIS_HOST', true);

const MARIA_USER = getEnv('MARIA_USER', true);
const MARIA_PASSWORD = getEnv('MARIA_PASSWORD', true);
const MARIA_DBNAME = getEnv('MARIA_DBNAME', true);

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

const mariadbParams = {
    reqd: mariadb,
    host: THIS_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME, 
    connectionLimit: 5
};
    
const mariaDBManagerClass = require('./classes/mariadb_management')
const mariaDBManager = new mariaDBManagerClass(mariadbParams);
    
//------------------------------------------
// session management
//------------------------------------------
var session = require('express-session')
var mySQL = require('mysql')
var MySQLStore = require('express-mysql-session')(session);

var mysqlPool = mySQL.createPool({
    host: THIS_HOST, //'localhost',
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
// user management
//------------------------------------------
const userManagementClass = require('./classes/usermanagement')
const userManagement = new userManagementClass(mariaDBManager);

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
  "dbManager": mariaDBManager, 
  "mailer": gMailer, 
  "commonmark": commonmark, 
  "pug": pug, 
  "appURL": INSTRUCTORTIPS_URL, 
  "fileServices": fileservices,
  "HTMLToImage": puppeteer,
  "tempFileMaker": tmp
});

//------------------------------------------
// cron management
//------------------------------------------
var cron = require('cron');
const cronSchedulerClass = require('./classes/cronscheduler')
const cronScheduler = new cronSchedulerClass({
  "cron": cron, 
  "messageManagement": messageManagement
});

//------------------------------------------
// InstructorTips admin query objects
//------------------------------------------
const dbAdminQueryClass = require('./classes/dbadmin_query')
const dbAdminQuery = new dbAdminQueryClass(userManagement, mariaDBManager);

const dbAdminInsertClass = require('./classes/dbadmin_insert')
const dbAdminInsert = new dbAdminInsertClass(userManagement, mariaDBManager);

const dbAdminUpdateClass = require('./classes/dbadmin_update')
const dbAdminUpdate = new dbAdminUpdateClass(userManagement, mariaDBManager);

const dbAdminDeleteClass = require('./classes/dbadmin_delete')
const dbAdminDelete = new dbAdminDeleteClass(userManagement, mariaDBManager);

//------------------------------------------
// InstructorTips general query objects
//------------------------------------------
const dbTipManagerClass = require('./classes/tipmanager')
const dbTipManager = new dbTipManagerClass(userManagement, mariaDBManager, messageManagement);

//------------------------------------------------------
// login/logout and main page
//------------------------------------------------------
app.get('/tipsmanager.html', function (req, res) {
  var loggedin = userManagement.isLoggedIn(req.session);

  if (loggedin) {
    res.sendFile(path.join(__dirname, 'private', 'tipsmanager.html'))
  } else {
    res.redirect('/login.html');
  }
})

app.get('/login.html', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'login.html'))
})

app.post('/login_attempt', async function (req, res) {
  var loginSuccess = await userManagement.attemptLogin(req.session, req.body.userName, req.body.hashedPassword);
 
  if (loginSuccess) {
    res.redirect('/tipsmanager.html');
  } else {
    res.redirect('/login.html?retry=true');
  }
})
  
app.get('/usermanagement/logout', function (req, res) {
  userManagement.logout(req.session);
  res.redirect('/login.html');
})

app.post('/usermanagement/passwordchange', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
    var result = await userManagement.changePassword(req.body, req.session);
    console.log('changePassword result');
    console.log(result);
    
    if (result.success) {
      console.log('password change succeeded: redirecting...');
      userManagement.logout(req.session);
      result.details = 'password change succeeded';
      result.data = {};
      result.data.redirectURL = '/login.html';
      
    } else {
      console.log('password change failed: sending result...');
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
// GET requests
//------------------------------------------------------
app.get('/styles/:stylesheet', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'styles/' + req.params.stylesheet))
})

app.get('/scripts/:script', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', 'scripts/' + req.params.script))
})

app.get('/help/images/:helpfile', function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
    res.sendFile(path.join(__dirname, 'private', 'help/images/' + req.params.helpfile))
  }
})

app.get('/help/:helpfile', function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
    res.sendFile(path.join(__dirname, 'private', 'help/' + req.params.helpfile))
  }
})

// InstructorTips admin
app.get('/admin/query/:queryName',  async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor') && req.params.queryName == 'navbar') {
    res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));

  } else if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin') && req.params.queryName == 'cronstatus') {
    res.send({success: true, details: 'cronstatus', data: {isRunning: cronScheduler.isRunning('schedulepush')}});

  } else if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
    res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));

  } else if (req.params.queryName == 'calendars') {
    res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));
    
  } else {
    res.send(_failedRequest('get'));
  }
})

// InstructorTips general
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

//------------------------------------------------------
// POST requests
//------------------------------------------------------

// InstructorTips admin
app.post('/admin/insert/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
    res.send(await dbAdminInsert.doInsert(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/update/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin') && req.params.queryName == 'cronstatus') {
    if (req.body.enableJob) {
      cronScheduler.startJob('schedulepush');
    } else {
      cronScheduler.stopJob('schedulepush');
    }
    res.send({success: true, details: 'cronstatus', data: {isRunning: cronScheduler.isRunning('schedulepush')}});

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

// InstructorTips general
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

//------------------------------------------
// boilerplate response for failed request
//------------------------------------------
function _failedRequest(requestType) {
  return {success: false, details: requestType + ' failed'};
}

//------------------------------------------------------
// start up
//------------------------------------------------------
app.listen(THIS_PORT, () => console.log('app listening on port ' + THIS_PORT))
