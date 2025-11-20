// Simple WebSocket Server for TODO Manager
// This is an optional component for enabling real-time collaboration

const { Server } = require('socket.io');

const io = new Server(3001, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory storage
let todos = [];
let activities = [];

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // When a user joins
  socket.on('join', (data) => {
    console.log('User joined:', data);
    
    // Send current state to the new user
    socket.emit('todos:sync', { todos });
    
    // Broadcast to others that a new user joined
    socket.broadcast.emit('activity:new', {
      activity: {
        id: `${Date.now()}-${Math.random()}`,
        todoId: '',
        todoName: '',
        action: 'created',
        userId: data.userId,
        timestamp: new Date().toISOString(),
        details: `${data.userName} joined the session`
      }
    });
  });
  
  // When todos are updated
  socket.on('todos:update', (data) => {
    todos = data.todos;
    
    // Broadcast to all other clients
    socket.broadcast.emit('todos:sync', data);
  });
  
  // When a todo is created
  socket.on('todo:created', (data) => {
    todos.push(data.todo);
    socket.broadcast.emit('todo:created', data);
  });
  
  // When a todo is updated
  socket.on('todo:updated', (data) => {
    todos = todos.map(t => t.id === data.todo.id ? data.todo : t);
    socket.broadcast.emit('todo:updated', data);
  });
  
  // When a todo is deleted
  socket.on('todo:deleted', (data) => {
    todos = todos.filter(t => t.id !== data.todoId);
    socket.broadcast.emit('todo:deleted', data);
  });
  
  // When a new activity is added
  socket.on('activity:new', (data) => {
    activities.unshift(data.activity);
    activities = activities.slice(0, 50); // Keep last 50
    socket.broadcast.emit('activity:new', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

console.log('WebSocket server running on port 3001');

// Optional: Add Express server for REST API
// const express = require('express');
// const app = express();
// 
// app.get('/api/todos', (req, res) => {
//   res.json({ todos });
// });
// 
// app.listen(3000, () => {
//   console.log('REST API running on port 3000');
// });
