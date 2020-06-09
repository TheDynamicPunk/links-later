const puppeteer = require('puppeteer');

async function scrapeProduct(links) {

    console.log('In getPrice v2');

    let linksArray = links.split(',');

    try {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();

        for (let item of linksArray) {

            if (item.includes('flipkart.com')) {
                await page.goto(item);
                
                let data = await page.evaluate(() => {

                    let price, mrp, itemName;
            
                    document.querySelector('._3qQ9m1') ? price = document.querySelector('._3qQ9m1').textContent.replace(/\D/g , '') : '';
                    document.querySelector('._1POkHg') ? mrp = document.querySelector('._1POkHg').textContent.replace(/\D/g , '') : '';
                    document.querySelector('._35KyD6') ? itemName = document.querySelector('._35KyD6').textContent : '';

                    let imgSrc = (document.querySelectorAll('img')).item(2).getAttribute('src');

                    return {
                        isProduct: true,
                        site: 'flipkart',
                        itemName: itemName || '',
                        mrp: mrp || '',
                        price: price || '',
                        productImageUrl: imgSrc || './assets/image_not_found.svg',
                        timestamp: Date.now()
                    }
                });
                
                data.url = item;
                console.log(data);
                return data;
            }

            else if (item.includes('amazon.'))
            {
                await page.goto(item);

                let data = await page.evaluate(() => {

                    price = document.querySelector('#priceblock_ourprice').textContent.replace(/\D/g , '').slice(0, -2);
                    mrp = document.querySelector('.priceBlockStrikePriceString').textContent.replace(/\D/g , '').slice(0, -2);
                    itemName = document.querySelector('#productTitle').textContent.trim();
                    imgSrc = document.querySelector('#landingImage').getAttribute('src');

                    return {
                        isProduct: true,
                        site: 'amazon',
                        itemName: itemName || '',
                        mrp: mrp || '',
                        price: price || '',
                        productImageUrl: imgSrc || './assets/image_not_found.svg',
                        timestamp: Date.now()
                    }
                });

                data.url = item;
                console.log(data);
                return data;
            }
        }
    } catch (err) {
        console.log('Error occurred while fetching product details: ', err);
    }
}

module.exports = scrapeProduct;