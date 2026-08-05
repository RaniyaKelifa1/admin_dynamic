const admin = require('firebase-admin');
const serviceAccount = require('./Private_Key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const excludedDepartment = 'digital marketing department';
const excludedRole = 'admin';
const excludedName = 'admin account';

const isExcluded = (data) => {
  const department = (data.department || '').toString().trim().toLowerCase();
  const role = (data.role || '').toString().trim().toLowerCase();
  const name = (data.name || '').toString().trim().toLowerCase();
  return (
    department === excludedDepartment ||
    role === excludedRole ||
    name === excludedName
  );
};

const normalizeCreationTime = (creationTime) => {
  if (!creationTime) return null;
  if (creationTime._seconds !== undefined && creationTime._nanoseconds !== undefined) {
    return creationTime;
  }

  const date = creationTime instanceof Date ? creationTime : new Date(creationTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return admin.firestore.Timestamp.fromDate(date);
};

async function migrateTeamMembers() {
  console.log('Starting migration from Team Members to Employees...');

  const sourceSnapshot = await db.collection('teamMembers').get();
  if (sourceSnapshot.empty) {
    console.log('No Team Members records found. Nothing to migrate.');
    return;
  }

  let count = 0;
  for (const docSnap of sourceSnapshot.docs) {
    const data = docSnap.data();

    if (isExcluded(data)) {
      console.log(`Skipping excluded record: ${docSnap.id}`);
      continue;
    }

    const creationTime = normalizeCreationTime(data.creationTime);

    const employeeRecord = {
      ...data,
      status: data.status === undefined ? true : Boolean(data.status),
      department: 'Marketing',
      creationTime: creationTime || admin.firestore.Timestamp.now(),
    };

    const destinationRef = db.collection('Employees').doc(docSnap.id);
    await destinationRef.set(employeeRecord, { merge: true });
    count += 1;
  }

  console.log(`Migration complete. Copied ${count} Team Members records to Employees.`);
}

migrateTeamMembers().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
