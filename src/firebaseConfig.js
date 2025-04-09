import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, remove, onValue, onChildAdded, onChildRemoved } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_rU0iQH1D_fuYdo6q_LvCYXNyLFvOF80",
    authDomain: "scrum-poker-app-50640.firebaseapp.com",
    projectId: "scrum-poker-app-50640",
    storageBucket: "scrum-poker-app-50640.firebasestorage.app",
    messagingSenderId: "991266427015",
    appId: "1:991266427015:web:3de3af1b034f6e8aeee822",
    measurementId: "G-18583JYCKK"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // Initialize Realtime Database

// Refs for users and votes
const votesRef = ref(db, 'votes');
const usersRef = ref(db, 'users');

export { db, votesRef, usersRef, ref, set, update, remove, onValue, onChildAdded, onChildRemoved };