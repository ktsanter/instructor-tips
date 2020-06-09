"use strict";

//console.log(process.env);

const express = require('express')
var bodyParser = require('body-parser');
var favicon = require('serve-favicon')
var path = require('path')
const mariadb = require('mariadb')
var session = require('express-session')
var mySQL = require('mysql')
var MySQLStore = require('express-mysql-session')(session);
var nodemailer = require('nodemailer');

const app = express()
const port = 3000

// temp: hard-coded for now
const THIS_HOST = 'localhost';

app.use(favicon('favicon.ico'))

app.use(bodyParser.json()); 

//------ req body parsers -------------
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); // for form data


//------- session management ------------------
var mysqlPool = mySQL.createPool({
    host: THIS_HOST, //'localhost',
    user: 'root',
    password: 'SwordFish002',
    database: 'sessionstore'
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
  secret: 'Grit Gumption',
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

//--------- user management -----------------
const userManagementClass = require('./classes/usermanagement')
const userManagement = new userManagementClass(mariadb, 'instructortips', THIS_HOST);

//-------- email -------------
const gMailerClass = require('./classes/gmailer');
const gMailer = new gMailerClass(nodemailer);

//-------- admin queries -----------------
const dbAdminQueryClass = require('./classes/dbadmin_query')
const dbAdminQuery = new dbAdminQueryClass(mariadb, 'instructortips', userManagement, THIS_HOST);

const dbAdminInsertClass = require('./classes/dbadmin_insert')
const dbAdminInsert = new dbAdminInsertClass(mariadb, 'instructortips', THIS_HOST);

const dbAdminUpdateClass = require('./classes/dbadmin_update')
const dbAdminUpdate = new dbAdminUpdateClass(mariadb, 'instructortips', THIS_HOST);

const dbAdminDeleteClass = require('./classes/dbadmin_delete')
const dbAdminDelete = new dbAdminDeleteClass(mariadb, 'instructortips', THIS_HOST);

//---------- tip manager
const dbTipManagerClass = require('./classes/tipmanager', THIS_HOST)
const dbTipManager = new dbTipManagerClass(mariadb, 'instructortips', userManagement);

//---------- bolerplate response for failed request
function _failedRequest(requestType) {
  return {success: false, details: requestType + ' failed'};
}

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
  var loginSuccess = await userManagement.attemptLogin(req.session, req.body.userName, req.body.userPassword);
 
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

app.post('/change_password', async function (req, res) {
  userManagement.changePassword(req.body, req.session);
  res.redirect('/login.html');
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

app.get('/help.html', function (req, res) {
    res.sendFile(path.join(__dirname, 'private', 'help.html'))
})

// InstructorTips admin
app.get('/admin/query/:queryName',  async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor') && req.params.queryName == 'navbar') {
    res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));

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
  if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
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
    res.send(await dbTipManager.doInsert(req.params, req.body, gMailer, userInfo, userManagement.isAtLeastPrivilegeLevel));

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
// start up message
//------------------------------------------------------
app.listen(port, () => console.log('app listening on port ' + port))
