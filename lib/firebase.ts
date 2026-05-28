import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCnbHIZFUtSwY4y_QOoVe_8IUt4_QFgZRQ",
    authDomain: "my-butler-b5f8d.firebaseapp.com",
    projectId: "my-butler-b5f8d",
    storageBucket: "my-butler-b5f8d.firebasestorage.app",
    messagingSenderId: "510259700039",
    appId: "1:510259700039:web:67a53f779948aa1c432c62"
  };

// Next.jsでFirebaseを安全に初期化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// データベース（Firestore）の機能をエクスポート
export const db = getFirestore(app);