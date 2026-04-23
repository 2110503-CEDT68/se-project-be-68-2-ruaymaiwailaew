const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

// const { setServers } = require("node:dns/promises");
// setServers(["1.1.1.1", "8.8.8.8"]);

// Security require
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Read env file when running in serverless mode.
dotenv.config({ path: './config/config.env' });

const openApiDocument = require('./docs/openapi');

// Config rate limiting
const limiter = rateLimit({
    windowMs: 10*60*1000,
    max: 109
});

const app = express();
const purifyWindow = new JSDOM('').window;
const DOMPurify = createDOMPurify(purifyWindow);

const swaggerUser = process.env.SWAGGER_USERNAME;
const swaggerPass = process.env.SWAGGER_PASSWORD;

const protectSwaggerDocs = (req, res, next) => {
    if (!swaggerUser || !swaggerPass) {
        return next();
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"');
        return res.status(401).send('Authentication required');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const separatorIndex = credentials.indexOf(':');

    if (separatorIndex < 0) {
        res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"');
        return res.status(401).send('Invalid authentication format');
    }

    const username = credentials.slice(0, separatorIndex);
    const password = credentials.slice(separatorIndex + 1);

    if (username !== swaggerUser || password !== swaggerPass) {
        res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"');
        return res.status(401).send('Invalid credentials');
    }

    return next();
};

const trustProxySetting = process.env.TRUST_PROXY;
if (trustProxySetting !== undefined && trustProxySetting !== '') {
    const normalized = trustProxySetting.trim().toLowerCase();
    if (normalized === 'true') {
        app.set('trust proxy', true);
    } else if (normalized === 'false') {
        app.set('trust proxy', false);
    } else if (!Number.isNaN(Number(normalized))) {
        app.set('trust proxy', Number(normalized));
    } else {
        app.set('trust proxy', trustProxySetting);
    }
}

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

app.set('query parser', 'extended');

app.use(express.json());
app.use(cookieParser());

const sanitizeInput = (value) => {
    if (typeof value === 'string') {
        return DOMPurify.sanitize(value, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'style'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick']
        });
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeInput(item));
    }

    if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) {
            value[key] = sanitizeInput(value[key]);
        }
    }

    return value;
};

const sanitizeRequest = (req, res, next) => {
    req.body = sanitizeInput(req.body);
    req.query = sanitizeInput(req.query);
    req.params = sanitizeInput(req.params);
    next();
};

// Security used
app.use(mongoSanitize());
app.use(helmet());
app.use(sanitizeRequest);
app.use(limiter);
app.use(hpp());
app.use(cors());

app.get('/api-docs.json', protectSwaggerDocs, (req, res) => {
    res.json(openApiDocument);
});
app.use('/api-docs', protectSwaggerDocs, swaggerUi.serve, swaggerUi.setup(openApiDocument));

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

// Export app for serverless platforms and server.js runtime.
module.exports = app;

//handle unhandled promise rejections
process.on('unhandledRejection', (err, Promise) => {
    console.log(`Error: ${err.message}`);
  process.exit(1);
});