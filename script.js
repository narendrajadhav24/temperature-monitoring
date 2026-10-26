
const SUPABASE_URL = "https://yprravrnfbzmxvuevrhg.supabase.co";
const SUPABASE_KEY = "sb_publishable_yOySs7YnIgmXrUZQVrtzqg_yD1Ufjlr";

const TABLE_URL = `${SUPABASE_URL}/rest/v1/sensor_readings`;

const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
const statusElement = document.getElementById("connectionStatus");
const connectionDot = document.getElementById("connectionDot");
const lastUpdatedElement = document.getElementById("lastUpdated");

const chartContext = document.getElementById("temperatureChart");

const temperatureChart = new Chart(chartContext, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Temperature (°C)",
            data: [],
            borderColor: "#ea580c",
            backgroundColor: "rgba(234, 88, 12, 0.12)",
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: "Temperature (°C)"
                }
            },
            x: {
                title: {
                    display: true,
                    text: "Time"
                }
            }
        }
    }
});

async function fetchSensorData() {
    try {
        const response = await fetch(
            `${TABLE_URL}?select=*&order=created_at.desc&limit=20`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const records = await response.json();

        if (!records.length) {
            throw new Error("No sensor readings found.");
        }

        const latest = records[0];

        temperatureElement.textContent =
            Number(latest.temperature).toFixed(1);

        humidityElement.textContent =
            Number(latest.humidity).toFixed(1);

        lastUpdatedElement.textContent =
            new Date(latest.created_at).toLocaleString();

        // Chart expects oldest-to-newest order
        const chartRecords = [...records].reverse();

        temperatureChart.data.labels = chartRecords.map(
            item => new Date(item.created_at).toLocaleTimeString()
        );

        temperatureChart.data.datasets[0].data =
            chartRecords.map(item => Number(item.temperature));

        temperatureChart.update();

        statusElement.textContent = "Supabase Connected";
        connectionDot.className = "dot connected";

    } catch (error) {
        console.error("Supabase Error:", error);

        statusElement.textContent = "Database Connection Failed";
        connectionDot.className = "dot disconnected";
    }
}

// Initial fetch
fetchSensorData();

// Refresh readings every 5 seconds
setInterval(fetchSensorData, 5000);
