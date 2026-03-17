# 🛡️ NetProbe — Port Scanner

A full-stack network security tool that scans open ports on any target host, assesses risk levels, and generates downloadable PDF security reports.

🔗 **Live Demo:** [netprobe-port-scanner.netlify.app](https://netprobe-port-scanner.netlify.app)  
⚙️ **Backend API:** [manches3003-netprobe-backend.hf.space](https://manches3003-netprobe-backend.hf.space)

---

## 📸 Preview

> A fast, clean interface for scanning ports and identifying security risks on any IP or domain.

---

## ✨ Features

- 🔍 **Port Scanning** — Scan common or full port ranges on any target IP or domain
- ⚠️ **Risk Assessment** — Each open port is rated with a risk level and reason
- 📊 **Risk Score** — Overall security score calculated per scan (0–100)
- 📄 **PDF Export** — Download a full security report with findings and recommendations
- 🌐 **REST API** — Clean FastAPI backend with `/scan` and `/export-pdf` endpoints

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| Netlify | Hosting & deployment |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python-nmap | Port scanning engine |
| ReportLab | PDF generation |
| Docker | Containerization |
| Hugging Face Spaces | Backend hosting |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- nmap installed on your system
- Docker (for backend deployment)

---

### 1. Clone the repo

```bash
git clone https://github.com/manches3003/netprobe-port-scanner.git
cd netprobe-port-scanner
```

---

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

### 3. Run the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at `http://localhost:8000`

---

### 4. Connect Frontend to Backend

In your frontend code, set the API URL:

```javascript
const API_URL = "http://localhost:8000"; // local
// or
const API_URL = "https://manches3003-netprobe-backend.hf.space"; // production
```

---

## 📡 API Endpoints

### `GET /health`
Returns backend status.

```json
{ "status": "ok" }
```

---

### `POST /scan`
Scans open ports on a target.

**Request:**
```json
{
  "target": "example.com",
  "scan_type": "common"
}
```

**Response:**
```json
{
  "target": "example.com",
  "ip": "93.184.216.34",
  "open_ports": [...],
  "risk_score": 42,
  "risk_rating": "Medium",
  "recommendations": [...],
  "scan_duration": 3.2,
  "timestamp": "2025-03-17T10:00:00"
}
```

`scan_type` options: `common` (top ports) or `full` (all 65535 ports)

---

### `POST /export-pdf`
Generates and returns a PDF security report.

**Request:** Pass the full scan result object as the request body.  
**Response:** PDF file download.

---

## 🐳 Deploy Backend with Docker

```bash
cd backend
docker build -t netprobe-backend .
docker run -p 7860:7860 netprobe-backend
```

---

## 📁 Project Structure

```
netprobe-port-scanner/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py          # FastAPI app & routes
│   ├── scanner.py       # Port scanning logic
│   ├── requirements.txt
│   └── Dockerfile
│
└── README.md
```

---

## ⚠️ Disclaimer

NetProbe is intended for **educational purposes and authorized security testing only**.  
Do not scan systems or networks without **explicit permission** from the owner.  
Unauthorized port scanning may be illegal in your jurisdiction.

---

## 👨‍💻 Author

**Keshav Kansara**  
MSc Cyber Security — SRH University Leipzig  
📧 keshavkansara123@gmail.com  
🔗 [GitHub](https://github.com/manches3003)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
