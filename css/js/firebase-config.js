/* * =========================================
 * TURKAY SPACE - FIREBASE KONFİGÜRASYONU
 * (TÜM GÜNCELLEMELER DAHİL - FİNAL SÜRÜM)
 * =========================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

// --- AUTH (GİRİŞ) FONKSİYONLARI ---
import { 
    getAuth,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- FIRESTORE (VERİTABANI) FONKSİYONLARI ---
import { 
    getFirestore, 
    collection,
    getDocs,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,      // Üye onayı için eklendi
    query,          // Üye onayı için eklendi
    where,          // Üye onayı için eklendi
    writeBatch      // Üye onayı için eklendi
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- STORAGE (DOSYA YÜKLEME) FONKSİYONLARI ---
import { 
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";


// Senin sağladığın Firebase konfigürasyon bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyBHK-lEDMq3qUJL70dxEshqDEzKjnh5VSs",
  authDomain: "turkaywebs-1335b.firebaseapp.com",
  projectId: "turkaywebs-1335b",
  storageBucket: "turkaywebs-1335b.firebasestorage.app",
  messagingSenderId: "707812880041",
  appId: "1:707812880041:web:6d9dc91d0b5190d65043b8",
  measurementId: "G-E1N1VKBK68"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); 
const analytics = getAnalytics(app);

// main.js ve admin.js'nin 'import' edeceği tüm fonksiyonlar:
export { 
    app, db, auth, storage,
    
    // Auth Fonksiyonları
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    
    // Firestore Fonksiyonları
    collection, 
    getDocs, 
    addDoc, 
    onSnapshot, 
    deleteDoc, 
    doc,
    updateDoc,      // Üye onayı için
    query,          // Üye onayı için
    where,          // Üye onayı için
    writeBatch,     // Üye onayı için

    // Storage Fonksiyonları
    ref,
    uploadBytes,
    getDownloadURL
};