import dotenv from "dotenv";
import { server, ensureReady } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

ensureReady()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
