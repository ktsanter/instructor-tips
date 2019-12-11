"use strict";

const express = require('express')
const app = express()
const port = 3000

var favicon = require('serve-favicon')
var path = require('path')
app.use(favicon(path.join(__dirname, 'public_static', 'favicon.ico')))

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 

const mariadb = require('mariadb')

var nodemailer = require('nodemailer');

const userManagementClass = require('./classes/usermanagement_temp1')
const userManagement = new userManagementClass(mariadb, 'instructortips');

/* temporary */ userManagement.setUser({userShortName: 'ksanter'});

const gMailerClass = require('./classes/gmailer');
const gMailer = new gMailerClass(nodemailer);

const dbAdminQueryClass = require('./classes/dbadmin_query')
const dbAdminQuery = new dbAdminQueryClass(mariadb, 'instructortips', userManagement);

const dbAdminInsertClass = require('./classes/dbadmin_insert')
const dbAdminInsert = new dbAdminInsertClass(mariadb, 'instructortips');

const dbAdminUpdateClass = require('./classes/dbadmin_update')
const dbAdminUpdate = new dbAdminUpdateClass(mariadb, 'instructortips');

const dbAdminDeleteClass = require('./classes/dbadmin_delete')
const dbAdminDelete = new dbAdminDeleteClass(mariadb, 'instructortips');

const dbTipManagerClass = require('./classes/tipmanager')
const dbTipManager = new dbTipManagerClass(mariadb, 'instructortips', userManagement);

const dbTipFilterClass = require('./classes/tipfilter')
const dbTipFilter = new dbTipFilterClass(mariadb, 'instructortips', userManagement);

app.use('/public', express.static('public_static'))

function _failedRequest(requestType) {
  return {success: false, details: requestType + ' failed'};
}

//------------------------------------------------------
// GET requests
//------------------------------------------------------
app.get('/admin/query/:queryName',  async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor') && req.params.queryName == 'navbar') {
    res.send(await dbAdminQuery.doQuery(req.params, res));

  } else if (userManagement.isAtLeastPrivilegeLevel('admin')) {
    res.send(await dbAdminQuery.doQuery(req.params, res));

  } else {
    res.send(_failedRequest('get'));
  }
})

app.get('/tipmanager/filter/query/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipFilter.doQuery(req.params, req.body));

  } else {
    res.send(_failedRequest('get'));
  }
})

app.get('/tipmanager/query/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipManager.doQuery(req.params, req.body));

  } else {
    res.send(_failedRequest('get'));
  }
})

// ------ *** temporary user management *** ---------------
app.get('/usermanagement/getuser', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await userManagement.getUserInfo(req.params, req.body));

  } else {
    res.send(_failedRequest('get'));
  }
})

app.get('/usermanagement/getuserlist', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await userManagement.getUserList(req.params, req.body));

  } else {
    res.send(_failedRequest('get'));
  }
})

app.get('/usermanagement/setuser/username/:userShortName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await userManagement.setUser(req.params, req.body));

  } else {
    res.send(_failedRequest('get'));
  }
})
// ------ *** end of temporary user management *** ---------------


//------------------------------------------------------
// POST requests
//------------------------------------------------------
app.post('/admin/insert/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('admin')) {
    res.send(await dbAdminInsert.doInsert(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/update/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('admin')) {
    res.send(await dbAdminUpdate.doUpdate(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/admin/delete/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('admin')) {
    res.send(await dbAdminDelete.doDelete(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/query/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipManager.doQuery(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/insert/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipManager.doInsert(req.params, req.body, gMailer));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/update/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipManager.doUpdate(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/delete/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipManager.doDelete(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.post('/tipmanager/filter/update/:queryName', async function (req, res) {
  if (userManagement.isAtLeastPrivilegeLevel('instructor')) {
    res.send(await dbTipFilter.doUpdate(req.params, req.body));

  } else {
    res.send(_failedRequest('post'));
  }
})

app.listen(port, () => console.log('app listening on port ' + port))
