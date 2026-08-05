import React from "react";
import { Card, Typography, Table, Tag, Button } from "antd";

const { Title, Paragraph } = Typography;

const columns = [
  { title: "Candidate", dataIndex: "candidate", key: "candidate" },
  { title: "Position", dataIndex: "position", key: "position" },
  { title: "Stage", dataIndex: "stage", key: "stage", render: (stage) => <Tag color={stage === "Interview" ? "blue" : stage === "Offer" ? "green" : "orange"}>{stage}</Tag> },
  { title: "Source", dataIndex: "source", key: "source" },
  { title: "Applied", dataIndex: "applied", key: "applied" },
  { title: "Action", key: "action", render: () => <Button type="primary" size="small">View</Button> },
];

const data = [
  { key: 1, candidate: "Josephine Kwarteng", position: "Finance Analyst", stage: "Interview", source: "Referral", applied: "2026-07-07" },
  { key: 2, candidate: "Michael Boateng", position: "HR Coordinator", stage: "Offer", source: "Job Board", applied: "2026-07-10" },
  { key: 3, candidate: "Linda Koranteng", position: "Payroll Specialist", stage: "Screening", source: "Career Site", applied: "2026-07-14" },
];

const HRRecruitment = () => (
  <div>
    <Title level={2}>Recruitment & Hiring</Title>
    <Paragraph>Manage open roles, candidate pipelines, and hiring progress for HR and finance teams.</Paragraph>
    <Card bordered>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
  </div>
);

export default HRRecruitment;
