import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

const Login = lazy(() => import('./Sales/Components/Login'));
const RegisterUser = lazy(() => import('./Sales/Components/RegisterUser'));

const HRMenu = lazy(() => import('./HR/menu'));
const HRDashboard = lazy(() => import('./HR/dashboard'));
const HREmployees = lazy(() => import('./HR/employees'));
const HRLeaveRequests = lazy(() => import('./HR/leaveRequests'));
const HRPayroll = lazy(() => import('./HR/payroll'));
const HRRecruitment = lazy(() => import('./HR/recruitment'));
const HRDepartments = lazy(() => import('./HR/departments'));

const FinanceMenu = lazy(() => import('./Finance/menu'));
const FinanceDashboard = lazy(() => import('./Finance/dashboard'));
const FinanceBudget = lazy(() => import('./Finance/budget'));
const FinanceExpenses = lazy(() => import('./Finance/expenses'));
const FinanceLedger = lazy(() => import('./Finance/ledger'));
const FinanceInvoicing = lazy(() => import('./Finance/invoicing'));
const FinancePayments = lazy(() => import('./Finance/payments'));
const FinanceCommissions = lazy(() => import('./Finance/commissions'));
const FinanceReports = lazy(() => import('./Finance/reports'));
const FinanceCRMIntegration = lazy(() => import('./Finance/crmIntegration'));

function AppLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#117960', animation: 'spin 1s linear infinite' }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}



function App() {
  return (
    <Router>
      <Suspense fallback={<AppLoading />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Register" element={<RegisterUser />} />

          <Route path="/HRDashboard" element={<HRMenu />}>
            <Route path="Home" element={<HRDashboard />} />
            <Route path="Employees" element={<HREmployees />} />
            <Route path="LeaveRequests" element={<HRLeaveRequests />} />
            <Route path="Payroll" element={<HRPayroll />} />
            <Route path="Recruitment" element={<HRRecruitment />} />
            <Route path="Departments" element={<HRDepartments />} />
          </Route>

          <Route path="/FinanceDashboard" element={<FinanceMenu />}>
            <Route path="Home" element={<FinanceDashboard />} />
            <Route path="Ledger" element={<FinanceLedger />} />
            <Route path="IncomeExpenses" element={<FinanceExpenses />} />
            <Route path="Invoicing" element={<FinanceInvoicing />} />
            <Route path="Payments" element={<FinancePayments />} />
            <Route path="Commissions" element={<FinanceCommissions />} />
            <Route path="Reports" element={<FinanceReports />} />
            <Route path="CRMIntegration" element={<FinanceCRMIntegration />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}


export default App;
