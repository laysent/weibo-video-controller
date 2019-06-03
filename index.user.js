// ==UserScript==
// @name        Weibo Video Button
// @author      LaySent
// @version     1.0.0
// @description Add buttons that helps control video in weibo.
// @homepage    https://github.com/laysent/weibo-video-button
// @include     /^https?://(www\.)?weibo\.com/.*$/
// @downloadURL https://github.com/laysent/weibo-video-button/index.user.js
// @updateURL   https://raw.githubusercontent.com/laysent/weibo-video-button/master/index.user.js
// @supportURL  https://github.com/laysent/weibo-video-button/issues
// @run-at      document-end
// @license     MIT License
// ==/UserScript==
function applyStyle(element, style) {
    Object.keys(style).forEach((key) => {
        element.style[key] = style[key];
    });
}
function getButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    applyStyle(button, {
        display: 'block',
        padding: '16px',
        width: '50px',
    });
    return button;
}
function getSameOriginUrl(video) {
    return fetch(video.src)
        .then(function (response) { return response.blob(); })
        .then(function (blob) { return URL.createObjectURL(blob); });
}
function downloadResource(link) {
    const a = document.createElement('a');
    a.setAttribute('href', link);
    a.setAttribute('download', '');
    a.setAttribute('target', '_blank');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function addDownloadEventListener(button, video) {
    let sameOriginLink = null;
    video.addEventListener('canplaythrough', () => {
        getSameOriginUrl(video)
            .then((result) => {
            sameOriginLink = result;
        }, (error) => {
            /**
             * most likely caused due to not same origin issue
             */
            console.error(error);
        });
    });
    button.addEventListener('click', () => {
        downloadResource(sameOriginLink || video.src);
    });
}
function getControllers(video) {
    const controller = document.createElement('div');
    applyStyle(controller, {
        position: 'absolute',
        left: '-50px',
        fontSize: '16px',
    });
    for (let speed = 1; speed <= 3; speed += 0.5) {
        const button = getButton(speed.toString());
        button.addEventListener('click', () => {
            video.playbackRate = speed;
        });
        controller.appendChild(button);
    }
    const download = getButton('⏬');
    addDownloadEventListener(download, video);
    controller.appendChild(download);
    return controller;
}
function isVideo(element) {
    return element.tagName === 'VIDEO';
}
function mutationCallback(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type !== 'childList')
            return;
        const { addedNodes } = mutation;
        addedNodes.forEach((node) => {
            if (!isVideo(node))
                return;
            const video = node;
            if ('hasController' in video.dataset)
                return;
            const controller = getControllers(video);
            node.parentNode.appendChild(controller);
            video.dataset.hasController = '';
        });
    }
}
const observer = new MutationObserver(mutationCallback);
const container = document.getElementById('plc_frame');
if (!container) {
    console.error('[WeiboVideoButton] Cannot find weibo main container.');
}
else {
    observer.observe(container, { attributes: false, childList: true, subtree: true });
}
