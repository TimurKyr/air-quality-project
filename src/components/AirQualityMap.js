"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../app/globals.css';

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });

async function fetchCSV(filePath) {
    const response = await fetch(filePath);
    const text = await response.text();
    const rows = text.split("\n").slice(1);
    return rows.map(row => row.split(",").map(cell => cell.trim()));
}

// WHO Norms for pollutants (values in µg/m³)
const WHO_NORMS = {
    so2: 20,
    co: 10000,
    no2: 40,
    formaldehyde: 10,
};

// Function to get score of each pollutant
function getScore(value, norm, weight = 2) {
    if (value > 2 * norm) return 6 * weight;  // severe pollution
    if (value > 1.5 * norm) return 4 * weight;  // moderate pollution
    if (value > 1.1 * norm) return 2 * weight;  // slightly above norm
    if (value >= 0.8 * norm) return 1 * weight; // expanded yellow range
    return 0; // good
}

function getMarkerColor(so2, co, no2, formaldehyde) {
    let quality = 0;

    // Calculating scores for each pollutant
    quality += getScore(so2, WHO_NORMS.so2, 2.5);   // lower impact
    quality += getScore(co, WHO_NORMS.co, 2.5);     // lower impact
    quality += getScore(no2, WHO_NORMS.no2, 3.5);   // higher impact
    quality += getScore(formaldehyde, WHO_NORMS.formaldehyde, 3.5); // higher impact

    // Determine marker color
    if (quality < 6) return "green";  // Low pollution
    if (quality >= 6 && quality < 10) return "yellow"; // Moderate pollution
    return "red"; // High pollution
}

const calculateTotalScore = (sensor) => {
    return (
        getScore(sensor.so2, WHO_NORMS.so2, 2.5) +
        getScore(sensor.co, WHO_NORMS.co, 2.5) +
        getScore(sensor.no2, WHO_NORMS.no2, 3) + 
        getScore(sensor.formaldehyde, WHO_NORMS.formaldehyde, 3)
    );
};

// Final label of the mark according to score
function getFinalQualityLabel(score) {
    if (score < 6) return "Ниже нормы";
    if (score >= 6 && score < 10) return "Немного выше нормы";
    return "Превышает норму";
}

function getPollutionStatus(value, norm) {
    if (value < 0.8 * norm) return "Ниже нормы";
    if (value >= 0.8 * norm && value < 1.2 * norm) return "Немного выше нормы";
    return "Превышает норму";
}

export default function AirQualityMap() {
    const [sensorData, setSensorData] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [mapCenter, setMapCenter] = useState([43.24, 76.92]);
    const [map, setMap] = useState(null);

    // Function for getting sensor data for chosen date
    async function fetchData() {
        try {
            const sensorLocations = await fetchCSV("/data/sensor_locations.csv");
            const airQualityData = await fetchCSV("/data/air_quality_data.csv");

            const locationMap = Object.fromEntries(
                sensorLocations.map(([id, lat, lon]) => [
                    id,
                    { latitude: parseFloat(lat), longitude: parseFloat(lon) },
                ])
            );

            const formattedSelectedDate = selectedDate.toLocaleDateString("en-CA");

            let formattedParsedData = [];
            
            // Getting data for chosen date
            const parsedData = airQualityData.filter(([date]) => {
                return date.trim() === formattedSelectedDate;
            });

            // If data exists
            if (parsedData.length > 0) {
                console.log("Parsed Data:", parsedData);
                formattedParsedData = parsedData.map(([date, sensorId, so2, co, no2, formaldehyde]) => {
                    const latitude = locationMap[sensorId]?.latitude;
                    const longitude = locationMap[sensorId]?.longitude;
                    return {
                        sensorId,
                        latitude,
                        longitude,
                        so2: parseFloat(so2) || 0,
                        co: parseFloat(co) || 0,
                        no2: parseFloat(no2) || 0,
                        formaldehyde: parseFloat(formaldehyde) || 0,
                        color: getMarkerColor(
                            parseFloat(so2), parseFloat(co), parseFloat(no2), 
                            parseFloat(formaldehyde)
                        ),
                    };
                }).filter(sensor => sensor.latitude && sensor.longitude);

                // Saving sensors' data
                setSensorData([...formattedParsedData]);
                
                // If sensor was selected, then date was changed
                if (selectedSensor) {
                    const updatedSensor = formattedParsedData.find(sensor => sensor.sensorId === selectedSensor.sensorId);
                    if (updatedSensor) {
                        console.log("✅ Updating selected sensor with new data:", updatedSensor);
                        setSelectedSensor(updatedSensor);
                    } else {
                        console.warn("⚠️ Previously selected sensor is not available for the new date.");
                        setSelectedSensor(null);
                    }
                }
            } else {
                console.warn(`No sensor data found for ${formattedSelectedDate} and ${selectedDate}`);
                setSensorData([]);
                setSelectedSensor(null);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    // Runs when either map was initialized or date was changed
    useEffect(() => {
        if (map && selectedDate) {
            console.log(map)
            console.log("Date is selected: ", selectedDate);
            fetchData();
        }
    }, [selectedDate, map]);

    // Function to draw markers and areas around them
    // Runs when sensors' data was successfully fetched
    useEffect(() => {
        if (!map) {
            console.warn("⚠️ mapRef.current is NULL. Waiting for initialization...");
            return;
        }

        // Cleaning map
        map.eachLayer((layer) => {
            if (!(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });

        map.createPane("overlayPane");
        map.getPane("overlayPane").style.zIndex = "500";
        map.getPane("overlayPane").style.pointerEvents = "none";

        const overlayLayer = L.layerGroup().addTo(map);
        const markerLayer = L.layerGroup().addTo(map);

        if (sensorData.length > 0) {
            sensorData.forEach(sensor => {
                console.log("Adding marker for sensor:", sensor.sensorId, "at", sensor.latitude, sensor.longitude);

                if (!sensor.latitude || !sensor.longitude) {
                    console.warn("Invalid sensor coordinates:", sensor);
                    return;
                }

                // Drawing the areas for markers
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = 400;
                canvas.height = 400;

                const gradient = ctx.createRadialGradient(
                    200, 200, 0,
                    200, 200, 200
                );

                const colorMap = {
                    red: "255, 0, 0",
                    yellow: "200, 150, 50",
                    green: "0, 128, 0"
                };

                const rgbColor = colorMap[sensor.color] || "0, 0, 0";

                gradient.addColorStop(0.7, `rgba(${rgbColor}, 0.23)`);
                gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 400, 400);

                const overlay = L.imageOverlay(canvas.toDataURL(), [
                    [sensor.latitude + 0.05, sensor.longitude - 0.05],
                    [sensor.latitude - 0.05, sensor.longitude + 0.05]
                ], { pane: "overlayPane", interactive: true }).addTo(overlayLayer);

                // Runs when user clickes on any area
                overlay.on("click", (e) => {
                    console.log("Overlay clicked:", e.latlng);
                    const closestSensor = sensorData.reduce((closest, sensor) => {
                        const distance = map.distance(e.latlng, L.latLng(sensor.latitude, sensor.longitude));
                        return distance < closest.distance ? { sensor, distance } : closest;
                    }, { sensor: null, distance: Infinity }).sensor;

                    if (closestSensor) {
                        setSelectedSensor(closestSensor);
                    }
                });

                // Drawing the markers
                L.marker([sensor.latitude, sensor.longitude], {
                    icon: new L.Icon({
                        iconUrl: `/marker-icon-${sensor.color}.png`,
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl: "/marker-shadow.png",
                        shadowSize: [41, 41]
                    }),
                    pane: "markerPane",
                    zIndexOffset: 50
                }).addTo(markerLayer).bindPopup(`
                    <strong>Датчик ${sensor.sensorId}</strong><br />
                    Итоговая оценка: ${getFinalQualityLabel(calculateTotalScore(sensor))}
                `).on("click", (e) => {
                    console.log("Marker clicked:", e.latlng);
                    const closestSensor = sensorData.reduce((closest, sensor) => {
                        const distance = map.distance(e.latlng, L.latLng(sensor.latitude, sensor.longitude));
                        return distance < closest.distance ? { sensor, distance } : closest;
                    }, { sensor: null, distance: Infinity }).sensor;

                    if (closestSensor) {
                        setSelectedSensor(closestSensor);
                    }
                });
            });
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 500);
    
    }, [sensorData]);

    return (
        <div style={styles.container}>
            <MapContainer 
                center={mapCenter} 
                zoom={12}
                style={{ height: "500px", width: "100%", marginTop: "30px" }}
                scrollWheelZoom={false} // user can't zoom the map
                dragging={false}    // user can't move the map
                zoomControl={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                ref={setMap}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </MapContainer>

            <div style={styles.calendar}>
                <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                maxDate={new Date()}
                inline
                />
            </div>
            
            {/* Section for showing the advanced information about the sensor */}
            {selectedSensor && (
                <div style={{ textAlign: "center", marginTop: "20px", padding: "15px 40px", background: "#f9f9f9", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
                <h3>Подробная информация о датчике</h3>
                <p><strong>ID датчика:</strong> {selectedSensor.sensorId}</p>
                <br/>

                <div style={styles.advancedInfoText}>
                    <p><strong>SO₂:</strong> {selectedSensor.so2} µg/m³. Согласно ВОЗ, норма составляет {WHO_NORMS.so2} µg/m³.</p>
                    <p><strong>{getPollutionStatus(selectedSensor.so2, WHO_NORMS.so2)}</strong></p>
                </div>
                <div style={styles.advancedInfoText}>
                    <p><strong>CO:</strong> {selectedSensor.co} µg/m³. Согласно ВОЗ, норма составляет {WHO_NORMS.co} µg/m³.</p>
                    <p><strong>{getPollutionStatus(selectedSensor.co, WHO_NORMS.co)}</strong></p>
                </div>
                <div style={styles.advancedInfoText}>
                    <p><strong>NO₂:</strong> {selectedSensor.no2} µg/m³. Согласно ВОЗ, норма составляет {WHO_NORMS.no2} µg/m³.</p>
                    <p><strong>{getPollutionStatus(selectedSensor.no2, WHO_NORMS.no2)}</strong></p>
                </div>
                <div style={styles.advancedInfoText}>
                    <p><strong>Формальдегид:</strong> {selectedSensor.formaldehyde} µg/m³. Согласно ВОЗ, норма составляет {WHO_NORMS.formaldehyde} µg/m³.</p>
                    <p><strong>{getPollutionStatus(selectedSensor.formaldehyde, WHO_NORMS.formaldehyde)}</strong></p>
                </div>
                <br/>
                
                <p><strong>Итоговая оценка:</strong> {getFinalQualityLabel(calculateTotalScore(selectedSensor))}</p>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        position: "relative",
    },
    calendar: {
        position: "absolute",
        top: "5px",
        right: "5px",
        zIndex: 1000,
        transform: "scale(0.7)",
        transformOrigin: "top right",
    },
    advancedInfoText: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 20px",
    },
};