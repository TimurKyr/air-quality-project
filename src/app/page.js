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
      <div>
        <p style={styles.title}>ТЕКУЩАЯ ПОГОДА В АЛМАТЫ</p>
      </div>
      <Weather />
      
      <div>
        <p style={styles.title}>КАРТА КАЧЕСТВА ВОЗДУХА АЛМАТЫ</p>
      </div>
      <AirQualityMap />
    </main>
  );
}

const styles = {
  container: {
      background: "linear-gradient(to bottom, #ffffff, #f1f1f1)",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
      width: "900px",
      margin: "20px auto",
  },
  title: {
      fontSize: "16px",
      color: "#636363",
      marginBottom: "0px",
      padding: "0 3px",
      borderBottom: "1px solid #ccc",
  },
}