const puppeteer = require('puppeteer');

async function scrapeProduct(links) {

    console.log('In getPrice v2');

    let linksArray = links.split(',');

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        for (let item of linksArray) {

            if (item.includes('www.flipkart.com')) {
                await page.goto(item);
                
                let data = await page.evaluate(() => {

                    let price, mrp, itemName, productImageUrl;
            
                    document.querySelector('._3qQ9m1') ? price = document.querySelector('._3qQ9m1').textContent.replace(/\D/g , '') : '';
                    document.querySelector('._1POkHg') ? mrp = document.querySelector('._1POkHg').textContent.replace(/\D/g , '') : '';
                    document.querySelector('._35KyD6') ? itemName = document.querySelector('._35KyD6').textContent : '';

                    let imgs = document.querySelectorAll('img');
                    let imgSources = [];
                    imgs.forEach( item => {
                        imgSources.push(item.getAttribute('src'));
                    });

                    return {
                        isProduct: true,
                        site: 'flipkart',
                        itemName: itemName || '',
                        mrp: mrp || '',
                        price: price || '',
                        productImageUrl: imgSources[2] || './assets/image_not_found.svg',
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