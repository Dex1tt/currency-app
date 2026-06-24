const API_KEY = 'edaf14e8a7c5621b71426798';
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

const currencies = ['USD', 'EUR', 'RUB', 'GBP', 'JPY', 'CNY', 'KZT', 'UAH', 'BYN', 'TRY'];

const flags = {
    USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺',
    GBP: '🇬🇧', JPY: '🇯🇵', CNY: '🇨🇳',
    KZT: '🇰🇿', UAH: '🇺🇦', BYN: '🇧🇾', TRY: '🇹🇷'
};

let rates = {};
let history = [];
let chartInstance = null;

function saveSettings() {
    localStorage.setItem('from', document.getElementById('from-currency').value);
    localStorage.setItem('to', document.getElementById('to-currency').value);
}

function saveHistory() {
    localStorage.setItem('history', JSON.stringify(history));
}

function loadHistory() {
    const saved = localStorage.getItem('history');
    if (saved) history = JSON.parse(saved);
}

async function loadRates() {
    const res = await fetch(API_URL);
    const data = await res.json();
    rates = data.conversion_rates;
    loadHistory();
    fillSelects();
    renderHistory();
    convert();
}

function fillSelects() {
    const from = document.getElementById('from-currency');
    const to = document.getElementById('to-currency');

    currencies.forEach(function(currency) {
        const flag = flags[currency] || '';
        from.innerHTML += `<option value="${currency}">${flag} ${currency}</option>`;
        to.innerHTML += `<option value="${currency}">${flag} ${currency}</option>`;
    });

    from.value = localStorage.getItem('from') || 'USD';
    to.value = localStorage.getItem('to') || 'RUB';
}

function convert() {
    const amount = parseFloat(document.getElementById('amount').value);
    const from = document.getElementById('from-currency').value;
    const to = document.getElementById('to-currency').value;

    if (!amount || !rates[from] || !rates[to]) return;

    const result = (amount / rates[from]) * rates[to];
    document.getElementById('result').value = result.toFixed(2);
    document.getElementById('rate-info').textContent = `1 ${from} = ${(rates[to] / rates[from]).toFixed(4)} ${to}`;

    history.unshift(`${amount} ${flags[from]} ${from} → ${result.toFixed(2)} ${flags[to]} ${to}`);
    if (history.length > 5) history.pop();
    saveHistory();
    saveSettings();
    renderHistory();
}

function renderHistory() {
    const el = document.getElementById('history');
    const clearBtn = document.getElementById('clear-history');

    if (history.length === 0) {
        el.innerHTML = '';
        clearBtn.style.display = 'none';
        return;
    }

    clearBtn.style.display = 'block';
    el.innerHTML = history.map(item => `<div class="history-item">${item}</div>`).join('');
}

async function loadChart(from, to) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const dates = [];
    const values = [];
    const baseRate = rates[to] / rates[from];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(`${d.getDate()}.${d.getMonth() + 1}`);
        const variation = baseRate * (1 + (Math.random() - 0.5) * 0.04);
        values.push(variation.toFixed(4));
    }

    values[6] = baseRate.toFixed(4);

    document.getElementById('chart-wrap').style.display = 'block';

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(document.getElementById('chart'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                data: values,
                borderColor: '#185FA5',
                backgroundColor: '#e8f0fe',
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { font: { size: 11 } } },
                x: { ticks: { font: { size: 11 } } }
            }
        }
    });
}

document.getElementById('convert-btn').addEventListener('click', async function() {
    convert();
    const from = document.getElementById('from-currency').value;
    const to = document.getElementById('to-currency').value;

    this.textContent = 'Загрузка...';
    this.disabled = true;

    await loadChart(from, to);

    this.textContent = 'Конвертировать';
    this.disabled = false;
});

document.getElementById('swap-btn').addEventListener('click', function() {
    const from = document.getElementById('from-currency');
    const to = document.getElementById('to-currency');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    convert();
});

document.getElementById('amount').addEventListener('input', convert);

document.getElementById('clear-history').addEventListener('click', function() {
    history = [];
    saveHistory();
    renderHistory();
    this.style.display = 'none';
});

loadRates();