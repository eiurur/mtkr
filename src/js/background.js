import 'babel-polyfill';
import ChromeSyncStorage from './chromeSyncStorage';

const constants = {
  image: {
    unwatched:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABt0lEQVQ4T7VTwWpTQRQ9d5LXlYvsikW7LURmJrHZaaWBou5cKbjoRqFfUWj9BsFFuzM7xeJaCy8UwZ1lZpKALoqKKH6AheZl5sqElzBNLRSKA3cxc8+cc+fcO4RLLrrkfZxLYK1dBrDsvR9Wq9VPUkr7L7FTBM65+RDCOoAYauZCJOgIITpSyt+T3JSg3+/XR6PRKwA3yuQ+Mx8BOBFCLDHz3fL8KITwtNlsduN+TNDr9W557z8kitta62fOueshBNZa/zDGbAHYnmCY+Waj0TikwWBwtSiKrwDmyuRhURS3W63WsTHmAMAKEX0cDodrWZZFkWaJOyaia2SMeQvgQaL+goi6zKwBFBNVZr4vhHjEzE8S7JtI8A3AYlLac2beE0LkqYkhhDYRPSaijeT8Mznn1kMIL6euEr1TSt2z1ubMvDo2iqirlGobY94DWEsI7oxNnDUolh1NtNY+jHml1OvzMNM2GmNWAOwCWCoVouNfmPmEiGTSge9CiE0pZWfaxklJZUfiG2MszAzSTwA7WZbt1Ov1X2cGKQXneX6lVqspIopRVCoV670faK3/zI7z//tMF/2lfwG+ZbiyNVxcWAAAAABJRU5ErkJggg==',
    watched:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB0klEQVQ4T7VTwWoTURQ956WaLtw0qYqlSh0QQTHFdmkrFoq6c6XgohslM/QD3AnGbxClk5Qump1Sca2FBhHcWQgoKPJsRCvVJiLUYmznXpmYmU6qBaH4du/ec8+975z7iF0e7rIeOxL0lt4OQ8ywivyULvPia96p/q1ZB8GBkj0oigkoJhTIJQsIVEGUDVH+nHdWolxMkJmqnSDlPqAn28l5BSwVTRDHAZwP4wpaI5vXVyePVcJ7i6BnunbGBMGziFXBQsM7ejsz8/EwAtVGvv9Dxn93i9BChDFihr5MDiyy1186JJAlAnvbycU0ukeWvb71zJR9SmIU4PM00uNN/AibnG7j1jeDtX5mi/YRFJfi96reU7JCYFDBjairCi/S4Aqg1xLazDHr2xqAI1sEuEMNHqpJLXSIKMGYmNRVAm4i/jqcIFR9NhF8XPecC9miXYDiXCtOVOquM5b17RMA4xFWDM62RNwuUCyiby+H+YbnPNgJE9vYU7KjRlACWpaFdhWMwRsNpKk0pxIOvAdxs+465djGaKTfjqhLwoVqX8fmkcuqKBqwuOoNfPpjkZLg/Xdf7gv2pHMGqZyIbtBotevb2quVG4Pft6/z//tM//pLfwHd17j4ogkEvQAAAABJRU5ErkJggg==',
  },
};

const isVideoPage = (url) => {
  return /\/gp\/video\/detail\/([0-9A-Z]+)/.test(url);
};

const catchMovieTitle = (pageTitle) => {
  const pattern = /Amazon.co.jp: (.+)を観る/;
  const match = pattern.exec(pageTitle);
  const movieTitle = match ? match[1] : '';
  return movieTitle;
};

const findWatched = async (movieTitle) => {
  return await ChromeSyncStorage.get(movieTitle);
};

const toggleIcon = (isWatched) => {
  const iconImage = isWatched
    ? constants.image.watched
    : constants.image.unwatched;
  chrome.browserAction.setIcon({
    path: iconImage,
  });
};

const updateRecord = async (isWatched, movieTitle, record) => {
  if (isWatched) {
    await ChromeSyncStorage.remove(movieTitle);
  } else {
    await ChromeSyncStorage.set({ [movieTitle]: record });
  }
};

const scrapeThumbnail = () => {
  return new Promise((resolve, reject) => {
    function script() {
      return document
        .querySelector('.dv-fallback-packshot-image img')
        .getAttribute('src');
    }
    chrome.tabs.executeScript(
      {
        code: '(' + script + ')();',
      },
      (results) => {
        const thumbnail = results[0];
        resolve(thumbnail);
      },
    );
  });
};

const indicateWatchStatus = async ({ url, title }) => {
  toggleIcon(false);
  if (!isVideoPage(url)) return;
  const movieTitle = catchMovieTitle(title);
  const watched = await findWatched(movieTitle);
  const isWatched = !!watched;
  toggleIcon(isWatched);
};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  indicateWatchStatus(tab);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.getSelected(null, async (tab) => {
    indicateWatchStatus(tab);
  });
});

chrome.browserAction.onClicked.addListener(async (tab) => {
  const { url, title } = tab;
  if (!isVideoPage(url)) return;
  const thumbnail = await scrapeThumbnail();
  const createdAt = new Date().getTime();
  const movieTitle = catchMovieTitle(title);
  const watched = await findWatched(movieTitle);
  const isWatched = !!watched;
  const record = {
    url,
    thumbnail,
    createdAt,
    title: movieTitle,
  };
  toggleIcon(!isWatched);
  updateRecord(isWatched, movieTitle, record);
});
