const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.get('/verify-account/:token', async (req, res) => {
    console.log('inside confirm email route!');
    console.log('received token: ', req.params.token);

    try {
        console.log('hello here!');
        let { _id: userId } = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
        console.log({userId});

        await User.updateOne({_id: userId}, {isVerified: true});

        res.status(200).send({msg: 'Email successfully verified!'});
    
    } catch (error) {
        console.log({error});
        res.status(400).send({tokenFound: true, err: error});
    }
});

module.exports = router;