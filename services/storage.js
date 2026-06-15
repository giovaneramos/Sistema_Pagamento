(function () {
  const EP = (window.EVENTPAY = window.EVENTPAY || {});
  const DB_NAME = 'eventpay_demo_db';
  const DB_VERSION = 1;
  const MASTER_KEY = 'eventpay_master_state';

  const openDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('recargas')) {
        db.createObjectStore('recargas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('estornos')) {
        db.createObjectStore('estornos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncs')) {
        db.createObjectStore('syncs', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const withStore = async (storeName, mode, handler) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = handler(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  };

  const getAll = async (storeName) => withStore(storeName, 'readonly', (store) => new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  }));

  const putMany = async (storeName, records) => withStore(storeName, 'readwrite', (store) => {
    records.forEach((record) => store.put(record));
  });

  const clearStore = async (storeName) => withStore(storeName, 'readwrite', (store) => store.clear());

  EP.storage = {
    async loadMaster() {
      const raw = localStorage.getItem(MASTER_KEY);
      return raw ? JSON.parse(raw) : null;
    },

    async saveMaster(master) {
      localStorage.setItem(MASTER_KEY, JSON.stringify(master));
    },

    async loadLedger() {
      const [sales, recargas, estornos, syncs] = await Promise.all([
        getAll('sales'),
        getAll('recargas'),
        getAll('estornos'),
        getAll('syncs')
      ]);

      return { sales, recargas, estornos, syncs };
    },

    async saveLedger(ledger) {
      await Promise.all([
        clearStore('sales'),
        clearStore('recargas'),
        clearStore('estornos'),
        clearStore('syncs')
      ]);
      await Promise.all([
        putMany('sales', ledger.sales || []),
        putMany('recargas', ledger.recargas || []),
        putMany('estornos', ledger.estornos || []),
        putMany('syncs', ledger.syncs || [])
      ]);
    },

    async ensureSeed(seedData) {
      const master = await this.loadMaster();
      const ledger = await this.loadLedger();

      const needMaster = !master;
      const needLedger = !(ledger.sales.length || ledger.recargas.length || ledger.estornos.length || ledger.syncs.length);

      if (needMaster) {
        const { sales, recargas, estornos, syncs, ...rest } = seedData;
        await this.saveMaster(rest);
      }
      if (needLedger) {
        await this.saveLedger({ sales: seedData.sales, recargas: seedData.recargas, estornos: seedData.estornos, syncs: seedData.syncs });
      }
    },

    async putRecord(storeName, record) {
      await withStore(storeName, 'readwrite', (store) => store.put(record));
    }
  };
})();
