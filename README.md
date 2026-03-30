# 🏙️ AI-Powered Fault Management System  
### Ekurhuleni Metropolitan Municipality

## 📌 Overview
This project is an AI-powered fault detection and management system designed to help the Ekurhuleni Metropolitan Municipality improve service delivery.

The system enables residents to report infrastructure issues such as potholes, burst water pipes, faulty streetlights, and illegal dumping. Using AI, the system automatically classifies faults, routes them to relevant departments, and provides real-time monitoring through a dashboard.

---

## 🎯 Objectives
- Improve service delivery efficiency through AI automation  
- Enable faster fault detection and response  
- Provide data-driven insights for decision-making  
- Enhance citizen engagement and participation  
- Reduce infrastructure downtime and maintenance costs  

---

## ⚙️ System Architecture

### 1. 📥 Data Input (User Interface)
Residents can submit reports via a simple digital interface:
- Upload images of faults  
- Enter location details (GPS or manual input)  
- Provide short descriptions  
- Optional: Voice input (Speech-to-Text supported)

---

### 2. 🤖 AI Component
The system uses an AI model to classify faults based on image and text input.

#### Categories:
- Potholes  
- Burst water pipes  
- Streetlight failures  
- Illegal dumping  

#### Features:
- Image classification (Teachable Machine)  
- Text classification (NLP-based logic)  
- Multi-language support (Translation into South African languages)  

---

### 3. 🔄 Automation Workflow
An automated workflow is triggered when a report is submitted:

1. User submits report  
2. Data is sent to AI model  
3. Fault is classified  
4. Report is stored in database  
5. Task is assigned to relevant department  
6. Status is updated:
   - Pending  
   - In Progress  
   - Resolved  

---

### 4. 🗄️ Data Storage
Centralized storage system maintains:
- Fault reports  
- AI predictions  
- Status updates  
- Historical records  
- Inventory usage logs  

**Tools Used:**
- Google Sheets (Database)  

---

### 5. 📊 Dashboard & Monitoring
A real-time dashboard provides insights for city officials:

#### Key Metrics:
- Number of faults by category  
- Geographic distribution  
- Resolution progress  
- Response times  
- Trends over time  

#### Features:
- Real-time updates  
- Visual analytics (charts & maps)  
- Notifications when faults are updated  

**Tool Used:**
- Power BI  

---

## 🔔 Notifications System
- Dashboard alerts for status updates  
- Email/SMS notifications for maintenance teams  
- Push notifications for mobile users  

---

## 📱 Maintenance Crew Mobile Interface
A dedicated mobile interface enables field workers to:

- Receive task notifications  
- View assigned faults  
- Access GPS navigation routes  
- Update task status in real time  
- Log repair details  
- Capture before/after images  

---

## 📦 Inventory Management System
Integrated inventory tracking allows crews to:

- Log materials used per repair  
- Automatically update stock levels  
- Trigger low-stock alerts  
- Generate reorder notifications  

---

## 🎤 Voice & Language Features
- **Speech-to-Text (STT):** Convert voice reports into text  
- **Translation:** Translate reports into local South African languages  
- **Text-to-Speech (TTS):** Optional audio playback  

---

## 🛠️ Tech Stack (Low-Code Friendly)

| Component        | Tool Used              |
|----------------|----------------------|
| Forms/Input     | Google Forms         |
| AI Model        | Teachable Machine    |
| Automation      | Zapier / Make        |
| Database        | Google Sheets        |
| Dashboard       | Power BI             |

---

## 🔐 User Roles

### 👤 Resident (User)
- Submit fault reports  
- Track report status  

### 🛠️ Admin (Municipality Staff)
- View all reports  
- Monitor dashboard  
- Assign and manage tasks  
- Update fault statuses  

---

## 🚀 Workflow Summary
1. Resident submits a fault  
2. AI classifies the issue  
3. System logs and assigns the task  
4. Maintenance team receives notification  
5. Team resolves the issue  
6. Status is updated and reflected on dashboard  

---

## 🌍 Impact
This system transforms municipal operations into a smart, responsive, and data-driven ecosystem by:

- Improving response times  
- Increasing transparency  
- Enabling proactive maintenance  
- Enhancing community engagement  

---

## ✨ Future Enhancements
- WhatsApp integration for reporting  
- AI-based severity scoring  
- Predictive maintenance analytics  
- Offline mobile support for field teams  
- Integration with GIS systems  

---

## 📄 License
This project is for educational and prototype purposes.  

---

## 👨‍💻 Author
Developed as part of an AI-driven smart city initiative by Thando Mngomezulu.
