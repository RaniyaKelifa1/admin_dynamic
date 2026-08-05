import React, { useState } from "react";
import { Layout, Menu, Dropdown, Button, notification } from "antd";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { auth } from "../Sales/Components/firebase";
import { signOut } from "firebase/auth";
import { HomeOutlined, UserOutlined, DollarOutlined, AppstoreOutlined, LogoutOutlined } from "@ant-design/icons";
import Logo from "../Sales/Components/Dynamic logo-03.png";

const { Header, Content } = Layout;

const HRMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate("/", { replace: true });
      notification.success({ message: "Logged out", description: "You have been logged out." });
    } catch (error) {
      notification.error({ message: "Logout failed", description: error.message });
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { key: "home", icon: <HomeOutlined />, label: "Home", path: "/HRDashboard/Home" },
    { key: "employees", icon: <UserOutlined />, label: "Employees", path: "/HRDashboard/Employees" },
    { key: "payroll", icon: <DollarOutlined />, label: "Payroll", path: "/HRDashboard/Payroll" },
    { key: "departments", icon: <AppstoreOutlined />, label: "Departments", path: "/HRDashboard/Departments" },
  ];

  return (
    <Layout style={{ minHeight: "100vh", width: "100vw" }}>
      <Header
        style={{
          background: "#fff",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <img src={Logo} alt="Company Logo" style={{ width: "200px" }} />
        </div>

        <div style={{ position: "absolute", right: "20px", paddingRight: "16px" }}>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Button type="primary" style={{ backgroundColor: "#129777", border: "none", color: "#fff" }} loading={loggingOut}>
              Logout
            </Button>
          </Dropdown>
        </div>
      </Header>

      <Content style={{ padding: "24px", margin: "0", minHeight: "calc(100vh - 64px - 70px)", marginBottom: "70px" }}>
        <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
          <Outlet />
        </div>
      </Content>

      <div style={{ position: "fixed", bottom: 0, width: "100%", backgroundColor: "white", borderTop: "1px solid #e8e8e8", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 0",
                  backgroundColor: active ? "#129777" : "transparent",
                  color: active ? "white" : "#129777",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "20px" }}>{item.icon}</span>
                <span style={{ marginTop: "4px", fontSize: "12px" }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default HRMenu;
