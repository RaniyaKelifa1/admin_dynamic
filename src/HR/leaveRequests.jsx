import React from "react";
import { Card, Typography, Table, Tag, Button } from "antd";

const { Title, Paragraph } = Typography;

const columns = [
  { title: "Employee", dataIndex: "employee", key: "employee" },
  { title: "Type", dataIndex: "type", key: "type" },
  { title: "From", dataIndex: "from", key: "from" },
  { title: "To", dataIndex: "to", key: "to" },
  { title: "Status", dataIndex: "status", key: "status", render: (status) => <Tag color={status === "Pending" ? "orange" : status === "Approved" ? "green" : "red"}>{status}</Tag> },
  { title: "Action", key: "action", render: () => <Button type="primary" size="small">Review</Button> },
];

const data = [
  { key: 1, employee: "David Asante", type: "Annual Leave", from: "2026-08-01", to: "2026-08-05", status: "Pending" },
  { key: 2, employee: "Grace Mensah", type: "Sick Leave", from: "2026-07-22", to: "2026-07-24", status: "Approved" },
  { key: 3, employee: "Samuel Opoku", type: "Personal Leave", from: "2026-08-10", to: "2026-08-12", status: "Pending" },
];

const HRLeaveRequests = () => (
  <div>
    <Title level={2}>Leave Requests</Title>
    <Paragraph>
      Review leave applications and manage approval status for employees.
    </Paragraph>
    <Card bordered>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
  </div>
);

export default HRLeaveRequests;
