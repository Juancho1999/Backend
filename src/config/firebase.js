import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCOPZAEWNVUOpbhs6ydKfQX0tb2iqTkpe0",
  authDomain: "gimnasio-app-1f4d7.firebaseapp.com",
  projectId: "gimnasio-app-1f4d7",
  storageBucket: "gimnasio-app-1f4d7.firebasestorage.app",
  messagingSenderId: "698212664924",
  appId: "1:698212664924:web:1e990c6749dbc85ffb4899"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
