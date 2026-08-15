import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Statistic, List, Tag, Spin } from "antd";
import { resolvePayrollWithTax } from "./payrollService";
import { loadHrDepartments, loadHrEmployees, loadHrPayrollMonths, loadHrPayrollRecords } from "./hrDataService";

const { Title, Paragraph } = Typography;

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

const HRDashboard = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [currentPayrollTotal, setCurrentPayrollTotal] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [activeMonthLabel, setActiveMonthLabel] = useState("Current month");
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [employeeStatusChart, setEmployeeStatusChart] = useState([]);
  const [departmentChart, setDepartmentChart] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [employees, payrollRecords, monthStatuses, departments] = await Promise.all([
          loadHrEmployees(),
          loadHrPayrollRecords(),
          loadHrPayrollMonths(),
          loadHrDepartments(),
        ]);

        const monthStatusMap = Object.fromEntries(monthStatuses.map((month) => [month.id, month]));
        const activeMonthKey = fixedMonthKeys.find((monthKey) => {
          const monthStatus = monthStatusMap[monthKey]?.status;
          return monthStatus !== "Paid";
        }) || fixedMonthKeys[0];

        const monthPayrollRecords = payrollRecords.filter((record) => record.monthKey === activeMonthKey);
        const payrollTotal = monthPayrollRecords.reduce((sum, record) => {
          const calculations = resolvePayrollWithTax({
            basicSalary: record.basicSalary || 0,
            taxableAllowances: record.taxableAllowances || 0,
            nonTaxableAllowances: record.nonTaxableAllowances || 0,
            incomeTaxManual: record.incomeTaxManual,
            incomeTaxOverride: record.incomeTaxOverride,
          });
          return sum + calculations.netSalary;
        }, 0);

        const activeCount = employees.filter((employee) => {
          const statusValue = employee.status;
          if (typeof statusValue === "boolean") {
            return statusValue;
          }
          return String(statusValue || "Active").toLowerCase() !== "inactive";
        }).length;

        const recent = [...employees]
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || a.creationTime?.seconds || 0;
            const bTime = b.createdAt?.seconds || b.creationTime?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 5);

        setTotalEmployees(employees.length);
        setActiveEmployees(activeCount);
        setCurrentPayrollTotal(payrollTotal);
        setDepartmentCount(departments.length);
        setActiveMonthLabel(activeMonthKey);
        setRecentEmployees(recent);

        const statusCounts = employees.reduce((acc, employee) => {
          const statusValue = employee.status;
          const key = typeof statusValue === "boolean"
            ? (statusValue ? "Active" : "Inactive")
            : String(statusValue || "Active").toLowerCase() === "inactive"
              ? "Inactive"
              : "Active";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const departmentCounts = employees.reduce((acc, employee) => {
          const dept = employee.department || "Unassigned";
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {});

        const monthPayrollTrend = fixedMonthKeys.map((monthKey) => {
          const records = payrollRecords.filter((record) => record.monthKey === monthKey);
          const total = records.reduce((sum, record) => {
            const calculations = resolvePayrollWithTax({
              basicSalary: record.basicSalary || 0,
              taxableAllowances: record.taxableAllowances || 0,
              nonTaxableAllowances: record.nonTaxableAllowances || 0,
              incomeTaxManual: record.incomeTaxManual,
              incomeTaxOverride: record.incomeTaxOverride,
            });
            return sum + calculations.netSalary;
          }, 0);
          return { month: monthKey, total };
        });

        setEmployeeStatusChart(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
        setDepartmentChart(Object.entries(departmentCounts).map(([name, value]) => ({ name, value })));
        setPayrollTrend(monthPayrollTrend);
      } catch (error) {
        console.error("Error loading HR dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6 }}>HR Dashboard</Title>
        <Paragraph style={{ marginBottom: 0, color: "#6b7280" }}>
          A live overview of employees, departments, and payroll from your registered data.
        </Paragraph>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Card bordered={false} style={{ background: "linear-gradient(135deg, #129777 0%, #0f766e 100%)", color: "white" }}>
                <Statistic title={<span style={{ color: "rgba(255,255,255,0.9)" }}>Total Employees</span>} value={totalEmployees} valueStyle={{ color: "white", fontSize: 28 }} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <Statistic title="Active Employees" value={activeEmployees} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <Statistic title="Current Payroll" value={`${currentPayrollTotal.toLocaleString()} ETB`} />
                <Paragraph style={{ marginTop: 8, marginBottom: 0, color: "#6b7280" }}>For {activeMonthLabel}</Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <Statistic title="Departments" value={departmentCount} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={8}>
              <Card title="Employee Status" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {employeeStatusChart.map((item) => (
                    <div key={item.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 999 }}>
                        <div style={{ width: `${(item.value / Math.max(...employeeStatusChart.map((entry) => entry.value), 1)) * 100}%`, height: "100%", background: item.name === "Active" ? "#129777" : "#f59e0b", borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Department Mix" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {departmentChart.map((item) => (
                    <div key={item.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 999 }}>
                        <div style={{ width: `${(item.value / Math.max(...departmentChart.map((entry) => entry.value), 1)) * 100}%`, height: "100%", background: "#2563eb", borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Payroll Trend" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180 }}>
                  {payrollTrend.slice(-6).map((item) => (
                    <div key={item.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", height: `${Math.max(10, (item.total / Math.max(...payrollTrend.map((entry) => entry.total), 1)) * 100)}%`, minHeight: 10, background: "#129777", borderRadius: "6px 6px 0 0" }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{item.month}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title="Recent Employees" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <List
                  dataSource={recentEmployees}
                  renderItem={(employee) => (
                    <List.Item>
                      <List.Item.Meta
                        title={employee.name || "Unnamed employee"}
                        description={`${employee.role || "Employee"} • ${employee.department || "Unassigned"}`}
                      />
                      <Tag color={employee.status === "Inactive" ? "default" : "green"}>{employee.status || "Active"}</Tag>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Quick Snapshot" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <Paragraph style={{ marginBottom: 8 }}>
                  Payroll for {activeMonthLabel} is {currentPayrollTotal.toLocaleString()} ETB across the live HR records.
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  The dashboard now updates directly from the registered employee, department, and payroll data in your database.
                </Paragraph>
              </Card>
            </Col>
          </Row>

        </>
      )}
    </div>
  );
};

export default HRDashboard;
