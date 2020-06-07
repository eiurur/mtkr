export default class ChromeSyncStorageManager {
  static set(item) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(item, () => resolve(true));
    });
  }

  static get(key = '') {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([key], (item) => {
        const result =
          item[key] === undefined || item[key] === '' ? null : item[key];
        return resolve(result);
      });
    });
  }

  static getList(keys = []) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (items) => {
        return resolve(items);
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, function (items) {
        resolve(items);
      });
    });
  }

  static remove(key = '') {
    return new Promise((resolve, reject) => {
      if (!key) return resolve(true);
      chrome.storage.sync.remove(key, () => resolve(true));
    });
  }

  static clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear();
      resolve(true);
    });
  }
}
