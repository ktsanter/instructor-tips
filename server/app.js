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
const MARIA_DBNAME_WELCOME = getEnv('MARIA_DBNAME_WELCOME', true);
const MARIA_DBNAME_IMAGEFLIPPER = getEnv('MARIA_DBNAME_IMAGEFLIPPER', true);

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
// URL parser
//------------------------------------------
const url = require('url');

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
    
const mariadbParams_WelcomeLetter = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_WELCOME /*, 
    connectionLimit: 5 */
};
    
const mariadbParams_ImageFlipper = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_IMAGEFLIPPER /*, 
    connectionLimit: 5 */
};

const mariaDBManagerClass = require('./classes/mariadb_management')
const mariaDBManager_InstructorTips = new mariaDBManagerClass(mariadbParams_InstructorTips);
const mariaDBManager_TreasureHunt = new mariaDBManagerClass(mariadbParams_TreasureHunt);
const mariaDBManager_WelcomeLetter = new mariaDBManagerClass(mariadbParams_WelcomeLetter);
const mariaDBManager_ImageFlipper = new mariaDBManagerClass(mariadbParams_ImageFlipper);
    
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
    sharePugFile : path.join(__dirname, 'private', '/instructortips-app/pug/schedule_share.pug'),
    sharePugWrapperFile : path.join(__dirname, 'private', '/instructortips-app/pug/schedule_share_wrapper.pug'),
    
    reminderPugFile : path.join(__dirname, 'private', '/instructortips-app/pug/schedule_reminder.pug'),
    reminderPugWrapperFile : path.join(__dirname, 'private', '/instructortips-app/pug/schedule_reminder_wrapper.pug'),

    resetPugFile : path.join(__dirname, 'private', '/login/pug/reset_notification.pug')
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
// RosterManager
//------------------------------------------
const formidable = require('formidable');
const exceljs = require('exceljs');
const rosterManagerClass = require('./classes/roster-manager')
const rosterManager = new rosterManagerClass({tempFileManager: tmp, formManager: formidable});

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
// Welcome letter general query objects
//------------------------------------------
const dbWelcomeLetterClass = require('./classes/welcomeletter')
const dbWelcomeLetter = new dbWelcomeLetterClass({
  "dbManager": mariaDBManager_WelcomeLetter,
  "userManagement": userManagement,
  "pug": pug,
  "fileServices": fileservices,
  "pugPath": path.join(__dirname + '/private/welcomeletter/pug')
});

//------------------------------------------
// Image flipper general query objects
//------------------------------------------
const dbImageFlipperClass = require('./classes/imageflipper')

const dbImageFlipper = new dbImageFlipperClass({
  "dbManager": mariaDBManager_ImageFlipper,
  "userManagement": userManagement
});

//------------------------------------------
// DB manager lookup, app info lookup
//------------------------------------------
var dbManagerLookup = {
  "instructortips": dbTipManager,
  "usermanagement": dbTipManager,
  "tipmanager": dbTipManager,
  "treasurehunt": dbTreasureHunt,
  "welcome": dbWelcomeLetter,
  "imageflipper": dbImageFlipper
};

var appLookup = {
  "instructortips" : {
    appDescriptor: 'instructortips',
    appName: 'InstructorTips',
    routeRedirect: '/instructortips-app',
    loginReRoute: 'instructortips'
  },
  
  "treasurehunt" : {
    appDescriptor: 'treasurehunt',
    appName: 'Treasure Hunt',
    routeRedirect: '/treasurehunt-configuration',
    loginReRoute: 'treasurehunt'
  },
  
  "welcome" : {
    appDescriptor: 'welcome',
    appName: 'Welcome letter configuration',
    routeFunction: dbWelcomeLetter.renderConfigurationPage,
    routeData: 'welcomeletter/pug/configuration.pug',
    loginReRoute: 'welcomeletter/configuration'
  },
  
  "welcome-options" : {
    appDescriptor: 'welcome-options',
    appName: 'Welcome letter options editor',
    routePug: 'welcomeletter/pug/options.pug',
    loginReRoute: 'welcomeletter/options'
  },

  "image-flipper-generator" : {
    appDescriptor: 'image-flipper-generator',
    appName: 'Image flipper generator',
    routePug: 'image-flipper/pug/generator.pug',
    loginReRoute: 'image-flipper/generator'
  } 
};

//------------------------------------------------------
// app specific routing and queries
//------------------------------------------------------
function routeIfLoggedIn(req, res, appDescriptor) {
  var loggedin = userManagement.isLoggedIn(req.session);
  var appInfo = appLookup[appDescriptor];
  
  userManagement.setAppInfoForSession(req.session, appInfo);

  if (loggedin) {
    res.redirect('/usermanagement/routeToApp/' + appInfo.appDescriptor);
    
  } else {
    res.redirect('/login');
  }
}

app.get('/instructortips', function (req, res) { routeIfLoggedIn(req, res, 'instructortips'); })
app.get('/treasurehunt', function (req, res) { routeIfLoggedIn(req, res, 'treasurehunt'); })
app.get('/treasurehunt-configuration', function (req, res) { 
  if (userManagement.isLoggedIn(req.session)) {
    res.sendFile(path.join(__dirname, 'private', 'treasurehunt-configuration/html/treasurehunt-configuration.html'));
  } else {
    res.redirect('/login'); 
  }
})

app.get('/welcomeletter/configuration', function (req, res) { routeIfLoggedIn(req, res, 'welcome'); })
app.get('/welcomeletter/options', function (req, res) { routeIfLoggedIn(req, res, 'welcome-options'); })

app.get('/image-flipper/generator', function (req, res) { routeIfLoggedIn(req, res, 'image-flipper-generator'); })

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
    res.send(await dbTreasureHuntLanding.checkAnswer(req.body));
})

app.get('/welcomeletter/:coursekey/:audience', async function(req, res) { 
  if (req.params.audience == 'student' || req.params.audience == 'mentor') {
    var fileNameMentor = path.join(__dirname, 'private', 'welcomeletter/pug/welcomeletter-mentor.pug');
    var fileNameStudent = path.join(__dirname, 'private', 'welcomeletter/pug/welcomeletter-student.pug');

    var result = await dbWelcomeLetter.renderWelcomeLetter(req.params, {mentor: fileNameMentor, student: fileNameStudent});

    if (result.success) {
      res.send(result.data);
    } else {
      sendFailedAccess(res, 'welcomeletter');
    }
    
      
  } else {
    sendFailedAccess(res, 'welcomeletter');
  }
})

app.get('/welcomeletter2/:courseid/:audience', async function(req, res) { 
  if (req.params.audience == '000' || req.params.audience == '100') {
    req.params.audience = (req.params.audience == '000') ? 'student' : 'mentor';

    var fileNameMentor = path.join(__dirname, 'private', 'welcomeletter/pug/mentor.pug');
    var fileNameStudent = path.join(__dirname, 'private', 'welcomeletter/pug/student.pug');

    var result = await dbWelcomeLetter.renderWelcomeLetter2(req.params, {mentor: fileNameMentor, student: fileNameStudent});

    if (result.success) {
      res.send(result.data);
    } else {
      sendFailedAccess(res, 'welcomeletter');
    }
      
  } else {
    sendFailedAccess(res, 'welcomeletter');
  }
})

app.get('/welcomeletter/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'welcomeletter/pug/help.pug');
  
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})



//------------------------------------------------------
// user management, login, logout, etc.
//------------------------------------------------------
app.get('/usermanagement/routeToApp/:app', async function (req, res) {
  var appDescriptor = req.params.app;
  var appInfo = appLookup[appDescriptor];

  var loggedIn = userManagement.isLoggedIn(req.session);
  if (!loggedIn) {
    userManagement.setAppInfoForSession(req.session, appInfo);
    res.redirect('/login');
    
  } else if (appInfo && appInfo.routeRedirect) {
    res.redirect(appInfo.routeRedirect);

  } else if (appInfo && appInfo.routePug) {
    var pugFileName = path.join(__dirname, 'private', appInfo.routePug);
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
    
  } else if (appInfo && appInfo.routeFunction) {
    var pugFileName = path.join(__dirname, 'private', appInfo.routeData);
    await appInfo.routeFunction(res, dbManagerLookup[appDescriptor], pugFileName, renderAndSendPugIfExists, userManagement, req.session.userInfo);
    
  } else {
    sendFailedAccess(res, 'routeToApp/' + appDescriptor);
  }
});

app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname, 'private', '/login/html/login.html'))
})

app.post('/usermanagement/login_attempt', async function (req, res) {
  var loginSuccess = await userManagement.attemptLogin(req.session, req.body.userName, req.body.hashedPassword);
  
  var appInfo = userManagement.getAppInfoForSession(req.session);
  
  if (loginSuccess) {
    res.redirect('/usermanagement/routeToApp/' + appInfo.appDescriptor);

  } else {
    res.redirect('/login?retry=true');
  }
})
  
app.get('/usermanagement/logout', function (req, res) {
  userManagement.logout(req.session);
  res.redirect('/login');
})

app.get('/usermanagement/createaccount', function (req, res) {
  res.redirect('/login?createaccount=true');
})

app.post('/usermanagement/createaccount_attempt', async function (req, res) {
  var result = await userManagement.createAccount(req.body);
  
  if (result.success) {
    res.redirect('/login');
  } else {
    res.redirect('/login?createaccount=true&' + result.details);
  }
}) 

app.get('/usermanagement/resetaccount', function (req, res) {
  res.redirect('/login?resetaccount=true');
})

app.post('/usermanagement/resetaccount_attempt', async function (req, res) {
  var result = await userManagement.resetRequest(req.body);
  
  if (result.success) {
    res.redirect('/login');    
  } else {
    res.redirect('/login?resetaccount=true&' + result.details);
  }
}) 

app.post('/usermanagement/pendingaccount_attempt', async function (req, res) {
  var result = await userManagement.resetPendingRequest(req.body);
  
  if (result.success) {
    res.redirect('/login');    
  } else {
    res.redirect('/login?' + result.details);
  }
}) 

app.post('/usermanagement/passwordchange', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
    
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    var result = await userManagement.changePassword(req.body, req.session);
    if (result.success) {
      userManagement.logout(req.session);
      result.data = {};
      result.data.redirectURL = '/login';
    }
    
    res.send(result);
  }
}) 

app.get('/usermanagement/passwordsalt', function (req, res) { // note this is not privilege protected
  var result = {
    success: true,
    details: 'query succeeded',
    data: {salt: PASSWORD_SALT}
  };
  
  res.send(result);  
})  

app.get('/usermanagement/sessionappname', function (req, res) { // note this is not privilege protected
  var result = {
    success: true,
    details: 'query succeeded',
    data: {appname: userManagement.getAppInfoForSession(req.session).appName}
  };
  
  res.send(result);  
})  

app.get('/usermanagement/getuser', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {
    res.send(userManagement.queryUserInfo(req.session));

  } else {
    res.send(_failedRequest('get'));
  }
})  

app.get('/usermanagement/refreshuser', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor')) {;
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
app.get('/binary-conversion/:mode', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'binary-conversion/pug/binary-conversion.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {mode: req.params.mode}});
})

app.get('/slide-indexer/:subpage', function (req, res) {
  if (req.params.subpage == 'help') {
    var htmlFileName = path.join(__dirname, 'private', 'slide-indexer/html/help.html');
    res.sendFile(htmlFileName);
    
  } else if (req.params.subpage == 'user-help') {
    var pugFileName = path.join(__dirname, 'private', 'slide-indexer/pug/user-help.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {} );
    
  } else if (req.params.subpage == 'user-help2') {
    var pugFileName = path.join(__dirname, 'private', 'slide-indexer/pug/user-help2.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {} );
    
  } else if (req.params.subpage == 'config') {
    var pugFileName = path.join(__dirname, 'private', 'slide-indexer/pug/slide-indexer-config.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {} );
    
  } else if (req.params.subpage == 'tester') {
    var htmlFileName = path.join(__dirname, 'private', 'slide-indexer/html/iframe-tester.html');
    res.sendFile(htmlFileName);
    
  } else {
    var pugFileName = path.join(__dirname, 'private', 'slide-indexer/pug/slide-indexer.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {
      params: {
        presentationid: req.params.subpage,
        slidenumber: 0
      }
    });
  }
})

app.get('/slide-indexer/:presentationid/:slidenumber', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'slide-indexer/pug/slide-indexer.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {
    params: {
      presentationid: req.params.presentationid,
      slidenumber: req.params.slidenumber
    },
  });
})

app.get('/accordion-wrapper', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'accordion-wrapper/pug/accordion-wrapper.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/jsgd/:app', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'jsgd/pug/' + req.params.app + '.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/support-tool-index', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'support-tool-index/pug/support-tool-index.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/jsgd-resources', function (req, res) { // redirect from old name
  res.redirect('/jsgd/resources');
})

app.get('/basic-web-design', function (req, res) {
  res.redirect('/basic-web-design/home');
})

app.get('/basic-web-design/:app', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'basic-web-design/pug/' + req.params.app + '.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/countdown/scripts/:script', function (req, res) {
  var scriptFileName = path.join(__dirname, 'private', 'countdown/scripts/' + req.params.script);
  res.sendFile(scriptFileName);
})

app.get('/countdown/styles/:style', function (req, res) {
  var styleFileName = path.join(__dirname, 'private', 'countdown/styles/' + req.params.style);
  res.sendFile(styleFileName);
})

app.get('/countdown/:app', function (req, res) {
  const appParams = {params: url.parse(req.url,true).query};
  
  var pugFileName = path.join(__dirname, 'private', 'countdown/pug/' + req.params.app + '.pug');
  
  renderAndSendPugIfExists(res, req.params.app, pugFileName, appParams);
})

app.get('/image-flipper/flipper', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'image-flipper/pug/flipper.pug');
  
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/image-flipper/project/:configkey', async function (req, res) {
  var dbManager = dbManagerLookup['imageflipper'];
  req.params.queryName = 'singleproject';
  var userInfo = userManagement.getUserInfo(req.session);
  
  res.send(await dbManager.doQuery(req.params, req.body, userInfo));
})

app.get('/image-flipper/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'image-flipper/pug/help.pug');
  
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/roster-manager', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'roster-manager/pug/roster-manager.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.post('/roster-manager/:formname', function (req, res) {
  rosterManager.processUploadedFile(req, res, processRosterManagerResult); 
})

async function processRosterManagerResult(req, res, result) {
  if (result.success) {
    var fileName = result.targetfilename;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    await result.workbook.xlsx.write(res);

    res.end();
    
  } else {
    var pugFileName = path.join(__dirname, 'private', 'roster-manager/pug/error.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {formname: result.formname, description: result.description}});
  }
}

app.get('/aboutme', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'aboutme/pug/aboutme.pug');
  
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/cte-department', function (req, res) {
  res.redirect('/cte-department/home');
})

app.get('/cte-department/home', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'cte-department/pug/cte-department.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {});
})

app.get('/cte-department/remind', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'cte-department/pug/remind-for-embed.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {});
})

app.get('/:app', function (req, res) {
  var appDescriptor = req.params.app;
  
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
  var userInfo = userManagement.getUserInfo(req.session);

  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'instructor') && req.params.queryName == 'navbar') {
    res.send(await dbAdminQuery.doQuery(req.params, res, userInfo));

  } else if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin') && req.params.queryName == 'cronstatus') {
    res.send({
      success: true, 
      details: 'cronstatus', 
      data: {
        scheduleNotificationsRunning: cronScheduler.isRunning('schedulepush'),
        clearExpiredRequestisRunning: cronScheduler.isRunning('clearexpiredrequests'),
        mailerDebugMode: gMailer.isDebugModeOn()
      }});

  } else if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin') && req.params.queryName == 'cronstatus-forcepush') {
    await messageManagement.sendSchedulePushNotifications();
    res.send({success: true, details: 'forced push notifications'});

  } else if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
    res.send(await dbAdminQuery.doQuery(req.params, res, userInfo));
    
  } else {
    res.send(_failedRequest('get'));
  }
})

app.post('/admin/insert/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
    res.send(await dbAdminInsert.doInsert(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/update/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin') && req.params.queryName == 'cronstatus') {
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

  } else if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
    res.send(await dbAdminUpdate.doUpdate(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/delete/:queryName', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  
  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
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

function renderAndSendPugIfExists(res, app, pugFileName, pugOptions) {
  if (fileservices.existsSync(pugFileName)) {
    res.send(pug.renderFile(pugFileName, pugOptions));
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
