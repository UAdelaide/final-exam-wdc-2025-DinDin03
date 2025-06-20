const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

const DBpool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.json());

async function insertInitialData() {
    try {
        await DBpool.execute(`
            INSERT INTO Users (username, email, password_hash, role) VALUES
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('dinwalker', 'din@gmail.com', 'hashed101112', 'walker'),
            ('himaowner', 'hima@gmail.com', 'hashed131415', 'owner')
        `);
        await DBpool.execute(`
            INSERT INTO Dogs (owner_id, name, size) VALUES
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
            ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Neutron', 'large'),
            ((SELECT user_id FROM Users WHERE username = 'himaowner'), 'Megatron', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'himaowner'), 'Electron', 'medium')
        `);
        await DBpool.execute(`
            INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
             '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')),
             '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Neutron' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
             '2025-06-11 14:00:00', 60, 'Norwood', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Megatron' AND owner_id = (SELECT user_id FROM Users WHERE username = 'himaowner')),
             '2025-06-12 07:30:00', 45, 'Glenelg', 'completed'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Electron' AND owner_id = (SELECT user_id FROM Users WHERE username = 'himaowner')),
             '2025-06-13 16:00:00', 30, 'Tea Tree Plaza', 'open')
        `);

        console.log('Data inserted successfully');
    } catch (error) {
        console.error('Error inserting data', error);
    }
}

app.get('/api/dogs', async (req, res) => {
    try {
        const query = `
            SELECT
                d.name AS dog_name,
                d.size,
                u.username AS owner_username
            FROM Dogs d
            INNER JOIN Users u ON d.owner_id = u.user_id
            ORDER BY d.dog_id
        `;
        const [results] = await DBpool.execute(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'failed to fetch dogs' });
    }
});

app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const query = `
            SELECT
                wr.request_id,
                d.name AS dog_name,
                wr.requested_time,
                wr.duration_minutes,
                wr.location,
                u.username AS owner_username
            FROM WalkRequests wr
            INNER JOIN Dogs d ON wr.dog_id = d.dog_id
            INNER JOIN Users u ON d.owner_id = u.user_id
            WHERE wr.status = 'open'
            ORDER BY wr.requested_time
        `;
        const [results] = await DBpool.execute(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch open walk requests' });
    }
});

app.get('/api/walkers/summary', async (req, res) => {
    try {
        const query = `
            SELECT
                u.username AS walker_username,
                COUNT(DISTINCT wr.rating_id) AS total_ratings,
                IFNULL(AVG(wr.rating), NULL) AS average_rating,
                COUNT(DISTINCT CASE WHEN wrq.status = 'completed' THEN wa.request_id END) AS completed_walks
            FROM Users u
            LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id AND wa.status = 'accepted'
            LEFT JOIN WalkRequests wrq ON wa.request_id = wrq.request_id
            LEFT JOIN WalkRatings wr ON wrq.request_id = wr.request_id AND wr.walker_id = u.user_id
            WHERE u.role = 'walker'
            GROUP BY u.user_id, u.username
            ORDER BY u.username
        `;
        const [results] = await DBpool.execute(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch walker summary' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await insertInitialData();
});