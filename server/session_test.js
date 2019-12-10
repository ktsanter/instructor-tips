var express = require('express')
var parseurl = require('parseurl')
var session = require('express-session')
var mysql = require('mysql')
var MySQLStore = require('express-mysql-session')(session);

var app = express()
const port = 3000;

var mysqlPool = mysql.createPool({
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
  cookie: {maxAge: 30000}, // 30 seconds for testing
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}))

app.use(function (req, res, next) {
  if (!req.session.views) {
    req.session.views = {}
  }

  // get the url pathname
  var pathname = parseurl(req).pathname

  // count the views
  req.session.views[pathname] = (req.session.views[pathname] || 0) + 1
  
  console.log(req.session);

  next()
})

app.get('/foo', function (req, res, next) {
  res.send('you viewed this page ' + req.session.views['/foo'] + ' times' + '<br>expires: ' + req.session.cookie._expires)
})

app.get('/bar', function (req, res, next) {
  res.send('you viewed this page ' + req.session.views['/bar'] + ' times' + '<br>expires: ' + req.session.cookie._expires)
})

app.listen(port, () => console.log('app listening on port ' + port));
