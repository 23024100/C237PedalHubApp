const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pedalhubapp'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable parsing of URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));


// Using Read operation to view the form to add a new event
// Display form to add a new event
app.get("/addEvent", (req, res) => {
    res.render("addEvent");
});


// Using Create operation to add a new event
// Process form submission to add a new event
app.post("/addEvent", upload.single('image'), (req, res) => {
    // Extract event data from the request body
    const { name, eventDate, eventDetails } = req.body;
    let image = null;

    if (req.file) {
        image = '/images/' + req.file.filename; // Adjust path to match how images are served
    }

    const sql = "INSERT INTO events (name, eventDate, eventDetails, image) VALUES (?, ?, ?, ?)";

    // Insert the new event into the database
    connection.query(sql, [name, eventDate, eventDetails, image], (error, results) => {
        if (error) {
            console.error("Error adding event:", error);
            res.status(500).send('Error adding event');
        } else {
            res.redirect('/');
        }
    });
});

// Using Read operation to view all events
// Render index page with all events
app.get("/", (req, res) => {
    const sql = "SELECT * FROM events";
    connection.query(sql, (error, results) => {
        if (error) {
            console.log("Database error", error);
            return res.status(500).send("Database error");
        }
        res.render('index', { events: results }); // Render HTML page with data
    });
});


// Using Read operation to view the details of a single event
// Render event details page
app.get('/event/:id', (req, res) => {
    const eventId = req.params.id; // Get the event ID from the URL
    const sql = 'SELECT * FROM events WHERE eventId = ?';
    connection.query(sql, [eventId], (error, results) => {
        if (error) {
            console.error('Database query error', error.message);
            return res.status(500).send('Error retrieving event');
        }
        if (results.length > 0) {
            res.render('event', { event: results[0] }); // Render HTML page with event details
        } else {
            res.status(404).send('Event not found');
        }
    });
});

// Using Read Operation to view the form to edit an event
// Render edit event form
app.get('/editEvent/:id', (req, res) => {
    const eventId = req.params.id; // Get the event ID from the URL
    const sql = 'SELECT * FROM events WHERE eventId = ?';
    connection.query(sql, [eventId], (error, results) => {
        if (error) {
            console.error('Database query error', error.message);
            return res.status(500).send('Error retrieving event');
        }
        if (results.length > 0) {
            res.render('editEvent', { event: results[0] }); // Render HTML page with edit form
        } else {
            res.status(404).send('Event not found');
        }
    });
});

// Using Update operation to edit and update details of an event
// Process form submission to update an event
app.post('/editEvent/:id', upload.single('image'), (req, res) => {
    const eventId = req.params.id;
    const { name, eventDate, eventDetails } = req.body;
    let image = req.body.currentImage;

    if (req.file) {
        image = '/images/' + req.file.filename; // Adjust path to match how images are served
    }

    const sql = 'UPDATE events SET name = ?, eventDate = ?, eventDetails = ?, image = ? WHERE eventId = ?';

    connection.query(sql, [name, eventDate, eventDetails, image, eventId], (error, results) => {
        if (error) {
            console.error("Error updating event:", error);
            res.status(500).send('Error updating event');
        } else {
            res.redirect('/');
        }
    });
});

// Using Delete operation to delete an event
// Delete an event
app.get('/deleteEvent/:id', (req, res) => {
    const eventId = req.params.id;
    const sql = 'DELETE FROM events WHERE eventId = ?';
    connection.query(sql, [eventId], (error, results) => {
        if (error) {
            console.error('Error deleting event:', error);
            res.status(500).send('Error deleting event');
        } else {
            res.redirect('/');
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
