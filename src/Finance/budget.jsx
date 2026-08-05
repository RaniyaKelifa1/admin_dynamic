import React from "react";
import { Card, Typography, Table, Tag } from "antd";

const { Title, Paragraph } = Typography;

const columns = [
  { title: "Date", dataIndex: "date", key: "date" },
  { title: "Account", dataIndex: "account", key: "account" },
  { title: "Type", dataIndex: "type", key: "type" },
  { title: "Amount", dataIndex: "amount", key: "amount" },
  { title: "Balance", dataIndex: "balance", key: "balance" },
  { title: "Status", dataIndex: "status", key: "status", render: (status) => <Tag color={status === "Posted" ? "green" : "orange"}>{status}</Tag> },
];

const data = [
  { key: 1, date: "2026-07-01", account: "Cash", type: "Debit", amount: "$8,600", balance: "$38,900", status: "Posted" },
  { key: 2, date: "2026-07-05", account: "Revenue", type: "Credit", amount: "$12,300", balance: "$51,200", status: "Posted" },
  { key: 3, date: "2026-07-10", account: "Expense", type: "Debit", amount: "$3,400", balance: "$47,800", status: "Pending" },
];

const FinanceBudget = () => (
  <div>
    <Title level={2}>General Ledger</Title>
    <Paragraph>Record and review journal entries, account balances, and ledger activity for finance operations.</Paragraph>
    <Card bordered>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
  </div>
);

export default FinanceBudget;
