const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/events");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

const app = express();

connectDB();

app.use(
  cors({
    origin: "https://event-ease-unified-event-manager.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token", 'Authorization'],
    credentials: true,
  })
);
app.options("*", cors());

app.use(express.json({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport");

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  console.log("Received request to root endpoint");
  res.send("EventPro API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
