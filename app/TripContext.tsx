import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { app } from '../firebaseConfig';

export const TripContext = createContext<any>(null);
const db = getFirestore(app);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  // 1. טעינה ראשונית מיידית מ-LocalStorage כדי שהמידע בחיים לא יימחק ביציאה
  const [tripsData, setTripsData] = useState<any>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localData = localStorage.getItem('my_trips_data');
      return localData ? JSON.parse(localData) : {};
    }
    return {};
  });

  // משיכת נתונים מהענן (אם החיבור תקין, הוא יסנכרן ויגבה מקומית)
  useEffect(() => {
    try {
      const docRef = doc(db, "users", "my_trips_data");
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          setTripsData(cloudData);
          
          // גיבוי הנתונים מהענן לתוך ה-LocalStorage
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('my_trips_data', JSON.stringify(cloudData));
          }
        }
      }, (error) => {
        console.log("Firebase snapshot error, using local storage instead:", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.log("Firebase is offline:", e);
    }
  }, []);

  // עדכון נתונים חכם ומשולב
  const updateTripData = async (tripName: string, key: string, newData: any) => {
    if (!tripName) return;

    setTripsData((prev: any) => {
      const updatedData = {
        ...prev,
        [tripName]: {
          ...(prev[tripName] || { planning: {}, expenses: [], packing: [], journal: {} }),
          [key]: newData,
        },
      };

      // 2. שמירה מיידית ב-LocalStorage - פועל במאית השנייה ולא מוחק כלום לעולם!
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('my_trips_data', JSON.stringify(updatedData));
      }

      return updatedData;
    });

    // 3. ניסיון סנכרון מול הענן ברקע
    try {
      const docRef = doc(db, "users", "my_trips_data");
      
      // שולחים את המבנה העדכני של הטיול כדי למנוע התנגשויות
      const currentTripState = tripsData[tripName] || { planning: {}, expenses: [], packing: [], journal: {} };
      
      await setDoc(docRef, {
        [tripName]: {
          ...currentTripState,
          [key]: newData
        }
      }, { merge: true }); 
    } catch (e) {
      console.error("Cloud sync paused, data saved locally:", e);
    }
  };

  return (
    <TripContext.Provider value={{ tripsData, updateTripData }}>
      {children}
    </TripContext.Provider>
  );
};