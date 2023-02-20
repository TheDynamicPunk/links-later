const router = require('express').Router();
const jwt = require('jsonwebtoken');
const BlacklistAuthToken = require('../models/BlacklistAuthToken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const hasToken = require('./verifyToken');

router.get('/', hasToken, async (req, res) => {
    console.log('in signout route');
    
    console.log(req.cookies);

    let {auth_token: authToken, refresh_token: refreshToken }= req.cookies;

    console.log('hello');
    
    await RefreshToken.deleteMany({token: req.cookies.refresh_token});
    
    console.log('check if auth token present or not');
    if (authToken != null || authToken != '') {

        let blackListAuthToken = new BlacklistAuthToken ({
            blacklistedAuthToken: authToken,
            user: req.userId,
            creationDate: new Date(Date.now())
        });

        await blackListAuthToken.save();

        console.log('Removed existing token from user.issuedTokens and added to BlackListAuthToken...');
    }

    res.clearCookie('auth_token').redirect('/');
});

module.exports = router;