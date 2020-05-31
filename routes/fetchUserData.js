const router = require('express').Router();
const jwt = require('jsonwebtoken');
const hasToken = require('./verifyToken');
const User = require('../models/User');

router.get('/', hasToken, async (req, res) => {

    console.log('fetching user data now!');

    const { _id:userID } = jwt.decode(req.cookies.auth_token);
    // console.log('userid: ', userID);
    const { username, storedLinks } = await User.findOne({_id: userID});

    console.log(username);

    res.status(200).json({
        username: username,
        links: storedLinks
    });
});

module.exports = router;