import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import TX from "../components/TranslatedText";

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const currentLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function MapPage() {
  const userRole = localStorage.getItem("userRole") || "user";
  const token = localStorage.getItem("token");

  const routeLayerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [mapIssues, setMapIssues] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([11.0168, 76.9558]);

  const fetchMapIssues = async () => {
    try {
      let url = "/api/map-issues";
      if (userRole === "user")      url = "/api/map-issues/my";
      else if (userRole === "collector") url = "/api/map-issues/collector";

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { console.error(data.message || "Failed to fetch map issues"); return; }

      const cleanedIssues = (Array.isArray(data) ? data : []).filter(
        (issue) =>
          issue.latitude !== null && issue.longitude !== null &&
          !isNaN(Number(issue.latitude)) && !isNaN(Number(issue.longitude))
      );
      setMapIssues(cleanedIssues);
    } catch (err) {
      console.error("Error fetching map issues:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      const data = await res.json();
      if (data.length === 0) { alert("Location not found"); return; }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lon], 14);
        if (selectedMarkerRef.current) mapInstanceRef.current.removeLayer(selectedMarkerRef.current);
        selectedMarkerRef.current = L.marker([lat, lon], { icon: blueIcon })
          .addTo(mapInstanceRef.current).bindPopup("📌 Searched Location").openPopup();
        setSelectedLocation({ lat, lng: lon });
      }
    } catch (err) { console.error("Search error:", err); }
  };

  const drawRoute = async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) { alert("No route found"); return; }
      const routeCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (routeLayerRef.current && mapInstanceRef.current) mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = L.polyline(routeCoords, { color: "blue", weight: 5 }).addTo(mapInstanceRef.current);
    } catch (err) { console.error("Route error:", err); }
  };

  const fetchCollectors = async () => {
    try {
      const res = await fetch("/api/users/collectors", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { console.error(data.message || "Failed to fetch collectors"); return; }
      setCollectors(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error fetching collectors:", err); }
  };

  useEffect(() => {
    fetchMapIssues();
    if (userRole === "admin") fetchCollectors();
  }, [userRole]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView(currentLocation, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    if (userRole === "user") {
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        if (selectedMarkerRef.current) map.removeLayer(selectedMarkerRef.current);
        selectedMarkerRef.current = L.marker([lat, lng], { icon: blueIcon })
          .addTo(map)
          .bindPopup(`📌 Selected Location<br/>Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}`)
          .openPopup();
      });
    }
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [userRole]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(newLocation);
          if (mapInstanceRef.current) mapInstanceRef.current.setView(newLocation, 13);
        },
        () => console.log("Using default location")
      );
    }
  }, []);

  useEffect(() => {
    if (userRole !== "collector") return;
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userRole]);

  useEffect(() => {
    if (userRole === "admin" || !mapInstanceRef.current) return;
    if (!currentLocation || currentLocation.length !== 2) return;
    const [lat, lng] = currentLocation;
    if (currentLocationMarkerRef.current) mapInstanceRef.current.removeLayer(currentLocationMarkerRef.current);
    currentLocationMarkerRef.current = L.marker([lat, lng], { icon: currentLocationIcon })
      .addTo(mapInstanceRef.current).bindPopup("📍 Your Current Location");
  }, [currentLocation, userRole]);

  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    mapIssues.forEach((issue) => {
      let icon = redIcon;
      if (issue.status === "assigned") icon = yellowIcon;
      else if (issue.status === "done") icon = greenIcon;

      const marker = L.marker([Number(issue.latitude), Number(issue.longitude)], { icon })
        .addTo(markersLayerRef.current);

      let collectorName = "Not Assigned";
      if (issue.assigned_collector_id) {
        const found = collectors.find((c) => Number(c.id) === Number(issue.assigned_collector_id));
        collectorName = found ? found.name : `Collector ID: ${issue.assigned_collector_id}`;
      }

      let popupHtml = `
        <div>
          <p><strong>Description:</strong> ${issue.description}</p>
          <p><strong>Status:</strong> ${issue.status}</p>
          <p><strong>Collector:</strong> ${collectorName}</p>
        </div>
      `;

      if (userRole === "admin" && issue.status !== "done") {
        popupHtml += `
          <div style="margin-top:10px;">
            <select id="collector-select-${issue.id}">
              <option value="">Assign Collector</option>
              ${collectors.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
            </select>
            <button id="assign-btn-${issue.id}">Assign</button>
          </div>
        `;
      }

      if (userRole === "collector" && issue.status !== "done") {
        popupHtml += `
          <div style="margin-top:10px;">
            <button id="done-btn-${issue.id}">Mark Done</button>
          </div>
        `;
      }

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        if (userRole === "collector" && issue.status !== "done") {
          if (currentLocation && currentLocation.length === 2) {
            drawRoute(currentLocation, [Number(issue.latitude), Number(issue.longitude)]);
          }
        }
        if (userRole === "admin" && issue.status !== "done") {
          const btn = document.getElementById(`assign-btn-${issue.id}`);
          const select = document.getElementById(`collector-select-${issue.id}`);
          if (btn && select) {
            btn.onclick = () => {
              if (!select.value) return;
              handleAssignCollector(issue.id, select.value);
              marker.closePopup();
            };
          }
        }
        if (userRole === "collector") {
          const doneBtn = document.getElementById(`done-btn-${issue.id}`);
          if (doneBtn) {
            doneBtn.onclick = () => { handleMarkDone(issue.id); marker.closePopup(); };
          }
        }
      });
    });
  }, [mapIssues, collectors, userRole, currentLocation]);

  const handleSubmitIssue = async () => {
    if (!selectedLocation || !description.trim()) {
      alert("Select location + enter description");
      return;
    }
    try {
      const res = await fetch("/api/map-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description, latitude: selectedLocation.lat, longitude: selectedLocation.lng }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      alert("Issue submitted");
      setDescription("");
      setSelectedLocation(null);
      fetchMapIssues();
    } catch (err) { console.error(err); }
  };

  const handleAssignCollector = async (issueId, collectorId) => {
    try {
      await fetch(`/api/map-issues/assign/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assigned_collector_id: collectorId }),
      });
      fetchMapIssues();
    } catch (err) { console.error(err); }
  };

  const handleMarkDone = async (issueId) => {
    try {
      await fetch(`/api/map-issues/status/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "done" }),
      });
      fetchMapIssues();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h2 style={{ marginBottom: "5px" }}><TX>Map</TX></h2>

        <div style={{ margin: 0 }}>
          <p style={{ margin: 0 }}>
            {userRole === "user"      && <TX>Select location and submit issue</TX>}
            {userRole === "admin"     && <TX>Assign collectors</TX>}
            {userRole === "collector" && <TX>Update assigned issues</TX>}
          </p>

          {userRole === "user" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={handleSearch}>
                <TX>Search</TX>
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "5px" }}>
          <button className="btn-primary" onClick={fetchMapIssues}>
            <TX>Refresh</TX>
          </button>
        </div>

        <div style={{ marginBottom: "5px", fontSize: "14px" }}>
          <span style={{ marginRight: "10px" }}>🔴 <TX>Pending</TX></span>
          <span style={{ marginRight: "10px" }}>🟡 <TX>Assigned</TX></span>
          <span style={{ marginRight: "10px" }}>🟢 <TX>Done</TX></span>
          {userRole === "user" && (
            <>
              <span style={{ marginRight: "10px" }}>🔵 <TX>Selected</TX></span>
              <span>🟣 <TX>You</TX></span>
            </>
          )}
          {userRole === "collector" && <span>🟣 <TX>You</TX></span>}
        </div>

        <div
          ref={mapRef}
          style={{ height: "65vh", width: "100%", borderRadius: "12px", overflow: "hidden" }}
        />

        {userRole === "user" && (
          <div style={{ marginTop: "20px" }}>
            <h3><TX>Raise Issue</TX></h3>

            {selectedLocation && (
              <p style={{ fontSize: "14px", color: "#555" }}>
                📍 {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </p>
            )}

            <textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="input"
              style={{ minHeight: "80px" }}
            />

            <button className="btn-primary" style={{ marginTop: "10px" }} onClick={handleSubmitIssue}>
              <TX>Submit Issue</TX>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapPage;