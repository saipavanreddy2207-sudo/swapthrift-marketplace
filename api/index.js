// Vercel function entry point. Exporting the HTTP server (rather than only the
// Express app) lets Vercel handle both regular requests and Socket.IO upgrades.
import server from '../backend/app.js'

export default server
