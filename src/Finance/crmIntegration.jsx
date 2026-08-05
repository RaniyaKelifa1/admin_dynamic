import React from "react";
import { Card, Typography, List } from "antd";

const { Title, Paragraph } = Typography;

const integrationItems = [
  "Link client payments to CRM deals",
  "Match invoices with customer accounts",
  "Show deal status with payment progress",
  "Sync financial records with CRM data",
];

const FinanceCRMIntegration = () => (
  <div>
    <Title level={2}>CRM Integration</Title>
    <Paragraph>Integrate finance records with CRM deals and client payment history.</Paragraph>
    <Card bordered>
      <List
        dataSource={integrationItems}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  </div>
);

export default FinanceCRMIntegration;
