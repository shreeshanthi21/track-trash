# Track Trash: Smart Waste Management Operations System

Track Trash is a full-stack, cloud-native operational ecosystem designed to optimize urban waste collection. It bridges IoT-simulated hardware telemetry with automated administrative dispatch and field operations. The application segments functionalities across three distinct user roles (Citizen, Waste Collector, and Administrator) to coordinate real-time cleanup operations.

Live Production URL: [https://track-trash.vercel.app](https://track-trash.vercel.app)

Screenshots of the site are attached in the end.

---

##  System Architecture & Data Flow

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
<img width="1265" height="820" alt="image" src="https://github.com/user-attachments/assets/ba20560c-4ad1-4b75-a9ab-649610c36336" />
<img width="1294" height="694" alt="image" src="https://github.com/user-attachments/assets/671d055e-09d2-422a-88bd-bf4c2b5f7c68" />

USER:
<img width="1892" height="823" alt="image" src="https://github.com/user-attachments/assets/380d6a62-00fc-4cc9-8e24-31510aad657f" />
<img width="1880" height="808" alt="image" src="https://github.com/user-attachments/assets/1090d29e-d387-4daa-ba39-45eb363aa9e0" />
<img width="1886" height="826" alt="image" src="https://github.com/user-attachments/assets/c0c8e952-fdab-4176-a7df-207dd23c3cff" />
<img width="1887" height="905" alt="image" src="https://github.com/user-attachments/assets/48e6f6d5-affa-4db8-aee1-e469669a7839" />
<img width="1898" height="821" alt="image" src="https://github.com/user-attachments/assets/7ed00885-58da-424d-bf53-c612608ba708" />
<img width="1899" height="824" alt="image" src="https://github.com/user-attachments/assets/07c56264-503c-42cf-a5fb-5fa50e6a6995" />
<img width="1886" height="822" alt="image" src="https://github.com/user-attachments/assets/e0e467ec-dc50-48a6-8d79-50bbb88dc9d5" />
<img width="1863" height="817" alt="image" src="https://github.com/user-attachments/assets/fdcbfd25-f6bc-4eaa-86fa-4bf6dca19a6a" />
<img width="1889" height="808" alt="image" src="https://github.com/user-attachments/assets/771943aa-aa1a-44e7-bbc4-91dbc0364cf7" />

ADMIN:
<img width="1624" height="810" alt="image" src="https://github.com/user-attachments/assets/90760a03-5734-4d6b-87cb-d4d4a8fd6ba8" />
<img width="1622" height="730" alt="image" src="https://github.com/user-attachments/assets/b39b7239-ef72-4114-be82-3b9d10b7fd06" />
<img width="1659" height="806" alt="image" src="https://github.com/user-attachments/assets/f8737ab8-6a4e-405c-a60b-e6a2629e60f1" />
<img width="1599" height="814" alt="image" src="https://github.com/user-attachments/assets/a3b78753-0a10-48d8-b88e-10a2a026c02a" />
<img width="1655" height="646" alt="image" src="https://github.com/user-attachments/assets/fa696257-e369-45c7-ab6b-1b2437d67d4a" />
<img width="1347" height="808" alt="image" src="https://github.com/user-attachments/assets/b9c6dc69-b027-4650-a6c4-b5c4ef5be862" />
<img width="1349" height="805" alt="image" src="https://github.com/user-attachments/assets/9a1f8000-c393-403b-9b79-cbcaf5ab201a" />
<img width="1394" height="798" alt="image" src="https://github.com/user-attachments/assets/f5797b7a-0c40-4832-98a4-fee9f8ca948f" />
<img width="1312" height="807" alt="image" src="https://github.com/user-attachments/assets/1b44952e-19fd-40da-8599-e96f04c553a2" />

COLLECTOR:
<img width="1281" height="811" alt="image" src="https://github.com/user-attachments/assets/8e889b6c-d83b-433a-bbe1-65093539692d" />
<img width="1401" height="583" alt="image" src="https://github.com/user-attachments/assets/20fa3cae-e74a-4350-903b-9714427605cd" />
<img width="1366" height="616" alt="image" src="https://github.com/user-attachments/assets/8843fb10-83fc-424c-bf07-827f833168e4" />
