# Track Trash: Smart Waste Management Operations System

Track Trash is a full-stack, cloud-native operational ecosystem designed to optimize urban waste collection. It bridges IoT-simulated hardware telemetry with automated administrative dispatch and field operations. The application segments functionalities across three distinct user roles (Citizen, Waste Collector, and Administrator) to coordinate real-time cleanup operations.

Live Production URL: [https://track-trash.vercel.app](https://track-trash.vercel.app)

---

## 🏗️ System Architecture & Data Flow

The application decouples user complaints, automated sensor streams, and logistics assignments into a highly scalable, distributed relational infrastructure.

```text
+-----------------------------------------------------------------+
|                      Vercel React Frontend                      |
+-----------------------------------------------------------------+
         |                          |                          |
         | (Citizen User)           | (Waste Collector)        | (System Admin)
         v                          v                          v
+------------------+       +------------------+       +------------------+
| - Raise Map Pins |       | - Real-Time OSRM |       | - Assign Bins    |
| - Classify Waste |       |   Routing Engine |       | - Task Map Issues|
| - Review Issues  |       | - Complete Jobs  |       | - Analytics      |
+------------------+       +------------------+       +------------------+
         |                          |                          |
         +--------------------------+--------------------------+
                                    |
                                    v
+-----------------------------------------------------------------+
|                   Render Express Node Server                    |
+-----------------------------------------------------------------+
         |                                                     |
         | (WebSocket Engine)                                  | (Relational Queries)
         v                                                     v
+----------------------------------+       +----------------------------------+
|      Live Socket.io Pipe         |       |      TiDB Cloud Serverless       |
|      (Hardware Emulation)        |       |          (MySQL Engine)          |
+----------------------------------+       +----------------------------------+

```
### Core Workflows:
1. **Automated IoT Pipeline:** Ultrasonic sensors track physical waste bin depths. When filling triggers cross the target limit ($Fill \ge 80\%$), the backend dynamically creates an `OVERFLOW` system warning alert.
2. **Citizen-Driven Map Pipeline:** Users drop geospatial vector coordinates on a map interface to isolate illicit dumping zones.
3. **Decoupled Synchronization:** Administrative actions pair dispatch commands with open tasks, automatically synchronizing standard bin records and manual coordinates into unified chronological task structures.

---

##  Tech Stack

### Frontend Monorepo Subunit:
* **Framework:** React 18 (Vite Bundler Engine)
* **Routing Structure:** React Router DOM v6 (Declarative Guard Isolation)
* **Geospatial Mapping Engine:** Leaflet Engine & OpenStreetMap Layers
* **Dynamic Route Mapping:** OSRM (Open Source Routing Machine) API Matrix
* **State & Localization:** Global Context Profiles, Custom Language Hooks (English, Tamil, Hindi)

### Backend Service Pipeline:
* **Runtime Core:** Node.js, Express.js Web Framework
* **Real-time Synchronization Engine:** Socket.io WebSockets
* **Cloud Storage Tier:** TiDB Cloud Serverless Distributed MySQL Cluster
* **Access Control Guard:** JWT (JSON Web Tokens) with Role-Restricted Evaluation Middleware

---

##  Key Engineering Implementation Decisions

### 1. Optimization of Component Evaluation via Role-Restricted Memorization
To optimize client-side bundle computing overhead, individual view configurations are mapped through declarative memo structures (`useMemo`). The layout strips unhandled routes dynamically based on session status:
* **Waste Collectors:** Hidden from the system alerts dashboard and public complaints view to prevent loading failures on unauthorized telemetry routes.
* **Administrators & Waste Collectors:** Stripped of public classifier tools to keep their views dedicated exclusively to logistical tasks.

### 2. Multi-Table Transaction Synchronization Barrier
Manual public map records (`map_issues`) and structured logistical items (`collections`) were seamlessly synchronized. When an Administrator issues a dispatch target command to a collector from a geographical point on the map, the database creates a mirror entry inside the tracking engine to ensure real-time coordination across both layouts.

### 3. Mitigating Race Conditions in Distributed Asynchronous Query Pipelines
To ensure consistency across the distributed cloud-native **TiDB Cluster**, raw database callbacks were restructured sequentially to eliminate transactional race conditions:

```javascript
// Enforcing sequential query execution order blocks:
db.query("UPDATE collections SET status='completed' WHERE id=?", [id], (err) => {
    db.query("UPDATE bins SET current_fill=0 WHERE id=?", [bin_id], (err) => {
        db.query("UPDATE alerts SET status='resolved' WHERE bin_id=?", [bin_id], (err) => {
            return res.json({ message: "Collection pipelines updated across cloud sectors cleanly" });
        });
    });
});

```

---

## Database Schema Mapping

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'collector', 'admin') DEFAULT 'user',
    live_latitude DECIMAL(10, 8),
    live_longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL, -- Liters
    current_fill INT DEFAULT 0, -- Percentage
    status ENUM('empty', 'active', 'full') DEFAULT 'empty',
    sensor_status VARCHAR(50),
    latest_distance_cm DECIMAL(5,2)
);

CREATE TABLE map_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status ENUM('pending', 'assigned', 'done') DEFAULT 'pending',
    assigned_collector_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_collector_id) REFERENCES users(id)
);

CREATE TABLE collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bin_id INT NULL,
    collector_id INT NOT NULL,
    status ENUM('pending', 'in-progress', 'collected', 'completed') DEFAULT 'pending',
    location VARCHAR(255) NULL,
    collected_at TIMESTAMP NULL,
    FOREIGN KEY (bin_id) REFERENCES bins(id),
    FOREIGN KEY (collector_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('COLLECTION', 'ALERT', 'ISSUE', 'GENERAL') DEFAULT 'GENERAL',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

```

---

##  Installation & Local Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/shreeshanthi21/track-trash.git
cd track-trash

```

### 2. Configure Backend Subunit

```bash
cd backend
npm install

```

Create a `.env` file inside the `backend` folder:

```env
PORT=5001
DB_HOST=your-tidb-cloud-serverless-host
DB_USER=your-username
DB_PASSWORD=your-secure-password
DB_NAME=track_trash
JWT_SECRET=your-jwt-signing-secret-key
SERIAL_PORT=COM5
SERIAL_BIN_ID=1
DEVICE_SECRET=your-secure-secret-device


```

Start the local Express server:

```bash
npm run dev

```

### 3. Configure Frontend Subunit

```bash
cd ../frontend
npm install

```

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:5001

```

Start the local Vite server:

```bash
npm run dev

```

---

##  Role-Based Testing Matrix

| Feature Focus Area | User Account Privileges | Waste Collector Privileges | Administrator Privileges |
| --- | --- | --- | --- |
| **Bins Metrics Grid** | Read-Only Local Proximity | Read-Only Operations Queue | Full Administrative CRUD |
| **Mapping Workspace** | Drop Coordinate Issue Pins | Review Assignments & Route Lines | Execute Assignment Dispatches |
| **Logistics Dashboard** | Full Access Enabled | Complete Assigned Tasks | Review System Operations |
| **ML Garbage Classifier** | Complete Upload Access | View Port Blocked | View Port Blocked |
| **System Settings** | Standard User State | Standard Collector State | Direct Field Pairing Control |

```

```