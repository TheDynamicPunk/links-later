const express = require('express');
const app = express();
require('dotenv').config();
const { check, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
const previewLinks = require('./scrape');
const handleForm = require('./handleForm');
const environment = process.env.NODE_ENV;
const isDevelopment = environment === 'development'

console.log("environment:", environment);

//Route handlers
const signupRoute = require('./routes/signup');
const verifyAccount = require('./routes/verifyEmailToken');
const loginRoute = require('./routes/login');
const fetchUserData = require('./routes/fetchUserData');
const refreshPrice = require('./routes/priceRefresh');
const updateUser = require('./routes/updateUserLinks');
const signOutRoute = require('./routes/signout');
const refreshToken = require('./models/RefreshToken');

//Connect to DB
mongoose.connect( process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }, () => {
      console.log("Connected to DB!");
    }
);

// Redirect all requests from http to https
if (!isDevelopment) {
    app.use( function requireHTTPS(req, res, next) {
        // The 'x-forwarded-proto' check is for Heroku
        if (!req.secure && req.get('x-forwarded-proto') !== 'https')
        {
            return res.redirect('https://' + req.get('host') + req.url);
        }
        next();
    });
}

// Middlewares
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies.breakingChanges;
    console.log(cookie);    

    if (cookie === undefined || cookie === 'false')
    {
        // no: set a new cookie
        res.cookie('breakingChanges', process.env.BREAKING_CHANGES, { maxAge: 86400000});
        console.log('Created cookie!');
    }
    else
    {
        // yes, cookie was already present 
        console.log('Cookie exists!', cookie);
    } 
  next();
});

app.use('/sign-out', signOutRoute);
app.use('/signup', signupRoute);
app.use('/login', loginRoute);
app.use('/refresh-token', refreshToken);
app.use('/get-data', fetchUserData);
app.use('/update-user', updateUser);
app.use('/api', refreshPrice);
app.use('/api', verifyAccount);

app.get('/', (req, res) => {
    res.sendFile('public/linkslater.html', {root: __dirname});
});

app.post('/scrapeLinks', async (req, res) => {
    console.log('Scraping Links...');
    const result = await previewLinks(req.body.links);
    res.send(result);
});

app.post('/submit-form', [
    check('userEmail').isEmail().withMessage('Please enter a valid e-mail id!'),
    check('issueTitle').isAscii().withMessage('Please enter valid characters in issue title!'),
    check('issue').isAscii().withMessage('Please enter valid characters in issue description!'),
    check('buggyLink').optional({checkFalsy: true}).isURL().withMessage('Please enter a valid URL!')

], (req, res) => {

    console.log('User email: ', req.body.userEmail);
    console.log('Issue Title: ', req.body.issueTitle);
    console.log('Issue: ', req.body.issue);
    console.log('Buggy Link: ', req.body.buggyLink);

    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        console.log('errors: ', errors.array());
        return res.status(422).jsonp(errors.array());
    }
    else {
        handleForm(req.body);
        return res.status(200).jsonp(errors.array());
    }
});

app.get('/confirm-email', (req, res) => {
    res.sendFile('./public/confirmEmail.html', { root: __dirname});
})
app.get('/confirm-email/:token', (req, res) => {
    console.log('sending confirm email page');
    res.sendFile('./public/confirmEmail.html', { root: __dirname});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});