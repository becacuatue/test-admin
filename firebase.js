
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBdEuAqxHxHaxE3lTCEOwH2YO8L2Jg4hlY",
  authDomain: "dtorder-19c91.firebaseapp.com",
  projectId: "dtorder-19c91",
  storageBucket: "dtorder-19c91.appspot.com",
  messagingSenderId: "499125096462",
  appId: "1:499125096462:web:5fc0f37019e018fd57ac5f"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;