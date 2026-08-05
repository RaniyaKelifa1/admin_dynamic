import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../Sales/Components/firebase";

export const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value?.toDate === "function") {
    return parseDateValue(value.toDate());
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === "object" && typeof value.seconds === "number") {
    const parsed = new Date(value.seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatDisplayDate = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeEmployeeRecord = (docId, data = {}, sourceCollection = "Employees") => {
  const creationTime = parseDateValue(data.creationTime);

  const joined = creationTime ? formatDisplayDate(creationTime) : data.joined || "Unknown";

  return {
    id: docId,
    key: docId,
    sourceCollection,
    name: data.name || data.fullName || data.employeeName || data.userName || "Unnamed employee",
    role: data.role || data.position || data.Position || data.jobTitle || "Employee",
    department: data.department || data.teamName || data.office || data.team || "Unassigned",
    phoneNumber: data.phoneNumber || data.phone || data.mobile || "",
    status: data.status || data.employeeStatus || "Active",
    defaultSalary: data.defaultSalary ?? data.basicSalary ?? data.salary ?? 12000,
    basicSalary: data.basicSalary ?? data.defaultSalary ?? data.salary ?? 12000,
    creationTime,
    joined,
    originalDepartment: data.department || data.teamName || data.office || data.team || "",
    ...data,
  };
};

const loadRecordsFromCollections = async (collectionNames, normalizeRecord) => {
  const seenKeys = new Set();
  const records = [];

  for (const collectionName of collectionNames) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      snapshot.docs.forEach((docSnap) => {
        const docId = docSnap.id;
        const key = `${collectionName}:${docId}`;
        if (seenKeys.has(key)) {
          return;
        }
        seenKeys.add(key);
        records.push(normalizeRecord(docSnap.id, docSnap.data(), collectionName));
      });
    } catch (error) {
      console.error(`Error loading ${collectionName}:`, error);
    }
  }

  return records;
};

export const loadHrEmployees = async (autoCleanDuplicates = false) => {
  const employees = await loadRecordsFromCollections(
    ["Employees", "employees", "teamMembers", "teammembers", "employee", "Employee", "staff", "users", "user"],
    normalizeEmployeeRecord
  );

  // Deduplicate by normalized name + phone number. If duplicates are found
  // prefer the record that has an assigned department. If one record has a
  // unassigned department and the other has a department, optionally delete
  // the unassigned one from Firestore (when autoCleanDuplicates=true).
  const keyed = {};
  const toDelete = [];

  const normalizeKey = (r) => {
    const name = (r.name || "").toString().trim().toLowerCase();
    const phone = (r.phoneNumber || r.phone || "").toString().replace(/\D/g, "");
    return `${name}||${phone}`;
  };

  const hasDept = (r) => {
    const d = (r.department || r.originalDepartment || "").toString().trim();
    return d && d.length > 0 && d.toLowerCase() !== "unassigned";
  };

  for (const rec of employees) {
    const key = normalizeKey(rec);
    if (!key || key === "||") {
      // fallback: keep by doc id
      keyed[`id:${rec.id}`] = keyed[`id:${rec.id}`] || rec;
      continue;
    }

    if (!keyed[key]) {
      keyed[key] = rec;
      continue;
    }

    const existing = keyed[key];

    const existingHas = hasDept(existing);
    const recHas = hasDept(rec);

    // Prefer the one that has a department assigned
    if (existingHas && !recHas) {
      // mark rec for deletion if it lacks department
      toDelete.push(rec);
      continue;
    }
    if (recHas && !existingHas) {
      toDelete.push(existing);
      keyed[key] = rec;
      continue;
    }

    // If both or neither have departments, prefer canonical 'Employees' collection
    const preferExisting = (existing.sourceCollection || "").toLowerCase() === "employees";
    const preferNew = (rec.sourceCollection || "").toLowerCase() === "employees";
    if (preferNew && !preferExisting) {
      toDelete.push(existing);
      keyed[key] = rec;
      continue;
    }

    // Otherwise keep the first seen one and mark the other for deletion
    toDelete.push(rec);
  }

  if (autoCleanDuplicates && toDelete.length > 0) {
    for (const delRec of toDelete) {
      try {
        if (delRec && delRec.sourceCollection && delRec.id) {
          await deleteDoc(doc(db, delRec.sourceCollection, delRec.id));
          console.info(`Deleted duplicate employee ${delRec.id} from ${delRec.sourceCollection}`);
        }
      } catch (err) {
        console.error("Failed to delete duplicate record:", delRec, err);
      }
    }
  }

  const final = Object.values(keyed).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return final;
};

export const loadHrDepartments = async () => {
  const normalizeDepartment = (docId, data = {}, collectionName) => ({
    id: docId,
    key: docId,
    sourceCollection: collectionName,
    name: data.name || data.departmentName || data.title || data.label || "Unnamed department",
    ...data,
  });

  return loadRecordsFromCollections(
    ["Departments", "departments", "Department", "department", "Teams", "teams"],
    normalizeDepartment
  );
};

export const loadHrPayrollRecords = async () => {
  const normalizePayroll = (docId, data = {}, collectionName) => ({
    id: docId,
    key: docId,
    sourceCollection: collectionName,
    employeeId: data.employeeId || data.employee || data.userId || data.user || "",
    monthKey: data.monthKey || data.period || data.month || "",
    basicSalary: data.basicSalary ?? data.defaultSalary ?? data.salary ?? 0,
    taxableAllowances: data.taxableAllowances ?? data.taxableAllowance ?? 0,
    nonTaxableAllowances: data.nonTaxableAllowances ?? data.nonTaxableAllowance ?? 0,
    status: data.status || "Pending",
    ...data,
  });

  return loadRecordsFromCollections(
    ["Payroll", "payroll", "PayrollRecords", "payrollRecords", "Salaries", "salaries"],
    normalizePayroll
  );
};

export const loadHrPayrollMonths = async () => {
  const normalizeMonth = (docId, data = {}, collectionName) => ({
    id: docId,
    key: docId,
    sourceCollection: collectionName,
    status: data.status || "Pending",
    completedAt: data.completedAt || data.completed_on || null,
    updatedAt: data.updatedAt || data.updated_on || null,
    ...data,
  });

  return loadRecordsFromCollections(
    ["PayrollMonths", "payrollMonths", "PayrollPeriods", "payrollPeriods", "Months", "months"],
    normalizeMonth
  );
};
