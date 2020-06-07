import 'babel-polyfill';

import ChromeSyncStorage from './chromeSyncStorage';

(async () => {
  const items = await ChromeSyncStorage.getAll();
  const cards = Object.keys(items)
    .map((id) => items[id])
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((item) => {
      const card = `
      <div>
        <a href="${item.url}" target="_blank">
          <img src="${item.thumbnail}" title="${item.title}"/>
        </a>
      </div>`;
      return card;
    });
  const container = document.getElementById('movies');
  container.innerHTML = cards.join('');
})();
