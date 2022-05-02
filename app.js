var createError = require('http-errors');
var express = require('express');
var path = require('path');
const crypto = require('crypto');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSesssion = require('express-session');
const passport = require('passport');
const { Issuer, Strategy } = require('openid-client');
function base64URLEncode(str) {
  return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}
var code_verifier = base64URLEncode(crypto.randomBytes(32));
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}
var code_challenge = base64URLEncode(sha256(code_verifier));

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
require('dotenv').config();
var flash = require('connect-flash');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(
  expressSesssion({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  })
);
Issuer.discover(process.env.OIDC_DOMAIN).then(passport_issuer => {
  var client = new passport_issuer.Client({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: [process.env.CALLBACK_URL],
    response_types: ["code"],
  });

  client.authorizationUrl({
    scope: 'openid profile',
    resource: 'https://my.api.example.com/resource/32178',
    code_challenge,
    code_challenge_method: 'S256',
  });

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  passport.use(
    'oidc',
    new Strategy({ client }, (tokenSet, userinfo, done) => {
      return done(null, tokenSet.claims());
    })
  );

  // handles serialization and deserialization of authenticated user
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
  app.get('/auth', function (req, res, next) {
    passport.authenticate('oidc')(req, res, next);
  });

  // authentication callback
  app.get('/auth/callback', (req, res, next) => {
    passport.authenticate('oidc', {
      successRedirect: '/users',
      failureRedirect: '/'
    })(req, res, next);
  });
    // // start authentication request
    // app.get('/auth', function(req, res, next) {
    //   passport.authenticate('oidc', function(err, user, info) {
    //     if (err) {
    //       return next(err); // will generate a 500 error
    //     }
    //     // Generate a JSON response reflecting authentication status
    //     if (! user) {
    //       return res.send({ success : false, message : 'authentication failed' });
    //     }
    //     // ***********************************************************************
    //     // "Note that when using a custom callback, it becomes the application's
    //     // responsibility to establish a session (by calling req.login()) and send
    //     // a response."
    //     // Source: http://passportjs.org/docs
    //     // ***********************************************************************
    //     req.login(user, loginErr => {
    //       if (loginErr) {
    //         return next(loginErr);
    //       }
    //       return res.send({ success : true, message : 'authentication succeeded' });
    //     });      
    //   })(req, res, next);
    // });

    // // authentication callback
    // app.get('/auth/callback', (req, res, next) => {
    //   passport.authenticate('oidc',  function(err, user, info) {
    //     if (err) {
    //       return next(err); // will generate a 500 error
    //     }
    //     // Generate a JSON response reflecting authentication status
    //     if (! user) {
    //       return res.send({ success : false, message : 'authentication failed' });
    //     }
    //     // ***********************************************************************
    //     // "Note that when using a custom callback, it becomes the application's
    //     // responsibility to establish a session (by calling req.login()) and send
    //     // a response."
    //     // Source: http://passportjs.org/docs
    //     // ***********************************************************************
    //     req.login(user, loginErr => {
    //       if (loginErr) {
    //         return next(loginErr);
    //       }
    //       return res.redirect('/users');
    //     });      
    //   })(req, res, next);
    // });

  app.use('/users', usersRouter);

  // start logout request
  app.get('/logout', (req, res) => {
    res.redirect(client.endSessionUrl());
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
});

module.exports = app;
