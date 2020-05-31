const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const hasToken = require('./verifyToken');

router.get('/', hasToken, (req, res) => {
    console.log('in signout route');
    console.log(req.cookies.auth_token);

    const { _id } = jwt.decode(req.cookies.auth_token);
    console.log('id: ', _id);

    let currentToken = req.cookies.auth_token;
    User.updateOne({_id: _id}, { $pull: { issuedTokens: { $in: [ currentToken ] }}})
    .then( res => {
        console.log('signout cloud res: ', res);
    })
    .catch( err => {
        console.log("err: ", err);
    });

    console.log('Pulled token from cloud!');
    res.clearCookie('auth_token').redirect('/');
});

module.exports = router;