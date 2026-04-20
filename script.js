// Chart instance
let pieChart = null;

// Load data dari localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let balance = parseInt(localStorage.getItem('balance')) || 0;

// Update tampilan balance
function updateBalance() {
    document.getElementById('balance').textContent = balance.toLocaleString();
    localStorage.setItem('balance', balance);
}

// Hitung total pemasukan & pengeluaran
function getIncomeExpenseSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'pemasukan')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return {
        income: totalIncome,
        expense: totalExpense,
        total: totalIncome + totalExpense
    };
}

// Update PIE CHART - GUARANTEED TO WORK!
function updatePieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const summary = getIncomeExpenseSummary();
    
    // Destroy existing chart
    if (pieChart) {
        pieChart.destroy();
    }
    
    // Empty state
    if (summary.total === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = 'bold 18px Segoe UI';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📊', ctx.canvas.width/2, ctx.canvas.height/2 - 10);
        ctx.font = '14px Segoe UI';
        ctx.fillText('Belum ada transaksi', ctx.canvas.width/2, ctx.canvas.height/2 + 10);
        return;
    }
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['💰 Pemasukan', '💸 Pengeluaran'],
            datasets: [{
                data: [summary.income, summary.expense],
                backgroundColor: ['#51cf66', '#ff6b6b'],
                borderColor: ['#fff', '#fff'],
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 14, weight: 'bold' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: Rp ${context.parsed.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '50%'
        }
    });
}

// Render history (sama)
function renderHistory() {
    const historyList = document.getElementById('historyList');
    
    if (transactions.length === 0) {
        historyList.innerHTML = '<div class="empty-state">Belum ada transaksi. Tambahkan pemasukan atau pengeluaran!</div>';
        return;
    }

    historyList.innerHTML = transactions.map((trans) => `
        <div class="history-item ${trans.type}">
            <div class="amount">${trans.type === 'pengeluaran' ? '−' : '+'}Rp ${trans.amount.toLocaleString()}</div>
            <div><strong>${trans.description || trans.notes}</strong></div>
            <div class="details">
                ${new Date(trans.date || Date.now()).toLocaleString('id-ID', { 
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
                ${trans.type === 'pengeluaran' ? ` | Sisa: Rp ${trans.newBalance?.toLocaleString() || balance.toLocaleString()}` : ''}
            </div>
        </div>
    `).reverse().join('');
}

// Tambah pengeluaran
function addPengeluaran() {
    const amount = parseInt(document.getElementById('pengeluaranAmount').value);
    const item = document.getElementById('pengeluaranItem').value.trim();
    const date = document.getElementById('pengeluaranDate').value;

    if (!amount || amount <= 0 || !item) {
        alert('❌ Isi lengkap jumlah dan item!');
        return;
    }

    if (amount > balance) {
        alert(`💸 Uang tidak cukup!\nSaldo: Rp ${balance.toLocaleString()}`);
        return;
    }

    balance -= amount;
    transactions.push({
        type: 'pengeluaran',
        amount, description: item,
        date: date || new Date().toISOString().slice(0, 16),
        newBalance: balance
    });

    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('balance', balance);

    document.getElementById('pengeluaranAmount').value = '';
    document.getElementById('pengeluaranItem').value = '';
    document.getElementById('pengeluaranDate').value = new Date().toISOString().slice(0, 16);

    updateBalance();
    renderHistory();
    updatePieChart();
}

// Tambah pemasukan
function addPemasukan() {
    const amount = parseInt(document.getElementById('pemasukanAmount').value);
    const notes = document.getElementById('pemasukanNotes').value.trim();

    if (!amount || amount <= 0 || !notes) {
        alert('❌ Masukkan jumlah & sumber uang!');
        return;
    }

    balance += amount;
    transactions.push({
        type: 'pemasukan',
        amount, notes,
        date: new Date().toISOString().slice(0, 16)
    });

    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('balance', balance);

    document.getElementById('pemasukanAmount').value = '';
    document.getElementById('pemasukanNotes').value = '';

    updateBalance();
    renderHistory();
    updatePieChart();
}

// Reset data
function resetData() {
    if (confirm('⚠️ Hapus semua data?')) {
        transactions = []; balance = 0;
        localStorage.clear();
        updateBalance();
        renderHistory();
        updatePieChart();
    }
}

// Init
document.getElementById('pengeluaranDate').value = new Date().toISOString().slice(0, 16);
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const id = document.activeElement.id;
        if (id.includes('pengeluaran')) addPengeluaran();
        if (id.includes('pemasukan')) addPemasukan();
    }
});

updateBalance();
renderHistory();
updatePieChart();