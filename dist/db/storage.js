const DB_NAME = 'horizon-planner';
const STORE = 'tasks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, work) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = work(store);
    tx.oncomplete = () => resolve(result?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const taskDB = {
  all: () => transact('readonly', store => store.getAll()),
  put: task => transact('readwrite', store => store.put(task)),
  delete: id => transact('readwrite', store => store.delete(id)),
  bulkPut: tasks => transact('readwrite', store => { tasks.forEach(task => store.put(task)); })
};

export function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
