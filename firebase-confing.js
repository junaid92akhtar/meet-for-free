// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDaHEhas55ZVn31GJeBymk2bWg0GS4eVAI",
  authDomain: "testing-9acd2.firebaseapp.com",
  projectId: "testing-9acd2",
  storageBucket: "testing-9acd2.firebasestorage.app",
  messagingSenderId: "572622502339",
  appId: "1:572622502339:web:1448744f3ab83f4616e576",
  measurementId: "G-KFEPDE5QKG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);