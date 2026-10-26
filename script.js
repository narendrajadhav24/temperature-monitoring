
// =====================================
// SUPABASE CONFIGURATION
// =====================================

const SUPABASE_URL =
    "https://yprravrnfbzmxvuevrhg.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_yOySs7YnIgmXrUZQVrtzqg_yD1Ufjlr";

const TABLE_URL =
    `${SUPABASE_URL}/rest/v1/sensor_readings`;

// =====================================
// HTML ELEMENTS
// =====================================

const temperatureElement =
    document.getElementById("temperature");

const humidityElement =
    document.getElementById("humidity");

const statusElement =
    document.getElementById("connectionStatus");

const connectionDot =
    document.getElementById("connectionDot");

const lastUpdatedElement =
    document.getElementById("lastUpdated");

// =====================================
// TEMPERATURE CHART
// =====================================

const chartContext =
    document.getElementById("temperatureChart");

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
        maintainAspectRatio: false,

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

// =====================================
// UPDATE CONNECTION STATUS
// =====================================

function updateStatus(message, connected) {

    statusElement.textContent = message;

    connectionDot.className =
        connected ? "dot connected" : "dot disconnected";
}

// =====================================
// FETCH SENSOR DATA FROM SUPABASE
// =====================================

async function fetchSensorData() {

    try {

        updateStatus("Connecting to Supabase...", false);

        const response = await fetch(
            `${TABLE_URL}?select=id,temperature,humidity,created_at&order=created_at.desc&limit=20`,
            {
                method: "GET",

                headers: {
                    "apikey": SUPABASE_KEY
                }
            }
        );

        if (!response.ok) {

            const errorMessage = await response.text();

            throw new Error(
                `HTTP ${response.status}: ${errorMessage}`
            );
        }

        const records = await response.json();

        // Check whether data exists
        if (!records.length) {

            updateStatus(
                "Connected to Supabase - Waiting for sensor data",
                true
            );

            temperatureElement.textContent = "--";
            humidityElement.textContent = "--";

            lastUpdatedElement.textContent =
                "No sensor readings available";

            temperatureChart.data.labels = [];
            temperatureChart.data.datasets[0].data = [];

            temperatureChart.update();

            return;
        }

        // Latest reading
        const latest = records[0];

        const temperature =
            Number(latest.temperature);

        const humidity =
            Number(latest.humidity);

        // Validate values
        if (
            !Number.isFinite(temperature) ||
            !Number.isFinite(humidity)
        ) {
            throw new Error("Invalid sensor data received.");
        }

        // Display temperature
        temperatureElement.textContent =
            temperature.toFixed(1);

        // Display humidity
        humidityElement.textContent =
            humidity.toFixed(1);

        // Display last updated time
        lastUpdatedElement.textContent =
            new Date(latest.created_at).toLocaleString();

        // =====================================
        // UPDATE TEMPERATURE CHART
        // =====================================

        // Convert oldest-to-newest
        const chartRecords = [...records].reverse();

        temperatureChart.data.labels =
            chartRecords.map(item =>
                new Date(item.created_at).toLocaleTimeString()
            );

        temperatureChart.data.datasets[0].data =
            chartRecords.map(item =>
                Number(item.temperature)
            );

        temperatureChart.update();

        updateStatus(
            "Supabase Connected - Live Data Available",
            true
        );

        console.log("Latest Sensor Reading:", latest);

    } catch (error) {

        console.error("Supabase Error:", error);

        updateStatus(
            "Database Connection Failed",
            false
        );
    }
}

// =====================================
// INITIAL FETCH
// =====================================

fetchSensorData();

// =====================================
// AUTOMATIC REFRESH EVERY 5 SECONDS
// =====================================

setInterval(fetchSensorData, 5000);
