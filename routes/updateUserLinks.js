const router = require('express').Router();
const jwt = require('jsonwebtoken');
const hasToken = require('./verifyToken');
const User = require('../models/User');
const _ = require('lodash');

router.post('/', hasToken, async (req, res) => {

    const { _id } = jwt.decode(req.cookies.auth_token);
    // console.log('req.user', req.user);
    const userAccount = await User.findOne({_id: _id});
    await User.updateOne({_id: _id}, { lastUpdated: Date.now()});

    if(req.body.options === 'add')
    {
        const result = _.differenceBy(req.body.links, userAccount.storedLinks, 'url');

        User.updateOne({_id: _id }, { $push: { storedLinks: { $each: result}}})
            .then( () => {
                console.log('DB updated!');
                res.send('Success! Synced with DB!');
            })
            .catch(err => {
                console.log(err);
            });
    }
    else if (req.body.options === 'delete')
    {
        User.updateOne({ _id: _id}, { $pull: { storedLinks: { url: req.body.links}}})
            .then( () => {
                console.log('DB updated!');
                res.send('Success! Synced with DB!');
            })
            .catch( err => {
                res.send('Error updating to cloud! Please try again!', err);
            })
    }
});

module.exports = router;