import React, { useState } from "react";
import { Card, Typography, Table, Row, Col, Button, Modal, Form, Input, Select, Space, message } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const initialCommissionData = [
  { key: "1", agent: "John Doe", deal: "ACME contract", commission: "5%", amount: "ETB 1,250", date: "Hamle 10, 2018", status: "Paid" },
  { key: "2", agent: "Jane Smith", deal: "Beta project", commission: "7%", amount: "ETB 1,925", date: "Nehase 05, 2018", status: "Pending" },
];

const FinanceCommissions = () => {
  const [commissions, setCommissions] = useState(initialCommissionData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const openNewCommission = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditCommission = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const normalized = {
        ...values,
        amount: values.amount.startsWith("ETB") ? values.amount : `ETB ${values.amount}`,
      };

      if (editingRecord) {
        setCommissions((current) => current.map((row) => (row.key === editingRecord.key ? { ...row, ...normalized } : row)));
        message.success("Commission entry updated successfully.");
      } else {
        setCommissions((current) => [
          ...current,
          { key: `${Date.now()}`, ...normalized },
        ]);
        message.success("Commission entry added successfully.");
      }

      closeModal();
    } catch (error) {
      // validation failure handled by form
    }
  };

  const columns = [
    { title: "Agent", dataIndex: "agent", key: "agent" },
    { title: "Deal", dataIndex: "deal", key: "deal" },
    { title: "Commission %", dataIndex: "commission", key: "commission" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEditCommission(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>Commission Calculations</Title>
          <Paragraph>Review agent commissions tied to client deals and payment status.</Paragraph>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNewCommission}>
              Add Commission
            </Button>
          </Space>
        </Col>
      </Row>
      <Card bordered>
        <Table columns={columns} dataSource={commissions} pagination={false} />
      </Card>

      <Modal
        title={editingRecord ? "Edit Commission" : "Add Commission"}
        open={modalVisible}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingRecord ? "Update" : "Add"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="agent" label="Agent" rules={[{ required: true, message: "Enter an agent name." }]}> 
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item name="deal" label="Deal" rules={[{ required: true, message: "Enter a deal name." }]}> 
            <Input placeholder="ACME contract" />
          </Form.Item>
          <Form.Item name="commission" label="Commission %" rules={[{ required: true, message: "Enter commission percentage." }]}> 
            <Input placeholder="5%" />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: "Enter an amount." }]}> 
            <Input placeholder="ETB 1,250" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Enter a date." }]}> 
            <Input placeholder="Hamle 10, 2018" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select a status." }]}> 
            <Select>
              <Option value="Paid">Paid</Option>
              <Option value="Pending">Pending</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinanceCommissions;
