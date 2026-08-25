/**
 * Ethiopian payroll calculation utilities.
 *
 * Uses Federal Income Tax (Amendment) Proclamation No. 1395/2025 and
 * Ethiopian pension rates for employee and employer contributions.
 */

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/** No income tax when basic salary is below this amount. */
export const INCOME_TAX_EXEMPTION_THRESHOLD = 4000;

export const isIncomeTaxExempt = (basicSalary) =>
  (Number(basicSalary) || 0) < INCOME_TAX_EXEMPTION_THRESHOLD;

export const calculatePension = (basicSalary) => {
  const employeePension = roundToTwo(basicSalary * 0.07);
  const employerPension = roundToTwo(basicSalary * 0.11);
  return { employeePension, employerPension };
};

export const calculateIncomeTax = (taxableIncome) => {
  const ti = Math.max(0, taxableIncome);

  if (ti <= 2000) {
    return 0;
  }
  if (ti <= 4000) {
    return roundToTwo(ti * 0.15 - 300);
  }
  if (ti <= 7000) {
    return roundToTwo(ti * 0.2 - 500);
  }
  if (ti <= 10000) {
    return roundToTwo(ti * 0.25 - 850);
  }
  if (ti <= 14000) {
    return roundToTwo(ti * 0.3 - 1350);
  }
  return roundToTwo(ti * 0.35 - 2050);
};

export const calculatePayroll = ({ basicSalary, taxableAllowances, nonTaxableAllowances }) => {
  const normalizedBasic = Number(basicSalary) || 0;
  const normalizedTaxable = Number(taxableAllowances) || 0;
  const normalizedNonTaxable = Number(nonTaxableAllowances) || 0;

  const grossIncome = roundToTwo(normalizedBasic + normalizedTaxable + normalizedNonTaxable);
  const taxableIncome = roundToTwo(normalizedBasic + normalizedTaxable);
  const { employeePension, employerPension } = calculatePension(normalizedBasic);
  const calculatedIncomeTax = isIncomeTaxExempt(normalizedBasic) ? 0 : calculateIncomeTax(taxableIncome);
  const incomeTax = calculatedIncomeTax;
  const netSalary = roundToTwo(grossIncome - employeePension - incomeTax);

  return {
    grossIncome,
    taxableIncome,
    employeePension,
    employerPension,
    calculatedIncomeTax,
    incomeTax,
    netSalary,
  };
};

export const resolvePayrollWithTax = ({
  basicSalary,
  taxableAllowances,
  nonTaxableAllowances,
  incomeTaxManual = false,
  incomeTaxOverride,
}) => {
  const base = calculatePayroll({ basicSalary, taxableAllowances, nonTaxableAllowances });
  const manual = Boolean(incomeTaxManual);
  const incomeTax = manual
    ? roundToTwo(Math.max(0, Number(incomeTaxOverride) || 0))
    : base.calculatedIncomeTax;
  const netSalary = roundToTwo(base.grossIncome - base.employeePension - incomeTax);

  return {
    ...base,
    incomeTax,
    incomeTaxManual: manual,
    incomeTaxOverride: manual ? incomeTax : null,
    netSalary,
  };
};
