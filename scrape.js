const request = require('request-promise');
const cheerio = require('cheerio');

async function previewLinks(links) {

    if(links)
    {
        let linkData = [];
        let linksArray = links.split(',');

        for (item of linksArray) {
            try {
                const response = await request({
                    uri: item,
                    headers: {
                        "Accept-Language": "en-US,en;q=0.5",
                    },
                });

                let $ = cheerio.load(response);
                let title = $('meta[property="og:title"]').attr('content');
                console.log(title);
                let videoDescription = $('meta[property="og:description"]').attr('content');
                console.log(videoDescription);
                let url = item;
                console.log(url);
                let videoThumbnailUrl = $('meta[property="og:image"]').attr('content');
                console.log(videoThumbnailUrl);

                let data = {
                    title: title,
                    videoDescription: videoDescription,
                    url: item,
                    thumbnailUrl: videoThumbnailUrl, 
                }

                linkData.push(data);

            } catch (error) {
                console.log(error);
            }
        }
        console.log('Scraping complete!');
        return linkData;
    }
}

module.exports = previewLinks;