const router = require('express').Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

router.post('/', [
    check('username').optional().trim().escape().matches(/^[a-zA-Z0-9_]+$/),
    check('userEmail').optional().isEmail().trim().escape().normalizeEmail(),
    check('userPassword').trim().escape()
], async (req, res) => {
    console.log('inside login post');

    const validationErrors = validationResult(req);
    console.log('Validation Errors: ', validationErrors.errors);

    if(validationErrors.errors.length != 0)
    {
        return res.status(400).jsonp(validationErrors.errors);
    }

    // Find if user exists in DB
    console.log('Fetching data from cloud!');

    let userAccount = '';

    if(req.body.userEmail !== undefined) {
        console.log('got useremail');
        userAccount = await User.findOne({email: req.body.userEmail});
    } else if(req.body.username !== undefined) {
        console.log('got username');
        userAccount = await User.findOne({username: req.body.username});
    } else {
        console.log('got nothing :(');
        return res.status(400).json({err: 'Account not found!'});
    }

    console.log('Fetched from cloud!');
    
    if(userAccount)
    {
        const pwdStatus = await bcrypt.compare(req.body.userPassword, userAccount.password);
        
        if(pwdStatus === true)
        {
            if(userAccount.isVerified)
            {
                const token = jwt.sign({_id: userAccount._id}, process.env.TOKEN_SECRET, {expiresIn: '7d'});

                await User.updateOne({_id: userAccount._id}, {$push: {issuedTokens: {$each: [token]}}});
                res.cookie('auth_token', token, {
                    expires: new Date(Date.now() + (7 * 86400000)),
                    httpOnly: true,
                    sameSite: true,

                    //Disable secure for localhost and enable for production!
                    secure: true
                }).status(200).redirect('/');
                console.log('Login success!');
            }
            else {
                console.log('User e-mail not verified!');

                const emailToken = jwt.sign({_id: userAccount._id}, process.env.EMAIL_SECRET, {expiresIn: '6h'});

                // const verificationUrl = `${req.get('origin')}/confirm-email/${emailToken}`;
                const verificationUrl = `https://linkslater.herokuapp.com/confirm-email/${emailToken}`;

                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    service: "gmail",
                    auth: {
                        user: process.env.AUTH_EMAIL,               //Official Links Later account username
                        pass: process.env.AUTH_EMAIL_PASSWORD,      //Official Links Later account password
                    }
                });

                // send mail with defined transport object
                let info = await transporter.sendMail({
                    from: '"Login Assistant 👻"' + process.env.AUTH_EMAIL, // sender address
                    to: userAccount.email, // list of receivers
                    subject: "Links Later Account Verification", // Subject line
                    html: `<b>Click <a target="blank" href="${verificationUrl}">here</a> to validate your account!</b>
                           <br>
                           <p>or Copy and paste this link in the browser
                           <br>
                           <b>${verificationUrl}</b>
                           </p>
                           <br>
                           <br>
                           <p>This link will automatically expire in 6 hours.`, // html body
                });

                console.log("Message sent: %s", info.messageId);

                res.status(404).json({err: 'Your account is not verified. We\'ve mailed the link to your E-mail id to verify your account.'});
            }
        }
        else {
            res.status(400).json({err: 'The given username/email and password combination doesn\'t exist!'});
        }
    } 
    else {
        res.status(400).json({err: 'Account not found!'});
    }
});

module.exports = router;