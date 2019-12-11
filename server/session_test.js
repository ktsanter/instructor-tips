var express = require('express')
const path = require('path')
var bodyParser = require('body-parser');
var session = require('express-session')
var mySQL = require('mysql')
var MySQLStore = require('express-mysql-session')(session);

var app = express()
const port = 3000;

//------ req body parsers -------------
  app.use(bodyParser.json()); 
  app.use(bodyParser.urlencoded({ extended: true })); // for form data

//------- session management ------------------
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

  //-- initialize userInfo, set ID to "not logged-in" sentinel value
  app.use(function (req, res, next) {
    if (!req.session.userInfo) {
      req.session.userInfo = {userId: -1}
    }

    next()
  })
// end of session management ************

//-------- login management ---------------------
  app.get('/mainpage.html', function (req, res) {
    var success = (req.session.userInfo && req.session.userInfo.userId >= 0);

    if (success) {
      res.sendFile(path.join(__dirname, 'private', 'mainpage.html'))
    } else {
      res.redirect('/login.html');
    }
  })

  app.get('/login.html', function (req, res) {
    res.sendFile(path.join(__dirname, 'private', 'login.html'))
  })

  app.post('/login_attempt', function (req, res) {
    var userName = req.body.userName;
    var userPassword = req.body.userPassword;
    var success = (userPassword == 'okay');
   
    if (success) {
      req.session.userInfo.userId = 1;
      res.redirect('/mainpage.html');
    } else {
      res.redirect('/login.html?retry=true');
    }
  })
//----------- end of login management -----------------

app.listen(port, () => console.log('app listening on port ' + port));
