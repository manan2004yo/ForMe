import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVdAjxSc0hnPzAJRG7GMbyF3y4wRTp9s0",
  authDomain: "forme-8054e.firebaseapp.com",
  projectId: "forme-8054e",
  storageBucket: "forme-8054e.firebasestorage.app",
  messagingSenderId: "1009073022364",
  appId: "1:1009073022364:web:31da28ae75fbc0e0d6d459"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const q = query(collection(db, 'users'), limit(1));
    await getDocs(q);
    console.log("SUCCESS: Connected to Firestore and fetched collection successfully!");
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

test();
