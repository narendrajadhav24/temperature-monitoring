
// ======================================
// MQTT CONFIGURATION
// ======================================

const MQTT_URL = "ws://localhost:9001";

const MQTT_TOPIC = "college/temperature/room1";

// ======================================
// HTML ELEMENTS
// ======================================

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

// ======================================
// TEMPERATURE CHART
// ======================================

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

// ======================================
// CONNECT TO MQTT BROKER
// ======================================

const client = mqtt.connect(MQTT_URL, {
    clientId: "webDashboard_" +
        Math.random().toString(16).substring(2, 10),

    connectTimeout: 5000,
    reconnectPeriod: 3000
});

// ======================================
// MQTT CONNECTED
// ======================================

client.on("connect", function () {

    console.log("MQTT Connected!");

    statusElement.textContent = "MQTT Connected";

    connectionDot.className = "dot connected";

    client.subscribe(MQTT_TOPIC, function (error) {

        if (error) {
            console.error("Subscription error:", error);
        } else {
            console.log("Subscribed to:", MQTT_TOPIC);
        }

    });

});

// ======================================
// RECEIVE SENSOR DATA
// ======================================

client.on("message", function (topic, message) {

    try {

        const data = JSON.parse(message.toString());

        const temperature = Number(data.temperature);
        const humidity = Number(data.humidity);

        if (!Number.isFinite(temperature) ||
            !Number.isFinite(humidity)) {
            throw new Error("Invalid sensor readings");
        }

        // Update temperature
        temperatureElement.textContent =
            temperature.toFixed(1);

        // Update humidity
        humidityElement.textContent =
            humidity.toFixed(1);

        // Update last received time
        const currentTime =
            new Date().toLocaleTimeString();

        lastUpdatedElement.textContent = currentTime;

        // Add temperature to chart
        temperatureChart.data.labels.push(currentTime);

        temperatureChart.data.datasets[0].data.push(
            temperature
        );

        // Keep only latest 20 readings
        if (temperatureChart.data.labels.length > 20) {

            temperatureChart.data.labels.shift();

            temperatureChart.data.datasets[0].data.shift();

        }

        temperatureChart.update();

        console.log("Sensor Data:", data);

    } catch (error) {

        console.error("Invalid MQTT message:", error);

    }

});

// ======================================
// MQTT DISCONNECTED
// ======================================

client.on("close", function () {

    statusElement.textContent = "MQTT Disconnected";

    connectionDot.className = "dot disconnected";

});

// ======================================
// MQTT ERROR
// ======================================

client.on("error", function (error) {

    console.error("MQTT Error:", error);

});
