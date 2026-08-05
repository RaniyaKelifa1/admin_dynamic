import React, { useState } from "react";
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Table, 
  Button, 
  Space, 
  Tag, 
  ConfigProvider, 
  theme,
  Statistic
} from "antd";
import { 
  Download, 
  FileText, 
  Filter, 
  BarChart3, 
  PieChart, 
  Wallet, 
  TrendingUp,
  ChevronRight
} from "lucide-react";

const { Title, Text, Paragraph } = Typography;

const reportCards = [
  { title: "Profit & Loss", desc: "Net performance analysis", icon: <TrendingUp className="text-emerald-500" />, key: "pnl" },
  { title: "Balance Sheet", desc: "Assets & Equity health", icon: <BarChart3 className="text-blue-500" />, key: "balance" },
  { title: "Cash Flow", desc: "Operational liquidity", icon: <Wallet className="text-amber-500" />, key: "cash" },
  { title: "Commission Summary", desc: "Agent payout tracking", icon: <PieChart className="text-rose-500" />, key: "commission" },
];

const reportTableData = [
  { key: "1", report: "Profit & Loss", period: "Hamle 2018", status: "Ready", generated: "Sene 05, 2018" },
  { key: "2", report: "Balance Sheet", period: "Nekemet 2018", status: "Draft", generated: "Sene 01, 2018" },
  { key: "3", report: "Cash Flow", period: "Sene 2018", status: "Ready", generated: "Nehase 02, 2018" },
];

const FinanceReports = () => {
  const { token } = theme.useToken();

  const columns = [
    { title: "Report Name", dataIndex: "report", key: "report", render: (text) => <Text strong>{text}</Text> },
    { title: "Fiscal Period", dataIndex: "period", key: "period" },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      render: (status) => (
        <Tag color={status === "Ready" ? "success" : "processing"} className="rounded-full">
          {status.toUpperCase()}
        </Tag>
      )
    },
    { title: "Generated Date", dataIndex: "generated", key: "generated" },
    { 
      title: "", 
      key: "action", 
      render: () => <Button type="link" size="small" icon={<ChevronRight size={16} />}>View</Button> 
    },
  ];

  return (
    <ConfigProvider theme={{ token: { borderRadius: 12 } }}>
      <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <Title level={2} className="!mb-1">Financial Reports</Title>
            <Text type="secondary">Generate and review core statements in ETB.</Text>
          </div>
          <Space>
            <Button icon={<Filter size={16} />}>Filter</Button>
            <Button type="primary" icon={<Download size={16} />}>Export CSV</Button>
          </Space>
        </div>

        {/* Quick Access Cards */}
        <Row gutter={[24, 24]} className="mb-8">
          {reportCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-none shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-gray-50 rounded-xl">{card.icon}</div>
                  <Text strong className="text-lg">{card.title}</Text>
                </div>
                <Paragraph type="secondary" className="!mb-0 text-sm">{card.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Main Table */}
        <Card title={<span className="text-lg">Recent Reports</span>} className="shadow-sm border-none rounded-2xl mb-8">
          <Table columns={columns} dataSource={reportTableData} pagination={false} />
        </Card>

        {/* Footer Notes */}
        
      </div>
    </ConfigProvider>
  );
};

export default FinanceReports;