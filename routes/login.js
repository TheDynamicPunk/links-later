const router = require('express').Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/', [
    check('userEmail').isEmail().trim().escape().normalizeEmail(),
    check('userPassword').trim().escape()
], async (req, res) => {
    console.log('inside login post');
    // console.log('req: ', req.body);

    const validationErrors = validationResult(req);
    console.log('Validation Errors: ', validationErrors.errors);

    if(validationErrors.errors.length != 0)
    {
        return res.status(400).jsonp(validationErrors.errors);
    }

    // Find if user exists in DB
    console.log('Fetching data from cloud!');
    const userAccount = await User.findOne({email: req.body.userEmail});
    console.log('Fetched from cloud!');
    
    if(userAccount)
    {
        const pwdStatus = await bcrypt.compare(req.body.userPassword, userAccount.password);
        
        if(pwdStatus === true)
        {
            const token = jwt.sign({_id: userAccount._id}, process.env.TOKEN_SECRET, {expiresIn: '1d'});

            await User.updateOne({_id: userAccount._id}, {$push: {issuedTokens: {$each: [token]}}});
            res.cookie('auth_token', token, {
                expires: new Date(Date.now() + (1 * 86400000)),
                httpOnly: true,
                sameSite: true,

                //Disable secure for localhost and enable for production!
                secure: true
            }).status(200).redirect('/');
            console.log('Login success!');
        }
        else {
            res.status(400).send('This email and password combination doesn\'t exist!');
        }
    } 
    else {
        res.status(400).send('Account not found!');
    }
});

module.exports = router;