const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const path = require('path');

const sessionMiddleware = require('./middleware/session');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');
const mobileRoutes = require('./routes/mobile.routes');
const reportsRoutes = require('./routes/reports.routes');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(sessionMiddleware);

// Flash messages
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.session = req.session;
    next();
});

// Health check routes
app.get('/ping', (req, res) => {
    res.send('pong');
});

app.get('/ping_json', (req, res) => {
    const supabase = require('./config/supabase');
    res.json({
        pong: true,
        time: new Date().toISOString(),
        supabase_configured: !!supabase,
        db_configured: !!process.env.DATABASE_URL
    });
});

// Routes
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', employeeRoutes);
app.use('/', mobileRoutes);
app.use('/', reportsRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});

module.exports = app;
