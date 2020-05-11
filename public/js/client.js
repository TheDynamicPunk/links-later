let loader = document.querySelector('.loader');
let links = document.querySelector('#links');

function clearInput() {
    document.querySelector('#links').value = '';
}

function deletePane(element) {
    let paneLink = element.previousSibling.getAttribute('href');
    element.parentNode.remove();
    // console.log(paneLink);
    let data = JSON.parse(localStorage.getItem('previousLinks'));
    // console.log(data);

    _.remove(data, item => {
        return item.url === paneLink;
    });
    
    localStorage.setItem('previousLinks', JSON.stringify(data));

    isCollectionEmpty();
}

function isCollectionEmpty() {
    if(_.isEmpty(JSON.parse(localStorage.getItem('previousLinks'))))
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

document.querySelector('button').addEventListener('click', async () => {
    loader.style.opacity = 1;
    let data = {
        links: links.value
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

    localStorage.setItem('previousLinks', JSON.stringify(scrapedData));

    // console.log(scrapedData);
    // console.log(localStorage.getItem('previousLinks'));

    if(response.status === 200)
    {
        loader.style.opacity = 0;
        createPanes(scrapedData);
    }
});

function createPanes(data) {
    // console.log(data);
    
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
        newPane.appendChild(title);
        newPane.appendChild(description);
        newPane.appendChild(videoUrl);
        newPane.appendChild(delBtn);

        //Render new element in DOM
        document.querySelector('.collection').appendChild(newPane);
    });
}

window.onload = () => {
    let prevData = JSON.parse(localStorage.getItem('previousLinks'));
    // console.log(_.isEmpty(prevData));

    if(!isCollectionEmpty()) {
        createPanes(prevData);
    }
}