import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

app.post('/roll', (req, res) => {
    const { formula, theme } = req.body;
    if (!formula) {
        return res.status(400).json({ error: 'Formula is required (e.g. "2d20")' });
    }

    console.log(`Received Roll Request: ${formula} (Theme: ${theme || 'current'})`);

    // Broadcast to all connected clients
    io.emit('roll_request', { formula, theme });

    res.json({ status: 'success', message: 'Roll broadcasted', formula });
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('connected', { message: 'Connected to Dice Server' });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Dice Server running on http://localhost:${PORT}`);
});
