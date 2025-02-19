var createError = require('http-errors');
var express = require('express');
var path = require('path');

const expressSession = require('express-session');
const { auth } = require('express-openid-connect');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
require('dotenv').config();

var app = express();

const ClientId = process.env.CLIENT_ID;
const ClientSecret = process.env.CLIENT_SECRET;
const OIDC_DOMAIN = process.env.OIDC_DOMAIN;

app.use(auth({
  authRequired: false,
  clientSecret: ClientSecret,
  issuerBaseURL: `${OIDC_DOMAIN}`,
  clientID: ClientId,
  baseURL: process.env.BASE_URL,

  authorizationParams: {
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'openid profile',
  },
  routes: {
    login: false,
  },
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(
  expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  })
);


app.get('/auth', (req, res) =>
  res.oidc.login({
    returnTo: '/users'
  })
);


app.use('/users', usersRouter);


// start logout request
app.get('/logout', (req, res) => {
  res.redirect(req.oidc.endSessionUrl());
});

// logout callback
app.get('/logout/callback', (req, res) => {
  // clears the persisted user from the local storage
  req.logout();
  // redirects the user to a public route
  res.redirect('/');
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
