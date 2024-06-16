// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD8ADr1g1xsoRGhptLqC7bgDRsow6m89o",
  authDomain: "chat-app-23319.firebaseapp.com",
  projectId: "chat-app-23319",
  storageBucket: "chat-app-23319.appspot.com",
  messagingSenderId: "273478545786",
  appId: "1:273478545786:web:aadb0ba55bc0437ffae6c3",
  measurementId: "G-PPW0FZZWT0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, app };
