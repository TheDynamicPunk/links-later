require('dotenv').config();
const jwt = require('jsonwebtoken');
const BlacklistAuthToken = require('../models/BlacklistAuthToken');
const RefreshToken = require('../models/RefreshToken');

const environment = process.env.NODE_ENV;
const isDevelopment = environment === 'development'

// Middleware function for authenticating JWT
module.exports = async function (req, res, next) {

    console.log('verifying token');

    const {auth_token: authToken, refresh_token: refreshToken} = req.cookies;

    console.log('authToken: ', authToken);
    console.log('refreshToken: ', refreshToken);
    
    // If refresh token isn't presented, redirect to login page
    if(!refreshToken) {
        console.log('No auth_token/refresh_token in request!');
        return res.status(403).json({
            redirect: '/loginForm.html',
            message: "No auth/refresh_token found in request cookies. Please login again!",
        });
    } 
    // If refresh token is presented
    else {

        let refreshTokenObject = await RefreshToken.findOne({token: refreshToken})

        console.log({refreshToken: refreshTokenObject})

        // If refresh token isn't found in DB, let the user know
        if(!refreshTokenObject) {
            res.status(403).json({message: 'Invalid refresh token!'});
            return;
        }

        // If refresh token has expired, redirect to login page
        if(RefreshToken.verifyExpiration(refreshTokenObject)) {
            RefreshToken.findByIdAndRemove(refreshTokenObject._id, { useFindAndModify: false }).exec();

            res.status(403).json({
                redirect: '/loginForm.html',
                message: "Refresh token expired. Please login again!",
            });

            return;
        }

        console.log('here@', authToken)
        // If refresh token hasn't expired and is valid then check if auth token is valid or not
        if(authToken) {
            try {
                let decodedToken = jwt.verify(authToken, process.env.TOKEN_SECRET);

                let blacklistedTokens = await BlacklistAuthToken.find({blacklistedAuthToken: authToken});
                
                if (blacklistedTokens.length > 0) {
                    
                    res.status(403).json({
                        redirect: '/loginForm.html',
                        message: "Unauthorized! Please login again!",
                    });
                    
                    return;
                }
                
                console.log({decodedToken});
                req.userId = decodedToken._id;
                console.log("auth_token verified. Moving on...");
                next();
            } catch (TokenExpiredError) {
                console.log('Token has expired. Checking if new token can be generated from supplied refresh_token...');
                await generateNewAuthFromRefreshToken(req, res, refreshTokenObject);
                next();
            }
        }

        // Else auth token has expired but refresh token is still valid so generate a new auth token and extend expiry on refresh token
        else {
            await generateNewAuthFromRefreshToken(req, res, refreshTokenObject);
            next();
        }
    }
}

const generateNewAuthFromRefreshToken = async (req, res, refreshTokenObject) => {

    console.log(refreshTokenObject);
    let newAuthToken = jwt.sign({_id: refreshTokenObject.user}, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_TTL + 'ms'});
    RefreshToken.extendExpiry(refreshTokenObject);

    await RefreshToken.updateOne({_id: refreshTokenObject._id}, {$set: {expireTimestamp: refreshTokenObject.expireTimestamp + parseInt(process.env.REFRESH_TOKEN_TTL)}});

    req.userId =  refreshTokenObject.user;

    console.log('setting new cookies!');
    console.log({newAuthToken})

    res.cookie('auth_token', newAuthToken, {
        maxAge: parseInt(process.env.TOKEN_TTL),
        httpOnly: true,
        sameSite: true,

        //Disable secure for localhost and enable for production!
        secure: isDevelopment ? false : true
    })
    .cookie('refresh_token', refreshTokenObject.token, {
        // maxAge: parseInt(process.env.REFRESH_TOKEN_TTL),
        httpOnly: true,
        sameSite: true,

        //Disable secure for localhost and enable for production!
        secure: isDevelopment ? false : true
    })
}