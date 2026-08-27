const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'zc_db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serve frontend files

// Redirect root to login
app.get('/', (req, res) => {
    res.redirect('/frontend/login.html');
});

// GET /api/data
app.get('/api/data', (req, res) => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            return res.json({});
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST /api/data
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to write database' });
    }
});

// POST /api/upload-base64
app.post('/api/upload-base64', (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        // image is a base64 string like "data:image/jpeg;base64,/9j/4AAQSk..."
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid base64 string' });
        }
        
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `img_${Date.now()}.jpg`;
        const filepath = path.join(UPLOADS_DIR, filename);
        
        fs.writeFileSync(filepath, buffer);
        
        // Return URL accessible from frontend
        res.json({ success: true, url: `/uploads/${filename}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// PUT endpoints to update specific collections in db.json for granular updates
app.put('/api/tasks/:id', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const taskIdx = db.productionTasks.findIndex(t => t.id === req.params.id);
        if (taskIdx >= 0) {
            db.productionTasks[taskIdx] = req.body;
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const newTask = req.body;
        // Backend overrides ID to ensure uniqueness if needed, but frontend already sends ID
        db.productionTasks.push(newTask);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ success: true, data: newTask });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/violations', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        db.violations = db.violations || [];
        db.violations.push(req.body);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Node Server is running on port ${PORT}`);
});
