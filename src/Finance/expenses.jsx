import React from "react";
import { Card, Typography, Table, Tag } from "antd";

const { Title, Paragraph } = Typography;

const columns = [
  { title: "Category", dataIndex: "category", key: "category" },
  { title: "Type", dataIndex: "type", key: "type" },
  { title: "Amount", dataIndex: "amount", key: "amount" },
  { title: "Date", dataIndex: "date", key: "date" },
  { title: "Status", dataIndex: "status", key: "status", render: (status) => <Tag color={status === "Approved" ? "green" : status === "Pending" ? "orange" : "red"}>{status}</Tag> },
];

const data = [
  { key: 1, category: "Client Revenue", type: "Income", amount: "$12,500", date: "2026-07-08", status: "Approved" },
  { key: 2, category: "Office Rent", type: "Expense", amount: "$2,400", date: "2026-07-05", status: "Approved" },
  { key: 3, category: "Travel", type: "Expense", amount: "$850", date: "2026-07-12", status: "Pending" },
  { key: 4, category: "Consulting Fees", type: "Income", amount: "$4,200", date: "2026-07-09", status: "Approved" },
];

const FinanceExpenses = () => (
  <div>
    <Title level={2}>Income & Expense Tracking</Title>
    <Paragraph>Track financial inflows and outflows, map income items to invoices, and monitor expense approvals.</Paragraph>
    <Card bordered>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
  </div>
);

export default FinanceExpenses;
