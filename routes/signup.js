const router = require('express').Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    console.log(req.body);

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

    await user.save();

    console.log('Fetching data from DB');
    const userAccount = await User.findOne({email: req.body.userEmail});
    const token = jwt.sign({_id: userAccount._id}, process.env.TOKEN_SECRET, {expiresIn: '1d'});
    await User.updateOne({_id: userAccount._id}, {$push: {issuedTokens: {$each: [token]}}});

    res.cookie('auth_token', token, {
        expires: new Date(Date.now() + (1 * 86400000)),
        httpOnly: true,
        sameSite: true,
        
        //Disable secure for localhost and enable for production!
        secure: true
    }).status(200).redirect('/');
});

module.exports = router;