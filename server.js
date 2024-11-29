const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: 'Dhayanithi##17', 
  database: 'school_management'
});

db.connect((err) => {
  if (err) {
    console.error('Could not connect to database:', err);
    process.exit(1);
  }
  console.log('Connected to the MySQL database');
});

// Add School API
app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validate input
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error inserting school', error: err });
    }
    res.status(200).json({ message: 'School added successfully', schoolId: result.insertId });
  });
});

// List Schools API (sorted by proximity)
app.get('/listSchools', (req, res) => {
  const { userLatitude, userLongitude } = req.query;

  if (!userLatitude || !userLongitude) {
    return res.status(400).json({ message: 'User latitude and longitude are required' });
  }

  const query = 'SELECT id, name, address, latitude, longitude FROM schools';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving schools', error: err });
    }

    // Calculate distance and sort by proximity
    const sortedSchools = results.map((school) => {
      const distance = getDistance(userLatitude, userLongitude, school.latitude, school.longitude);
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);

    res.status(200).json(sortedSchools);
  });
});

// Function to calculate the distance between two coordinates (in km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
