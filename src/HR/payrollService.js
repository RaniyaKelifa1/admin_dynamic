/**
 * Ethiopian payroll calculation utilities.
 *
 * Uses Federal Income Tax (Amendment) Proclamation No. 1395/2025 and
 * Ethiopian pension rates for employee and employer contributions.
 */

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

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
  const incomeTax = calculateIncomeTax(taxableIncome);
  const netSalary = roundToTwo(grossIncome - employeePension - incomeTax);

  return {
    grossIncome,
    taxableIncome,
    employeePension,
    employerPension,
    incomeTax,
    netSalary,
  };
};
