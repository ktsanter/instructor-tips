"use strict";

//------------------------------------------
// configure express for the app
//------------------------------------------
const express = require('express')
var path = require('path')

const app = express()

app.get('/', function (req, res) {
  res.send("yoloswag");
})  

//------------------------------------------------------
// start up
//------------------------------------------------------
app.listen(3000, () => console.log('app listening on :3000'))
