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

const dbQueryInterfaceClass = require('./classes/ssdbqueryinterface')
const dbQuery = new dbQueryInterfaceClass(mariadb, 'instructortips');

const dbInsertInterfaceClass = require('./classes/ssdbinsertinterface')
const dbInsert = new dbInsertInterfaceClass(mariadb, 'instructortips');

const dbUpdateInterfaceClass = require('./classes/ssdbupdateinterface')
const dbUpdate = new dbUpdateInterfaceClass(mariadb, 'instructortips');

const dbDeleteInterfaceClass = require('./classes/ssdbdeleteinterface')
const dbDelete = new dbDeleteInterfaceClass(mariadb, 'instructortips');

const dbTipFilterClass = require('./classes/tipfilter')
const dbTipFilter = new dbTipFilterClass(mariadb, 'instructortips');

app.use('/public', express.static('public_static'))

//------------------------------------------------------
// GET requests
//------------------------------------------------------
app.get('/admin/query/:queryName',  async function (req, res) {
  var dbResult = await dbQuery.doQuery(req.params);
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

//------------------------------------------------------
// POST requests
//------------------------------------------------------
app.post('/admin/insert/:queryName', async function (req, res) {
  var dbResult = await dbInsert.doInsert(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/admin/update/:queryName', async function (req, res) {
  var dbResult = await dbUpdate.doUpdate(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/admin/delete/:queryName', async function (req, res) {
  var dbResult = await dbDelete.doDelete(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/query/:queryName', async function (req, res) {
  var dbResult = await dbQuery.doQuery(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/insert/:queryName', async function (req, res) {
  var dbResult = await dbInsert.doInsert(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/update/:queryName', async function (req, res) {
  var dbResult = await dbUpdate.doUpdate(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/delete/:queryName', async function (req, res) {
  var dbResult = await dbDelete.doDelete(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.post('/tipmanager/filter/update/:queryName', async function (req, res) {
  var dbResult = await dbTipFilter.doUpdate(req.params, req.body, userManagement.getFullUserInfo().data);
  res.send(dbResult);
})

app.listen(port, () => console.log('app listening on port ${port}!'))
