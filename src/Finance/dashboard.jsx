import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  Table,
  Tag,
  ConfigProvider,
  Layout,
  Space,
  Skeleton,
  Avatar,
  theme
} from "antd";
import {
  TrendingUp,
  Users,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Landmark
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

// Helper to parse numbers safely
const parseNumber = (value) => {
  if (value == null) return 0;
  const cleaned = String(value).replace(/[^0-9.\-]/g, "");
  return Number(cleaned) || 0;
};

// Helper for currency formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ----------------------------------------------------------------------
// MOCK DATA FOR PREVIEW
// ----------------------------------------------------------------------
const generateMockData = () => {
  const mockSales = Array.from({ length: 45 }).map((_, i) => ({
    id: `SALE-${1000 + i}`,
    invoiceNumber: `INV-2026-${100 + i}`,
    clientName: ["Acme Corp", "Global Tech", "Nexus Ind.", "Stark Ent.", "Wayne Group"][i % 5],
    salesAmount: Math.floor(Math.random() * 150000) + 20000,
    dateOfRecording: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    status: Math.random() > 0.2 ? "Paid" : "Pending",
  }));

  const mockPayroll = Array.from({ length: 24 }).map((_, i) => ({
    id: `PR-${i}`,
    grossIncome: Math.floor(Math.random() * 5000) + 8000,
    monthKey: new Date().toISOString().slice(0, 7),
  }));

  const mockPayrollMonths = [
    { id: "1", status: "Paid", month: "January" },
    { id: "2", status: "Paid", month: "February" },
    { id: "3", status: "Paid", month: "March" },
    { id: "4", status: "Pending", month: "April" },
  ];

  return { mockSales, mockPayroll, mockPayrollMonths, employeesCount: 24 };
};

const FinanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [salesRecords, setSalesRecords] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payrollMonths, setPayrollMonths] = useState([]);
  const [employeesCount, setEmployeesCount] = useState(0);

  const { token } = theme.useToken();

  // ----------------------------------------------------------------------
  // FIREBASE INTEGRATION (COMMENTED OUT FOR PREVIEW)
  // ----------------------------------------------------------------------
  /*
  import { collection, getDocs } from "firebase/firestore";
  import { db } from "../Sales/Components/firebase";

  useEffect(() => {
    const loadFinanceData = async () => {
      try {
        setLoading(true);
        const [salesSnap, payrollSnap, payrollMonthsSnap, employeesSnap] = await Promise.all([
          getDocs(collection(db, "sales")),
          getDocs(collection(db, "Payroll")),
          getDocs(collection(db, "PayrollMonths")),
          getDocs(collection(db, "Employees")),
        ]);

        setSalesRecords(salesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPayrollRecords(payrollSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPayrollMonths(payrollMonthsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setEmployeesCount(employeesSnap.size);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFinanceData();
  }, []);
  */

  // Mock Data Loader (Remove this when using real Firebase above)
  useEffect(() => {
    setTimeout(() => {
      const { mockSales, mockPayroll, mockPayrollMonths, employeesCount } = generateMockData();
      setSalesRecords(mockSales);
      setPayrollRecords(mockPayroll);
      setPayrollMonths(mockPayrollMonths);
      setEmployeesCount(employeesCount);
      setLoading(false);
    }, 1200);
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = salesRecords.reduce((sum, record) => sum + parseNumber(record.salesAmount), 0);
    const totalSalesCount = salesRecords.length;
    
    const totalPayrollCost = payrollRecords.reduce((sum, record) => {
      const gross = parseNumber(record.grossIncome) ||
        parseNumber(record.basicSalary) + parseNumber(record.taxableAllowances) + parseNumber(record.nonTaxableAllowances);
      return sum + gross;
    }, 0);

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const payrollThisMonth = payrollRecords
      .filter((record) => String(record.monthKey).startsWith(currentMonthKey))
      .reduce((sum, record) => {
        const gross = parseNumber(record.grossIncome) ||
          parseNumber(record.basicSalary) + parseNumber(record.taxableAllowances) + parseNumber(record.nonTaxableAllowances);
        return sum + gross;
      }, 0);

    const openPayrollMonths = payrollMonths.filter((month) => String(month.status).toLowerCase() !== "paid").length;
    const completedPayrollMonths = payrollMonths.filter((month) => String(month.status).toLowerCase() === "paid").length;
    const averageInvoice = totalSalesCount ? totalRevenue / totalSalesCount : 0;

    return {
      totalRevenue,
      totalSalesCount,
      totalPayrollCost,
      payrollThisMonth,
      openPayrollMonths,
      completedPayrollMonths,
      averageInvoice,
    };
  }, [salesRecords, payrollRecords, payrollMonths]);

  const recentSales = useMemo(() => {
    return [...salesRecords]
      .sort((a, b) => new Date(b.dateOfRecording || 0) - new Date(a.dateOfRecording || 0))
      .slice(0, 7)
      .map((record) => ({
        key: record.id,
        invoice: record.invoiceNumber || record.agreementNumber || record.id,
        client: record.soldTo || record.clientName || "Unknown",
        amount: parseNumber(record.salesAmount),
        date: new Date(record.dateOfRecording || "").toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric"
        }),
        status: record.status || "Recorded",
      }));
  }, [salesRecords]);

  const chartData = useMemo(() => {
    // Creating a mock trend for the chart to make the dashboard look alive
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, index) => ({
      name: month,
      Revenue: Math.floor(stats.totalRevenue / 6) + (Math.random() * 50000 - 25000),
      Payroll: Math.floor(stats.totalPayrollCost / 6) + (Math.random() * 5000 - 2500),
    }));
  }, [stats]);

  const columns = [
    { 
      title: "Invoice Number", 
      dataIndex: "invoice", 
      key: "invoice",
      render: (text) => <Text strong className="text-gray-700">{text}</Text>
    },
    { 
      title: "Client", 
      dataIndex: "client", 
      key: "client",
      render: (text) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }}>
            {text.charAt(0)}
          </Avatar>
          <Text>{text}</Text>
        </Space>
      )
    },
    { 
      title: "Amount", 
      dataIndex: "amount", 
      key: "amount",
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>
    },
    { 
      title: "Date", 
      dataIndex: "date", 
      key: "date",
      render: (date) => <Text type="secondary">{date}</Text>
    },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      render: (status) => {
        const isPaid = status.toLowerCase() === 'paid';
        return (
          <Tag 
            color={isPaid ? 'success' : 'processing'}
            icon={isPaid ? <CheckCircle2 size={14} className="mr-1 inline" /> : <Clock size={14} className="mr-1 inline" />}
            className="rounded-full px-3 py-0.5 border-none font-medium"
          >
            {status.toUpperCase()}
          </Tag>
        );
      }
    },
  ];

  const StatCard = ({ title, value, prefix, suffix, icon, colorClass, loading }) => (
    <Card 
      bordered={false} 
      className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl h-full"
      bodyStyle={{ padding: '24px' }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <Text type="secondary" className="text-sm font-medium uppercase tracking-wider mb-1 block">
              {title}
            </Text>
            <Statistic 
              value={value} 
              prefix={prefix}
              suffix={suffix}
              valueStyle={{ fontWeight: 600, fontSize: '28px', color: '#1f2937' }} 
            />
          </div>
          <div className={`p-4 rounded-xl ${colorClass}`}>
            {icon}
          </div>
        </div>
      </Skeleton>
    </Card>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
          borderRadius: 12,
          colorPrimary: '#1677ff',
          colorBgContainer: '#ffffff',
        },
        components: {
          Card: {
            headerBg: 'transparent',
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
          }
        }
      }}
    >
      <Layout className="min-h-screen bg-gray-50/50 pb-12">
        <Content className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                Finance Overview
              </Title>
              <Text type="secondary" className="text-base">
                Live financial performance and payroll metrics.
              </Text>
            </div>
           
          </div>

          {/* Top KPI Cards */}
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                loading={loading}
                title="Total Revenue" 
                value={stats.totalRevenue} 
                prefix="ETB "
                icon={<TrendingUp size={28} className="text-emerald-600" />}
                colorClass="bg-emerald-50"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                loading={loading}
                title="Total Payroll Cost" 
                value={stats.totalPayrollCost} 
                prefix="ETB "
                icon={<Wallet size={28} className="text-rose-600" />}
                colorClass="bg-rose-50"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                loading={loading}
                title="Active Employees" 
                value={employeesCount} 
                icon={<Users size={28} className="text-blue-600" />}
                colorClass="bg-blue-50"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                loading={loading}
                title="Average Invoice" 
                value={stats.averageInvoice} 
                prefix="ETB "
                icon={<Receipt size={28} className="text-amber-600" />}
                colorClass="bg-amber-50"
              />
            </Col>
          </Row>

          {/* Charts and Secondary Stats */}
          <Row gutter={[24, 24]} className="mb-8">
            {/* Chart Section */}
            <Col xs={24} lg={16}>
              <Card 
                bordered={false} 
                title={<span className="font-semibold text-lg">Revenue vs Payroll Trend</span>}
                className="shadow-sm rounded-2xl h-full"
                bodyStyle={{ padding: '24px 24px 0 24px' }}
              >
                <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} tickFormatter={(val) => `ETB ${val / 1000}k`} />
                        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="Payroll" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPayroll)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Skeleton>
              </Card>
            </Col>

            {/* Payroll Status Section */}
            <Col xs={24} lg={8}>
              <Card 
                bordered={false} 
                title={<span className="font-semibold text-lg">Payroll Periods</span>}
                className="shadow-sm rounded-2xl h-full"
              >
                <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                  <div className="flex flex-col gap-6 pt-2">
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <Text className="text-blue-600 font-medium">This Month's Payroll</Text>
                        <ArrowUpRight size={18} className="text-blue-500" />
                      </div>
                      <Title level={3} style={{ margin: 0, color: '#1d4ed8' }}>
                        {formatCurrency(stats.payrollThisMonth)}
                      </Title>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <Text strong className="block">Completed</Text>
                          <Text type="secondary" className="text-xs">Paid Months</Text>
                        </div>
                      </div>
                      <Title level={4} style={{ margin: 0 }}>{stats.completedPayrollMonths}</Title>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                          <Clock size={20} />
                        </div>
                        <div>
                          <Text strong className="block">Pending</Text>
                          <Text type="secondary" className="text-xs">Open Periods</Text>
                        </div>
                      </div>
                      <Title level={4} style={{ margin: 0 }}>{stats.openPayrollMonths}</Title>
                    </div>
                  </div>
                </Skeleton>
              </Card>
            </Col>
          </Row>

          {/* Recent Sales Table */}
          <Card 
            bordered={false} 
            title={<span className="font-semibold text-lg">Recent Sales Transactions</span>}
            className="shadow-sm rounded-2xl"
            bodyStyle={{ padding: 0 }}
          >
             <Skeleton loading={loading} active paragraph={{ rows: 6 }} className="p-6">
              <Table 
                columns={columns} 
                dataSource={recentSales} 
                pagination={{ pageSize: 5 }} 
                locale={{ emptyText: "No sales records found." }} 
                rowClassName="hover:bg-gray-50/50 transition-colors"
              />
            </Skeleton>
          </Card>

        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default FinanceDashboard;