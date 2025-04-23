import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJ3miRgiMJMTC7xP3dLFJEnkqJESwovfw",
  authDomain: "vaniapp-7d6eb.firebaseapp.com",
  projectId: "vaniapp-7d6eb",
  storageBucket: "vaniapp-7d6eb.appspot.com",
  messagingSenderId: "483912374504",
  appId: "1:483912374504:android:e8516d97d1e0b025fd915d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
