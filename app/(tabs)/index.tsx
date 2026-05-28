import { useRouter } from 'expo-router';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { app } from '../../firebaseConfig';
const db = getFirestore(app);

export default function HomeScreen() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTrips = localStorage.getItem('my_saved_destinations');
      if (savedTrips) {
        try { setDestinations(JSON.parse(savedTrips)); } catch (e) {}
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const docRef = doc(db, "users", "my_trips_metadata");
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.destinations && data.destinations.length > 0) {
            setDestinations(data.destinations);
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('my_saved_destinations', JSON.stringify(data.destinations));
            }
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.log(e);
    }
  }, [isInitialized]);

  const saveDestinations = async (newDestinations: any[]) => {
    // קודם מעדכנים את המסך והזיכרון המקומי
    setDestinations(newDestinations);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('my_saved_destinations', JSON.stringify(newDestinations));
    }
    
    // שומרים בענן ומקפיצים הודעה למשתמש
    try {
      await setDoc(doc(db, "users", "my_trips_metadata"), { destinations: newDestinations }, { merge: true });
      alert("הטיול נשמר בענן בהצלחה! אפשר לצאת מהאפליקציה בראש שקט.");
      
      setModal(false);
      setName(''); setStart(''); setEnd('');
    } catch (e: any) {
      alert("שגיאת שרת: " + e.message);
    }
  };

  const formatD = (t: string) => {
    let v = t.replace(/\D/g, ''); 
    if (v.length > 8) v = v.slice(0, 8); 
    if (v.length > 4) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    if (v.length > 2) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const getMonthYear = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const shortYear = parts[2].slice(2); 
    if (monthIndex >= 0 && monthIndex < 12) return `${months[monthIndex]} ’${shortYear}`;
    return '';
  };

  const getSortValue = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return 99999999; 
    const parts = dateStr.split('/');
    return parseInt(`${parts[2]}${parts[1]}${parts[0]}`, 10);
  };

  const addTrip = () => {
    if (!name || !start || !end) return alert('חובה למלא את כל השדות');
    const newTrip = { id: Date.now(), name, start, end };
    const sorted = [...destinations, newTrip].sort((a, b) => getSortValue(a.start) - getSortValue(b.start));
    
    saveDestinations(sorted);
  };

  const deleteTrip = (idToRemove: number) => {
    const filtered = destinations.filter(x => x.id !== idToRemove);
    saveDestinations(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>הטיולים שלי</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {destinations.map(d => (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <TouchableOpacity 
                style={styles.btn} 
                onPress={() => router.push({ pathname: '/dashboard', params: { name: d.name, start: d.start, end: d.end } })}
              >
                <Text style={styles.btnText}>פרטים</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTrip(d.id)}>
                <Text style={styles.delText}>מחיקה</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardRight}>
              <Text style={styles.cardTitle}>{d.name}</Text>
              <Text style={styles.cardMonth}>{getMonthYear(d.start)}</Text>
              <Text style={styles.cardDates}>{d.start} - {d.end}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addBtnText}>+ יעד חדש</Text>
      </TouchableOpacity>
      
      <Modal visible={modal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeaderTitle}>לאן טסים?</Text>
            <TextInput placeholder="שם היעד" value={name} onChangeText={setName} style={styles.input} placeholderTextColor="#C4B7B0" textAlign="right" />
            <TextInput placeholder="תאריך יציאה (DDMMYYYY)" value={start} onChangeText={(t) => setStart(formatD(t))} style={styles.input} keyboardType="numeric" placeholderTextColor="#C4B7B0" textAlign="right" />
            <TextInput placeholder="תאריך חזרה (DDMMYYYY)" value={end} onChangeText={(t) => setEnd(formatD(t))} style={styles.input} keyboardType="numeric" placeholderTextColor="#C4B7B0" textAlign="right" />
            
            <TouchableOpacity style={styles.saveBtn} onPress={addTrip}>
              <Text style={styles.saveBtnText}>שמירה</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
              <Text style={styles.cancelTxt}>ביטול</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, paddingTop: 70, paddingHorizontal: 25, backgroundColor: '#FDFBF7' }, 
  header: { fontSize: 30, fontWeight: '300', letterSpacing: 1, textAlign: 'center', marginBottom: 35, color: '#4A3C31' }, 
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 22, borderRadius: 24, marginBottom: 16, shadowColor: '#8C6A5D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 }, 
  cardRight: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' }, 
  cardLeft: { alignItems: 'center', justifyContent: 'center', marginLeft: 15 }, 
  cardTitle: { fontSize: 22, fontWeight: '500', color: '#4A3C31', marginBottom: 6, letterSpacing: 0.5 }, 
  cardMonth: { fontSize: 15, color: '#8C6A5D', fontWeight: '400', marginBottom: 4 }, 
  cardDates: { fontSize: 13, color: '#A08C7F', fontWeight: '300' }, 
  btn: { backgroundColor: '#8C6A5D', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 }, 
  btnText: { color: '#FFFFFF', fontWeight: '500', fontSize: 13, letterSpacing: 0.5 }, 
  delText: { color: '#C4B7B0', fontSize: 13, marginTop: 12, fontWeight: '400' }, 
  addBtn: { backgroundColor: '#4A3C31', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 30, shadowColor: '#4A3C31', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 15 }, 
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', letterSpacing: 0.5 }, 
  modalOverlay: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: 'rgba(74, 60, 49, 0.3)' }, 
  modalContainer: { backgroundColor: '#FDFBF7', padding: 30, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 25 }, 
  modalHeaderTitle: { fontSize: 22, fontWeight: '400', color: '#4A3C31', textAlign: 'center', marginBottom: 25, letterSpacing: 0.5 },
  input: { backgroundColor: '#FFFFFF', padding: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0E6DD', color: '#4A3C31', fontSize: 15 }, 
  saveBtn: { backgroundColor: '#8C6A5D', padding: 16, borderRadius: 20, alignItems: 'center', marginTop: 10 }, 
  saveBtnText: { color: '#FFFFFF', fontWeight: '500', fontSize: 16, letterSpacing: 0.5 }, 
  cancelBtn: { marginTop: 18, alignItems: 'center' }, 
  cancelTxt: { color: '#A08C7F', fontWeight: '400', fontSize: 15 } 
});