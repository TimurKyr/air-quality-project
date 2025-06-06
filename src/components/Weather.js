"use client";

import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";

export default function Weather() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Runs immediately when website loads
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Getting weather info from openweathermap API
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=Almaty,KZ&units=metric&appid=b7887f62e5f98e29c27718b583698dae`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch weather data");
                }
                const data = await response.json();

                setWeatherData({
                    temperature: Math.round(data.main.temp),
                    windSpeed: Math.round(data.wind.speed),
                    precipitation: data.weather[0].main || "Unknown",
                    humidity: data.main.humidity,
                    sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString("ru-RU"),
                    sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString("en-US"),
                    description: data.weather[0].main || "Unknown",
                });
                setLoading(false);  // Weather is ready to show
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    const WeatherIcons = {
        temperature: "🌡️",
        wind: "💨",
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error}</p>;

    return (
        <div style={styles.weatherContainer}>
            {/* Section with temperature and wind speed */}
            <div style={styles.topSection}>
                <div style={styles.iconSection}>
                    <span style={styles.icon}>{WeatherIcons.temperature}</span>
                    <div>
                        <span style={styles.BigText}>{Math.round(weatherData.temperature)}°C</span>
                    </div>
                </div>
                <div style={styles.iconSection}>
                    <span style={styles.icon}>{WeatherIcons.wind}</span>
                    <div>
                        <span style={styles.BigText}>{weatherData.windSpeed} km/h</span>
                    </div>
                </div>
            </div>

            {/* Section with additional weather information */}
            <div style={styles.bottomSection}>
                <div style={styles.bottomSectionText}>
                    <p>Precipitation:</p>
                    <p><strong>{weatherData.precipitation}</strong></p>
                </div>
                <div style={styles.bottomSectionText}>
                    <p>Humidity:</p>
                    <p><strong>{weatherData.humidity}%</strong></p>
                </div>
                <div style={styles.bottomSectionText}>
                    <p>Sunrise Time:</p>
                    <p><strong>{weatherData.sunrise}</strong></p>
                </div>
                <div style={styles.bottomSectionText}>
                    <p>Sunset Time:</p>
                    <p><strong>{weatherData.sunset}</strong></p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    weatherContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        gap: "30px",
    },
    topSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "80%",
    },
    iconSection: {
        display: "flex",
        flexDirection: "row",
        alignItems: "left",
    },
    icon: {
        fontSize: "60px",
        marginRight: "8px",
    },
    BigText: {
        fontWeight: "bold",
        fontSize: "50px",
    },
    bottomSection: {
        textAlign: "left",
        alignItems: "center",
        fontSize: "16px",
        width: "80%",
    },
    bottomSectionText: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #ccc",
    },
};