"use strict";

const express = require('express')
const app = express()
const port = 3000

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 

const mariadb = require('mariadb')

const userManagementClass = require('./classes/usermanagement')
const userManagement = new userManagementClass(mariadb, 'instructortips');

/* temporary */ userManagement.setUser({userShortName: 'ksanter'});

const dbAdminQueryClass = require('./classes/dbadmin_query')
const dbAdminQuery = new dbAdminQueryClass(mariadb, 'instructortips');

const dbAdminInsertClass = require('./classes/dbadmin_insert')
const dbAdminInsert = new dbAdminInsertClass(mariadb, 'instructortips');

const dbAdminUpdateClass = require('./classes/dbadmin_update')
const dbAdminUpdate = new dbAdminUpdateClass(mariadb, 'instructortips');

const dbAdminDeleteClass = require('./classes/dbadmin_delete')
const dbAdminDelete = new dbAdminDeleteClass(mariadb, 'instructortips');

const dbTipManagerClass = require('./classes/tipmanager')
const dbTipManager = new dbTipManagerClass(mariadb, 'instructortips');

const dbTipFilterClass = require('./classes/tipfilter')
const dbTipFilter = new dbTipFilterClass(mariadb, 'instructortips');

app.use('/public', express.static('public_static'))

//------------------------------------------------------
// GET requests
//------------------------------------------------------
app.get('/admin/query/:queryName',  async function (req, res) {
  var dbResult = await dbAdminQuery.doQuery(req.params);
  res.send(dbResult);
})

app.get('/usermanagement/getfulluser', async function (req, res) {
  var dbResult = await userManagement.getFullUserInfo(req.params, req.body);
  res.send(dbResult);
})

app.get('/usermanagement/setuser/username/:userShortName', async function (req, res) {
  var dbResult = await userManagement.setUser(req.params, req.body);
  res.send(dbResult);
})

app.get('/usermanagement/getuser', async function (req, res) {
  var dbResult = await userManagement.getUserInfo(req.params, req.body);
  res.send(dbResult);
})

app.get('/tipmanager/filter/query/:queryName', async function (req, res) {
  var dbResult = await dbTipFilter.doQuery(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.get('/tipmanager/query/:queryName', async function (req, res) {
  var dbResult = await dbTipManager.doQuery(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

//------------------------------------------------------
// POST requests
//------------------------------------------------------
app.post('/admin/insert/:queryName', async function (req, res) {
  var dbResult = await dbAdminInsert.doInsert(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/admin/update/:queryName', async function (req, res) {
  var dbResult = await dbAdminUpdate.doUpdate(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/admin/delete/:queryName', async function (req, res) {
  var dbResult = await dbAdminDelete.doDelete(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/query/:queryName', async function (req, res) {
  var dbResult = await dbTipManager.doQuery(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/insert/:queryName', async function (req, res) {
  var dbResult = await dbTipManager.doInsert(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/update/:queryName', async function (req, res) {
  var dbResult = await dbTipManager.doUpdate(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/delete/:queryName', async function (req, res) {
  var dbResult = await dbTipManager.doDelete(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/filter/update/:queryName', async function (req, res) {
  var dbResult = await dbTipFilter.doUpdate(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.listen(port, () => console.log('app listening on port ${port}!'))
