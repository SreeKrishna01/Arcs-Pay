require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const accountRoutes = require("./routes/accountRoutes");
const cardRoutes = require("./routes/cardRoutes");
const recipientRoutes = require("./routes/recipientRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const biometricRoutes = require("./routes/biometricRoutes");

connectDB();

const app = express();

// Accept the configured CLIENT_URL(s) plus any private-network origin
// (e.g. http://192.168.x.x:5173) so the app works when opened from a
// phone or another device on the same Wi-Fi/LAN during development.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

const privateNetworkOrigin =
  /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}):\d+$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl/Postman/mobile apps with no Origin header
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (privateNetworkOrigin.test(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Arcs Pay API", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/biometric", biometricRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Arcs Pay API running on port ${PORT}`);
});
