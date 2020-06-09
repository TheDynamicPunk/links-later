const request = require('request-promise');
const cheerio = require('cheerio');
const scrapeProduct = require('./scrapeProduct');

async function previewLinks(links) {

    if(links)
    {
        let linkData = [];
        let linksArray = links.split(',');

        for (item of linksArray) {

            if(item.includes('www.flipkart.com') || item.includes('amazon.'))
            {
                let productData = await scrapeProduct(item);
                linkData.push(productData);
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