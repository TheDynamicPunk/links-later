const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port =process.env.PORT || 3000;
const previewLinks = require('./scrape');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile('public/linkslater.html', {root: __dirname});
});

app.post('/scrapeLinks', async (req, res) => {
    console.log('Scraping Links...');
    const result = await previewLinks(req.body.links);
    res.send(result);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})