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

  // עדכון נתונים בענן ובזיכרון המקומי
  const updateTripData = async (tripName: string, key: string, newData: any) => {
    const docRef = doc(db, "users", "my_trips_data");
    
    const updatedData = {
      ...tripsData,
      [tripName]: {
        ...(tripsData[tripName] || { planning: {}, expenses: [], packing: [], journal: {} }),
        [key]: newData,
      },
    };

    setTripsData(updatedData); // עדכון מיידי באפליקציה

    try {
      await setDoc(docRef, updatedData, { merge: true }); // שמירה בענן
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