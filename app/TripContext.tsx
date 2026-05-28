import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { app } from '../firebaseConfig';

export const TripContext = createContext<any>(null);
const db = getFirestore(app);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [tripsData, setTripsData] = useState<any>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. טעינה ראשונית מהזיכרון המקומי של המכשיר - מופעל מיד חסין מאיפוסים
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
    setIsInitialized(true);
  }, []);

  // 2. סנכרון חכם מול Firebase - מאזין לענן בלי למחוק מידע מקומי
  useEffect(() => {
    if (!isInitialized) return;

    try {
      const docRef = doc(db, "users", "my_trips_data");
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          // מעדכנים את האפליקציה רק אם באמת יש מידע ממשי בשרת
          if (cloudData && Object.keys(cloudData).length > 0) {
            setTripsData(cloudData);
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('my_trips_data', JSON.stringify(cloudData));
            }
          }
        } else {
          // הגנה קריטית: אם המסמך לא קיים בענן, לא נוגעים ולא דורסים את ה-LocalStorage!
          console.log("Document does not exist in Firebase yet. Preserving local storage.");
        }
      }, (error) => {
        console.log("Firebase onSnapshot error:", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.log("Firebase connection error:", e);
    }
  }, [isInitialized]);

  // 3. עדכון בטוח, סינכרוני ומיידי - שומר מקומית ומשגר לענן ברקע
  const updateTripData = async (tripName: string, key: string, newData: any) => {
    if (!tripName) return;

    setTripsData((prev: any) => {
      const updatedTripState = {
        ...(prev[tripName] || { planning: {}, expenses: [], packing: [], journal: {} }),
        [key]: newData,
      };

      const updatedAllTrips = {
        ...prev,
        [tripName]: updatedTripState,
      };

      // שמירה מקומית פיזית במכשיר באותה מאית שנייה!
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('my_trips_data', JSON.stringify(updatedAllTrips));
      }

      // שיגור לענן ברקע בלי לעכב את רנדור המסך
      const docRef = doc(db, "users", "my_trips_data");
      setDoc(docRef, updatedAllTrips, { merge: true }).catch((e) => {
        console.error("Cloud sync paused, but data is safe locally:", e);
      });

      return updatedAllTrips;
    });
  };

  return (
    <TripContext.Provider value={{ tripsData, updateTripData }}>
      {children}
    </TripContext.Provider>
  );
};