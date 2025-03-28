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
                
                // Translation to show info in Russian
                const weatherTranslation = {
                    Clear: "Ясно",
                    Clouds: "Облачно",
                    Rain: "Дождь",
                    Snow: "Снег",
                    Drizzle: "Морось",
                    Thunderstorm: "Гроза",
                    Mist: "Туман",
                    Fog: "Туман",
                    Haze: "Легкий туман",
                    Smoke: "Дымка",
                    Dust: "Пыль",
                    Sand: "Песок",
                    Squall: "Шквал",
                    Tornado: "Торнадо"
                };

                setWeatherData({
                    temperature: Math.round(data.main.temp),
                    windSpeed: Math.round(data.wind.speed),
                    precipitation: weatherTranslation[data.weather[0].main] || "Неизвестно",
                    humidity: data.main.humidity,
                    sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString("ru-RU"),
                    sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString("ru-RU"),
                    description: weatherTranslation[data.weather[0].main] || "Неизвестно",
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
            <div style={styles.leftSection}>
                <div style={styles.iconSection}>
                    <span style={styles.icon}>{WeatherIcons.temperature}</span>
                    <div>
                        <span style={styles.BigText}>{Math.round(weatherData.temperature)}°C</span>
                    </div>
                </div>
                <div style={styles.iconSection}>
                    <span style={styles.icon}>{WeatherIcons.wind}</span>
                    <div>
                        <span style={styles.BigText}>{weatherData.windSpeed} км/ч</span>
                    </div>
                </div>
            </div>

            {/* Section with additional weather information */}
            <div style={styles.rightSection}>
                <div style={styles.rightSectionText}>
                    <p>Осадки:</p>
                    <p><strong>{weatherData.precipitation}</strong></p>
                </div>
                <div style={styles.rightSectionText}>
                    <p>Влажность:</p>
                    <p><strong>{weatherData.humidity}%</strong></p>
                </div>
                <div style={styles.rightSectionText}>
                    <p>Время Восхода:</p>
                    <p><strong>{weatherData.sunrise}</strong></p>
                </div>
                <div style={styles.rightSectionText}>
                    <p>Время Заката:</p>
                    <p><strong>{weatherData.sunset}</strong></p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    weatherContainer: {
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
    },
    leftSection: {
        display: "flex",
        flexDirection: "column",
    },
    iconSection: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        fontSize: "60px",
        marginRight: "8px",
    },
    BigText: {
        fontWeight: "bold",
        fontSize: "50px",
    },
    rightSection: {
        textAlign: "left",
        fontSize: "16px",
        width: "40%",
    },
    rightSectionText: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #ccc", // gray line below each line
    },
};