import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgTP88-8BJm8T1U91Rmbk43DJtEuL3ZAU",
  authDomain: "trends-3850e.firebaseapp.com",
  projectId: "trends-3850e",
  storageBucket: "trends-3850e.appspot.com",
  messagingSenderId: "14946832597",
  appId: "1:14946832597:web:371d3025625c17b97b925c"
}

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
