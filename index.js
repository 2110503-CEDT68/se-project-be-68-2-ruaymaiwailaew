const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');

// const { setServers } = require("node:dns/promises");
// setServers(["1.1.1.1", "8.8.8.8"]);

// Security require
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Read env file
dotenv.config({ path: './config/config.env' });

// Config rate limiting
const limiter = rateLimit({
    windowMs: 10*60*1000,
    max: 750
});

const app = express();

// Ensure DB connected for every Serverless request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error(`MongoDB connection error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database Connection Error' });
    }
});

// app.set('trust proxy', 1);
app.set('query parser', 'extended');

app.use(express.json());
app.use(cookieParser());

// Security used
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cors());

// Route files
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');
const dentist = require('./routes/dentist');
const reviews = require('./routes/reviews');

// Router
app.use('/api/auth', auth);
app.use('/api/bookings', bookings);
app.use('/api/dentist', dentist);
app.use('/api/reviews', reviews);

// Server port and listen
module.exports = app;

//handle unhandled promise rejections
process.on('unhandledRejection', (err, Promise) => {
    console.log(`Error: ${err.message}`);
  process.exit(1);
});