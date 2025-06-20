const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

const DBpool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '16October2003@',
    database: 'dog-walk-service',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.json());

async function insertInitialData() {
    try {
        await pool.execute(`
            INSERT INTO Users (username, email, password_hash, role) VALUES
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('dinwalker', 'din@gmail.com', 'hashed101112', 'walker'),
            ('himaowner', 'hima@gmail.com', 'hashed131415', 'owner')
        `);
        await pool.execute(`
            INSERT INTO Dogs (owner_id, name, size) VALUES
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
            ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Neutron', 'large'),
            ((SELECT user_id FROM Users WHERE username = 'himaowner'), 'Megatron', 'small'),
            ((SELECT user_id FROM Users WHERE username = 'himaowner'), 'Electron', 'medium')
        `);
        await pool.execute(`
            INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
             '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')),
             '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Neutron' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
             '2025-06-11 14:00:00', 60, 'Central Park', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Megatron' AND owner_id = (SELECT user_id FROM Users WHERE username = 'himaowner')),
             '2025-06-12 07:30:00', 45, 'Riverside Trail', 'completed'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Electron' AND owner_id = (SELECT user_id FROM Users WHERE username = 'himaowner')),
             '2025-06-13 16:00:00', 30, 'Dog Park Plaza', 'open')
        `);

        console.log('Initial data inserted successfully');
    } catch (error) {
        console.error('Error inserting initial data:', error);
    }
}

// Routes will go here

// Start server and insert initial data
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await insertInitialData();
});