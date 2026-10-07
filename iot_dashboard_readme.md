# 🌡️ Real-time IoT Data Dashboard

<div align="center">

![IoT Dashboard](https://img.shields.io/badge/IoT-Dashboard-blue?style=for-the-badge&logo=internet-of-things)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![Real-time](https://img.shields.io/badge/Real--time-Updates-orange?style=for-the-badge&logo=socket.io)

**A modern, real-time IoT data dashboard built with the MERN stack featuring live temperature and humidity monitoring with beautiful visualizations.**

[🚀 Quick Start](#-installation--setup) • [📊 Features](#-features) • [🎯 Learning](#-learning-objectives) • [🚀 Deploy](#-deployment)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔴 **Real-time Monitoring**
- Live sensor data using Socket.IO
- WebSocket connections for instant updates
- Connection status indicators

</td>
<td width="50%">

### 🎨 **Beautiful Interface**
- Modern dashboard with Tailwind CSS
- Responsive design for all devices
- Interactive data visualizations

</td>
</tr>
<tr>
<td width="50%">

### 📊 **Data Management**
- MongoDB persistent storage
- RESTful API endpoints
- Historical data tracking

</td>
<td width="50%">

### 🤖 **IoT Simulation**
- Built-in sensor data generator
- Customizable intervals
- Multiple sensor support

</td>
</tr>
</table>

---

## 🏗️ System Architecture

```mermaid
graph LR
    A[React Frontend<br/>Port 3000] <--> B[Express Backend<br/>Port 5000]
    B <--> C[MongoDB Atlas<br/>Database]
    A <--> D[Socket.IO<br/>Real-time]
    B <--> D
    E[IoT Simulator] --> B
    
    style A fill:#61dafb
    style B fill:#339933
    style C fill:#4DB33D
    style D fill:#010101
    style E fill:#ff6b6b
```

---

## 🚀 Quick Start

### Prerequisites

<details>
<summary>📋 System Requirements</summary>

- **Node.js** `v14+` - [Download here](https://nodejs.org/)
- **MongoDB** - Local or [MongoDB Atlas](https://www.mongodb.com/atlas) (recommended)
- **Git** - [Download here](https://git-scm.com/)

</details>

### 1️⃣ Installation

```bash
# Clone the repository
git clone https://github.com/your-username/iot-dashboard.git
cd iot-dashboard

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2️⃣ Database Setup

<details>
<summary>🗄️ MongoDB Atlas (Recommended)</summary>

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Create `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/iot-dashboard
PORT=5000
NODE_ENV=development
```

</details>

<details>
<summary>🐳 Local MongoDB with Docker</summary>

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then use: `MONGODB_URI=mongodb://localhost:27017/iot-dashboard`

</details>

### 3️⃣ Launch Application

Open **3 terminals** and run:

```bash
# Terminal 1 - Backend Server
npm run dev

# Terminal 2 - Frontend Dashboard
cd client && npm start

# Terminal 3 - IoT Simulator (Optional)
node iot-simulator.js
```

### 4️⃣ Access Dashboard

| Service | URL | Purpose |
|---------|-----|---------|
| 🖥️ **Dashboard** | http://localhost:3000 | Main application |
| ⚡ **API Server** | http://localhost:5000 | Backend API |
| 🔍 **Health Check** | http://localhost:5000/api/health | System status |

---

## 📡 API Reference

<details>
<summary>🔗 Available Endpoints</summary>

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/health` | System health check | `{ status: "OK", timestamp: "..." }` |
| `GET` | `/api/data` | Retrieve all sensor data | `[{ temperature, humidity, timestamp }]` |
| `GET` | `/api/data/latest` | Get latest reading | `{ temperature, humidity, timestamp }` |
| `POST` | `/api/data` | Add new sensor data | `{ success: true, data: {...} }` |

### Sample API Request

```javascript
// POST /api/data
{
  "sensorId": "temp_001",
  "temperature": 23.5,
  "humidity": 65.2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

</details>

---

## 🎨 Dashboard Components

### Real-time Monitoring Panel
- 🌡️ **Temperature Gauge** - Visual temperature display with color coding
- 💧 **Humidity Meter** - Real-time humidity percentage
- 📊 **Live Charts** - Interactive Chart.js visualizations
- 🔌 **Connection Status** - WebSocket connection indicator

### Data Visualization Features
- 📈 **Trend Analysis** - Historical data patterns
- ⚠️ **Alert System** - Threshold-based warnings
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- 🎯 **Status Indicators** - Normal/Warning/Critical badges

---

## ⚙️ Configuration

<details>
<summary>🔧 Environment Variables</summary>

Create a `.env` file in the project root:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/iot-dashboard
DB_NAME=iot_dashboard

# Server Configuration
PORT=5000
NODE_ENV=development

# Socket.IO Configuration
SOCKET_PORT=5001
CORS_ORIGIN=http://localhost:3000

# IoT Simulator Settings
SIMULATOR_INTERVAL=5000
SENSOR_COUNT=3
```

</details>

<details>
<summary>🤖 IoT Simulator Settings</summary>

Edit `iot-simulator.js` to customize:

```javascript
const CONFIG = {
  API_URL: 'http://localhost:5000/api',
  SENSOR_ID: 'temp_humidity_001',
  INTERVAL: 3000,  // 3 seconds
  TEMPERATURE_RANGE: [18, 35],
  HUMIDITY_RANGE: [30, 80]
};
```

</details>

---

## 🎯 Learning Objectives

This project demonstrates key concepts across multiple technologies:

<table>
<tr>
<td>

### 🟢 **Backend Development**
- Express.js server setup
- MongoDB integration
- RESTful API design
- Real-time communication

</td>
<td>

### 🔵 **Frontend Development**  
- React component architecture
- State management with hooks
- Real-time UI updates
- Responsive design patterns

</td>
</tr>
<tr>
<td>

### 🟡 **Database Design**
- NoSQL schema modeling
- Data persistence strategies
- Query optimization
- Connection management

</td>
<td>

### 🟣 **IoT Concepts**
- Sensor data simulation
- Real-time data streaming
- Device communication protocols
- Data visualization techniques

</td>
</tr>
</table>

---

## 🚀 Deployment

### Heroku Deployment

<details>
<summary>📦 Step-by-step Heroku Setup</summary>

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-iot-dashboard

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set NODE_ENV=production

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Open your app
heroku open
```

</details>

### Docker Deployment

<details>
<summary>🐳 Docker Configuration</summary>

```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t iot-dashboard .
docker run -p 5000:5000 -e MONGODB_URI=your_uri iot-dashboard
```

</details>

---

## 🐛 Troubleshooting

<details>
<summary>❌ Common Issues & Solutions</summary>

### MongoDB Connection Issues
```bash
# Check connection string format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Test connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(err => console.error('❌ Error:', err))"
```

### Port Conflicts
```bash
# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### WebSocket Issues
- Check firewall settings
- Verify CORS configuration
- Test with Socket.IO client debugger

</details>

---

## 📚 Tech Stack & Resources

### Technologies Used

<div align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

### 📖 Documentation Links
- [MongoDB Documentation](https://docs.mongodb.com/) - Database operations
- [Express.js Guide](https://expressjs.com/) - Backend framework
- [React Documentation](https://reactjs.org/) - Frontend library
- [Socket.IO Documentation](https://socket.io/) - Real-time communication
- [Chart.js Documentation](https://www.chartjs.org/) - Data visualization
- [Tailwind CSS Documentation](https://tailwindcss.com/) - Styling framework

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Add tests for new features
- Update documentation as needed
- Ensure mobile responsiveness

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

<div align="center">

**Built with ❤️ for IoT learning and development**

Created by **Abitha** | [GitHub](https://github.com/your-username) | [LinkedIn](https://linkedin.com/in/your-profile)

⭐ **Star this repo if you found it helpful!**

---

*Made for IoT workshops and real-world learning applications*

</div>