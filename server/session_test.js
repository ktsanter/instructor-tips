var express = require('express')
//var parseurl = require('parseurl')
const path = require('path')
var session = require('express-session')
var mySQL = require('mysql')
var MySQLStore = require('express-mysql-session')(session);

var app = express()
const port = 3000;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 

var mysqlPool = mySQL.createPool({
    host: 'localhost',
    user: 'root',
    password: 'SwordFish002',
    database: 'session_test'
});

var sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000,
    createDatabaseTable: true  
  }, 
  mysqlPool
);

app.use(session({
  secret: 'Grit Gumption',
  cookie: {maxAge: 300000}, 
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}))

app.use(function (req, res, next) {
  if (!req.session.userInfo) {
    req.session.userInfo = {userId: -1}
  }

  next()
})

app.get('/mainpage.html', function (req, res) {
  console.log('trying to access mainpage.html');

  var htmlFile = 'mainpage.html';
  if (!req.session.userInfo || req.session.userInfo.userId < 0) {
    htmlFile = 'login.html';
  }
  
  res.sendFile(path.join(__dirname, 'private', htmlFile))
})

app.post('/login', function (req, res) {
  var userName = req.body.userName;
  var userPassword = req.body.userPassword;

  var result = {success: false, details: 'login failed'};  
  if (userPassword == 'okay') {
    result.success = true;
    result.details = 'login succeeded';
    req.session.userInfo.userId = 1;
  }

  console.log('login attempt: ' + userName + ' ' + userPassword + ' - ' + (result.success ? 'succeeded' : 'failed'));

  res.send(result);
})

app.listen(port, () => console.log('app listening on port ' + port));
