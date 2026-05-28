import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { app } from '../firebaseConfig';

export const TripContext = createContext<any>(null);
const db = getFirestore(app);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [tripsData, setTripsData] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. טעינה ראשונית ובטוחה מהזיכרון של הטלפון/דפדפן מיד כשהאפליקציה עולה
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localData = localStorage.getItem('my_trips_data');
      if (localData) {
        try {
          setTripsData(JSON.parse(localData));
        } catch (e) {
          console.error("Error parsing local data:", e);
        }
      }
    }
    setIsInitialized(true); // מסמנים שהאפליקציה סיימה לטעון את הזיכרון המקומי
  }, []);

  // 2. האזנה ל-Firebase (ענן) - מתחילה רק אחרי שהטעינה המקומית הסתיימה
  useEffect(() => {
    if (!isInitialized) return;

    try {
      const docRef = doc(db, "users", "my_trips_data");
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          setTripsData(cloudData);
          
          // גיבוי מיידי של מה שחזר מהענן לתוך הטלפון
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('my_trips_data', JSON.stringify(cloudData));
          }
        }
      }, (error) => {
        console.log("Firebase is offline, using local storage instead.", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.log("Firebase connection error:", e);
    }
  }, [isInitialized]);

  // 3. עדכון נתונים חסין ושמירה כפולה (גם בטלפון וגם בענן)
  const updateTripData = async (tripName: string, key: string, newData: any) => {
    if (!tripName) return;

    let updatedData: any = {};

    setTripsData((prev: any) => {
      updatedData = {
        ...prev,
        [tripName]: {
          ...(prev[tripName] || { planning: {}, expenses: [], packing: [], journal: {} }),
          [key]: newData,
        },
      };

      // שמירה במאית השנייה בתוך המכשיר עצמו - שלא ילך לאיבוד לעולם!
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('my_trips_data', JSON.stringify(updatedData));
      }

      return updatedData;
    });

    // ניסיון סנכרון מול הענן ברקע
    try {
      const docRef = doc(db, "users", "my_trips_data");
      const currentTripState = updatedData[tripName] || { planning: {}, expenses: [], packing: [], journal: {} };
      
      await setDoc(docRef, {
        [tripName]: currentTripState
      }, { merge: true }); 
    } catch (e) {
      console.log("Cloud sync paused, data safely stored on your device:", e);
    }
  };

  return (
    <TripContext.Provider value={{ tripsData, updateTripData }}>
      {children}
    </TripContext.Provider>
  );
};