let loader = document.querySelector('.loader');

function clearInput() {
    document.querySelector('#links-input').innerHTML = '';
}

function deletePane(element) {
    let paneLink = element.previousSibling.getAttribute('href');
    element.parentNode.remove();
    let data = getSavedLinks();

    _.remove(data, item => {
        return item.url === paneLink;
    });
    
    localStorage.setItem('savedLinks', JSON.stringify(data));

    isCollectionEmpty();

    console.log('Pane deleted...');
}

function isCollectionEmpty() {
    if(_.isEmpty(JSON.parse(localStorage.getItem('savedLinks'))))
    {
        document.querySelector('.no-links-prompt').style.display = '';
        return true;
    }
    else
    {
        document.querySelector('.no-links-prompt').style.display = 'none';
        return false;   
    }
}

function getSavedLinks() {
    let savedLinks = JSON.parse(localStorage.getItem('savedLinks'));

    if(!savedLinks)
        localStorage.setItem('savedLinks', '[]');
        
    return savedLinks;
}

function newlyAdded(params) {
    return _.differenceBy(params, getSavedLinks(), 'url');
}

function saveLocalLinks(params) {
    let result = _.unionBy(params, getSavedLinks(), 'url');
    localStorage.setItem('savedLinks', JSON.stringify(result));   
    console.log('Local storage updated...')
}

function sortPanes(sortMethod) {
    
    let result;

    if (sortMethod === 'recent') {
        result = _.orderBy( getSavedLinks(), ['timestamp'], ['desc']);
    } else if (sortMethod === 'oldest') {
        result = _.orderBy( getSavedLinks(), ['timestamp'], ['asc']);
    }

    document.querySelector('.collection').innerHTML = '';
    createPanes(result);
}

document.querySelector('select#sortMethods').addEventListener('change', (event) => {
    sortPanes(document.querySelector('select#sortMethods').value);
});

document.querySelector('.add-links').addEventListener('click', async () => {
    let linksInput = document.querySelector('#links-input') || document.querySelector('#links-input span');

    if(linksInput != null && linksInput.textContent != '')
    {
        loader.style.opacity = 1;
        let data = {
            links: linksInput.textContent
        };

        let response = await fetch('/scrapeLinks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-control': 'no-cache'
            },
            body: JSON.stringify(data)
        });

        let scrapedData = await response.json();

        console.log('scrapedData: ',scrapedData);
        console.log('savedLinks: ', getSavedLinks());

        if(response.status === 200)
        {
            loader.style.opacity = 0;
            console.log('here');
            
            createPanes(newlyAdded(scrapedData));
        }

        saveLocalLinks(scrapedData);
        isCollectionEmpty();
        clearInput();
    }
    else {
        let quotes = ['Add something here!', 'Copy and paste something 😅', 'Paste links here to add!', 'Feels empty in here 😕'];
        let randomValue = Math.floor((Math.random() * 4));
        document.querySelector('#links-input').setAttribute('placeholder', quotes[randomValue]);
    }
});

function createPanes(data) {  
    
    isCollectionEmpty();

    data.forEach( item => {

        //Create new pane div
        let newPane = document.createElement('div');
        newPane.classList.add('pane');

        //Create new anchor tag for video URL
        let videoUrl = document.createElement('a');
        videoUrl.classList.add('btn');
        videoUrl.setAttribute('href', item.url);
        videoUrl.setAttribute('target', 'blank');
        videoUrl.textContent = 'Open';

        //Create new image tag for cached preview image
        let previewImg = document.createElement('img');
        previewImg.setAttribute('src', item.thumbnailUrl);
        previewImg.setAttribute('alt', 'link-preview');

        //Create new h3 tag for displaying video title
        let title = document.createElement('h3');
        title.classList.add('title');
        title.textContent = item.title;

        //Create new date field
        let date = new Date(item.timestamp);
        let dateAdded = document.createElement('div');
        dateAdded.id = 'timestamp';
        dateAdded.textContent = date.toDateString().slice(3).trim();

        //Create new p tag for video description
        let description = document.createElement('p');
        description.classList.add('description');
        description.textContent = item.videoDescription;

        //Create new button tag for delete pane
        let delBtn = document.createElement('button');
        delBtn.id = 'deletePane';
        delBtn.setAttribute('onClick', 'deletePane(this)');

        //Create new fontawesome trash icon for delete button
        let trashIcon = document.createElement('i');
        trashIcon.classList.add('fas');
        trashIcon.classList.add('fa-trash');

        //Assemble all parts to make pane div
        delBtn.appendChild(trashIcon);
        newPane.appendChild(previewImg);
        newPane.appendChild(dateAdded);
        newPane.appendChild(title);
        newPane.appendChild(description);
        newPane.appendChild(videoUrl);
        newPane.appendChild(delBtn);

        //Render new element in DOM
        document.querySelector('.collection').appendChild(newPane);
    });
}

window.onload = () => {
    let prevData = JSON.parse(localStorage.getItem('savedLinks'));

    if(!isCollectionEmpty()) {
        createPanes(prevData);
    }
}