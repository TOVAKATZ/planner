import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { app } from '../firebaseConfig';

export const TripContext = createContext<any>(null);
const db = getFirestore(app);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [tripsData, setTripsData] = useState<any>({});

  // משיכת נתונים מהענן
  useEffect(() => {
    const docRef = doc(db, "users", "my_trips_data");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTripsData(docSnap.data());
      } else {
        setTripsData({});
      }
    });
    return () => unsubscribe();
  }, []);

  // עדכון נתונים חכם שמונע דריסה של עדכונים מקבילים (לו"ז + הוצאות)
  const updateTripData = async (tripName: string, key: string, newData: any) => {
    // בדיקה 1: האם בכלל יש שם לטיול?
    if (!tripName) {
      alert("שגיאה: האפליקציה לא זיהתה את שם הטיול ולכן לא יכולה לשמור.");
      return;
    }

    const docRef = doc(db, "users", "my_trips_data");

    setTripsData((prev: any) => {
      const updatedData = {
        ...prev,
        [tripName]: {
          ...(prev[tripName] || { planning: {}, expenses: [], packing: [], journal: {} }),
          [key]: newData,
        },
      };
      return updatedData;
    });

    try {
      await setDoc(docRef, {
        [tripName]: {
          [key]: newData
        }
      }, { merge: true }); 
    } catch (e: any) {
      // בדיקה 2: הקפצת שגיאת ה-Firebase המדויקת למסך
      alert("שגיאת שרת Firebase: " + e.message);
    }
  };

  return (
    <TripContext.Provider value={{ tripsData, updateTripData }}>
      {children}
    </TripContext.Provider>
  );
};