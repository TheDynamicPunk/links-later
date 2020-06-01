let loader = document.querySelector('.loader');
let collectionLoader = document.querySelector('.collection-loader');

function pressedEnter(e) {
    e.preventDefault();
    
    let code = e.keyCode ? e.keyCode : e.which;

    if(code === 13)
    {
        fetchLinks();
    }
}

function updateNoOfLinks() {
    document.querySelector('.number-of-links').textContent = 'Links collected: ' + getSavedLinks().length;
}

function parseTimestamp(params) {

    let linkDate = new Date(params);
    let date = linkDate.toDateString().slice(3).trim();
    let time = ((linkDate.getHours() < 10) ? '0' : '')
                + ((linkDate.getHours() > 12) ? (linkDate.getHours() - 12) : linkDate.getHours())
                + ':'
                + ((linkDate.getMinutes() < 10) ? '0' : '')
                + linkDate.getMinutes()
                + ' '
                + ((linkDate.getHours() < 12) ? 'AM' : 'PM');

    let dateTime = (date + ', ' + time);
    return dateTime;
}

function copyAllLinks(element) {

    let previousContent = element.textContent;
    element.textContent = 'Copied!';

    let savedLinks = getSavedLinks();
    let result = '';
    
    savedLinks.forEach(item => {
        result += item.url + ',';
    });

    result = result.slice(0, result.length-1);
    navigator.clipboard.writeText(result)
        .then(() => {
            console.log('All links copied!');
        })
        .catch( err => {
            console.error('Text can\'t be copied!');
        });

    setTimeout(() => {
        element.textContent = previousContent;
    }, 1500);
}

function clearInput() {
    document.querySelector('#links-input').innerHTML = '';
}

function makeToast(content, btn, showCloseBtn) {
    document.querySelector('.toast span').textContent = content;
    document.querySelector('.toast button').textContent = btn;
    let closeButton = document.querySelector('.toast .close-btn');
    
    if(closeButton != null && showCloseBtn === false)
        document.querySelector('.toast .close-btn').remove();

    document.querySelector('.toast-wrapper').style.display = '';
}

function deletePane(element) {
    let paneLink = element.previousSibling.getAttribute('href');
    let pane = element.parentNode.parentNode.parentNode;

    makeToast('Link deleted', 'Undo', false);

    pane.classList.add('delete-pane');
    pane.addEventListener('animationend', () => {
        pane.style.display = 'none';
    });

    let timerId = setTimeout( async () => {
        pane.remove();
        
        let data = getSavedLinks();

        _.remove(data, item => {
            return item.url === paneLink;
        });
        
        localStorage.setItem('savedLinks', JSON.stringify(data));
        
        console.log('fetching user data!');

        const response = await fetch('/get-data');
        const userData = await response.json();

        if(!userData.err) {
            console.log('In if block!');
            console.log('userData: ', userData);

            syncWithServer( paneLink, 'delete');
        }

        updateNoOfLinks();
        isCollectionEmpty();

        console.log('Pane deleted...');
        document.querySelector('.toast-wrapper').style.display = 'none';
    }, 10000);

    document.querySelector('.toast button').addEventListener('click', () => {
        clearTimeout(timerId);
        pane.classList.remove('delete-pane');
        pane.style.display = '';
        document.querySelector('.toast-wrapper').style.display = 'none';
    })
}

function isCollectionEmpty() {
    if(_.isEmpty(getSavedLinks()))
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

async function saveLocalLinks(params) {
    
    let result = _.unionBy(params, getSavedLinks(), 'url');
    localStorage.setItem('savedLinks', JSON.stringify(result));

    console.log('fetching user data!');

    const response = await fetch('/get-data');
    const userData = await response.json();

    if(!userData.err) {
        console.log('In if block!');
        console.log('userData: ', userData);

        syncWithServer(getSavedLinks(), 'add');
    }

    updateNoOfLinks();
    
    console.log('Local storage updated...');
}

function sortPanes(sortMethod) {
    
    let result;

    if (sortMethod === 'recent') {
        result = _.orderBy( getSavedLinks(), ['timestamp'], ['asc']);
    } else if (sortMethod === 'oldest') {
        result = _.orderBy( getSavedLinks(), ['timestamp'], ['desc']);
    } else {
        return;
    }

    localStorage.setItem('savedLinks', JSON.stringify(result));
    localStorage.setItem('sortPreference', sortMethod);

    document.querySelector('.collection').innerHTML = '';
    createPanes(result);
}

document.querySelector('select#sortMethods').addEventListener('change', (event) => {
    sortPanes(document.querySelector('select#sortMethods').value);
});

document.querySelector('.add-links').addEventListener('click', fetchLinks);

async function syncWithServer(linksData, options) {

    let payload = {
        links: linksData,
        options: options
    };

    const data = fetch('/update-user', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
    }
    ).then( res => {
        if(res.status === 200)
            console.log('Synced with cloud!');
        else
            console.log('Connection error!');
    }).then( async () => {
        const response = await fetch('/get-data');
        const data = await response.json();
        console.log('data update-user: ', data);

        if(data.links.length !== 0)
        {
            localStorage.setItem('savedLinks', JSON.stringify(data.links));
            // createPanes(getSavedLinks());
            updateNoOfLinks();
            return data.links;
        }
    });

    return await data;
}

async function fetchLinks() {
    let linksInput = document.querySelector('#links-input') || document.querySelector('#links-input span');

    if(linksInput != null && linksInput.textContent != '')
    {
        loader.style.opacity = 1;
        
        let data = {
            links: linksInput.textContent
        };

        try {

            let response = await fetch('/scrapeLinks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Cache-control': 'no-cache'
                },
                body: JSON.stringify(data)
            });

            let scrapedData = await response.json();

            console.log('scrapedData: ',scrapedData);
            console.log('savedLinks: ', getSavedLinks());

            if(response.status === 200)
            {
                loader.style.opacity = 0;
                createPanes(newlyAdded(scrapedData));
            }

            saveLocalLinks(scrapedData);
            isCollectionEmpty();
            clearInput();

        } catch { error => {
            console.log(error);
        }}
    }
    else {
        let quotes = ['Add something here!', 'Copy and paste something 😅', 'Paste links here to add!', 'Feels empty in here 😕'];
        let randomValue = Math.floor((Math.random() * 4));
        document.querySelector('#links-input').setAttribute('placeholder', quotes[randomValue]);
    }
}

function createPanes(data) {  

    console.log('Creating panes...');
    isCollectionEmpty();

    data.forEach( item => {

        //Create new pane div
        let newPane = document.createElement('div');
        newPane.classList.add('pane');

        //Create pane container
        let paneContainer = document.createElement('div');
        paneContainer.classList.add('pane-container');

        //Create new anchor tag for video URL
        let videoUrl = document.createElement('a');
        videoUrl.classList.add('btn1');
        videoUrl.setAttribute('href', item.url);
        videoUrl.setAttribute('target', 'blank');
        videoUrl.textContent = 'Open';

        //Create new image tag for cached preview image
        let previewImg = document.createElement('img');
        previewImg.setAttribute('src', item.pagethumbnailUrl);
        previewImg.setAttribute('alt', 'link-preview');

        //Create new h3 tag for displaying video title
        let title = document.createElement('h3');
        title.classList.add('title');
        title.textContent = item.pageTitle;

        //Create new date field
        let date = parseTimestamp(item.timestamp);
        let dateAdded = document.createElement('div');
        dateAdded.id = 'timestamp';
        dateAdded.textContent = date;

        //Create new p tag for video description
        let description = document.createElement('p');
        description.classList.add('description');
        description.textContent = item.pageDescription;

        //Create new button tag for delete pane
        let delBtn = document.createElement('button');
        delBtn.id = 'deletePane';
        delBtn.classList.add('btn1');
        delBtn.setAttribute('onClick', 'deletePane(this)');

        //Create cta-btns class to hold the 2 buttons
        let cta_btns = document.createElement('div');
        cta_btns.classList.add('cta-btns');

        //Create new fontawesome trash icon for delete button
        let trashIcon = document.createElement('i');
        trashIcon.classList.add('fas');
        trashIcon.classList.add('fa-trash');

        //Assemble all parts to make pane div
        delBtn.appendChild(trashIcon);
        newPane.appendChild(previewImg);
        paneContainer.appendChild(dateAdded);
        paneContainer.appendChild(title);
        paneContainer.appendChild(description);
        cta_btns.appendChild(videoUrl);
        cta_btns.appendChild(delBtn);
        paneContainer.appendChild(cta_btns);
        newPane.appendChild(paneContainer);

        //Render new element in DOM
        document.querySelector('.collection').prepend(newPane);
    });
}

window.onload = async () => {

    try {
        const response = await fetch('/get-data');
        const userData = await response.json();

        if(!userData.err) {
            console.log('In if block!');
            console.log('userData: ', userData);

            const data = await syncWithServer(getSavedLinks(), 'add');

            updateNoOfLinks();

            if(data.length !== 0) {
                console.log('after getting data!');
                createPanes(data);
                collectionLoader.style.display = 'none';
                isCollectionEmpty();
            }
        }
        else {
            console.log(userData.err);
            updateNoOfLinks();

            if(!isCollectionEmpty())
                createPanes(getSavedLinks());
        }

        if(localStorage.getItem('sortPreference'))
        {
            document.querySelector('select#sortMethods').value = localStorage.getItem('sortPreference');
        }
        
    } catch (err) {
        console.log(err);
    }
}