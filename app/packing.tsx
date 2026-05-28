import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TripContext } from './TripContext';

export default function Packing() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const { tripsData, updateTripData } = useContext(TripContext);
  const items = (tripsData[name as string]?.packing || []).sort((a:any, b:any) => a.n.localeCompare(b.n));
  const [val, setVal] = useState('');

  const addItem = () => {
    if(!val) return;
    updateTripData(name as string, 'packing', [...items, {id: Date.now(), n: val, q: 0, c: false}]);
    setVal('');
  };

  const updateQty = (id: number, delta: number) => {
    updateTripData(name as string, 'packing', items.map((x:any) => {
      if (x.id === id) {
        return { ...x, q: Math.max(0, x.q + delta) };
      }
      return x;
    }));
  };

  return (
    <View style={styles.c}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>חזור</Text>
      </TouchableOpacity>
      
      <Text style={styles.h}>רשימת ציוד</Text>
      
      <TextInput placeholder="הוספת פריט חדש..." value={val} onChangeText={setVal} style={styles.i} placeholderTextColor="#C4B7B0" />
      <TouchableOpacity style={styles.b} onPress={addItem}>
        <Text style={styles.t}>הוספה</Text>
      </TouchableOpacity>

      <View style={styles.tableContainer}>
        <FlatList 
          data={items} 
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <View style={styles.row}>
              <View style={styles.rightCell}>
                <TouchableOpacity 
                  onPress={() => updateTripData(name as string, 'packing', items.map((x:any) => x.id === item.id ? { ...x, c: !x.c } : x))} 
                  style={[styles.circle, item.c && styles.circleFilled]} 
                />
                <Text style={[styles.cellText, item.c && styles.textLineThrough]}>{item.n}</Text>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.middleCell}>
                <Text style={styles.qtyText}>{item.q}</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.leftCell}>
                <TouchableOpacity onPress={() => updateTripData(name as string, 'packing', items.filter((x:any) => x.id !== item.id))}>
                  <Text style={styles.delText}>מחיקה</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ 
  c: { flex: 1, padding: 30, paddingTop: 60, backgroundColor: '#FDFBF7' }, 
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backTxt: { fontSize: 15, color: '#A08C7F', fontWeight: '400', letterSpacing: 0.5 }, 
  h: { fontSize: 30, textAlign: 'center', marginBottom: 35, fontWeight: '300', color: '#4A3C31', letterSpacing: 1 }, 
  i: { borderWidth: 1, borderColor: '#F0E6DD', padding: 16, backgroundColor: '#FFFFFF', marginBottom: 15, borderRadius: 16, textAlign: 'right', color: '#4A3C31', fontSize: 15 }, 
  b: { backgroundColor: '#8C6A5D', padding: 18, alignItems: 'center', borderRadius: 24, marginBottom: 35, shadowColor: '#8C6A5D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }, 
  t: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', letterSpacing: 0.5 }, 
  tableContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, flexShrink: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E6DD', shadowColor: '#4A3C31', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  row: { flexDirection: 'row-reverse', alignItems: 'stretch', minHeight: 56 }, 
  rightCell: { flex: 2, flexDirection: 'row-reverse', alignItems: 'center', paddingRight: 20, paddingVertical: 10 }, 
  circle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#A08C7F', marginLeft: 15 },
  circleFilled: { backgroundColor: '#8C6A5D', borderColor: '#8C6A5D' },
  verticalDivider: { width: 1, backgroundColor: '#F0E6DD' },
  middleCell: { flex: 1.4, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  qtyText: { fontSize: 17, fontWeight: '400', color: '#4A3C31' },
  qtyControls: { flexDirection: 'column', marginRight: 15 },
  qtyBtn: { backgroundColor: '#FDFBF7', width: 24, height: 20, borderRadius: 6, marginVertical: 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0E6DD' },
  qtyBtnText: { fontSize: 13, fontWeight: '400', color: '#8A7E74' },
  leftCell: { flex: 0.9, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 20, paddingVertical: 10 },
  cellText: { fontSize: 15, color: '#4A3C31', fontWeight: '400' },
  textLineThrough: { textDecorationLine: 'line-through', color: '#C4B7B0' },
  delText: { color: '#C4B7B0', fontSize: 13, fontWeight: '300' }
});