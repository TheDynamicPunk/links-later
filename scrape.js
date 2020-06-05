const request = require('request-promise');
const cheerio = require('cheerio');

async function previewLinks(links) {

    if(links)
    {
        let linkData = [];
        let linksArray = links.split(',');

        for (item of linksArray) {

            if(item.includes('www.flipkart.com'))
            {
                console.log('Flipkart Link: ', item.includes('www.flipkart.com'));

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
                    console.log(itemPrice);
                    let itemMRP = $('._3auQ3N').text().replace(/\D/g, '');
                    console.log(itemMRP);
                    let itemName = $('._35KyD6').text();
                    console.log(itemName);
                    let itemPictureUrl = $('._1k8TbK').attr('src');
                    console.log(itemPictureUrl);

                    let data = {
                        isProduct: true,
                        site: 'flipkart',
                        itemName: itemName || 'Product Name',
                        mrp: itemMRP || 'NA',
                        price: itemPrice || 'NA',
                        url: item,
                        pagethumbnailUrl: itemPictureUrl || './assets/image_not_found.svg',
                        timestamp: Date.now()
                    }
    
                    linkData.push(data);
                } catch (err) {
                    console.log('Error while scraping: ', err);
                }
            }

            else {
                try {
                    const response = await request({
                        uri: item,
                        headers: {
                            "Accept-Language": "en-US,en;q=0.5",
                        },
                    });
    
                    let $ = cheerio.load(response);
                    let pageTitle = $('meta[property="og:title"]').attr('content');
                    console.log(pageTitle);
                    let pageDescription = $('meta[property="og:description"]').attr('content');
                    console.log(pageDescription);
                    let url = item;
                    console.log(url);
                    let pageThumbnailUrl = $('meta[property="og:image"]').attr('content');
                    console.log(pageThumbnailUrl);
    
                    let data = {
                        pageTitle: pageTitle || 'Title: NA',
                        pageDescription: pageDescription || 'Link: ' + item,
                        url: item,
                        pagethumbnailUrl: pageThumbnailUrl || './assets/image_not_found.svg',
                        timestamp: Date.now()
                    }
    
                    linkData.push(data);
    
                } catch (error) {
                    console.log(error);
                }
            }
        }
        console.log('Scraping complete!');
        return linkData;
    }
}

module.exports = previewLinks;