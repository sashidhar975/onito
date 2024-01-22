// tambola-backend/server.js

const express = require('express');
const mysql = require('mysql2');
const util = require('util');
const cors = require('cors');
const app = express();

app.use(cors());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Devil@975',
    database: 'tambola'
});

const queryAsync = util.promisify(connection.query).bind(connection);

connection.connect();

connection.on('error', (err) => {
    console.error('Database connection error:', err);
    process.exit(1);
});

app.use(express.json());

app.post('/api/generate-tickets', async (req, res) => {
    try {
        const { N } = req.body;
        const generatedTickets = await generateTickets(N);
        res.json({ tickets: generatedTickets });
    } catch (error) {
        console.error('Error generating tickets:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/fetch-tickets', async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        const fetchedTickets = await fetchTickets(page, pageSize);
        res.json({ tickets: fetchedTickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function generateTickets(N) {
    const sets = {};

    for (let i = 1; i <= N; i++) {
        const set = generateSet();
        sets[i] = set;
        await saveToDatabase(set);
    }

    return sets;
}

function generateSet() {
    const set = [];
    const numbers = Array.from({ length: 90 }, (_, i) => i + 1);
    shuffle(numbers);

    for (let i = 0; i < 6; i++) {
        const ticket = [];
        const column = i * 10;

        for (let j = 0; j < 3; j++) {
            const row = [];

            for (let k = 0; k < 9; k++) {
                if (k === 0 || k === 8 || (k === 4 && j === 1)) {
                    row.push(0);
                } else {
                    const number = numbers[column + k];
                    row.push(number);
                }
            }

            row.sort((a, b) => a - b);
            ticket.push(row);
        }

        set.push(ticket);
    }

    return set;
}

async function saveToDatabase(set) {
    const query = 'INSERT INTO tambola_tickets (ticket_data) VALUES (?)';
    const ticketData = JSON.stringify(set);
    await queryAsync(query, [ticketData]);
}

async function fetchTickets(page, pageSize) {
    try {
        const parsedPage = parseInt(page);
        const parsedPageSize = parseInt(pageSize);

        if (isNaN(parsedPage) || isNaN(parsedPageSize) || parsedPage < 1 || parsedPageSize < 1) {
            throw new Error('Invalid page or pageSize values');
        }

        const offset = (parsedPage - 1) * parsedPageSize;
        const query = 'SELECT ticket_data FROM tambola_tickets LIMIT ?, ?';
        const tickets = await queryAsync(query, [offset, parsedPageSize]);
        return tickets.map((ticket) => JSON.parse(ticket.ticket_data));
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
