import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { LoginOutlined } from '@ant-design/icons';
import { Layout, Card, Button, Form, Radio, Modal, Spin, Typography, Divider, Space } from 'antd';
import logo from './Dynamic logo-03.png';

const { Content } = Layout;
const { Title, Text } = Typography;

const Login = () => {
  const [role, setRole] = useState("HR");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!role) {
      setErrorMessage("Please select HR or Finance before logging in.");
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "HR") {
        navigate("/HRDashboard/Home");
      } else {
        navigate("/FinanceDashboard/Home");
      }
    }, 500);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content className="flex items-center justify-center p-4">
        <Card
          className="w-full max-w-md shadow-lg"
          style={{ borderColor: '#117960' }}
          bodyStyle={{ padding: '32px' }}
        >
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="Company Logo"
              className="w-32 mx-auto mb-4"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
            <Title level={3} className="text-[#117960]">
              Dummy Login Selector
            </Title>
            <Text type="secondary">
              Choose HR or Finance to continue.
            </Text>
          </div>

          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Login As">
              <Radio.Group value={role} onChange={(e) => setRole(e.target.value)} buttonStyle="solid">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Radio.Button value="HR" style={{ width: '100%' }}>
                    HR Portal
                  </Radio.Button>
                  <Radio.Button value="Finance" style={{ width: '100%' }}>
                    Finance Portal
                  </Radio.Button>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ background: '#117960', borderColor: '#117960' }}
              >
                <LoginOutlined /> Login to {role}
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            <Text type="secondary" className="text-xs text-[#117960]">
              This is a dummy login screen for HR / Finance access.
            </Text>
          </Divider>
        </Card>

        <Modal
          title={<span className="text-red-600">Login Required</span>}
          open={errorModalVisible}
          onCancel={() => setErrorModalVisible(false)}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => setErrorModalVisible(false)}
              style={{ background: '#117960', borderColor: '#117960' }}
            >
              OK
            </Button>
          ]}
          centered
        >
          <div className="text-gray-700">
            <p>{errorMessage}</p>
          </div>
        </Modal>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Spin size="large" tip="Signing in..." className="text-white" />
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default Login;
