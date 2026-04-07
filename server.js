const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT,
            amount REAL,
            type TEXT,
            category TEXT,
            date TEXT
        )`);
    }
});

// API Routes
app.get('/api/transactions', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC, id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/api/transactions', (req, res) => {
    const { description, amount, type, category, date } = req.body;
    if (!description || !amount || !type || !category || !date) {
        return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    const sql = 'INSERT INTO transactions (description, amount, type, category, date) VALUES (?,?,?,?,?)';
    const params = [description, amount, type, category, date];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            message: 'Transaction added successfully', 
            data: { id: this.lastID, description, amount, type, category, date } 
        });
    });
});

app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM transactions WHERE id = ?', id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Transaction deleted', changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
