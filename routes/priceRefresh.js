const router = require('express').Router();
const getPrice = require('../scrapeProduct');

router.post('/refresh-price', async (req, res) => {
    console.log('getting new prices!');

    const response = await getPrice(req.body.links);

    console.log(response);

    if(response.length !== 0)
        res.json(response);
    else
        req.json({error: 'Some error occured while fetching'});
});

module.exports = router;