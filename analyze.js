const params = new URLSearchParams(window.location.search);
const symbol = (params.get("symbol") || "AAPL").trim().toUpperCase();
const refresh = params.get("refresh") === "1";
const metaLine = document.getElementById("metaLine");
const tickerLabel = document.getElementById("tickerLabel");
const symbolInput = document.getElementById("symbol");

tickerLabel.textContent = symbol;
symbolInput.value = symbol

let chartInstance = null;

function setText(elementId, text) {
    if (document.getElementById(elementId)) {
       document.getElementById(elementId).textContent = text;
    }
}

// if API returns non numbers like null then it could mess up the chart. I made this helper to handle that
function safeNumber(num) {
    return Number.isFinite(Number(num)) ? Number(num) : null;
}

function formatDate(date) {
    return dayjs(date).isValid() ? dayjs(date).format("YYYY-MM-DD") : String(date);
}

function renderCalendar(rows) {
    const tbody = document.querySelector("#calendarTable tbody");
    tbody.innerHTML = "";
    for (const row of rows) {
        const tableRow = document.createElement("tr");
        tableRow.innerHTML = `
            <td>${formatDate(row.report_date)}</td>
            <td>${row.symbol || ""}</td>
            <td>${row.name || ""}</td>
            <td>${row.estimate ?? ""}</td>
            <td>${row.currency || ""}</td>
        `;
        tbody.appendChild(tableRow);
    }
}

function renderEarnings(rows) {
    const tbody = document.querySelector("#earningsTable tbody");
    tbody.innerHTML = "";

    for (const row of rows) {
        const surprisePercent = row.surprise_pct;
        const surprisePercentText = (surprisePercent === null || surprisePercent === undefined) ? "" : `${Number(surprisePercent).toFixed(2)}%`;
        const tableRow = document.createElement("tr");
        tableRow.innerHTML = `
            <td>${formatDate(row.reported_date)}</td>
            <td>${row.reported_eps ?? ""}</td>
            <td>${row.estimated_eps ?? ""}</td>
            <td>${(surprisePercent === null || surprisePercent === undefined) ? "" : `${Number(surprisePercent).toFixed(2)}%`}</td>
            <td>${row.badge || ""}</td>
        `;
        tbody.appendChild(tableRow);
    }
}

function renderChart(rows) {
    const labels = rows.map(row => formatDate(row.reported_date)).reverse()
    const values = rows.map(row => safeNumber(row.surprise_pct) ?? 0).reverse();
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    chartInstance = new Chart(document.getElementById("surpriseChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Surprise %",
                data: values
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {display: true}
            },
            scales: {
                y: {ticks: {callback: v => `${v}%`}}
            }
        }
    });
}

async function loadCalendar() {
    let url = ""
    if (refresh) {
        url = "/api/calendar?refresh=1";
    } else {
        url = "/api/calendar";
    }

    const response = await fetch(url);
    const data = await response.json();
    renderCalendar(data.items || []);
}

async function loadCalendarMeta() {
    const response = await fetch("/api/calendar?meta=1");
    const data = await response.json();
    let last = "";
    if (data.last_ingested) {
        last = formatDate(data.last_ingested);
    } else {
        last = "-";
    }
    metaLine.textContent = `Calendar rows: ${data.count} | Last ingested: ${last} | Ticker: ${symbol}`;
}

async function loadEarnings() {
    const response = await fetch(`/api/earnings?symbol=${encodeURIComponent(symbol)}`);
    const data = await response.json();
    setText("tickerLabel", data.symbol);
    renderEarnings(data.quarters);
    renderChart(data.quarters);
}

(async function run() {
    await loadCalendar();
    await loadCalendarMeta();
    await loadEarnings();
})();