import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Card,
  Typography,
  Table,
  Switch,
  Space,
  Select,
  InputNumber,
  Button,
  message,
  Divider,
  List,
  Tag,
  Modal,
  Statistic,
  Row,
  Col,
  Tooltip,
  Alert,
} from "antd";
import {
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Info,
  User,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../Sales/Components/firebase";
import {
  loadHrEmployees,
  loadHrPayrollRecords,
  loadHrPayrollMonths,
  getMonthPaymentSummary,
  formatMonthCloseBlockMessage,
  getEmployeePendingArrears,
  isEmployeeActive,
  buildBackPayRecordId,
} from "./hrDataService";
import { INCOME_TAX_EXEMPTION_THRESHOLD, isIncomeTaxExempt } from "./payrollService";

const { Title, Paragraph, Text } = Typography;

/**
 * Calculates Ethiopian Payroll according to Proclamation No. 979/2016 (Income Tax)
 * and Proclamation No. 715/2011 (Pension Scheme).
 */
export const calculatePayroll = ({
  basicSalary = 0,
  taxableAllowances = 0,
  nonTaxableAllowances = 0,
}) => {
  const basic = Math.max(0, Number(basicSalary) || 0);
  const taxableAllow = Math.max(0, Number(taxableAllowances) || 0);
  const nonTaxableAllow = Math.max(0, Number(nonTaxableAllowances) || 0);

  // 1. Gross Income Calculation
  const grossIncome = basic + taxableAllow + nonTaxableAllow;

  // 2. Pension Calculations (Based on Basic Salary)
  const employeePension = basic * 0.07; // 7% Employee Pension
  const employerPension = basic * 0.11; // 11% Employer Pension
  const totalPension = employeePension + employerPension;

  // 3. Taxable Income (Basic Salary + Taxable Allowances)
  const taxableIncome = basic + taxableAllow;

  // No income tax when basic salary is below 4,000 ETB
  if (isIncomeTaxExempt(basic)) {
    const totalEmployeeDeductions = employeePension;
    const netSalary = grossIncome - totalEmployeeDeductions;

    return {
      basicSalary: basic,
      taxableAllowances: taxableAllow,
      nonTaxableAllowances: nonTaxableAllow,
      grossIncome,
      taxableIncome,
      employeePension,
      employerPension,
      totalPension,
      taxRatePercent: 0,
      taxDeduction: 0,
      bracketLabel: `Basic salary below ${INCOME_TAX_EXEMPTION_THRESHOLD.toLocaleString()} ETB (Exempt)`,
      incomeTax: 0,
      calculatedIncomeTax: 0,
      totalEmployeeDeductions,
      netSalary,
    };
  }

  // 4. Ethiopian Monthly Personal Income Tax (PIT) Brackets
  let taxRate = 0;
  let taxDeduction = 0;
  let bracketLabel = "0 - 600 ETB (Exempt)";

  if (taxableIncome <= 600) {
    taxRate = 0;
    taxDeduction = 0;
    bracketLabel = "0 - 600 ETB (0%)";
  } else if (taxableIncome <= 1650) {
    taxRate = 0.10;
    taxDeduction = 60;
    bracketLabel = "601 - 1,650 ETB (10%)";
  } else if (taxableIncome <= 3200) {
    taxRate = 0.15;
    taxDeduction = 142.50;
    bracketLabel = "1,651 - 3,200 ETB (15%)";
  } else if (taxableIncome <= 5250) {
    taxRate = 0.20;
    taxDeduction = 302.50;
    bracketLabel = "3,201 - 5,250 ETB (20%)";
  } else if (taxableIncome <= 7800) {
    taxRate = 0.25;
    taxDeduction = 565.00;
    bracketLabel = "5,251 - 7,800 ETB (25%)";
  } else if (taxableIncome <= 10900) {
    taxRate = 0.30;
    taxDeduction = 955.00;
    bracketLabel = "7,801 - 10,900 ETB (30%)";
  } else {
    taxRate = 0.35;
    taxDeduction = 1500.00;
    bracketLabel = "Over 10,900 ETB (35%)";
  }

  // Calculate Income Tax
  const rawIncomeTax = taxableIncome * taxRate - taxDeduction;
  const incomeTax = Math.max(0, rawIncomeTax);

  // 5. Total Employee Deductions & Net Payable Salary
  const totalEmployeeDeductions = employeePension + incomeTax;
  const netSalary = grossIncome - totalEmployeeDeductions;

  return {
    basicSalary: basic,
    taxableAllowances: taxableAllow,
    nonTaxableAllowances: nonTaxableAllow,
    grossIncome,
    taxableIncome,
    employeePension,
    employerPension,
    totalPension,
    taxRatePercent: taxRate * 100,
    taxDeduction,
    bracketLabel,
    calculatedIncomeTax: incomeTax,
    incomeTax,
    totalEmployeeDeductions,
    netSalary,
  };
};

const applyIncomeTaxOverride = (base, incomeTaxManual, incomeTaxOverride) => {
  const calculatedIncomeTax = base.calculatedIncomeTax ?? base.incomeTax;
  const manual = Boolean(incomeTaxManual);
  const incomeTax = manual ? Math.max(0, Number(incomeTaxOverride) || 0) : calculatedIncomeTax;
  const netSalary = base.grossIncome - base.employeePension - incomeTax;

  return {
    ...base,
    calculatedIncomeTax,
    incomeTax,
    incomeTaxManual: manual,
    netSalary,
    totalEmployeeDeductions: base.employeePension + incomeTax,
  };
};

const payrollFromRecord = (record) =>
  applyIncomeTaxOverride(
    calculatePayroll({
      basicSalary: record.basicSalary || 0,
      taxableAllowances: record.taxableAllowances || 0,
      nonTaxableAllowances: record.nonTaxableAllowances || 0,
    }),
    record.incomeTaxManual,
    record.incomeTaxOverride
  );

const ethiopianMonthNames = [
  "Hamle",
  "Nehase",
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miyazya",
  "Ginbot",
  "Sene",
];

const fixedMonthKeys = [
  "2018-11",
  "2018-12",
  "2019-01",
  "2019-02",
  "2019-03",
  "2019-04",
  "2019-05",
  "2019-06",
  "2019-07",
  "2019-08",
  "2019-09",
  "2019-10",
];

const ethiopianMonthOrder = [
  "11",
  "12",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
];

/**
 * Calculates the next sequential YYYY-MM month key.
 * Increments month and handles roll-over to the next calendar year.
 */
export const getNextMonthKey = (monthKey) => {
  if (!monthKey) return "2018-11";
  const [yearStr, monthStr] = monthKey.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
};

/**
 * Generates an initial rolling list of consecutive month keys.
 */
export const generateInitialMonths = (startKey = "2018-11", count = 12) => {
  const list = [startKey];
  let current = startKey;
  for (let i = 1; i < count; i++) {
    current = getNextMonthKey(current);
    list.push(current);
  }
  return list;
};

const monthLabel = (monthKey, useEthiopianCalendar) => {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-");
  const monthIndex = ethiopianMonthOrder.indexOf(month.padStart(2, "0"));
  if (monthIndex === -1) {
    return monthKey;
  }
  if (useEthiopianCalendar) {
    return `${ethiopianMonthNames[monthIndex]} ${year}`;
  }
  return `${monthKey}`;
};

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return "N/A";
  if (typeof dateVal === "string") return dateVal;
  if (dateVal.toDate && typeof dateVal.toDate === "function") {
    return dateVal.toDate().toLocaleDateString();
  }
  if (dateVal instanceof Date) {
    return dateVal.toLocaleDateString();
  }
  return String(dateVal);
};

const defaultMonthKey = () => fixedMonthKeys[0];

// Initial Mock Employees for Fallback & Interactive Demo
const initialEmployeesMock = [
  { id: "emp-101", name: "Abebe Bikila", defaultSalary: 18500, basicSalary: 18500, title: "Senior Software Engineer" },
  { id: "emp-102", name: "Tigist Assefa", defaultSalary: 12500, basicSalary: 12500, title: "HR Generalist" },
  { id: "emp-103", name: "Mulugeta Tesfaye", defaultSalary: 8200, basicSalary: 8200, title: "Sales Executive" },
  { id: "emp-104", name: "Bethlehem Haile", defaultSalary: 4500, basicSalary: 4500, title: "Office Assistant" },
];

const HRPayroll = () => {
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [basicSalary, setBasicSalary] = useState(0);
  const [taxableAllowances, setTaxableAllowances] = useState(0);
  const [nonTaxableAllowances, setNonTaxableAllowances] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [incomeTaxManual, setIncomeTaxManual] = useState(false);
  const [incomeTaxOverride, setIncomeTaxOverride] = useState(null);
  const [useEthiopianCalendar, setUseEthiopianCalendar] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthStatuses, setMonthStatuses] = useState([]);
  
  // Logic Audit Modal State
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [auditEmployeeData, setAuditEmployeeData] = useState(null);

  // Back pay modal state
  const [backPayModalVisible, setBackPayModalVisible] = useState(false);
  const [backPayWorkMonth, setBackPayWorkMonth] = useState(null);
  const [backPayBasicSalary, setBackPayBasicSalary] = useState(0);
  const [backPayTaxableAllowances, setBackPayTaxableAllowances] = useState(0);
  const [backPayNonTaxableAllowances, setBackPayNonTaxableAllowances] = useState(0);
  const [backPayIncomeTaxManual, setBackPayIncomeTaxManual] = useState(false);
  const [backPayIncomeTaxOverride, setBackPayIncomeTaxOverride] = useState(null);
  const [adjustingRecordId, setAdjustingRecordId] = useState(null);

  const adjustmentFormRef = useRef(null);

  // Helper function to append the next recurring month to the back of the queue ("1 down -> 1 added back")
  const appendNextRecurringMonth = () => {
    setMonthsList((prevMonths) => {
      const lastMonth = prevMonths[prevMonths.length - 1];
      const nextMonthKey = getNextMonthKey(lastMonth);
      if (!prevMonths.includes(nextMonthKey)) {
        return [...prevMonths, nextMonthKey];
      }
      return prevMonths;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadPayrollData = async () => {
      try {
        const [loadedEmployees, loadedPayrollRecords, loadedMonths] = await Promise.all([
          loadHrEmployees(),
          loadHrPayrollRecords(),
          loadHrPayrollMonths(),
        ]);

        if (!isMounted) return;

        const normalizedEmployees = loadedEmployees.length > 0 ? loadedEmployees : initialEmployeesMock;
        const normalizedPayrollRecords = (loadedPayrollRecords || []).map((record) => ({
          ...record,
          basicSalary: Number(record.basicSalary) || 0,
          taxableAllowances: Number(record.taxableAllowances) || 0,
          nonTaxableAllowances: Number(record.nonTaxableAllowances) || 0,
        }));

        const monthKeys = Array.from(
          new Set([
            ...loadedMonths
              .map((month) => month.monthKey || month.id || month.key || month.period || month.month)
              .filter(Boolean),
            ...normalizedPayrollRecords.map((record) => record.monthKey).filter(Boolean),
            ...generateInitialMonths(defaultMonthKey(), 12),
          ])
        );

        const initialMonthStatuses = monthKeys.map((monthKey) => {
          const foundMonth = loadedMonths.find(
            (month) => (month.monthKey || month.id || month.key || month.period || month.month) === monthKey
          );
          return {
            id: monthKey,
            status: foundMonth?.status || "Pending",
            completedAt: foundMonth?.completedAt || null,
            updatedAt: foundMonth?.updatedAt || null,
          };
        });

        setEmployees(normalizedEmployees);
        setPayrollRecords(normalizedPayrollRecords);
        setMonthsList(monthKeys);
        setMonthStatuses(initialMonthStatuses);

        if (!selectedMonth && monthKeys.length > 0) {
          setSelectedMonth(monthKeys[0]);
        }
        if (!selectedEmployeeId && normalizedEmployees.length > 0) {
          setSelectedEmployeeId(normalizedEmployees[0].id);
        }
      } catch (error) {
        console.error("Error loading HR payroll data:", error);
        message.error("Could not load payroll data from the database.");
        setEmployees(initialEmployeesMock);
        setMonthsList(generateInitialMonths(defaultMonthKey(), 12));
        setMonthStatuses(generateInitialMonths(defaultMonthKey(), 12).map((monthKey) => ({ id: monthKey, status: "Pending" })));
      }
    };

    loadPayrollData();

    return () => {
      isMounted = false;
    };
  }, []);

  const months = useMemo(() => monthsList, [monthsList]);

  const monthStatusMap = useMemo(
    () =>
      monthStatuses.reduce((acc, month) => {
        acc[month.id] = month;
        return acc;
      }, {}),
    [monthStatuses]
  );

  const activeMonthKey = useMemo(
    () =>
      months.find((monthKey) => monthStatusMap[monthKey]?.status !== "Paid") || months[0],
    [months, monthStatusMap]
  );

  const selectedMonthStatus = monthStatusMap[selectedMonth]?.status || "Pending";
  const isSelectedMonthCompleted = selectedMonthStatus === "Paid";
  const isSelectedMonthActive = selectedMonth === activeMonthKey && !isSelectedMonthCompleted;

  const upcomingMonthKeys = useMemo(() => {
    const activeIndex = months.indexOf(activeMonthKey);
    if (activeIndex === -1) {
      return months.slice();
    }
    return months.slice(activeIndex);
  }, [months, activeMonthKey]);

  const completedMonthKeys = useMemo(
    () => months.filter((monthKey) => monthStatusMap[monthKey]?.status === "Paid"),
    [months, monthStatusMap]
  );

  const selectedMonthSummary = useMemo(
    () => getMonthPaymentSummary(selectedMonth, employees, payrollRecords),
    [selectedMonth, employees, payrollRecords]
  );

  const selectedEmployeeArrears = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return getEmployeePendingArrears(selectedEmployeeId, payrollRecords, monthStatusMap);
  }, [selectedEmployeeId, payrollRecords, monthStatusMap]);

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  const backPayMonthOptions = useMemo(
    () =>
      completedMonthKeys.map((monthKey) => ({
        label: monthLabel(monthKey, useEthiopianCalendar),
        value: monthKey,
      })),
    [completedMonthKeys, useEthiopianCalendar]
  );

  const currentPayrollRecord = useMemo(() => {
    if (adjustingRecordId) {
      return payrollRecords.find((record) => record.id === adjustingRecordId) || null;
    }
    return payrollRecords.find(
      (record) =>
        record.monthKey === selectedMonth &&
        record.employeeId === selectedEmployeeId &&
        record.recordType !== "arrears"
    );
  }, [adjustingRecordId, payrollRecords, selectedMonth, selectedEmployeeId]);

  const loadPayrollRecordIntoForm = useCallback(
    (record, employeeId) => {
      const employee = employees.find((emp) => emp.id === employeeId);
      const defaultSalary = employee?.defaultSalary ?? employee?.basicSalary ?? 0;

      if (record) {
        setBasicSalary(record.basicSalary ?? defaultSalary);
        setTaxableAllowances(record.taxableAllowances || 0);
        setNonTaxableAllowances(record.nonTaxableAllowances || 0);
        setStatus(record.status || "Pending");
        setIncomeTaxManual(Boolean(record.incomeTaxManual));
        setIncomeTaxOverride(
          record.incomeTaxManual
            ? Number(record.incomeTaxOverride ?? record.incomeTax ?? 0)
            : null
        );
        return;
      }

      setBasicSalary(defaultSalary);
      setTaxableAllowances(0);
      setNonTaxableAllowances(0);
      setStatus("Pending");
      setIncomeTaxManual(false);
      setIncomeTaxOverride(null);
    },
    [employees]
  );

  useEffect(() => {
    if (adjustingRecordId) return;
    loadPayrollRecordIntoForm(currentPayrollRecord, selectedEmployeeId);
  }, [adjustingRecordId, currentPayrollRecord, selectedEmployeeId, loadPayrollRecordIntoForm]);

  useEffect(() => {
    setAdjustingRecordId(null);
  }, [selectedMonth]);

  const handleAdjustRecord = (row) => {
    const record = payrollRecords.find((item) => item.id === row.id);
    setAdjustingRecordId(row.id);
    setSelectedEmployeeId(row.employeeId);
    loadPayrollRecordIntoForm(record, row.employeeId);

    window.requestAnimationFrame(() => {
      adjustmentFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    message.success(`Adjusting payroll for ${row.employeeName}`);
  };

  const basePayrollCalc = useMemo(
    () =>
      calculatePayroll({
        basicSalary,
        taxableAllowances,
        nonTaxableAllowances,
      }),
    [basicSalary, taxableAllowances, nonTaxableAllowances]
  );

  const payrollInputs = useMemo(
    () => applyIncomeTaxOverride(basePayrollCalc, incomeTaxManual, incomeTaxOverride),
    [basePayrollCalc, incomeTaxManual, incomeTaxOverride]
  );

  const backPayBaseCalc = useMemo(
    () =>
      calculatePayroll({
        basicSalary: backPayBasicSalary,
        taxableAllowances: backPayTaxableAllowances,
        nonTaxableAllowances: backPayNonTaxableAllowances,
      }),
    [backPayBasicSalary, backPayTaxableAllowances, backPayNonTaxableAllowances]
  );

  const backPayCalc = useMemo(
    () => applyIncomeTaxOverride(backPayBaseCalc, backPayIncomeTaxManual, backPayIncomeTaxOverride),
    [backPayBaseCalc, backPayIncomeTaxManual, backPayIncomeTaxOverride]
  );

  const activeMonthPayrollTotal = useMemo(() => {
    const activeRecords = payrollRecords.filter((record) => record.monthKey === activeMonthKey);
    const recordTotal = activeRecords.reduce((sum, record) => {
      const calculations = calculatePayroll({
        basicSalary: record.basicSalary || 0,
        taxableAllowances: record.taxableAllowances || 0,
        nonTaxableAllowances: record.nonTaxableAllowances || 0,
      });
      return sum + calculations.grossIncome;
    }, 0);

    const employeeIdsWithRecord = new Set(activeRecords.map((record) => record.employeeId));
    const missingTotal = employees.reduce((sum, employee) => {
      if (!isEmployeeActive(employee) || employeeIdsWithRecord.has(employee.id)) {
        return sum;
      }
      const calculations = calculatePayroll({
        basicSalary: employee.defaultSalary || 0,
        taxableAllowances: 0,
        nonTaxableAllowances: 0,
      });
      return sum + calculations.grossIncome;
    }, 0);

    return recordTotal + missingTotal;
  }, [activeMonthKey, payrollRecords, employees]);

  const currentMonthRecords = payrollRecords.filter(
    (record) =>
      (record.monthKey === selectedMonth && record.recordType !== "arrears") ||
      (record.recordType === "arrears" && record.paidInMonthKey === selectedMonth)
  );
  const selectedMonthPayrollRows = currentMonthRecords.map((record) => {
    const employee = employees.find((emp) => emp.id === record.employeeId) || {};
    const calculations = payrollFromRecord(record);
    const workMonth = record.workMonthKey || record.monthKey;
    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: employee.name || "Unknown Employee",
      employeeStatus: employee.status || "Unknown",
      isArrears: record.recordType === "arrears",
      workMonthKey: workMonth,
      incomeTaxManual: Boolean(record.incomeTaxManual),
      basicSalaryVal: record.basicSalary || 0,
      taxableAllowancesVal: record.taxableAllowances || 0,
      nonTaxableAllowancesVal: record.nonTaxableAllowances || 0,
      gross: `${calculations.grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`,
      taxable: `${calculations.taxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`,
      employeePension: `${calculations.employeePension.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`,
      employerPension: `${calculations.employerPension.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`,
      incomeTax: `${calculations.incomeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`,
      netSalary: `${calculations.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`,
      status: record.status || "Pending",
      rawCalculations: calculations,
    };
  });

  const handleOpenAudit = (record) => {
    setAuditEmployeeData(record);
    setAuditModalVisible(true);
  };

  const payrollTableColumns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (text, record) => (
        <Space size={4} wrap>
          <Text bold>{text}</Text>
          {!isEmployeeActive({ status: record.employeeStatus }) && <Tag color="default">Inactive</Tag>}
          {record.isArrears && (
            <Tag color="purple">Back pay · {monthLabel(record.workMonthKey, useEthiopianCalendar)}</Tag>
          )}
        </Space>
      ),
    },
    { title: "Gross Income", dataIndex: "gross", key: "gross" },
    { title: "Taxable Base", dataIndex: "taxable", key: "taxable" },
    { title: "Emp. Pension (7%)", dataIndex: "employeePension", key: "employeePension" },
    { title: "Empr. Pension (11%)", dataIndex: "employerPension", key: "employerPension" },
    { title: "Income Tax", dataIndex: "incomeTax", key: "incomeTax", render: (text, record) => (
      <Space size={4}>
        <span>{text}</span>
        {record.incomeTaxManual && <Tag color="orange">Adjusted</Tag>}
      </Space>
    ) },
    { title: "Net Salary", dataIndex: "netSalary", key: "netSalary", render: (text) => <Text style={{ color: '#1677ff', fontWeight: 'bold' }}>{text}</Text> },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (st) => (
        <Tag color={st === "Paid" ? "gold" : st === "Processing" ? "blue" : "default"}>
          {st}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            ghost
            onClick={(e) => {
              e.stopPropagation();
              handleAdjustRecord(record);
            }}
          >
            Adjust
          </Button>
          <Button
            type="link"
            icon={<Calculator size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAudit(record);
            }}
          >
            Breakdown
          </Button>
        </Space>
      ),
    },
  ];

  const savePayrollRecord = async () => {
    if (isSelectedMonthCompleted) {
      message.error("This payroll month is completed and cannot be edited.");
      return;
    }
    if (!selectedEmployeeId || !selectedMonth) {
      message.error("Please select an employee and month first.");
      return;
    }

    const newDefaultSalary = Number(basicSalary) || 0;
    const now = new Date();
    const editingRecord = currentPayrollRecord;
    const recordId = editingRecord?.id || `pay-${selectedEmployeeId}-${selectedMonth}`;

    setSaving(true);
    try {
      const payload = {
        employeeId: selectedEmployeeId,
        monthKey: editingRecord?.monthKey || selectedMonth,
        basicSalary: newDefaultSalary,
        taxableAllowances: Number(taxableAllowances) || 0,
        nonTaxableAllowances: Number(nonTaxableAllowances) || 0,
        incomeTaxManual,
        incomeTaxOverride: incomeTaxManual ? Number(incomeTaxOverride) || 0 : null,
        incomeTax: payrollInputs.incomeTax,
        calculatedIncomeTax: payrollInputs.calculatedIncomeTax,
        status,
        updatedAt: now,
        ...(editingRecord?.recordType === "arrears"
          ? {
              recordType: "arrears",
              workMonthKey: editingRecord.workMonthKey || editingRecord.monthKey,
              paidInMonthKey: editingRecord.paidInMonthKey || activeMonthKey,
            }
          : {}),
      };

      const firestorePayload = {
        ...payload,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "Payroll", recordId), firestorePayload, { merge: true });

      setEmployees((current) =>
        current.map((emp) =>
          emp.id === selectedEmployeeId ? { ...emp, defaultSalary: newDefaultSalary, basicSalary: newDefaultSalary } : emp
        )
      );

      setPayrollRecords((current) => {
        const existingIndex = current.findIndex((record) => record.id === recordId);
        if (existingIndex >= 0) {
          return current.map((record) => (record.id === recordId ? { ...record, ...payload, updatedAt: now } : record));
        }
        return [...current, { ...payload, id: recordId, key: recordId, updatedAt: now }];
      });

      message.success("Payroll record successfully updated.");
    } catch (error) {
      console.error("Error saving payroll record:", error);
      message.error("Could not save payroll record.");
    } finally {
      setSaving(false);
    }
  };

  const markMonthCompleted = async () => {
    if (!isSelectedMonthActive) {
      message.error("You can only complete the current active payroll month.");
      return;
    }
    if (!selectedMonth) return;

    if (!selectedMonthSummary.canCloseMonth) {
      message.error(formatMonthCloseBlockMessage(selectedMonthSummary));
      return;
    }

    setSaving(true);
    try {
      const completedAt = new Date();
      const monthPayload = {
        id: selectedMonth,
        monthKey: selectedMonth,
        status: "Paid",
        completedAt,
        updatedAt: completedAt,
      };

      await setDoc(doc(db, "PayrollMonths", selectedMonth), monthPayload, { merge: true });

      setMonthStatuses((current) => [
        ...current.filter((month) => month.id !== selectedMonth),
        monthPayload,
      ]);

      appendNextRecurringMonth();

      const nextMonth = upcomingMonthKeys.find((monthKey) => monthKey !== selectedMonth);
      if (nextMonth) {
        setSelectedMonth(nextMonth);
      }
      message.success("Payroll month closed! Next recurring period automatically added to queue.");
    } catch (error) {
      console.error("Error updating payroll month status:", error);
      message.error("Could not complete payroll month.");
    } finally {
      setSaving(false);
    }
  };

  const updateMonthStatus = async (newStatus) => {
    if (!selectedMonth) return;

    if (newStatus === "Paid") {
      const summary = getMonthPaymentSummary(selectedMonth, employees, payrollRecords);
      if (!summary.canCloseMonth) {
        message.error(formatMonthCloseBlockMessage(summary));
        return;
      }
    }

    setSaving(true);
    try {
      const updatedAt = new Date();
      const monthPayload = {
        id: selectedMonth,
        monthKey: selectedMonth,
        status: newStatus,
        updatedAt,
        ...(newStatus === "Paid" ? { completedAt: updatedAt } : {}),
      };

      await setDoc(doc(db, "PayrollMonths", selectedMonth), monthPayload, { merge: true });

      setMonthStatuses((current) => [
        ...current.filter((m) => m.id !== selectedMonth),
        monthPayload,
      ]);

      if (newStatus === "Paid") {
        appendNextRecurringMonth();
      }

      message.success(`Month status updated to ${newStatus}.`);
    } catch (err) {
      console.error("Error updating month status:", err);
      message.error("Could not update month status.");
    } finally {
      setSaving(false);
    }
  };

  const employeeOptions = employees.map((employee) => ({
    label: `${employee.name} (${employee.role || employee.title || "Staff"})${
      !isEmployeeActive(employee) ? " · Inactive" : ""
    }`,
    value: employee.id,
  }));

  const openBackPayModal = (workMonthKey = null) => {
    if (!selectedEmployeeId) {
      message.error("Select an employee first.");
      return;
    }

    const targetWorkMonth = workMonthKey || selectedEmployeeArrears[0]?.monthKey || completedMonthKeys[0];
    if (!targetWorkMonth) {
      message.error("No closed payroll months available for back pay.");
      return;
    }

    const existingRecord = payrollRecords.find(
      (record) =>
        record.employeeId === selectedEmployeeId &&
        (record.workMonthKey || record.monthKey) === targetWorkMonth &&
        (record.status || "Pending") !== "Paid"
    );
    const defaultSalary = selectedEmployee?.defaultSalary ?? selectedEmployee?.basicSalary ?? 0;

    setBackPayWorkMonth(targetWorkMonth);
    setBackPayBasicSalary(existingRecord?.basicSalary ?? defaultSalary);
    setBackPayTaxableAllowances(existingRecord?.taxableAllowances || 0);
    setBackPayNonTaxableAllowances(existingRecord?.nonTaxableAllowances || 0);
    setBackPayIncomeTaxManual(Boolean(existingRecord?.incomeTaxManual));
    setBackPayIncomeTaxOverride(
      existingRecord?.incomeTaxManual
        ? Number(existingRecord.incomeTaxOverride ?? existingRecord.incomeTax ?? 0)
        : null
    );
    setBackPayModalVisible(true);
  };

  const saveBackPayRecord = async () => {
    if (!selectedEmployeeId || !backPayWorkMonth) {
      message.error("Select an employee and work month for back pay.");
      return;
    }

    const existingRecord = payrollRecords.find(
      (record) =>
        record.employeeId === selectedEmployeeId &&
        (record.workMonthKey || record.monthKey) === backPayWorkMonth
    );
    const recordId = existingRecord?.id || buildBackPayRecordId(selectedEmployeeId, backPayWorkMonth);
    const now = new Date();

    setSaving(true);
    try {
      const payload = {
        employeeId: selectedEmployeeId,
        monthKey: backPayWorkMonth,
        workMonthKey: backPayWorkMonth,
        paidInMonthKey: activeMonthKey,
        recordType: "arrears",
        basicSalary: Number(backPayBasicSalary) || 0,
        taxableAllowances: Number(backPayTaxableAllowances) || 0,
        nonTaxableAllowances: Number(backPayNonTaxableAllowances) || 0,
        incomeTaxManual: backPayIncomeTaxManual,
        incomeTaxOverride: backPayIncomeTaxManual ? Number(backPayIncomeTaxOverride) || 0 : null,
        incomeTax: backPayCalc.incomeTax,
        calculatedIncomeTax: backPayCalc.calculatedIncomeTax,
        status: "Paid",
        updatedAt: now,
      };

      await setDoc(
        doc(db, "Payroll", recordId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true }
      );

      setPayrollRecords((current) => {
        const existingIndex = current.findIndex((record) => record.id === recordId);
        if (existingIndex >= 0) {
          return current.map((record) => (record.id === recordId ? { ...record, ...payload, id: recordId, key: recordId } : record));
        }
        return [...current, { ...payload, id: recordId, key: recordId }];
      });

      setBackPayModalVisible(false);
      message.success(
        `Back pay recorded for ${monthLabel(backPayWorkMonth, useEthiopianCalendar)} in ${monthLabel(activeMonthKey, useEthiopianCalendar)}.`
      );
    } catch (error) {
      console.error("Error saving back pay record:", error);
      message.error("Could not save back pay record.");
    } finally {
      setSaving(false);
    }
  };

  const totalPayrollAmountLabel = `${activeMonthPayrollTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`;
  const selectedMonthLabel = monthLabel(selectedMonth, useEthiopianCalendar);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        
        {/* Header Title Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck color="#1677ff" size={32} /> Ethiopian HR & Payroll
            </Title>
            <Paragraph type="secondary" style={{ margin: 0, marginTop: 4 }}>
              Compliant payroll calculation engine under Ethiopian Tax Proclamation No. 979/2016.
            </Paragraph>
          </div>
          <Space>
            <Tag color="blue" style={{ padding: "4px 12px", borderRadius: 12, fontSize: 13 }}>
              ET Tax Engine Active
            </Tag>
          </Space>
        </div>

        {selectedEmployeeArrears.length > 0 && selectedEmployee && (
          <Alert
            type="warning"
            showIcon
            message={`${selectedEmployee.name} has unpaid salary from closed month(s)`}
            description={
              <Space direction="vertical" size={8}>
                <Text>
                  Pending:{" "}
                  {selectedEmployeeArrears
                    .map((record) => monthLabel(record.workMonthKey || record.monthKey, useEthiopianCalendar))
                    .join(", ")}
                </Text>
                <Button type="primary" size="small" onClick={() => openBackPayModal()}>
                  Record Back Pay
                </Button>
              </Space>
            }
          />
        )}

        {/* Selected Month Summary Card */}
        <Card bordered={false} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: 12 }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space direction="horizontal" style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 16 }}>
              <div>
                <Title level={3} style={{ margin: 0, color: "#1e293b" }}>
                  {selectedMonthLabel}
                </Title>
                <Text type="secondary">Current active payroll period</Text>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Text type="secondary">Month Status:</Text>
                  <Select
                    value={selectedMonthStatus}
                    onChange={(val) => updateMonthStatus(val)}
                    options={[
                      { label: "Pending", value: "Pending" },
                      { label: "Processing", value: "Processing" },
                      ...(selectedMonthStatus === "Paid"
                        ? [{ label: "Paid", value: "Paid" }]
                        : []),
                    ]}
                    style={{ width: 150 }}
                    disabled={saving || isSelectedMonthCompleted}
                  />
                  {!isSelectedMonthCompleted && (
                    <Text type={selectedMonthSummary.canCloseMonth ? "success" : "warning"}>
                      {selectedMonthSummary.paidCount}/{selectedMonthSummary.totalCount} required employees paid
                      {selectedMonthSummary.inactiveBlockingCount > 0
                        ? ` (${selectedMonthSummary.inactiveBlockingCount} inactive with open entries)`
                        : ""}
                    </Text>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", background: "#f1f5f9", padding: "16px 24px", borderRadius: 12 }}>
                <Text type="secondary" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Monthly Payroll (Gross)
                </Text>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a" }}>
                  {totalPayrollAmountLabel}
                </div>
              </div>
            </Space>

            <Divider style={{ margin: "12px 0" }} />

            <Space style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
              <Space size="middle">
                <Tag color="green">Active Period</Tag>
                <Tag color="blue">Upcoming</Tag>
                <Tag color="default">Pending</Tag>
                <Tag color="gold">Paid</Tag>
              </Space>
              <Space>
                <Text bold>Calendar Display:</Text>
                <Switch
                  checked={useEthiopianCalendar}
                  onChange={setUseEthiopianCalendar}
                  checkedChildren="Ethiopian EC"
                  unCheckedChildren="Gregorian GC"
                />
              </Space>
            </Space>
          </Space>
        </Card>

        {/* Upcoming Months Horizontal Cards */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0 }}>Recurring Payroll Timeline</Title>
            <Button
              type="dashed"
              size="small"
              onClick={() => {
                appendNextRecurringMonth();
                message.info("Next payroll period added to recurring timeline.");
              }}
            >
              + Add Next Payroll Period
            </Button>
          </div>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {upcomingMonthKeys.map((monthKey) => {
              const monthStatus = monthStatusMap[monthKey]?.status || "Pending";
              const isActive = monthKey === activeMonthKey;
              const tagColor = isActive ? "green" : monthStatus === "Paid" ? "gold" : "blue";
              const statusTag = isActive ? "Active" : monthStatus === "Paid" ? "Paid" : "Pending";
              const isSelected = monthKey === selectedMonth;
              
              return (
                <Card
                  key={monthKey}
                  hoverable
                  style={{
                    minWidth: 170,
                    width: 170,
                    cursor: "pointer",
                    flex: "0 0 auto",
                    borderRadius: 10,
                    border: isSelected ? "2px solid #1677ff" : "1px solid #e2e8f0",
                    background: isSelected ? "#eff6ff" : "#ffffff",
                  }}
                  bodyStyle={{ padding: 14 }}
                  onClick={() => setSelectedMonth(monthKey)}
                >
                  <div style={{ marginBottom: 6, fontWeight: 700, fontSize: 15 }}>
                    {monthLabel(monthKey, useEthiopianCalendar)}
                  </div>
                  <Tag color={tagColor}>{statusTag}</Tag>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Completed Payroll Months History */}
        {completedMonthKeys.length > 0 && (
          <Card title="Completed Payroll History" bordered={false} style={{ borderRadius: 12 }}>
            <List
              dataSource={completedMonthKeys}
              renderItem={(monthKey) => (
                <List.Item
                  onClick={() => setSelectedMonth(monthKey)}
                  style={{ cursor: "pointer" }}
                >
                  <List.Item.Meta
                    avatar={<CheckCircle color="#52c41a" />}
                    title={monthLabel(monthKey, useEthiopianCalendar)}
                    description={
                      monthStatusMap[monthKey]?.completedAt
                        ? `Closed on ${formatDisplayDate(monthStatusMap[monthKey].completedAt)}`
                        : "Completed and Paid"
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Payroll Employee Form Details & Live Computations */}
        <div ref={adjustmentFormRef}>
        <Card
          title={
            <Space>
              <User size={18} />
              <span>
                Employee Salary & Allowance Adjustments — {selectedMonthLabel}
                {adjustingRecordId && currentPayrollRecord?.recordType === "arrears" && (
                  <Tag color="purple" style={{ marginLeft: 8 }}>
                    Back pay · {monthLabel(currentPayrollRecord.workMonthKey || currentPayrollRecord.monthKey, useEthiopianCalendar)}
                  </Tag>
                )}
              </span>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            
            {/* Input Controls */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Select Employee</label>
                <Select
                  style={{ width: "100%" }}
                  options={employeeOptions}
                  value={selectedEmployeeId}
                  onChange={(value) => {
                    setAdjustingRecordId(null);
                    setSelectedEmployeeId(value);
                  }}
                  placeholder="Select employee"
                  disabled={isSelectedMonthCompleted}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Basic Salary (ETB)</label>
                <InputNumber
                  min={0}
                  value={basicSalary}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={(value) => setBasicSalary(Number(value) || 0)}
                  disabled={isSelectedMonthCompleted}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Taxable Allowances</label>
                <InputNumber
                  min={0}
                  value={taxableAllowances}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={(value) => setTaxableAllowances(Number(value) || 0)}
                  disabled={isSelectedMonthCompleted}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Non-Taxable Allowances</label>
                <InputNumber
                  min={0}
                  value={nonTaxableAllowances}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={(value) => setNonTaxableAllowances(Number(value) || 0)}
                  disabled={isSelectedMonthCompleted}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Payment Status</label>
                <Select
                  style={{ width: "100%" }}
                  options={[
                    { label: "Pending", value: "Pending" },
                    { label: "Processing", value: "Processing" },
                    { label: "Paid", value: "Paid" },
                  ]}
                  value={status}
                  onChange={(value) => setStatus(value)}
                  disabled={isSelectedMonthCompleted}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space wrap>
                    <Switch
                      checked={incomeTaxManual}
                      onChange={(checked) => {
                        setIncomeTaxManual(checked);
                        if (checked) {
                          setIncomeTaxOverride(basePayrollCalc.calculatedIncomeTax ?? basePayrollCalc.incomeTax);
                        } else {
                          setIncomeTaxOverride(null);
                        }
                      }}
                      disabled={isSelectedMonthCompleted}
                    />
                    <Text strong>Company-adjusted income tax</Text>
                  </Space>
                  <Text type="secondary">
                    Calculated: {(basePayrollCalc.calculatedIncomeTax ?? basePayrollCalc.incomeTax).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Income Tax (ETB)</label>
                <InputNumber
                  min={0}
                  value={incomeTaxManual ? incomeTaxOverride : payrollInputs.incomeTax}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={(value) => setIncomeTaxOverride(Number(value) || 0)}
                  disabled={!incomeTaxManual || isSelectedMonthCompleted}
                />
              </Col>
              <Col xs={24} md={6}>
                <Button
                  style={{ marginTop: 28 }}
                  onClick={() => {
                    setIncomeTaxManual(false);
                    setIncomeTaxOverride(null);
                  }}
                  disabled={!incomeTaxManual || isSelectedMonthCompleted}
                >
                  Reset to calculated tax
                </Button>
              </Col>
            </Row>

            <Divider style={{ margin: "8px 0" }} />

            {/* Live Calculation Output Cards */}
            <div>
              <Text type="secondary" style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>
                Real-Time Ethiopian Payroll Computation:
              </Text>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8} md={4}>
                  <Card size="small" style={{ background: "#fafafa" }}>
                    <Statistic
                      title="Gross Income"
                      value={payrollInputs.grossIncome}
                      precision={2}
                      suffix="ETB"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Card size="small" style={{ background: "#fafafa" }}>
                    <Statistic
                      title="Taxable Base"
                      value={payrollInputs.taxableIncome}
                      precision={2}
                      suffix="ETB"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Card size="small" style={{ background: "#fff7e6" }}>
                    <Statistic
                      title="Emp Pension (7%)"
                      value={payrollInputs.employeePension}
                      precision={2}
                      suffix="ETB"
                      valueStyle={{ fontSize: 16, color: "#d46b08" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Card size="small" style={{ background: "#f6ffed" }}>
                    <Statistic
                      title="Empr Pension (11%)"
                      value={payrollInputs.employerPension}
                      precision={2}
                      suffix="ETB"
                      valueStyle={{ fontSize: 16, color: "#389e0d" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Card size="small" style={{ background: incomeTaxManual ? "#fff7e6" : "#fff1f0" }}>
                    <Statistic
                      title={incomeTaxManual ? "Income Tax (Adjusted)" : "Income Tax"}
                      value={payrollInputs.incomeTax}
                      precision={2}
                      suffix="ETB"
                      valueStyle={{ fontSize: 16, color: "#cf1322" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Card size="small" style={{ background: "#e6f4ff", borderColor: "#91ca pt" }}>
                    <Statistic
                      title="Net Payable Salary"
                      value={payrollInputs.netSalary}
                      precision={2}
                      suffix="ETB"
                      valueStyle={{ fontSize: 17, color: "#0958d9", fontWeight: "bold" }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            {/* Action Buttons */}
            <Space style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  onClick={savePayrollRecord}
                  loading={saving}
                  disabled={isSelectedMonthCompleted}
                >
                  Save Payroll Record
                </Button>
                <Button size="large" onClick={() => openBackPayModal()} disabled={completedMonthKeys.length === 0}>
                  Record Back Pay
                </Button>
              </Space>
              <Tooltip
                title={
                  !selectedMonthSummary.canCloseMonth && isSelectedMonthActive
                    ? formatMonthCloseBlockMessage(selectedMonthSummary)
                    : null
                }
              >
                <Button
                  type="primary"
                  danger
                  size="large"
                  onClick={markMonthCompleted}
                  disabled={!isSelectedMonthActive || !selectedMonthSummary.canCloseMonth}
                >
                  Close & Mark Month as Paid
                </Button>
              </Tooltip>
            </Space>
          </Space>
        </Card>
        </div>

        {/* Main Payroll Table */}
        <Card title={`Monthly Payroll Roster — ${selectedMonthLabel}`} bordered={false} style={{ borderRadius: 12 }}>
          <Table
            columns={payrollTableColumns}
            dataSource={selectedMonthPayrollRows}
            pagination={false}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleAdjustRecord(record),
              style: {
                cursor: "pointer",
                background:
                  record.id === adjustingRecordId ||
                  (!adjustingRecordId && record.employeeId === selectedEmployeeId)
                    ? "#e6f4ff"
                    : "inherit",
              },
            })}
          />
        </Card>
      </Space>

      {/* Logic Breakdown Audit Modal */}
      <Modal
        title={
          <Space>
            <Calculator color="#1677ff" />
            <span>Ethiopian Payroll Math Audit — {auditEmployeeData?.employeeName}</span>
          </Space>
        }
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuditModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={650}
      >
        {auditEmployeeData && (
          <div style={{ marginTop: 16 }}>
            <Card type="inner" title="1. Income & Tax Base" style={{ marginBottom: 12 }}>
              <p><strong>Basic Salary:</strong> {auditEmployeeData.rawCalculations.basicSalary.toLocaleString()} ETB</p>
              <p><strong>Taxable Allowances:</strong> {auditEmployeeData.rawCalculations.taxableAllowances.toLocaleString()} ETB</p>
              <p><strong>Non-Taxable Allowances:</strong> {auditEmployeeData.rawCalculations.nonTaxableAllowances.toLocaleString()} ETB</p>
              <Divider style={{ margin: "8px 0" }} />
              <p><strong>Gross Income Formula:</strong> Basic + Taxable Allow. + Non-Taxable Allow. = <strong>{auditEmployeeData.rawCalculations.grossIncome.toLocaleString()} ETB</strong></p>
              <p><strong>Taxable Base Formula:</strong> Basic + Taxable Allow. = <strong>{auditEmployeeData.rawCalculations.taxableIncome.toLocaleString()} ETB</strong></p>
            </Card>

            <Card type="inner" title="2. Mandatory Pension Contributions" style={{ marginBottom: 12 }}>
              <p><strong>Employee Pension (7% of Basic):</strong> {auditEmployeeData.rawCalculations.basicSalary.toLocaleString()} × 0.07 = <strong>{auditEmployeeData.rawCalculations.employeePension.toLocaleString()} ETB</strong></p>
              <p><strong>Employer Pension (11% of Basic):</strong> {auditEmployeeData.rawCalculations.basicSalary.toLocaleString()} × 0.11 = <strong>{auditEmployeeData.rawCalculations.employerPension.toLocaleString()} ETB</strong></p>
              <p><strong>Total Pension Fund:</strong> 18% = <strong>{auditEmployeeData.rawCalculations.totalPension.toLocaleString()} ETB</strong></p>
            </Card>

            <Card type="inner" title="3. Employment Income Tax (Proc 979/2016)" style={{ marginBottom: 12 }}>
              <p><strong>Applied Tax Bracket:</strong> {auditEmployeeData.rawCalculations.bracketLabel}</p>
              <p><strong>Calculated Tax:</strong> {(auditEmployeeData.rawCalculations.calculatedIncomeTax ?? auditEmployeeData.rawCalculations.incomeTax).toLocaleString()} ETB</p>
              {auditEmployeeData.incomeTaxManual && (
                <p><strong>Company-Adjusted Tax:</strong> {auditEmployeeData.rawCalculations.incomeTax.toLocaleString()} ETB</p>
              )}
              {!auditEmployeeData.incomeTaxManual && (
                <>
                  <p><strong>Tax Rate:</strong> {auditEmployeeData.rawCalculations.taxRatePercent}%</p>
                  <p><strong>Deduction Constant:</strong> {auditEmployeeData.rawCalculations.taxDeduction.toLocaleString()} ETB</p>
                  <Divider style={{ margin: "8px 0" }} />
                  <p><strong>Formula:</strong> (Taxable Base × Tax Rate) - Deduction</p>
                  <p><strong>Calculation:</strong> ({auditEmployeeData.rawCalculations.taxableIncome.toLocaleString()} × {auditEmployeeData.rawCalculations.taxRatePercent}%) - {auditEmployeeData.rawCalculations.taxDeduction} = <strong>{auditEmployeeData.rawCalculations.incomeTax.toLocaleString()} ETB</strong></p>
                </>
              )}
            </Card>

            <Card type="inner" title="4. Final Net Salary Summary" style={{ background: "#e6f4ff" }}>
              <p><strong>Gross Income:</strong> {auditEmployeeData.rawCalculations.grossIncome.toLocaleString()} ETB</p>
              <p><strong>Total Employee Deductions (Pension 7% + PIT Tax):</strong> {auditEmployeeData.rawCalculations.totalEmployeeDeductions.toLocaleString()} ETB</p>
              <Title level={4} style={{ color: "#0958d9", marginTop: 8 }}>
                Net Payable: {auditEmployeeData.rawCalculations.netSalary.toLocaleString()} ETB
              </Title>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <Clock color="#1677ff" />
            <span>Record Back Pay — {selectedEmployee?.name || "Employee"}</span>
          </Space>
        }
        open={backPayModalVisible}
        onCancel={() => setBackPayModalVisible(false)}
        onOk={saveBackPayRecord}
        okText="Save Back Pay as Paid"
        confirmLoading={saving}
        width={720}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="Back pay settles salary for a closed work month without reopening that period."
            description={`Payment will be recorded in the current open month (${monthLabel(activeMonthKey, useEthiopianCalendar)}).`}
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Work Month (closed)</label>
              <Select
                style={{ width: "100%" }}
                value={backPayWorkMonth}
                onChange={setBackPayWorkMonth}
                options={backPayMonthOptions}
                placeholder="Select closed month"
              />
            </Col>
            <Col xs={24} md={12}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Paid In (current month)</label>
              <Select
                style={{ width: "100%" }}
                value={activeMonthKey}
                disabled
                options={[{ label: monthLabel(activeMonthKey, useEthiopianCalendar), value: activeMonthKey }]}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Basic Salary (ETB)</label>
              <InputNumber
                min={0}
                value={backPayBasicSalary}
                style={{ width: "100%" }}
                onChange={(value) => setBackPayBasicSalary(Number(value) || 0)}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Taxable Allowances</label>
              <InputNumber
                min={0}
                value={backPayTaxableAllowances}
                style={{ width: "100%" }}
                onChange={(value) => setBackPayTaxableAllowances(Number(value) || 0)}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Non-Taxable Allowances</label>
              <InputNumber
                min={0}
                value={backPayNonTaxableAllowances}
                style={{ width: "100%" }}
                onChange={(value) => setBackPayNonTaxableAllowances(Number(value) || 0)}
              />
            </Col>
            <Col xs={24}>
              <Space wrap align="center">
                <Switch
                  checked={backPayIncomeTaxManual}
                  onChange={(checked) => {
                    setBackPayIncomeTaxManual(checked);
                    if (checked) {
                      setBackPayIncomeTaxOverride(backPayBaseCalc.calculatedIncomeTax ?? backPayBaseCalc.incomeTax);
                    } else {
                      setBackPayIncomeTaxOverride(null);
                    }
                  }}
                />
                <Text strong>Company-adjusted income tax</Text>
                <Text type="secondary">
                  Calculated: {(backPayBaseCalc.calculatedIncomeTax ?? backPayBaseCalc.incomeTax).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Income Tax (ETB)</label>
              <InputNumber
                min={0}
                value={backPayIncomeTaxManual ? backPayIncomeTaxOverride : backPayCalc.incomeTax}
                style={{ width: "100%" }}
                onChange={(value) => setBackPayIncomeTaxOverride(Number(value) || 0)}
                disabled={!backPayIncomeTaxManual}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Net Payable (ETB)</label>
              <InputNumber value={backPayCalc.netSalary} style={{ width: "100%" }} disabled />
            </Col>
          </Row>
        </Space>
      </Modal>
    </div>
  );
};

export default HRPayroll;