"use strict";

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

app.use(favicon('favicon.ico'))

app.use(bodyParser.json()); 

//------ req body parsers -------------
  app.use(bodyParser.json()); 
  app.use(bodyParser.urlencoded({ extended: true })); // for form data


//------- session management ------------------
  var mysqlPool = mySQL.createPool({
      host: 'localhost',
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
  const userManagement = new userManagementClass(mariadb, 'instructortips');

//-------- email -------------
  const gMailerClass = require('./classes/gmailer');
  const gMailer = new gMailerClass(nodemailer);

//-------- admin queries -----------------
  const dbAdminQueryClass = require('./classes/dbadmin_query')
  const dbAdminQuery = new dbAdminQueryClass(mariadb, 'instructortips', userManagement);

  const dbAdminInsertClass = require('./classes/dbadmin_insert')
  const dbAdminInsert = new dbAdminInsertClass(mariadb, 'instructortips');

  const dbAdminUpdateClass = require('./classes/dbadmin_update')
  const dbAdminUpdate = new dbAdminUpdateClass(mariadb, 'instructortips');

  const dbAdminDeleteClass = require('./classes/dbadmin_delete')
  const dbAdminDelete = new dbAdminDeleteClass(mariadb, 'instructortips');

//---------- tip manager and filter
  const dbTipManagerClass = require('./classes/tipmanager')
  const dbTipManager = new dbTipManagerClass(mariadb, 'instructortips', userManagement);

  const dbTipFilterClass = require('./classes/tipfilter')
  const dbTipFilter = new dbTipFilterClass(mariadb, 'instructortips', userManagement);

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


  app.get('/admin/query/:queryName',  async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor') && req.params.queryName == 'navbar') {
      res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));

    } else if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'admin')) {
      res.send(await dbAdminQuery.doQuery(req.params, res, userManagement.getUserInfo(req.session)));

    } else {
      res.send(_failedRequest('get'));
    }
  })

  app.get('/tipmanager/filter/query/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipFilter.doQuery(req.params, req.body, userManagement.getUserInfo(req.session)));

    } else {
      res.send(_failedRequest('get'));
    }
  })

  app.get('/tipmanager/query/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipManager.doQuery(req.params, req.body, userManagement.getUserInfo(req.session)));

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

  app.post('/tipmanager/query/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipManager.doQuery(req.params, req.body, userManagement.getUserInfo(req.session)));

    } else {
      res.send(_failedRequest('post'));
    }
  })

  app.post('/tipmanager/insert/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipManager.doInsert(req.params, req.body, gMailer, userManagement.getUserInfo(req.session)));

    } else {
      res.send(_failedRequest('post'));
    }
  })

  app.post('/tipmanager/update/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipManager.doUpdate(req.params, req.body, userManagement.getUserInfo(req.session)));

    } else {
      res.send(_failedRequest('post'));
    }
  })

  app.post('/tipmanager/delete/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipManager.doDelete(req.params, req.body));

    } else {
      res.send(_failedRequest('post'));
    }
  })

  app.post('/tipmanager/filter/update/:queryName', async function (req, res) {
    if (userManagement.isAtLeastPrivilegeLevel(userManagement.getUserInfo(req.session), 'instructor')) {
      res.send(await dbTipFilter.doUpdate(req.params, req.body, userManagement.getUserInfo(req.session)));

    } else {
      res.send(_failedRequest('post'));
    }
  })

app.listen(port, () => console.log('app listening on port ' + port))
