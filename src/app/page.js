"use client";

import dynamic from "next/dynamic";
import Weather from "../components/Weather";

// Importing AirQualityMap component
const AirQualityMap = dynamic(() => import("../components/AirQualityMap"), {
  ssr: false, // Rendering map on the client side, not on server
});

export default function Home() {
  return (
    <main style={styles.container}>
      <div style={styles.row}>
        {/* Weather column */}
        <div style={styles.weatherColumn}>
          <p style={styles.title}>ТЕКУЩАЯ ПОГОДА В АЛМАТЫ</p>
          <div style={styles.centeredContent}>
            <Weather />
          </div>
        </div>

        {/* Map column */}
        <div style={styles.mapColumn}>
          <p style={styles.title}>КАРТА КАЧЕСТВА ВОЗДУХА АЛМАТЫ</p>
          <AirQualityMap />
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    background: "linear-gradient(to bottom, #ffffff, #f1f1f1)",
    padding: "20px 50px",
    borderRadius: "12px",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
    width: "80%",
    margin: "20px auto",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "50px"
  },
  weatherColumn: {
    width: "40%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  mapColumn: {
    width: "60%",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "16px",
    color: "#636363",
    padding: "0 3px 3px 0",
    borderBottom: "1px solid #ccc",
    width: "100%",
  },
  centeredContent: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    width: "100%",
  },
}