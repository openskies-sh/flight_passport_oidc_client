var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var dotenv = require('dotenv');
var passport = require('passport');
var OpenIDStrategy = require('passport-openid');
var flash = require('connect-flash');
var userInViews = require('./lib/middleware/userInViews');
var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

dotenv.config();

let strategy = new OpenIDStrategy({
  returnURL: process.env.CALLBACK_URL,
  realm:process.env.OAUTH_DOMAIN,
  passReqToCallback: true,
},
  function (accessToken, refreshToken, params,userProfile, cb) {
    return cb(null, userProfile);
  }
);

strategy.userProfile = function (accesstoken, done) {
  // choose your own adventure, or use the Strategy's oauth client
  const headers = {
    'User-Agent': 'request',
    'Authorization': 'Bearer ' + accesstoken,
  };
  this._oauth2._request("GET", process.env.USER_INFO_URL, headers, null, null, (err, data) => {
    if (err) { return done(err); }
    try {
      data = JSON.parse(data);
    }
    catch (e) {
      return done(e);
    }
    done(null, data);
  });
};


passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cookieParser());

// config express-session
var sess = {
  secret: 'CHANGE THIS SECRET',
  cookie: {},
  resave: false,
  saveUninitialized: true
};

if (app.get('env') === 'production') {
  // If you are using a hosting provider which uses a proxy (eg. Heroku),
  // comment in the following app.set configuration command
  //
  // Trust first proxy, to prevent "Unable to verify authorization request state."
  // errors with passport-auth0.
  // Ref: https://github.com/auth0/passport-auth0/issues/70#issuecomment-480771614
  // Ref: https://www.npmjs.com/package/express-session#cookiesecure
  // app.set('trust proxy', 1);

  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());

// Handle auth failure error messages
app.use(function (req, res, next) {
  if (req && req.query && req.query.error) {
    req.flash('error', req.query.error);
  }
  if (req && req.query && req.query.error_description) {
    req.flash('error_description', req.query.error_description);
  }
  next();
});

app.use(userInViews());
app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/', usersRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Production error handler
// No stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
