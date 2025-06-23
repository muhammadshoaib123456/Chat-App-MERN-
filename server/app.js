import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import OurRouter from './routes/Route.js';
import cors from "cors";
import dotenv from 'dotenv';
import { createServer } from "http";
import { Server } from "socket.io";
import User from "./models/User.js";

dotenv.config();
const app = express();
const port = 8000;
const connectionUrl = process.env.ConnectionUrl;

// ✅ Allow only your frontend
const FRONTEND_URL = "https://chatappmernn.netlify.app";

// ✅ Create HTTP server
const httpServer = createServer(app);

// ✅ Socket.io with CORS
export const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// ✅ Express CORS middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

// ✅ Body parser
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// ✅ DB Connection
mongoose.connect(connectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Database connected successfully"))
.catch((err) => console.log("❌ Error connecting DB: " + err.message));

// ✅ Socket Events
io.on("connection", (socket) => {
    let userId;

    socket.on('userOnline', async (payload) => {
        userId = payload;
        if (!userId) return console.log("No user Id");

        const user = await User.findById(userId);
        if (user) {
            user.online = true;
            await user.save();
            io.emit('userOnline', { userId });
        }
    });

    socket.on('disconnect', async () => {
        if (!userId) return console.log("No user Id");

        const user = await User.findById(userId);
        if (user) {
            user.online = false;
            await user.save();
            io.emit('userOffline', { userId });
        }
    });

    socket.on('sendMsg', (payload) => {
        io.emit('sendMsg', payload);
    });

    socket.on('userIsTyping', ({ senderId, receiverId }) => {
        io.emit('userIsTyping', { senderId, receiverId });
    });

    socket.on('userStopTyping', ({ senderId, receiverId }) => {
        io.emit('userStopTyping', { senderId, receiverId });
    });
});

// ✅ Routes
app.get("/", (req, res)=>{
    res.send("hii")
})
app.use('/api/', OurRouter);

// ✅ Start server
httpServer.listen(port, () => {
    console.log(`🚀 App is running at http://localhost:${port}`);
});
