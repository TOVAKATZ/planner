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
    const docRef = doc(db, "users", "my_trips_data");

    // שימוש ב-prev מבטיח שתמיד נעבוד עם המידע הכי עדכני ולא נדרוס
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

    // שמירה נקודתית בענן כדי לא לדרוס מידע אחר
    try {
      await setDoc(docRef, {
        [tripName]: {
          [key]: newData
        }
      }, { merge: true }); 
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  return (
    <TripContext.Provider value={{ tripsData, updateTripData }}>
      {children}
    </TripContext.Provider>
  );
};