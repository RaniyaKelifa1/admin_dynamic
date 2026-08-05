import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, List, message, Modal, Space, Typography } from "antd";
import { collection, deleteDoc, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../Sales/Components/firebase";

const { Title, Paragraph } = Typography;
const { Search } = Input;

const HRDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadDepartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, "Departments"));
      const list = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setDepartments(list);
    } catch (error) {
      console.error("Error loading departments:", error);
      message.error("Could not load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) => (department.name || "").toLowerCase().includes(query));
  }, [departments, searchText]);

  const handleAddDepartment = async () => {
    const trimmed = newDepartment.trim();
    if (!trimmed) {
      message.error("Please enter a department name");
      return;
    }

    const exists = departments.some((department) => (department.name || "").toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      message.error("This department already exists");
      return;
    }

    setSubmitting(true);
    try {
      const departmentId = trimmed.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
      const payload = {
        id: departmentId,
        name: trimmed,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "Departments", departmentId), payload);
      setDepartments((current) => [...current, payload].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      setNewDepartment("");
      message.success("Department added");
    } catch (error) {
      console.error("Error adding department:", error);
      message.error("Could not add department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDepartment = async (department) => {
    Modal.confirm({
      title: "Remove department",
      content: `Are you sure you want to remove ${department.name}?`,
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteDoc(doc(db, "Departments", department.id));
          setDepartments((current) => current.filter((item) => item.id !== department.id));
          message.success("Department removed");
        } catch (error) {
          console.error("Error removing department:", error);
          message.error("Could not remove department");
        }
      },
    });
  };

  return (
    <div>
      <Title level={2}>Departments</Title>
      <Paragraph>HR can add or remove departments here. These values are stored in Firestore and used by employee registration.</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Enter department name"
            value={newDepartment}
            onChange={(event) => setNewDepartment(event.target.value)}
            onPressEnter={handleAddDepartment}
          />
          <Button type="primary" loading={submitting} onClick={handleAddDepartment}>
            Add Department
          </Button>
        </Space.Compact>
      </Card>

      <Card>
        <Search
          placeholder="Search departments"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          allowClear
          style={{ marginBottom: 16 }}
        />

        <List
          loading={loading}
          dataSource={filteredDepartments}
          renderItem={(department) => (
            <List.Item
              actions={[
                <Button key="remove" danger onClick={() => handleRemoveDepartment(department)}>
                  Remove
                </Button>,
              ]}
            >
              <List.Item.Meta title={department.name} description={`Saved as ${department.id}`} />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default HRDepartments;
