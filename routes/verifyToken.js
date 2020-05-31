const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware function for authenticating JWT
module.exports = function (req, res, next) {

    console.log('verifying token');

    const token = req.cookies.auth_token;
    console.log(req.cookies.auth_token);

    if(!token) {
        console.log('token not found!');
        return res.json({tokenFound: false, err: 'Token not found!'});
    }
    
    try {
        const verified = jwt.verify(req.cookies.auth_token, process.env.TOKEN_SECRET);
        console.log('verified value: ', verified);

        User.findOne({_id: verified._id})
        .then( res => {
            console.log('res: ', res);
            return res;
        })
        .then( userData => {
            const tokenFound = userData.issuedTokens.find( item => {
                return item === req.cookies.auth_token;
            });

            if(tokenFound)
            {
                console.log('token found in cloud: ', tokenFound);
                next();
            }
            else {
                res.json({err: 'Invalid token please login again!'});
            }
        })
        .catch( err => {
            console.log('err: ', err);
        });

    } catch (error) {
        res.status(400).send({tokenFound: true, err: error});
    }
}