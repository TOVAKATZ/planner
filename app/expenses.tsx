import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TripContext } from './TripContext';

export default function Expenses() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const { tripsData, updateTripData } = useContext(TripContext);
  const exp = (tripsData[name as string]?.expenses || []).sort((a:any, b:any) => a.l.localeCompare(b.l));
  
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('');

  const addExpense = () => {
    if(!label || !price) return;
    updateTripData(name as string, 'expenses', [...exp, { id: Date.now(), l: label, p: Number(price) }]);
    setLabel(''); setPrice('');
  };

  return (
    <View style={styles.c}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>חזור</Text>
      </TouchableOpacity>
      
      <Text style={styles.h}>הוצאות: {name}</Text>
      
      <View style={styles.inputsRow}>
        <TextInput placeholder="עבור מה?" value={label} onChangeText={setLabel} style={[styles.i, {flex: 0.65}]} placeholderTextColor="#C4B7B0" />
        <TextInput placeholder="סכום" value={price} onChangeText={setPrice} keyboardType="numeric" style={[styles.i, {flex: 0.35}]} placeholderTextColor="#C4B7B0" />
      </View>
      
      <TouchableOpacity style={styles.b} onPress={addExpense}>
        <Text style={styles.t}>+ רישום הוצאה</Text>
      </TouchableOpacity>

      <View style={styles.tableContainer}>
        <FlatList 
          data={exp} 
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <View style={styles.row}>
              <View style={styles.rightCell}>
                <Text style={styles.cellText}>{item.l}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.middleCell}>
                <Text style={styles.cellText}>{item.p} ₪</Text>
              </View>
              <View style={styles.leftCell}>
                <TouchableOpacity onPress={() => updateTripData(name as string, 'expenses', exp.filter((x:any) => x.id !== item.id))}>
                  <Text style={styles.delText}>מחיקה</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
      
      <Text style={styles.tot}>סה"כ הכל: {exp.reduce((a:number, b:any) => a + Number(b.p), 0).toLocaleString()} ₪</Text>
    </View>
  );
}

const styles = StyleSheet.create({ 
  c: { flex: 1, padding: 30, paddingTop: 60, backgroundColor: '#FDFBF7' }, 
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backTxt: { fontSize: 15, color: '#A08C7F', fontWeight: '400', letterSpacing: 0.5 }, 
  h: { fontSize: 30, textAlign: 'center', marginBottom: 35, fontWeight: '300', color: '#4A3C31', letterSpacing: 1 }, 
  inputsRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 15 },
  i: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, textAlign: 'right', borderWidth: 1, borderColor: '#F0E6DD', color: '#4A3C31', fontSize: 15 }, 
  b: { backgroundColor: '#8C6A5D', padding: 18, borderRadius: 24, alignItems: 'center', marginBottom: 35, shadowColor: '#8C6A5D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }, 
  t: { color: '#FFFFFF', fontWeight: '500', fontSize: 15, letterSpacing: 0.5 }, 
  tableContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, flexShrink: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E6DD', shadowColor: '#4A3C31', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 },
  row: { flexDirection: 'row-reverse', alignItems: 'stretch', minHeight: 52 }, 
  rightCell: { flex: 2, justifyContent: 'center', paddingRight: 20, paddingVertical: 10 }, 
  verticalDivider: { width: 1, backgroundColor: '#F0E6DD' },
  middleCell: { flex: 1.5, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  leftCell: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 20, paddingVertical: 10 },
  cellText: { fontSize: 15, color: '#4A3C31', fontWeight: '400' },
  delText: { color: '#C4B7B0', fontSize: 13, fontWeight: '300' },
  tot: { fontSize: 22, fontWeight: '500', marginTop: 30, textAlign: 'center', color: '#4A3C31', letterSpacing: 0.5 } 
});