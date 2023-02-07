const router = require('express').Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

router.post('/', [

    // Validation for username
    check('username')
    .isLength({min: 6, max: 25})
    .withMessage('Username should be 6-25 characters long!')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username should be alphanumeric, but underscores (_) are allowed')
    .trim()
    .escape(),

    // Validation for user's email address
    check('userEmail')
    .isLength({max: 50})
    .isEmail()
    .withMessage('The given email id is not valid')
    .normalizeEmail()
    .trim()
    .escape(),

    // Validation for user's password
    check('userPassword')
    .isLength({min: 6, max: 20})
    .withMessage('Password should be 6-20 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*#?&].{6,19}$/)
    .withMessage('Password should contain 1 uppercase, 1 lowercase and a number!')
    .trim()
    .escape(),

], async (req, res) => {
    // console.log(req.body);

    const validationErrors = validationResult(req);
    console.log('Validation Errors: ', validationErrors.errors);

    if(validationErrors.errors.length != 0)
    {
        return res.status(400).jsonp(validationErrors.errors);
    }

    //Check if username already exists
    const usernameExists = await User.findOne({username: req.body.username});
    
    if(usernameExists)
        return res.status(400).json([{usernameExists: true}]);

    //Check if user email already exists in the DB
    const emailExists = await User.findOne({email: req.body.userEmail});

    if(emailExists)
    {
        return res.status(400).json([{emailExists: true}]);
    }

    // Hash the password for storing in DB
    const salt_val = parseInt(process.env.SALT_VALUE);
    const salt = await bcrypt.genSalt(salt_val);
    const hashedPassword = await bcrypt.hash(req.body.userPassword, salt);

    //create a new user and save it in the DB
    const user = new User({
        username: req.body.username,
        email: req.body.userEmail,
        password: hashedPassword
    });

    const userAccount = await user.save();

    console.log('Fetching data from DB');
    // const userAccount = await User.findOne({email: req.body.userEmail});
    // const token = jwt.sign({_id: userAccount._id}, process.env.TOKEN_SECRET, {expiresIn: '1d'});
    const emailToken = jwt.sign({_id: userAccount._id}, process.env.EMAIL_SECRET, {expiresIn: '6h'});
    // await User.updateOne({_id: userAccount._id}, {$push: {issuedTokens: {$each: [token]}}});

    console.log('host: ', req.get('host'));
    console.log('origin: ', req.get('origin'));
    
    // const verificationUrl = `${req.get('origin')}/confirm-email/${emailToken}`;
    const verificationUrl = `https://linkslater.onrender.com/confirm-email/${emailToken}`;

    // create reusable transporter object using the default SMTP transport
  	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		requireTLS: true,
    	service: "gmail",
    	auth: {
      		user: process.env.AUTH_EMAIL,                   //Official Links Later account username
      		pass: process.env.AUTH_EMAIL_PASSWORD,          //Official Links Later account password
		}
    });

  	// send mail with defined transport object
	let info = transporter.sendMail({
    	from: '"Login Assistant 👻"' + process.env.AUTH_EMAIL,          // sender address
    	to: req.body.userEmail,                                         // list of receivers
		subject: "Links Later Account Verification",                    // Subject line
        html: `<b>Click <a target="blank" href="${verificationUrl}">here</a> to validate your account!</b>
               <br>
               <p>or Copy and paste this link in the browser
               <br>
               <b>${verificationUrl}</b>
               </p>
               <p>This link will automatically expire in 6 hours.`,     // html body
  	});

    console.log("Message sent: %s", info.messageId);

    res.send('Account successfully created!');
    // console.log('sending auth token!');
    // res.cookie('auth_token', token, {
    //     expires: new Date(Date.now() + (1 * 86400000)),
    //     httpOnly: true,
    //     sameSite: true,
        
    //     //Disable secure for localhost and enable for production!
    //     // secure: true
    // }).status(200).redirect('/');
});

module.exports = router;