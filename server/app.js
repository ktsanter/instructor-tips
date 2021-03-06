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
const MARIA_DBNAME_WELCOMEV2 = getEnv('MARIA_DBNAME_WELCOMEV2', true);
const MARIA_DBNAME_IMAGEFLIPPER = getEnv('MARIA_DBNAME_IMAGEFLIPPER', true);
const MARIA_DBNAME_FAQCOMPOSER = getEnv('MARIA_DBNAME_FAQCOMPOSER', true);
const MARIA_DBNAME_WALKTHROUGH = getEnv('MARIA_DBNAME_WALKTHROUGH', true);
const MARIA_DBNAME_COMMENTBUDDY = getEnv('MARIA_DBNAME_COMMENTBUDDY', true);
const MARIA_DBNAME_ENDDATEMANAGER = getEnv('MARIA_DBNAME_ENDDATEMANAGER', true);
const MARIA_DBNAME_ROSTERMANAGER = getEnv('MARIA_DBNAME_ROSTERMANAGER', true);

const SESSION_HOST = getEnv('SESSION_HOST', true);
const SESSION_USER = getEnv('SESSION_USER', true);
const SESSION_PASSWORD = getEnv('SESSION_PASSWORD', true);
const SESSION_DBNAME = getEnv('SESSION_DBNAME', true);
const SESSION_SECRET = getEnv('SESSION_SECRET', true);

const APIKEY_ENDDATEMANAGER = getEnv('APIKEY_ENDDATEMANAGER', true);
const APIKEY_ROSTERMANAGER = getEnv('APIKEY_ROSTERMANAGER', true);

const INSTRUCTORTIPS_URL = getEnv('INSTRUCTORTIPS_URL', true);

const PASSWORD_SALT = getEnv('PASSWORD_SALT', true);

function getEnv(varName, required) {
  var value = process.env[varName];
  if (required && !value) {
    console.log('couldn\'t retrieve value for ' + varName + ', exiting app...');
    process.exit(100);
  }
  return value;
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
// configure favicon
//------------------------------------------
var favicon = require('serve-favicon');
app.use(favicon('favicon.ico'));

//------------------------------------------
// body parsers
//------------------------------------------
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb', extended: true})); 
app.use(bodyParser.urlencoded({ extended: true })); // for form data

//------------------------------------------
// URL parser
//------------------------------------------
const url = require('url');

//------------------------------------------
// file services
//------------------------------------------
const fileservices = require('fs');

// default options for sendFile
const sendFileDefaultOptions = {
  root: path.join(__dirname, 'private'),
  dotfiles: 'deny'
};

//------------------------------------------
// Google APIs
//------------------------------------------
const {google} = require('googleapis');

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
    
const mariadbParams_WelcomeLetterV2 = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_WELCOMEV2 /*, 
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

const mariadbParams_FAQComposer = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_FAQCOMPOSER /*, 
    connectionLimit: 5 */
};

const mariadbParams_Walkthrough = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_WALKTHROUGH /*, 
    connectionLimit: 5 */
};

const mariadbParams_CommentBuddy = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_COMMENTBUDDY /*, 
    connectionLimit: 5 */
};

const mariadbParams_EndDateManager = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_ENDDATEMANAGER /*, 
    connectionLimit: 5 */
};

const mariadbParams_ASAdmin = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: 'information_schema' /*, 
    connectionLimit: 5 */
};

const mariadbParams_RosterManager = {
    reqd: mariadb,
    host: MARIA_HOST,
    user: MARIA_USER,
    password: MARIA_PASSWORD,
    dbName: MARIA_DBNAME_ROSTERMANAGER /*, 
    connectionLimit: 5 */
};

const mariaDBManagerClass = require('./classes/mariadb_management')
const mariaDBManager_InstructorTips = new mariaDBManagerClass(mariadbParams_InstructorTips);
const mariaDBManager_TreasureHunt = new mariaDBManagerClass(mariadbParams_TreasureHunt);
const mariaDBManager_WelcomeLetter = new mariaDBManagerClass(mariadbParams_WelcomeLetter);
const mariaDBManager_WelcomeLetterV2 = new mariaDBManagerClass(mariadbParams_WelcomeLetterV2);
const mariaDBManager_ImageFlipper = new mariaDBManagerClass(mariadbParams_ImageFlipper);
const mariaDBManager_FAQComposer = new mariaDBManagerClass(mariadbParams_FAQComposer);
const mariaDBManager_Walkthrough = new mariaDBManagerClass(mariadbParams_Walkthrough);
const mariaDBManager_CommentBuddy = new mariaDBManagerClass(mariadbParams_CommentBuddy);
const mariaDBManager_EndDateManager = new mariaDBManagerClass(mariadbParams_EndDateManager);
const mariaDBManager_ASAdmin = new mariaDBManagerClass(mariadbParams_ASAdmin);
const mariaDBManager_RosterManager = new mariaDBManagerClass(mariadbParams_RosterManager);
    
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

if ((process.env.NODE_ENV || 'development') == 'development') {
  app.use(session({
    secret: SESSION_SECRET,
    cookie: {
      maxAge: 24 * MS_PER_HOUR,
      secure: false
    }, 
    resave: false,
    saveUninitialized: true,
    store: sessionStore
  }))
} else {
  app.use(session({
    secret: SESSION_SECRET,
    proxy: true,
    cookie: {
      maxAge: 24 * MS_PER_HOUR,
      secure: true
    }, 
    resave: false,
    saveUninitialized: true,
    store: sessionStore
  }))
}

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
const gMailerClass = require('./classes/gmailer');
const gMailer = new gMailerClass({"google": google});

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
const rosterManagerOriginalClass = require('./classes/roster-manager-original')
const rosterManagerOriginal = new rosterManagerOriginalClass({tempFileManager: tmp, formManager: formidable});

const rosterManagerClass = require('./classes/roster-manager')
const rosterManager = new rosterManagerClass({
  "dbManager": mariaDBManager_RosterManager,
  "dbManager_enddate": mariaDBManager_EndDateManager,
  "userManagement": userManagement,  
  "tempFileManager": tmp, 
  "formManager": formidable,
  "apiKey": APIKEY_ROSTERMANAGER
});

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

const dbWelcomeLetterClassV2 = require('./classes/welcomeletterv2')
const dbWelcomeLetterV2 = new dbWelcomeLetterClassV2({
  "dbManager": mariaDBManager_WelcomeLetterV2,
  "userManagement": userManagement,
  "pug": pug,
  "fileServices": fileservices,
  "pugPath": path.join(__dirname + '/private/welcomeletter/pug'),
  "commonmark": commonmark
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
// FAQ composer general query objects
//------------------------------------------
const dbFAQComposerClass = require('./classes/faqcomposer')

const dbFAQComposer = new dbFAQComposerClass({
  "dbManager": mariaDBManager_FAQComposer,
  "userManagement": userManagement,
  "fileServices": fileservices,
  "pug": pug
});

//------------------------------------------
// Walkthrough general query objects
//------------------------------------------
const dbWalkthroughClass = require('./classes/walkthrough')

const dbWalkthrough = new dbWalkthroughClass({
  "dbManager": mariaDBManager_Walkthrough,
  "userManagement": userManagement,
  "fileServices": fileservices,
  "pug": pug
});

//------------------------------------------
// CommentBuddy general query objects
//------------------------------------------
const dbCommentBuddyClass = require('./classes/commentbuddy')

const dbCommentBuddy = new dbCommentBuddyClass({
  "dbManager": mariaDBManager_CommentBuddy,
  "userManagement": userManagement,
  "fileServices": fileservices,
  "pug": pug,
  "tempFileManager": tmp, 
  "formManager": formidable
});

//------------------------------------------
// EndDateManager general query objects
//------------------------------------------
const endDateManagerClass = require('./classes/enddate-manager')
const endDateManager = new endDateManagerClass({
  "dbManager": mariaDBManager_EndDateManager,
  "userManagement": userManagement,
  tempFileManager: tmp, 
  formManager: formidable,
  "apiKey": APIKEY_ENDDATEMANAGER
});

//------------------------------------------
// ASAdmin general query objects
//------------------------------------------
const ASAdminClass = require('./classes/as-admin');
const ASAdmin = new ASAdminClass({
  "gMailer": gMailer, 
  "cronScheduler": cronScheduler,
  "dbManager": mariaDBManager_ASAdmin
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
  "welcomeV2": dbWelcomeLetterV2,
  "imageflipper": dbImageFlipper,
  "faqcomposer": dbFAQComposer,
  "walkthrough": dbWalkthrough,
  "commentbuddy": dbCommentBuddy,
  "enddate-manager": endDateManager,
  "roster-manager": rosterManager
};

var appLookup = {
  "as-default": {
    appDescriptor: 'as-default',
    appName: 'Aardvark Studios',
    routePug: 'default/pug/default.pug',
    loginReRoute: 'default'
  },
  
  "instructortips" : {
    appDescriptor: 'instructortips',
    appName: 'InstructorTips',
    routeRedirect: '/instructortips-app',
    loginReRoute: 'instructortips'
  },
  
  "treasurehunt" : {
    appDescriptor: 'treasurehunt',
    appName: 'Treasure Hunt configuration',
    routePug: 'treasurehunt/pug/configuration.pug',
    loginReRoute: 'treasurehunt/options'
  },
  
  "welcomeV2" : {
    appDescriptor: 'welcomeV2',
    appName: 'Welcome letter configuration',
    routeFunction: dbWelcomeLetterV2.renderConfigurationPage,
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
    appName: 'Image flipper',
    routePug: 'image-flipper/pug/generator.pug',
    loginReRoute: 'image-flipper/generator'
  }, 

  "faq-composer" : {
    appDescriptor: 'faq-composer',
    appName: 'FAQ composer',
    routePug: 'faq-composer/pug/faq-composer.pug',
    loginReRoute: 'faq-composer/compose'
  }, 

  "walkthrough" : {
    appDescriptor: 'walkthrough',
    appName: 'Walkthrough helper',
    routePug: 'walkthrough/pug/helper.pug',
    loginReRoute: 'walkthrough/helper'
  }, 

  "enddate-manager" : {
    appDescriptor: 'enddate-manager',
    appName: 'End date manager',
    routePug: 'enddate-manager/pug/enddate-manager.pug',
    loginReRoute: 'enddate-manager/manager'
  }, 

  "as-admin" : {
    appDescriptor: 'as-admin',
    appName: 'Aardvark Studios admin',
    routePug: 'as-admin/pug/as-admin.pug',
    loginReRoute: 'as-admin/admin'
  }, 

  "roster-manager" : {
    appDescriptor: 'roster-manager',
    appName: 'Roster Manager',
    //routePug: 'roster-manager/pug/roster-manager.pug',
    //loginReRoute: 'roster-manager/manager'
    routeFunction: dbManagerLookup['roster-manager'].renderManagerPage,
    routeData: 'roster-manager/pug/roster-manager.pug',
    loginReRoute: 'roster-manager/manage'
  }, 

  "commentbuddy" : {
    appDescriptor: 'commentbuddy',
    appName: 'CommentBuddy composer',
    routePug: 'commentbuddy/pug/composer.pug',
    loginReRoute: 'commentbuddy/composer'
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

app.get('/', function (req, res) {
    res.sendStatus(200);
});

app.get('/marco', function (req, res) {
    res.send('polo');
});

app.get('/default', function (req, res) { routeIfLoggedIn(req, res, 'as-default'); })

app.get('/instructortips', function (req, res) { routeIfLoggedIn(req, res, 'instructortips'); })

app.get('/treasurehunt/configuration', function (req, res) { routeIfLoggedIn(req, res, 'treasurehunt'); })
app.get('/treasurehunt/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'treasurehunt/pug/help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})
app.get('/treasurehunt/landing/:projectid', async function (req, res) {
  var fileName = path.join(__dirname, 'private', 'treasurehunt/pug/landing.pug');
  var result = await dbTreasureHuntLanding.renderLandingPage(req.params, fileName, userManagement.getUserInfo(req.session));
  if (result.success) {
    res.send(result.data);    
  } else {
    sendFailedAccess(res, fileName);
  }
})
app.post('/treasurehunt/landing/check-answer', async function (req, res) {   
    res.send(await dbTreasureHuntLanding.checkAnswer(req.body));
})

app.get('/faq-composer/compose', function (req, res) { routeIfLoggedIn(req, res, 'faq-composer'); })
app.get('/faq-composer/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'faq-composer/pug/help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})
app.get('/faq-composer/faq/:faqsetid', async function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'faq-composer/pug/faq.pug');
  var result = await dbFAQComposer.renderLandingPage(req.params, pugFileName);

  if (result.success) {
    res.send(result.data);
  } else {
    sendFailedAccess(res, pugFileName);
  }
})

app.get('/walkthrough/helper', function (req, res) { routeIfLoggedIn(req, res, 'walkthrough'); })
app.get('/walkthrough/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'walkthrough/pug/help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/enddate-manager/manager', function (req, res) { routeIfLoggedIn(req, res, 'enddate-manager'); })
app.get('/enddate-manager/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'enddate-manager/pug/help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})
app.post('/usermanagement/routeToApp/enddate-manager/upload', function (req, res) {
  endDateManager.processUploadedFile(req, res); 
})
app.post('/usermanagement/routeToApp/enddate-manager/export', function (req, res) {
  endDateManager.exportToExcel(req, res, processEndDateManagerExportResult); 
})

async function processEndDateManagerExportResult(req, res, result) {
  if (result.success) {
    var fileName = result.targetfilename;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    await result.workbook.xlsx.write(res);

    res.end();
    
  } else {
    var pugFileName = path.join(__dirname, 'private', 'enddate-manager/pug/export-error.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {description: result.description}});
  }
}


app.get('/commentbuddy/composer', function (req, res) { routeIfLoggedIn(req, res, 'commentbuddy'); })
app.get('/commentbuddy/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'commentbuddy/pug/help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})
app.get('/commentbuddy/extension-help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'commentbuddy/pug/extension-help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})
app.post('/commentbuddy/processform/:formname', function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);
  dbCommentBuddy.processForm(req, res, processCommentBuddyResult, userInfo); 
})
async function processCommentBuddyResult(req, res, result) {
  if (!result.success) {
    var errdetails = '';
    var ssrow = '';
    if (result.description.hasOwnProperty('errdetails')) errdetails = result.description.errdetails;
    if (result.description.hasOwnProperty('ssrow')) ssrow = result.description.ssrow;
    
    var pugFileName = path.join(__dirname, 'private', 'commentbuddy/pug/error.pug');
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {
      formname: result.formname, 
      description: result.description,
      error: errdetails,
      spreadsheetrow: ssrow
    }});
  }
}

app.post('/commentbuddy-client/:queryType/:queryName', async function (req, res) {
  var dbManager = dbManagerLookup['commentbuddy'];
  if (req.params.queryType == 'query') {
    res.send(await dbManager.doQuery(req.params, req.body));
  } else if (req.params.queryType == 'insert') {
    res.send(await dbManager.doInsert(req.params, req.body));
  }
})

app.get('/image-flipper/generator', function (req, res) { routeIfLoggedIn(req, res, 'image-flipper-generator'); })

app.get('/welcomeletter/configuration', function (req, res) { routeIfLoggedIn(req, res, 'welcomeV2'); })
app.get('/welcomeletter/options', function (req, res) { routeIfLoggedIn(req, res, 'welcome-options'); })
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

app.get('/welcomeletterV2/:courseid/:audience', async function(req, res) { 
  if (req.params.audience == '000' || req.params.audience == '100') {
    req.params.audience = (req.params.audience == '000') ? 'student' : 'mentor';

    var fileNameMentor = path.join(__dirname, 'private', 'welcomeletter/pug/landing-mentor.pug');
    var fileNameStudent = path.join(__dirname, 'private', 'welcomeletter/pug/landing-student.pug');

    var result = await dbWelcomeLetterV2.renderWelcomeLetter(req.params, {mentor: fileNameMentor, student: fileNameStudent});

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
    var userInfo = userManagement.getUserInfo(req.session);    
    if (appInfo.appDescriptor == 'as-admin' && !userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
      res.send('unauthorized');
      return;
    } 

    var pugFileName = path.join(__dirname, 'private', appInfo.routePug);
    renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
    
  } else if (appInfo && appInfo.routeFunction) {
    var pugFileName = path.join(__dirname, 'private', appInfo.routeData);
    await appInfo.routeFunction(res, dbManagerLookup[appDescriptor], pugFileName, renderAndSendPugIfExists, userManagement, req.session.userInfo);
    
  } else {
    sendFailedAccess(res, 'routeToApp/' + appDescriptor);
  }
});

app.post('/usermanagement/login_attempt', async function (req, res) {
  var loginSuccess = await userManagement.attemptLogin(req.session, req.body.userName, req.body.hashedPassword);
  
  var appInfo = userManagement.getAppInfoForSession(req.session) || {appDescriptor: 'default'};
  
  if (loginSuccess) {
    res.redirect('/usermanagement/routeToApp/' + appInfo.appDescriptor);

  } else {
    res.redirect('/login?retry=true');
  }
})
  
app.get('/usermanagement/logout/:app', function (req, res) {
  userManagement.setAppInfoForSession(req.session, appLookup[req.params.app]);
  
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
      result.details = 'password change succeeded';
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
  var appStuff = userManagement.getAppInfoForSession(req.session);
  
  var result = {
    success: true,
    details: 'query succeeded',
    data: {appname: appStuff ? appStuff.appName : 'Aardvark Studios'}
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
  res.sendFile(path.join('common/styles/' + req.params.stylesheet), sendFileDefaultOptions);
})

app.get('/scripts/:scriptfile', function (req, res) {
  if (req.params.scriptfile.slice(-3) != '.js') req.params.scriptfile += '.js';
  res.sendFile(path.join('common/scripts/' + req.params.scriptfile), sendFileDefaultOptions);
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

app.get('/as-admin', function (req, res) {
  routeIfLoggedIn(req, res, 'as-admin');
})

app.get('/as-admin/admin/:task', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);

  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
    res.send(await ASAdmin.adminTask(req.params.task, req.body, userInfo));
  } else {
    res.send({success: false, data: null, details: 'unauthorized'});
  }
})

app.post('/as-admin/admin/:task', async function (req, res) {
  var userInfo = userManagement.getUserInfo(req.session);

  if (userManagement.isAtLeastPrivilegeLevel(userInfo, 'admin')) {
    res.send(await ASAdmin.adminTask(req.params.task, req.body, userInfo));
  } else {
    res.send({success: false, data: null, details: 'unauthorized'});
  }
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

app.get('/mathml/testbed', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'mathml/pug/mathml.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.get('/roster-manager', function (req, res) {
  routeIfLoggedIn(req, res, 'roster-manager');
})

app.get('/roster-manager-original', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'roster-manager/pug/roster-manager-original.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.post('/roster-manager-original/:formname', function (req, res) {
  rosterManagerOriginal.processUploadedFile(req, res, processRosterManagerOriginalResult); 
})

app.get('/roster-manager/help', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', 'roster-manager/pug/help.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName, {params: {}});
})

app.post('/usermanagement/routeToApp/roster-manager/upload/:uploadType', function (req, res) {
  rosterManager.processUploadedFile(req, res, req.params.uploadType); 
})

async function processRosterManagerOriginalResult(req, res, result) {
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

app.get('/:app', function (req, res, next) {
  var appDescriptor = req.params.app;
 
  res.sendFile(path.join(req.params.app + '/html/' + req.params.app + '.html'), sendFileDefaultOptions);
})

app.get('/styles/:app/:stylesheet', function (req, res) {
  res.sendFile(path.join(req.params.app + '/styles/' + req.params.stylesheet), sendFileDefaultOptions);
})

app.get('/scripts/:app/:scriptfile', function (req, res) {
  res.sendFile(path.join(req.params.app + '/scripts/' + req.params.scriptfile), sendFileDefaultOptions);
})

app.get('/pug/:app/:pugfile', function (req, res) {
  res.sendFile(path.join(req.params.app + '/pug/' + req.params.pugfile), sendFileDefaultOptions);
})

app.get('/images/:app/:imagefile', function (req, res) {
  res.sendFile(path.join(req.params.app + '/images/' + req.params.imagefile), sendFileDefaultOptions);
})

app.get('/subpage/:app/:helptype', function (req, res) {
  var pugFileName = path.join(__dirname, 'private', req.params.app + '/pug/help_' + req.params.helptype + '.pug');
  renderAndSendPugIfExists(res, req.params.app, pugFileName);
})

//------------------------------------------------------
// protected queries
//------------------------------------------------------
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
    res.send(await dbManager.doUpdate(req.params, req.body, userInfo, userManagement.isAtLeastPrivilegeLevel, req));

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
/*
app.get('*', function (req, res, next) {
  next(req);
});
*/

app.use(function(err, req, res, next) {
  console.error(err.stack);
  console.log('\nerror: ' + req.originalUrl);
//  res.send('cannot GET: ' + req.params[0]);
    res.status(err.status || 500).send('Error ' + (err.status || 500) + ': ' + req.originalUrl);
//  next(err);
});

//------------------------------------------------------
// start up
//------------------------------------------------------
app.listen(THIS_PORT, () => console.log('app listening on port ' + THIS_PORT))
