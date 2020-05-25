const express = require('express');
const app = express();
const { check, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
const previewLinks = require('./scrape');
const handleForm = require('./handleForm');

//Redirect all requests from http to https
// app.use( function requireHTTPS(req, res, next) {
//     // The 'x-forwarded-proto' check is for Heroku
//     if (!req.secure && req.get('x-forwarded-proto') !== 'https')
//     {
//         return res.redirect('https://' + req.get('host') + req.url);
//     }
//     next();
// });

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

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})