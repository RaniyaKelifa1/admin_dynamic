import React from "react";
import { Card, Typography, Table, Button } from "antd";

const { Title, Paragraph } = Typography;

const columns = [
  { title: "Invoice #", dataIndex: "invoice", key: "invoice" },
  { title: "Client", dataIndex: "client", key: "client" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Amount", dataIndex: "amount", key: "amount" },
  { title: "Due Date", dataIndex: "dueDate", key: "dueDate" },
];

const dataSource = [
  { key: "1", invoice: "INV-1001", client: "Acme Corp", status: "Paid", amount: "$4,200", dueDate: "2026-07-08" },
  { key: "2", invoice: "INV-1002", client: "Beta Ltd", status: "Pending", amount: "$2,750", dueDate: "2026-07-15" },
];

const FinanceInvoicing = () => (
  <div>
    <Title level={2}>Invoicing</Title>
    <Paragraph>Create, send, and track invoices for client work.</Paragraph>
    <Card title="Recent Invoices" bordered extra={<Button type="primary">New Invoice</Button>}>
      <Table columns={columns} dataSource={dataSource} pagination={false} />
    </Card>
  </div>
);

export default FinanceInvoicing;
