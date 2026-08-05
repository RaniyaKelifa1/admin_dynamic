const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCHIiwLOElxpJvKp5BNszG0nVIfbA6-SdY',
  authDomain: 'dynamicweb-e2ab3.firebaseapp.com',
  projectId: 'dynamicweb-e2ab3',
  storageBucket: 'dynamicweb-e2ab3.firebasestorage.app',
  messagingSenderId: '642855759049',
  appId: '1:642855759049:web:61245ed84ad7c66ff1f118',
  measurementId: 'G-844RRBDE04',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async () => {
  try {
    const cols = ['Employees', 'teamMembers'];
    const all = [];
    for (const name of cols) {
      const snap = await getDocs(collection(db, name));
      snap.docs.forEach((d) => all.push({ collection: name, id: d.id, data: d.data() }));
    }

    const map = {};
    const toDelete = [];

    const norm = (s) => (s || '').toString().trim().toLowerCase();

    for (const r of all) {
      const name = norm(r.data.name);
      const phone = (r.data.phoneNumber || r.data.phone || '').toString().replace(/\D/g, '');
      const key = `${name}||${phone}`;
      if (!map[key]) {
        map[key] = r;
        continue;
      }
      const existing = map[key];

      const existingHas = ((existing.data.department || existing.data.teamName || existing.data.office || '') || '').toString().trim().length > 0 && ((existing.data.department || '') || '').toString().toLowerCase() !== 'unassigned';
      const rHas = ((r.data.department || r.data.teamName || r.data.office || '') || '').toString().trim().length > 0 && ((r.data.department || '') || '').toString().toLowerCase() !== 'unassigned';

      if (existingHas && !rHas) {
        toDelete.push(r);
        continue;
      }
      if (rHas && !existingHas) {
        toDelete.push(existing);
        map[key] = r;
        continue;
      }

      if (r.collection === 'Employees' && existing.collection !== 'Employees') {
        toDelete.push(existing);
        map[key] = r;
        continue;
      }

      toDelete.push(r);
    }

    console.log('Matches to delete:', toDelete.length);
    for (const d of toDelete) {
      try {
        console.log('Deleting', d.collection, d.id, d.data.name, d.data.phoneNumber);
        await deleteDoc(doc(db, d.collection, d.id));
      } catch (e) {
        console.error('Delete failed', d.collection, d.id, e.message);
      }
    }

    console.log('Cleanup complete');
  } catch (err) {
    console.error('Error', err);
  }
})();
