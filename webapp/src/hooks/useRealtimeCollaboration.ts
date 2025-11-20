// import { useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import type { Todo, Activity } from '../types/todo';
// import { useTodoStore } from '../store/todoStore';

// // WebSocket server URL - update this to your actual WebSocket server
// const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

// export const useRealtimeCollaboration = () => {
//   const socketRef = useRef<Socket | null>(null);
//   const { todos, currentUser, syncTodos, syncActivity } = useTodoStore();

//   useEffect(() => {
//     // Initialize socket connection
//     socketRef.current = io(WS_URL, {
//       transports: ['websocket'],
//       reconnection: true,
//       reconnectionDelay: 1000,
//       reconnectionAttempts: 5,
//     });

//     const socket = socketRef.current;

//     // Connection events
//     socket.on('connect', () => {
//       console.log('Connected to WebSocket server');
      
//       // Join room and sync initial state
//       socket.emit('join', { userId: currentUser.id, userName: currentUser.name });
//     });

//     socket.on('disconnect', () => {
//       console.log('Disconnected from WebSocket server');
//     });

//     // Sync events
//     socket.on('todos:sync', (data: { todos: Todo[] }) => {
//       console.log('Received todos sync:', data);
//       syncTodos(data.todos);
//     });

//     socket.on('todo:created', (data: { todo: Todo }) => {
//       console.log('Todo created by another user:', data);
//       useTodoStore.setState((state) => ({
//         todos: [...state.todos, data.todo],
//       }));
//     });

//     socket.on('todo:updated', (data: { todo: Todo }) => {
//       console.log('Todo updated by another user:', data);
//       useTodoStore.setState((state) => ({
//         todos: state.todos.map((t) => (t.id === data.todo.id ? data.todo : t)),
//       }));
//     });

//     socket.on('todo:deleted', (data: { todoId: string }) => {
//       console.log('Todo deleted by another user:', data);
//       useTodoStore.setState((state) => ({
//         todos: state.todos.filter((t) => t.id !== data.todoId),
//       }));
//     });

//     socket.on('activity:new', (data: { activity: Activity }) => {
//       console.log('New activity:', data);
//       syncActivity(data.activity);
//     });

//     // Cleanup on unmount
//     return () => {
//       socket.disconnect();
//     };
//   }, [currentUser.id, currentUser.name]);

//   // Broadcast local changes to other clients
//   useEffect(() => {
//     if (!socketRef.current) return;

//     const socket = socketRef.current;
    
//     // Broadcast todos when they change
//     socket.emit('todos:update', { todos });
//   }, [todos]);

//   return {
//     isConnected: socketRef.current?.connected ?? false,
//     socket: socketRef.current,
//   };
// };
