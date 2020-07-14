let loader = document.querySelector('.loader');
let collectionLoader = document.querySelector('.collection-loader');

function pressedEnter(e) {
    
    let code = e.keyCode ? e.keyCode : e.which;

    if(code === 13)
    {
        e.preventDefault();
        fetchLinks();
    }
}

function updateNoOfLinks() {
    document.querySelector('.number-of-links').textContent = 'Links collected: ' + getSavedLinks().length;
}

function getDurationStamp(params) {

    let duration = (new Date() - params) / 1000;

    console.log(`${duration}s`);

    if (duration < 60) {

        if(Math.ceil(duration) === 1)
            return `${Math.ceil(duration)} second ago`;
        else
            return `${Math.ceil(duration)} seconds ago`;
    }
    else if (duration > 60 && duration < 3600) {
        
        let timeDuration = parseInt((Math.floor(duration) / 60).toPrecision());

        if(timeDuration === 1)
            return `${timeDuration} minute ago`;
        else
            return `${timeDuration} minutes ago`;
    }
    else if (duration > 3600 && duration < 86400) {

        let timeDuration = parseInt((Math.floor(duration) / 3600).toPrecision());

        if(timeDuration === 1)
            return `${timeDuration} hour ago`;
        else
            return `${timeDuration} hours ago`;
    }
    else if (duration > 86400 && duration < 2592000) {
        let timeDuration = parseInt((Math.floor(duration) / 86400).toPrecision());
        
        if (timeDuration === 1) {
            return `${timeDuration} day ago`;
        } else {
            return `${timeDuration} days ago`;   
        }
    }
    else if (duration > 2592000) {
        let timeDuration = parseInt((Math.floor(duration) / 2592000).toPrecision());
        
        if (timeDuration === 1) {
            return `${timeDuration} month ago`;
        } else {
            return `${timeDuration} months ago`;
        }
    }
    else {
        return `NA`;
    }
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

function createSyncModal(links) {
    
    console.log('Creating modal!');

    document.querySelector('.modal .image img').setAttribute('src', 'assets/sync.svg');
    document.querySelector('.modal .modal-title').innerHTML = '<h1>Sync links with cloud?</h1>';
    
    let content = 'Following links are not synced with your account<ul style="margin-top: 1em; margin-left: 1.5em">';
    
    links.forEach( item => {
        if(item.pageTitle)
            content += `<li>${item.pageTitle}</li>`;
        else
            content += `<li>${item.url}</li>`;
    });

    document.querySelector('.modal .modal-content').innerHTML = content;
    document.querySelector('.modal-container').classList.remove('close');
    document.querySelector('.modal-btns').innerHTML = '<button id="sync-links" class="btn1">Sync</button>'

    document.querySelector('.modal-btns #sync-links').addEventListener('click', async () => {

        document.querySelector('.modal-container').classList.add('close');

        const data = await syncWithServer(getSavedLinks(), 'add');

        updateNoOfLinks();

        if(data.length !== 0) {
            console.log('after getting data!');
            createPanes(data);
            collectionLoader.style.display = 'none';
            isCollectionEmpty();
        }
    });
}

function makeToast(content, btn, showCloseBtn) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'xk' + Math.random().toString(36).slice(2);

    if(showCloseBtn)
        toast.innerHTML = `<span>${content}</span><button>${btn}</button><span class="close-btn" onclick="closeToast(this)"><i class="fas fa-times"></i></span>`;
    else
        toast.innerHTML = `<span>${content}</span><button>${btn}</button>`;

    document.querySelector('.toast-wrapper').append(toast);

    return toast.id;
}

function deletePane(paneRef) {
    console.log(paneRef);
    let paneLink = paneRef.querySelector('.cta-btns a').getAttribute('href');

    let toastId = makeToast('Link deleted', 'Undo', false);

    paneRef.classList.add('delete-pane');
    paneRef.addEventListener('animationend', () => {
        paneRef.style.display = 'none';
    });

    let timerId = setTimeout( async () => {
        paneRef.remove();
        
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
        document.querySelector(`#${toastId}`).remove();
    }, 10000);

    document.querySelector(`#${toastId} button`).addEventListener('click', () => {
        clearTimeout(timerId);
        paneRef.classList.remove('delete-pane');
        paneRef.style.display = '';
        document.querySelector(`#${toastId}`).remove();
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

async function refreshPrice(element) {

    let paneContainer = element.parentNode.parentNode.parentNode;
    let elementLoader = paneContainer.querySelector('.loader');
    let priceField = paneContainer.querySelector('.price');
    let mrpField = paneContainer.querySelector('.mrp');
    let discountField = paneContainer.querySelector('.discount');
    let productLink = paneContainer.querySelector('.cta-btns a').getAttribute('href');

    element.style.display = 'none';
    elementLoader.style.display = '';

    let links = {
        links: productLink,
    };

    const updatedPrice = await updatePrice(links);

    if(updatedPrice)
    {
        let { price, mrp } = updatedPrice[0];

        if(mrp)
        {
            priceField.textContent = price;
            mrpField.textContent = mrp;

            let discount = (((mrp - price) / mrp) * 100).toFixed(0);
            discountField.textContent = discount + '% off';
        }
        else {
            priceField.textContent = price;
        }
    }
    else {
        console.log('error while getting new price!');
        paneContainer.querySelector('.error-info').textContent = 'Can\'t get new prices! Please check your internet connection';
        paneContainer.querySelector('.error-info').style.display = '';

    }

    element.style.display = '';
    elementLoader.style.display = 'none';
}

async function updatePrice(links) {
    try {
        const response = await fetch('/api/refresh-price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(links)
        });

        const data = await response.json();
        console.log('new price: ', data);

        return data;

    } catch (err) {
        console.log('Error while getting new price: ', err);
    }
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
        
        if(item.isProduct)
        {
            let pane =  `<img class="product-img" src="${item.productImageUrl}" alt="product-image">
                        <div class="product-container">
                            <div class="timestamp" title="${parseTimestamp(item.timestamp)}">${getDurationStamp(item.timestamp)}</div>
                            <h3 class="title">${item.itemName}</h3>`;
            if(item.site === 'flipkart')
            {
                pane += `<img class="source-logo" src="./assets/flipkart-icon.png" alt="flipkart-logo">`;
            }
            else {
                pane += `<img class="source-logo" src="./assets/amazon-icon.png" alt="amazon-logo">`;
            }

            pane += `<div class="price-info">
                        <div class="refresh">
                            <button title="Refresh Price" onclick="refreshPrice(this)"><i class="fas fa-sync-alt"></i></button>
                            <span class="loader" style="display: none;"><div class="lds-dual-ring"></div></span>
                        </div>`;
                        
            if(item.mrp) {
                console.log('item.mrp: ', item.mrp);
                pane += `<span class="price">${item.price}</span>
                        <span class="mrp">${item.mrp}</span>
                        <span class="discount">${(((item.mrp - item.price) / item.mrp) * 100).toFixed(0)}% off</span>`
            }
            else {
                console.log('item.mrp not present: ', item.mrp);
                pane += `<span class="price">${item.price}</span>`;
            }

            pane += `</div>
                    <div class="error-info" style="display: none;"></div>
                    <div class="cta-btns">
                        <a class="btn1" href=${item.url} target="blank">Open</a>
                        <button class="btn1" id="deletePane" onclick="deletePane(this.parentNode.parentNode.parentNode)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;

            let productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = pane;

            document.querySelector('.collection').prepend(productDiv);
        }
        else {
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
            let duration = getDurationStamp(item.timestamp);
            let dateAdded = document.createElement('div');
            dateAdded.classList.add('timestamp');
            dateAdded.setAttribute('title', date);
            dateAdded.textContent = duration;

            //Create new p tag for video description
            let description = document.createElement('p');
            description.classList.add('description');
            description.textContent = item.pageDescription;

            //Create new button tag for delete pane
            let delBtn = document.createElement('button');
            delBtn.id = 'deletePane';
            delBtn.classList.add('btn1');
            delBtn.setAttribute('onClick', 'deletePane(this.parentNode.parentNode.parentNode)');

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
        }
    });
}

window.onload = async () => {

    try {
        const response = await fetch('/get-data');
        const userData = await response.json();

        // Check if user is logged in
        if(!userData.err) {
            console.log('In if block!');
            console.log('userData: ', userData);

            // Check if any value in local that doesn't match with cloud
            let result = _.differenceBy(getSavedLinks(), userData.links, 'url');

            // Check if user has unsaved local links different from ones in the cloud
            if(result.length !== 0)
            {
                console.log('diff result: ', result);
                createSyncModal(result);
            }

            if(userData.links.length !== 0) {
                console.log('after getting data!');
                createPanes(userData.links);
                collectionLoader.style.display = 'none';
                localStorage.setItem('savedLinks', JSON.stringify(userData.links));
                updateNoOfLinks();
                isCollectionEmpty();
            }
        }

        // If user not logged in
        else {
            console.log(userData.err);
            updateNoOfLinks();

            if(!isCollectionEmpty())
                createPanes(getSavedLinks());

            collectionLoader.style.display = 'none';
        }

        if(localStorage.getItem('sortPreference'))
        {
            document.querySelector('select#sortMethods').value = localStorage.getItem('sortPreference');
        }
        
    } catch (err) {
        console.log(err);
    }
}