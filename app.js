require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const colors = require('colors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('express-flash');

//mongoose connection
mongoose.connect(process.env.URI, {useNewUrlParser: true},function(err){
    if(err){
        console.log("❗ | "+err.red);
    }else{
        console.log("⚙ | Connected to Database Succesfully.".green);
    }
});

const userSchema = new mongoose.Schema({ 
    username: String,
    email: String,
    password: String
})
const dataSchema = new mongoose.Schema({
    username: String,
    service: String,
    password: String,
    belongsTo: String
})

const User = mongoose.model('User', userSchema);
const Data = mongoose.model('Data', dataSchema);

//intialize express
const app = express();
//intialize body-parser
app.use(bodyParser.urlencoded({extended: true}));
//set view engine
app.set('view engine', 'ejs');
//set public folder
app.use(express.static('public'));
//session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
//app use passport
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function(user, done) {
    done(null, user.id);
})
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

//startegy
//login strategy
passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
      },function (email, password, done) {
      User.findOne({ email: email }, function (err, user) {
          if (err) return done(err);
          if (!user) return done(null, console.log('dog'), false, { message: 'Incorrect Email!' });
          bcrypt.compare(password, user.password, function (err, res) {
              if (err) return done(err);
              if (res === false) return done(null, false, { message: 'Incorrect Password!' });
              
              return done(null, user);
          });
      });
  })); 
  //signup startegy passport js
    passport.use(
        'local-signup',
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true
            },
            function(req, email, password, done) {
                process.nextTick(function() {
                    User.findOne({ email: email },async function(err, user) {
                        if (err) return done(err);
                        if (user) return done(null, false, {message: 'Email Already In Use!'});
                        const newUser = new User();
                        newUser.email = email;
                        const hashedPassword = await bcrypt.hash(req.body.password, 10);
                        newUser.username = req.body.username;
                        newUser.password = hashedPassword;
                        newUser.save(function(err) {
                            if (err) throw err;
                            console.log(newUser);
                            console.log('User Created Successfully!'.green);
                            return done(null, newUser);
                        });
                    });
                });
            }
        )
    );


    function isLoggedin(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        res.redirect('/signup');
    }
    function isLoggedOut(req, res, next) {
        if(!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    }
//APP PORT
const port = process.env.PORT || 3000;


app.get('/', function(res,res){
    res.render('index');
})
app.get('/signup', isLoggedOut,function(req,res){
    res.render('signup');
})
app.get('/login', isLoggedOut,function(req,res){
    res.render('login');
})
app.get('/save', isLoggedin,function(res,res){
    res.render('addpass');
})
app.get('/logout', isLoggedin, function(req, res){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});
app.get('/library',isLoggedin, function(req,res){
    //loop through each piece of data and display it through ejs
    Data.find({belongsTo: req.user.email}, function(err, data){
        if(err){
            console.log(err);
        }else{
            res.render('library', {data: data});
        }
    })
})



app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
}));
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));
app.post('/save',function(req,res){
    //save data in database
    const newData = new Data();
    newData.username = req.body.username;
    newData.service = req.body.service;
    newData.password = req.body.password;
    newData.belongsTo = req.user.email;

    newData.save(function(err){
        if(err){
            console.log(err);
        }else{
            console.log("Data Saved Successfully!".green);
        }
    })
    res.redirect('/save');
})


app.listen(port, function(){
    console.log("🚀 | Server Started at port "+port.toString().green);
})