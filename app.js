require('dotenv').config();

const express = require('express');

const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');

const User = require('./models/user');

// requiring routes
const indexRoute = require('./routes/index');
const movieRoute = require('./routes/movie');
const celebrityRoute = require('./routes/celebrity');

const url = process.env.DATABASEURL || 'mongodb://localhost/moviedazz';
mongoose.connect(url);
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log('Connected to Mongoose'));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

/* PASSPORT CONFIGURATION */
app.use(require('express-session')({
    secret: 'Once again rusty wins cutest dog!',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use('/movie', movieRoute);
app.use('/celebrity', celebrityRoute);
app.use('/', indexRoute);

app.listen(process.env.PORT || 5001, () => {
    console.log('MovieDazZ Has Started');
    console.log(`Server is listening at localhost:${process.env.PORT || 5001}`);
});
