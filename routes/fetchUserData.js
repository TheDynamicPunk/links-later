const router = require('express').Router();
const jwt = require('jsonwebtoken');
const hasToken = require('./verifyToken');
const User = require('../models/User');

router.get('/', hasToken, async (req, res) => {

    console.log('fetching user data now!');

    console.log(req.userId);

    const { username, storedLinks } = await User.findOne({_id: req.userId});

    res.status(200).json({
        username: username,
        links: storedLinks
    });
});

module.exports = router;