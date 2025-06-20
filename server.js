const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/events');
const authMiddleware = require('./middleware/authMiddleware');
const cors = require('cors');  
const passport = require('passport');
    const session = require('express-session');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
  app.use(session({
            secret: 'fRwD8ZcX#k5H*J!yN&2G@pQbS9v6E$tA', 
            resave: false,
            saveUninitialized: true,
        }));
// Enable CORS
app.use(cors());  
 app.use(passport.initialize());
        app.use(passport.session());
        console.log('Passport middleware initialized');
require('./config/passport'); // Include passport configuration

// Define Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/eventpro/events', eventRoutes);

// Define a basic route
app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
