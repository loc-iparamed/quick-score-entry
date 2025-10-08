import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCEtxC5a7dbiH4u9HSTKcGuI0v5Bm145GU',
  authDomain: 'quick-score-entry.firebaseapp.com',
  projectId: 'quick-score-entry',
  storageBucket: 'quick-score-entry.firebasestorage.app',
  messagingSenderId: '747194791933',
  appId: '1:747194791933:web:f7b04ed3cad576a525cb94',
  measurementId: 'G-7EDWVZ1TBF',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
