import React, { useState } from "react";
import { Card, Typography, Table, Row, Col, Button, Modal, Form, Input, Select, Space, message } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const initialPaymentsData = [
  { key: "1", payment: "PAY-321", client: "Acme Corp", amount: "ETB 4,200", status: "Completed", date: "Hamle 17, 2018" },
  { key: "2", payment: "PAY-322", client: "Beta Ltd", amount: "ETB 2,750", status: "Pending", date: "Nehase 03, 2018" },
];

const FinancePayments = () => {
  const [payments, setPayments] = useState(initialPaymentsData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const openNewPayment = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditPayment = (record) => {
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
        setPayments((current) => current.map((row) => (row.key === editingRecord.key ? { ...row, ...normalized } : row)));
        message.success("Payment updated successfully.");
      } else {
        setPayments((current) => [
          ...current,
          { key: `${Date.now()}`, ...normalized },
        ]);
        message.success("Payment added successfully.");
      }

      closeModal();
    } catch (error) {
      // validation failure handled by form
    }
  };

  const columns = [
    { title: "Payment #", dataIndex: "payment", key: "payment" },
    { title: "Client", dataIndex: "client", key: "client" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Date", dataIndex: "date", key: "date" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEditPayment(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>Payment Tracking</Title>
          <Paragraph>Monitor client payments and outstanding receivables.</Paragraph>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNewPayment}>
              Add Payment
            </Button>
          </Space>
        </Col>
      </Row>
      <Card bordered>
        <Table columns={columns} dataSource={payments} pagination={false} />
      </Card>

      <Modal
        title={editingRecord ? "Edit Payment" : "Add Payment"}
        open={modalVisible}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingRecord ? "Update" : "Add"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="payment" label="Payment #" rules={[{ required: true, message: "Enter a payment reference." }]}> 
            <Input placeholder="PAY-321" />
          </Form.Item>
          <Form.Item name="client" label="Client" rules={[{ required: true, message: "Enter a client name." }]}> 
            <Input placeholder="Acme Corp" />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: "Enter an amount." }]}> 
            <Input placeholder="ETB 4,200" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select a status." }]}> 
            <Select>
              <Option value="Completed">Completed</Option>
              <Option value="Pending">Pending</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Enter a date." }]}> 
            <Input placeholder="Hamle 17, 2018" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancePayments;
