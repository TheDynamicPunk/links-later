const router = require('express').Router();
const { check, validationResult } = require('express-validator');

router.post('/', [
    check('username')
    .isLength({min: 6, max: 25})
    .withMessage('Username should be 6-25 characters long!')
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username should be alphanumeric, but underscores (_) are allowed'),

    check('userEmail')
    .isLength({max: 50})
    .trim()
    .isEmail()
    .withMessage('The given email id is not valid')
    .normalizeEmail(),

    check('userPassword')
    .isLength({min: 6, max: 20})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*#?&].{6,19}$/)
    .withMessage('Password should be 6-20 characters long')

], (req,res) => {
    console.log(req.body);

    const errors = validationResult(req);
    console.log(errors.array());

    // console.log('after');
    // console.log('username:', req.body.username);
    console.log('email:', req.body.userEmail);
    // console.log('password:', req.body.userPassword);
});

module.exports = router;