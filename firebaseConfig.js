import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD1Sbwhr7cNBkzyUtUCKtM1bZpplU2GnSI",
  authDomain: "planner-d152c.firebaseapp.com",
  projectId: "planner-d152c",
  storageBucket: "planner-d152c.firebasestorage.app",
  messagingSenderId: "176509690627",
  appId: "1:176509690627:web:41876b5c09d5612d95ff36",
  measurementId: "G-5Q750GSHX5"
};

const app = initializeApp(firebaseConfig);

// בדיקה אם ה-Analytics נתמך (כלומר, אם אנחנו בדפדפן) לפני שמפעילים אותו
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { analytics, app };
