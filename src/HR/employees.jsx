import React, { useEffect, useState, useMemo } from "react";
import { Card, Typography, Table, Tag, Input, message, Space, Form, Modal, Select, Button, DatePicker } from "antd";
import { db } from "../Sales/Components/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { formatDisplayDate, loadHrEmployees, parseDateValue } from "./hrDataService";

// Generate and trigger download of a Word-compatible .doc file (HTML format)
// Generate and trigger download of a Word-compatible .doc file (HTML format)
const generateContractDoc = (employee) => {
  const name = employee.name || "_____________________";
  const phone = employee.phoneNumber || employee.phone || "_____________________";
  const salary = employee.basicSalary || employee.defaultSalary || "_____________";
  const today = new Date().toLocaleDateString();

  const content = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Contract - ${name}</title>
    <style>
      /* Clean page margins */
     /* Page Setup */
@page {
    margin: 2.54cm;
}

body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.45;
    margin: 2.54cm;
    padding: 0;
    color: #000;
}

/* Headings */
h2 {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    margin: 0 0 4px;
    letter-spacing: .4px;
}

h3 {
    text-align: center;
    font-size: 12pt;
    font-weight: normal;
    margin: 0 0 20px;
}

h4 {
    font-size: 12pt;
    font-weight: bold;
    text-decoration: underline;
    margin: 16px 0 6px;
}

/* Body Text */
p {
    margin: 0 0 8px;
    text-align: justify;
}

ul,
ol {
    margin: 4px 0 10px;
    padding-left: 28px;
}

li {
    margin-bottom: 4px;
    text-align: justify;
}

/* Contract Sections */
.contract-section {
    margin-bottom: 10px;
}

.clause-list {
    margin-top: 3px;
}

.indent {
    padding-left: 18px;
}

.witness-text {
    margin: 20px 0 10px;
}

/* Signature Section */
.signature-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 28px;
    table-layout: fixed;
}

.signature-table td {
    width: 50%;
    vertical-align: top;
    padding: 12px 18px;
    border: 1px solid #ccc;
}

.signature-table strong {
    display: block;
    text-align: center;
    margin-bottom: 10px;
    font-size: 12pt;
}

.signature-table .field {
    margin: 8px 0;
}

.signature-table .label {
    display: inline-block;
    width: 70px;
    font-weight: bold;
}
    </style>
  </head>
  <body>
    <h2>CONTRACTUAL EMPLOYMENT AGREEMENT</h2>
    <h3>(Sales Officer)</h3>

    <p>This employment contract agreement hereinafter called "Contract" is made and entered on the <strong>${today}</strong> hereinafter called "effective date" by and between</p>
    
    <p><strong>LIDIYA memorial construction</strong> a Company incorporated under the laws of Ethiopia and having its principal place of business at Addis Ababa, Kirkos sub city woreda 03, House/Office No.; 201c herein after referred to us <strong>"the Employer"</strong> on one hand;</p>
    
    <p>Name <strong>${name}</strong> with Address: Addis Ababa, sub city _______________, Woreda ____, House Number _______ Telephone <strong>${phone}</strong> here in after referred to us <strong>"the Employee"</strong> on the other hand;</p>

    <h4>RECITALS</h4>
    <p><strong>WHEREAS</strong> the Employer desires to obtain the benefit of the services of the Employee; and</p>
    <p><strong>WHEREAS</strong> the Employee desires to render such services, the terms and conditions set forth;</p>

    <h4>IN CONSIDERATION</h4>
    <p>of this mutual understanding, the Employer and Employee agree to the following terms and conditions:</p>

    <h4>Position Title</h4>
    <p>As Sales Officer, the Employee is required to perform his/her necessary job functions and duties, and all activities that may be assigned to Employee time to time by Employer.</p>

    <h4>Duration</h4>
    <p>The term of employment shall be for 3 months from the effective date of the contract and is based on contractual basis, where there may be a possibility of exclusion or continuity for another quarter.</p>

    <h4>Employer and Employee Duties</h4>
    <p><strong>The Employer undertakes to:</strong></p>
    <ul>
      <li>pay compensation;</li>
      <li>provide a clear target expected from employee in accordance with the post description and it shall communicate to the Employee as well as be filed on the Employee personal record;</li>
      <li>add other duties that are reasonable and within the scope of the Employee's work;</li>
    </ul>

    <p><strong>The Employee undertakes to:</strong></p>
    <ul>
      <li>perform all functions, and duties and activities to achieve the target;</li>
      <li>faithfully and to his/her best ability carry out the duties and responsibilities communicated to him/her by the Employer;</li>
      <li>comply with all company policies, rules and procedures at all times;</li>
      <li>obey all lawful and reasonable order and to perform such work as she / he is directed to perform which falls within his / her ability;</li>
      <li>strictly comply with the provision of this contract, may not misappropriate the Employer's property, keep all information entrusted to him / her confidential and have to adhere to the general Code of Conduct that governs all relations with co-employees, and clients; and</li>
      <li>return any Employer properties at the time of this contract termination.</li>
      <li>Act honestly to the interest of the company.</li>
    </ul>

    <h4>Compensation & Target</h4>
    <p>The Employee will be entitled to the following compensation for the services provided. Accordingly, the Employee shall be paid: -</p>
    <ul>
      <li>basic salary of monthly Birr <strong>${salary}</strong> (______________ Birr only);</li>
      <li>a commission 3% before VAT for selling apartments and shops (The commission payment shall be made up in to three portions (40%) as per the client's first payments and (30%, &amp; 30% installment) per the client second and third payment.</li>
    </ul>
    
    <p>All payments shall be subject to mandatory employment deductions. There shall be no commission payment where:</p>
    <ol type="a">
      <li>The employment contract is terminated in any way.</li>
      <li>The employee acts dishonestly towards the Company.</li>
    </ol>
    
    <p>The following are the quarterly performance targets:</p>
    <ul>
      <li>Survey # 600 Prospect/Quarter</li>
      <li>Show #120 Clients/ Quarter</li>
      <li>Sales # 3 Apartments/ Quarter</li>
    </ul>

    <h4>Benefits</h4>
    <p>The Employee has the right to participate in any benefits plans offered by the Employer. Access to these benefits will only be possible after the probationary period has passed.</p>

    <h4>Probationary Period</h4>
    <p>Employee and Employer understood that the first 60 working days of employment constitutes a probationary period. During this time, the Employee is not eligible for paid time off or other Employer benefits.</p>
    <p>During the probationary period, the Employer and Employee may exercise the right to terminate employment at any time without advanced notice.</p>

    <h4>Paid-Time Off</h4>
    <p>Following the probationary period, the Employee shall be eligible for the paid time off as per the labor laws of Ethiopia.</p>

    <h4>Termination</h4>
    <p>This contract may be terminated: -</p>
    <ul>
      <li>by mutual consent;</li>
      <li>either the Employer or Employee, at any time, during the terms of this contract, except during the probation period, may terminate the contract providing one month written notice to the other;</li>
      <li>as per the reasons stipulated by governing laws.</li>
      <li>If the sales agent didn't fulfill the sales target.</li>
    </ul>

    <h4>Non-Competition and Confidentiality</h4>
    <p>As the Employee will have access to confidential information that is the property of the Employer, the Employee shall not disclose this information outside of the Employer. During the time of Employment, the Employee shall not engage in any work for another Employer that is related to or in competition with the Employer, if the employee failed to do so the commission and salary will not be compensated.</p>
    <p>The Employee shall fully disclose to the Employer, if there is any other Employment relationships that the Employee has. The Employer may be permit to the Employee to seek other employment provided that: -</p>
    <ul>
      <li>it does not distract the Employee ability to fulfill his/her duties; and</li>
      <li>the Employee is not assisting other organizations in competing with the Employer.</li>
    </ul>
    <p>The Employee shall not solicit business from any of the Employer's clients for a period of at least one year after the termination of this employment contract.</p>

    <h4>Legal Authorization</h4>
    <p>The Employee agrees that he or she is fully authorized to work in Ethiopia and can provide proof of this with legal documentation. This documentation will be obtained by the Employer for legal records.</p>

    <h4>Governing Laws</h4>
    <p>Any matters that are not covered under this contract as well as the terms and conditions of this contract shall be governed, interpreted, and construed in accordance with employers working rules and regulations and applicable laws of the Federal Democratic Republic of Ethiopia.</p>

    <h4>Severability</h4>
    <p>The Employer and Employee agree that if any portion of this contract is found to be void or unenforceable, it shall be struck from the record and the remaining provisions will retain their full force and effect.</p>

    <h4>Amendment</h4>
    <p>This contract may be amended or modified at any time, provided the written consent of both the Employer and the Employee.</p>

    <h4>Entirety</h4>
    <p>This contract represents the entire agreement between the two parties and supersedes any previous written or oral agreement.</p>

    <h4>Counterpart</h4>
    <p>This contract may be executed in two counterparts, each of which will be deemed an original, but all of which together will constitute the same Agreement.</p>

    <p class="witness-text">IN WITNESS WHEREOF the Employer and the Employee hereby declare that they understand thoroughly the above provisions and agree to sign to abide by the terms and conditions of the contract. Accordingly, the Employer and Employee have caused this contract to be executed by Employer and Employee as of the effective date.</p>

    <table class="signature-table">
    <tr>
        <td>
            <strong>Employee</strong>

            <div class="field"><span class="label">Name:</span> ________________________</div>
            <div class="field"><span class="label">Date:</span> _________________________</div>
            <div class="field"><span class="label">Signature:</span> ____________________</div>
        </td>

        <td>
            <strong>Employer / Representative</strong>

            <div class="field"><span class="label">Name:</span> ________________________</div>
            <div class="field"><span class="label">Position:</span> _____________________</div>
            <div class="field"><span class="label">Date:</span> _________________________</div>
            <div class="field"><span class="label">Signature:</span> ____________________</div>
        </td>
    </tr>
</table>
  </body>
  </html>`;

  const blob = new Blob([content], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Employment-Contract-${name.replace(/\s+/g, "-")}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const { Title, Paragraph } = Typography;
const { Search } = Input;

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const handleStatusChange = async (value, record) => {
    const updatedStatus = value || "Inactive";
    try {
      await updateDoc(doc(db, "Employees", record.id), {
        status: updatedStatus,
      });
      setEmployees((current) =>
        current.map((item) =>
          item.id === record.id ? { ...item, status: updatedStatus } : item
        )
      );
      message.success("Status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Could not update status");
    }
  };

  const handleDateChange = async (dateString, record) => {
    if (!dateString) return;
    const dateValue = parseDateValue(dateString);
    if (!dateValue) return;

    try {
      // Try to update the Employees doc first; fallback to teamMembers
      try {
        await updateDoc(doc(db, "Employees", record.id), {
          creationTime: dateValue,
        });
      } catch (e) {
        await updateDoc(doc(db, "teamMembers", record.id), {
          creationTime: dateValue,
        });
      }

      const joined = formatDisplayDate(dateValue);

      setEmployees((current) =>
        current.map((item) =>
          item.id === record.id ? { ...item, creationTime: dateValue, joined } : item
        )
      );
      message.success("Join date updated");
    } catch (error) {
      console.error("Error updating join date:", error);
      message.error("Could not update join date");
    }
  };

  const openEditModal = (record) => {
    setIsEditing(true);
    setEditingEmployeeId(record.id);
    form.setFieldsValue({
      name: record.name,
      role: record.role,
      department: record.department,
      phoneNumber: record.phoneNumber,
      defaultSalary: record.defaultSalary || record.basicSalary || 12000,
      status: record.status || "Active",
    });
    setIsModalVisible(true);
  };

  const handleDeleteEmployee = async (record) => {
    const confirmed = window.confirm(`Delete employee ${record.name}? This action cannot be undone.`);
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "Employees", record.id));
      setEmployees((current) => current.filter((e) => e.id !== record.id));
      message.success("Employee removed");
    } catch (error) {
      console.error("Error removing employee:", error);
      message.error("Could not remove employee");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        // ask loader to auto-clean obvious duplicates in Firestore
        const loaded = (await loadHrEmployees(true))
          .filter(
            (employee) =>
              employee.originalDepartment !== "Digital Marketing" &&
              employee.role?.toLowerCase() !== "admin" &&
              employee.name?.toLowerCase() !== "admin"
          )
          .map(({ originalDepartment, ...rest }) => rest);

        setEmployees(loaded);
      } catch (error) {
        console.error("Error loading employee records:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadDepartments = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Departments"));
        const list = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((item) => item.name)
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setDepartments(list);
        if (list.length > 0) {
          form.setFieldValue("department", list[0].name);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
    loadDepartments();
  }, [form]);

  const filteredEmployees = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const searchable = (item) =>
      [item.name, item.role, item.phoneNumber]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(query));

    return employees
      .filter((employee) => (query ? searchable(employee) : true))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [employees, searchText]);

  const handleAddEmployee = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        role: values.role,
        department: values.department || "Marketing",
        phoneNumber: values.phoneNumber || "",
        status: values.status || "Active",
        defaultSalary: Number(values.defaultSalary) || 12000,
        basicSalary: Number(values.defaultSalary) || 12000,
        // keep existing creationTime on edits unless a date was explicitly provided
        creationTime: values.joinedDate ? values.joinedDate.toDate() : undefined,
        joined: values.joinedDate ? values.joinedDate.format?.("MMM D, YYYY") || "" : undefined,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && editingEmployeeId) {
        const updatePayload = Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== undefined));
        await updateDoc(doc(db, "Employees", editingEmployeeId), updatePayload);

        setEmployees((current) => current.map((emp) => (emp.id === editingEmployeeId ? { ...emp, ...updatePayload } : emp)));
        message.success("Employee updated successfully");
      } else {
        const fullPayload = {
          ...payload,
          creationTime: payload.creationTime || new Date(),
          joined: payload.joined || new Date().toLocaleDateString(),
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "Employees"), fullPayload);
        const newEmployee = {
          id: docRef.id,
          key: docRef.id,
          ...fullPayload,
          originalDepartment: fullPayload.department,
        };

        setEmployees((current) => [newEmployee, ...current]);

        // Trigger contract download for the newly added employee
        try {
          generateContractDoc(newEmployee);
        } catch (err) {
          console.warn("Could not generate contract doc:", err);
        }

        message.success("Employee added successfully");
      }

      form.resetFields();
      setIsModalVisible(false);
      setIsEditing(false);
      setEditingEmployeeId(null);
    } catch (error) {
      console.error("Error saving employee:", error);
      message.error("Could not save employee");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phoneNumber) => phoneNumber || "N/A",
    },
    {
      title: "Joined",
      dataIndex: "joined",
      key: "joined",
      render: (_, record) => {
        const dateValue = parseDateValue(record.creationTime)
          ? parseDateValue(record.creationTime).toISOString().slice(0, 10)
          : "";
        return (
          <input
            type="date"
            value={dateValue}
            onChange={(event) => handleDateChange(event.target.value, record)}
            style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #d9d9d9" }}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <select
          value={status || "Inactive"}
          onChange={(event) => handleStatusChange(event.target.value, record)}
          style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #d9d9d9" }}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => openEditModal(record)}>Edit</Button>
          <Button size="small" danger onClick={() => handleDeleteEmployee(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Employee Records</Title>
      <Paragraph>View HR-managed employee profiles, departments, and current status.</Paragraph>

      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", width: "100%" }}>
        <Search
          placeholder="Search by name, role, or phone number"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          allowClear
        />
        <Button type="primary" onClick={() => { setIsModalVisible(true); setIsEditing(false); form.resetFields(); }}>
          Add Employee
        </Button>
      </Space>

      <Modal
        title={isEditing ? "Edit Employee" : "Add Employee"}
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); setIsEditing(false); setEditingEmployeeId(null); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEmployee}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please enter employee name" }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true, message: "Please enter employee role" }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Department" name="department" initialValue={departments[0]?.name || "Marketing"}>
            <Select
              options={departments.map((department) => ({ label: department.name, value: department.name }))}
              placeholder="Select department"
            />
          </Form.Item>
          <Form.Item label="Phone Number" name="phoneNumber">
            <Input />
          </Form.Item>
          <Form.Item label="Default Salary (ETB)" name="defaultSalary" initialValue={12000}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Joined Date" name="joinedDate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="Active">
            <Select options={[{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Card bordered>
        <Table
          columns={columns}
          dataSource={filteredEmployees}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default HREmployees;
