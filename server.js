const dotenv = require('dotenv');
const app = require('./index');

// Read env file for local and container runtime.
dotenv.config({ path: './config/config.env' });

const PORT = process.env.PORT || 5003;

const server = app.listen(PORT, () => {
    console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT);
});

process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});
