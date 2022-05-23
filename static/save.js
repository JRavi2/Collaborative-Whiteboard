const canvass = document.querySelector('.app canvas');
const save_btn = document.querySelector('#save-btn');

function downloadCanvas() {
    var image = canvass.toDataURL();

    // create temporary link  
    var tmpLink = document.createElement('a');
    tmpLink.download = 'image.png'; // set the name of the download file 
    tmpLink.href = image;

    // temporarily add link to body and initiate the download  
    document.body.appendChild(tmpLink);
    tmpLink.click();
    document.body.removeChild(tmpLink);
}

save_btn.addEventListener('click', downloadCanvas);