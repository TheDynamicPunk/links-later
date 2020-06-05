const request = require('request-promise');
const cheerio = require('cheerio');

async function getPrice(links) {
    if(links)
    {
        let linkData = [];
        let linksArray = links.split(',');

        // console.log(linksArray);

        for (item of linksArray) {
            try {
                const response = await request({
                    uri: item,
                    headers: {
                        "Accept-Language": "en-US,en;q=0.5",
                        // "Accept-Encoding": "gzip, deflate, br",
                    },
                });

                let $ = cheerio.load(response);
                
                let itemPrice = $('._1vC4OE').text().replace(/\D/g , '');
                // console.log(itemPrice);
                let itemMRP = $('._3auQ3N').text().replace(/\D/g, '');
                // console.log(itemMRP);
                let itemName = $('._35KyD6').text();
                // console.log(itemName);

                let data = {
                    itemName: itemName || 'Product Name',
                    mrp: itemMRP || 'NA',
                    price: itemPrice || 'NA',
                    url: item,
                    timestamp: Date.now()
                }

                linkData.push(data);
            } catch (err) {
                console.log('Error while scraping: ', err);
                return err;
            }
        }
        console.log('new prices fetched!');
        return linkData;
    }
}

module.exports = getPrice;