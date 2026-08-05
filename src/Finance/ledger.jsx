import React, { useState } from "react";
import { Card, Typography, Table, Row, Col, Button, Modal, Form, Input, Select, Space, message } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const initialLedgerData = [
  { key: "1", date: "Hamle 23, 2018", account: "Sales Revenue", type: "Credit", amount: "ETB 12,500", memo: "Client payment" },
  { key: "2", date: "Nehase 01, 2018", account: "Office Supplies", type: "Debit", amount: "ETB 320", memo: "Stationery purchase" },
];

const FinanceLedger = () => {
  const [records, setRecords] = useState(initialLedgerData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const openNewRecord = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditRecord = (record) => {
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
        setRecords((current) => current.map((row) => (row.key === editingRecord.key ? { ...row, ...normalized } : row)));
        message.success("Ledger entry updated successfully.");
      } else {
        setRecords((current) => [
          ...current,
          { key: `${Date.now()}`, ...normalized },
        ]);
        message.success("Ledger entry added successfully.");
      }

      closeModal();
    } catch (error) {
      // validation failure handled by form
    }
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Account", dataIndex: "account", key: "account" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Memo", dataIndex: "memo", key: "memo" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEditRecord(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>General Ledger</Title>
          <Paragraph>Track journal entries, account balances, and core ledger activity.</Paragraph>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNewRecord}>
              Add Entry
            </Button>
          </Space>
        </Col>
      </Row>
      <Card bordered>
        <Table columns={columns} dataSource={records} pagination={false} />
      </Card>

      <Modal
        title={editingRecord ? "Edit Ledger Entry" : "Add Ledger Entry"}
        open={modalVisible}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingRecord ? "Update" : "Add"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Enter a date." }]}> 
            <Input placeholder="Hamle 23, 2018" />
          </Form.Item>
          <Form.Item name="account" label="Account" rules={[{ required: true, message: "Enter an account." }]}> 
            <Input placeholder="Sales Revenue" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Select an entry type." }]}> 
            <Select>
              <Option value="Credit">Credit</Option>
              <Option value="Debit">Debit</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: "Enter an amount." }]}> 
            <Input placeholder="ETB 1,250" />
          </Form.Item>
          <Form.Item name="memo" label="Memo">
            <Input placeholder="Client payment" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinanceLedger;
