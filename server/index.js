import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import session from "express-session";
import passport from "./config/passport.js";
import codeRoutes from "./routes/codeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import editorSocket from "./sockets/editorSocket.js";
import User from "./models/authModel.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Clean up old indexes
    try {
      const collection = mongoose.connection.collection("users");
      const indexes = await collection.getIndexes();

      if (indexes.username_1) {
        await collection.dropIndex("username_1");
        console.log("Dropped old username index");
      }
    } catch (error) {
      console.log("Index cleanup (non-critical):", error.message);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/code", codeRoutes);
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  editorSocket(socket, io);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
