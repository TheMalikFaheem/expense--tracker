document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    let transactions = [];

    // Fetch initial data
    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            transactions = data.data || [];
            updateUI();
        } catch (error) {
            console.error('Error fetching data:', error);
            transactionList.innerHTML = '<div class="empty-state">Failed to load transactions. Is the server running?</div>';
        }
    };

    // Update UI elements
    const updateUI = () => {
        // Render List
        transactionList.innerHTML = '';
        if (transactions.length === 0) {
            transactionList.innerHTML = '<div class="empty-state">No transactions found. Add one above!</div>';
        } else {
            transactions.forEach(t => {
                const li = document.createElement('li');
                li.className = 'transaction-item';
                
                const isIncome = t.type === 'income';
                const sign = isIncome ? '+' : '-';
                const amountClass = isIncome ? 'income' : 'expense';

                li.innerHTML = `
                    <div class="transaction-info">
                        <span class="t-desc">${t.description}</span>
                        <div class="t-meta">
                            <span class="category-badge">${t.category}</span>
                            <span>${new Date(t.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="transaction-right">
                        <span class="t-amount ${amountClass}">${sign}$${Math.abs(t.amount).toFixed(2)}</span>
                        <button class="delete-btn" onclick="deleteTransaction(${t.id})" title="Delete">✕</button>
                    </div>
                `;
                transactionList.appendChild(li);
            });
        }

        // Update Summary Cards
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
            
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const balance = income - expense;

        document.getElementById('total-balance').textContent = `$${balance.toFixed(2)}`;
        document.getElementById('total-income').textContent = `+$${income.toFixed(2)}`;
        document.getElementById('total-expense').textContent = `-$${expense.toFixed(2)}`;
    };

    // Add Transaction
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newTx = {
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTx)
            });
            const data = await res.json();
            
            if (res.ok) {
                await fetchTransactions();
                
                // Reset form fields except date
                document.getElementById('description').value = '';
                document.getElementById('amount').value = '';
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to connect to the server.');
        }
    });

    // Make global for inline onclick
    window.deleteTransaction = async (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        
        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                await fetchTransactions();
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to connect to the server.');
        }
    };

    // Init
    fetchTransactions();
});
