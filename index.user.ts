// ==UserScript==
// @name        Weibo Video Controller
// @author      LaySent
// @version     1.0.0
// @description Add buttons that helps control video in weibo.
// @homepage    https://github.com/laysent/weibo-video-controller
// @include     /^https?://(www\.)?weibo\.com/.*$/
// @downloadURL https://github.com/laysent/weibo-video-controller/index.user.js
// @updateURL   https://raw.githubusercontent.com/laysent/weibo-video-controller/master/index.user.js
// @supportURL  https://github.com/laysent/weibo-video-controller/issues
// @run-at      document-end
// @license     MIT License
// ==/UserScript==

function applyStyle(element: HTMLElement, style: { [key: string] : string }) {
  Object.keys(style).forEach((key) => {
    element.style[key] = style[key];
  });
}

function getButton(text: string) : HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  applyStyle(button, {
    display: 'block',
    padding: '16px',
    width: '50px',
  });
  return button;
}

function getSameOriginUrl(video: HTMLVideoElement) : Promise<string> {
  return fetch(video.src)
    .then(function (response) { return response.blob(); })
    .then(function (blob) { return URL.createObjectURL(blob); })
}

function downloadResource(link: string) {
  const a = document.createElement('a');
  a.setAttribute('href', link);
  a.setAttribute('download', '');
  a.setAttribute('target', '_blank');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
/**
 * Tries to add click event to download button, which will do the following things:
 * 1. if video finished downloading, will try use fetch and blob to get same-origin data url
 * 2. if done, use this same-origin data url when click, which will start download right away
 * 3. otherwise download will act like opening video in new tab, which requires further steps to
 * manually download the video.
 * @param button Download Button
 * @param video Video Element
 */
function addDownloadEventListener(button: HTMLButtonElement, video: HTMLVideoElement) {
  let sameOriginLink = null;
  video.addEventListener('canplaythrough', () => {
    getSameOriginUrl(video)
      .then(
        (result) => {
          sameOriginLink = result;
        },
        (error) => {
          /**
           * most likely caused due to not same origin issue
           */
          console.error(error);
        },
      );
  });
  button.addEventListener('click', () => {
    downloadResource(sameOriginLink || video.src);
  });
}

function getControllers(video: HTMLVideoElement) : HTMLDivElement {
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

function isVideo(element: HTMLElement) : element is HTMLVideoElement {
  return element.tagName === 'VIDEO';
}

function mutationCallback(mutationsList: MutationRecord[], observer: MutationObserver) {
  for (const mutation of mutationsList) {
    if (mutation.type !== 'childList') return;
    const { addedNodes } = mutation;
    addedNodes.forEach((node) => {
      if (!isVideo(node as HTMLElement)) return;
      const video = node as HTMLVideoElement;
      if ('hasController' in video.dataset) return;
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
} else {
  observer.observe(container, { attributes: false, childList: true, subtree: true });
}
