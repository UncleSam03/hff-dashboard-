import Dexie from 'dexie';

export const db = new Dexie('HFF_Dashboard_V2');

// Schema Setup: UUID, name, gender, age, 18-day attendance array, sync_status
db.version(1).stores({
    participants: '++id, uuid, name, gender, age, sync_status'
});

export default db;
