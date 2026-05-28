import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TripContext } from './TripContext';

const ROW_HEIGHT = 120; 

const CURRENCIES = [
  { code: 'ILS', symbol: '₪', name: 'שקל' },
  { code: 'USD', symbol: '$', name: 'דולר' },
  { code: 'EUR', symbol: '€', name: 'יורו' },
  { code: 'GBP', symbol: '£', name: 'פאונד' },
  { code: 'ISK', symbol: 'kr', name: 'קרונה' }
];

export default function PlanningScreen() {
  const { name, start, end } = useLocalSearchParams();
  const router = useRouter();
  const { tripsData, updateTripData } = useContext(TripContext);
  
  // תיקון: הפכנו את הנתונים למצב (State) כדי שהמסך יתרענן מיד
  const [planData, setPlanData] = useState<any>(tripsData[name as string]?.planning || {});

  // סנכרון הנתונים כדי לוודא שתמיד יש לנו את המידע המעודכן
  useEffect(() => {
    setPlanData(tripsData[name as string]?.planning || {});
  }, [tripsData, name]);

  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [rates, setRates] = useState<any>(null);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    dayNum: 1, activity: '', startTime: '', endTime: '', price: '', currency: 'ILS' 
  });
  
  const [timePicker, setTimePicker] = useState<{visible: boolean, field: 'startTime'|'endTime'|null}>({ visible: false, field: null });

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => { if (data?.rates) setRates(data.rates); })
      .catch(err => console.log(err));
  }, []);

  let totalDays = 1;
  if (start && end && typeof start === 'string' && typeof end === 'string') {
    const [sDay, sMonth, sYear] = start.split('/');
    const [eDay, eMonth, eYear] = end.split('/');
    const startDate = new Date(`${sYear}-${sMonth}-${sDay}`);
    const endDate = new Date(`${eYear}-${eMonth}-${eDay}`);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const diffTime = endDate.getTime() - startDate.getTime();
      totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
  }
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) { 
    for (let m = 0; m < 60; m += 15) { 
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`); 
    } 
  }

  const parseTime = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
  };

  const convertToILS = (amount: number, currencyCode: string) => {
    if (!rates || !amount) return 0; 
    if (currencyCode === 'ILS') return amount;
    const inUSD = amount / rates[currencyCode];
    return Math.round(inUSD * rates['ILS']);
  };

  const getDurationText = (startDec: number, endDec: number) => {
    const totalMinutes = Math.round((endDec - startDec) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} דק׳`;
    let hourPart = hours === 1 ? "שעה" : hours === 2 ? "שעתיים" : `${hours} שעות`;
    if (mins === 0) return `${hourPart}`;
    if (mins === 30) return `${hourPart} וחצי`;
    return `${hourPart} ו-${mins} דק׳`;
  };

  const openAddModal = (dayNum: number, defaultStart = '') => {
    setEditingId(null);
    setFormData({ dayNum, activity: '', startTime: defaultStart, endTime: '', price: '', currency: 'ILS' });
    setModalVisible(true);
  };

  const openEditModal = (dayNum: number, item: any) => {
    setEditingId(item.id);
    setFormData({ dayNum, activity: item.activity, startTime: item.startTime, endTime: item.endTime, price: item.price ? item.price.toString() : '', currency: item.currency || 'ILS' });
    setModalVisible(true);
  };

  const handleSaveActivity = () => {
    if (!formData.activity || !formData.startTime || !formData.endTime) return alert('נא למלא שדות חובה');
    const startDec = parseTime(formData.startTime);
    const endDec = parseTime(formData.endTime);
    if (endDec <= startDec) return alert('שעת סיום לא תקינה');

    const dayActivities = planData[formData.dayNum] || [];
    let updatedActivities;
    const activityId = editingId || Date.now().toString();

    const newActivity = {
      id: activityId, activity: formData.activity, startTime: formData.startTime, endTime: formData.endTime, startDec, endDec, price: Number(formData.price) || 0, currency: formData.currency
    };

    if (editingId) {
      updatedActivities = dayActivities.map((act: any) => act.id === editingId ? newActivity : act);
    } else {
      updatedActivities = [...dayActivities, newActivity];
    }

    const currentExpenses = tripsData[name as string]?.expenses || [];
    const filteredExpenses = currentExpenses.filter((e: any) => e.id !== activityId);
    if (newActivity.price > 0) {
      const expInIls = convertToILS(newActivity.price, newActivity.currency);
      filteredExpenses.push({ id: activityId, l: `${newActivity.activity} (לו״ז)`, p: expInIls });
    }

    // תיקון: מעדכנים את המצב המקומי כדי שהמסך יתרענן מיד
    const newPlanData = { ...planData, [formData.dayNum]: updatedActivities };
    setPlanData(newPlanData);
    
    updateTripData(name as string, 'planning', newPlanData);
    updateTripData(name as string, 'expenses', filteredExpenses);
    setModalVisible(false);
  };

  const handleDeleteActivity = () => {
    if (!editingId) return;
    const dayActivities = planData[formData.dayNum] || [];
    const updatedActivities = dayActivities.filter((act: any) => act.id !== editingId);
    const currentExpenses = tripsData[name as string]?.expenses || [];
    const updatedExpenses = currentExpenses.filter((e: any) => e.id !== editingId);

    // תיקון: מעדכנים את המצב המקומי כדי שהמסך יתרענן מיד במחיקה
    const newPlanData = { ...planData, [formData.dayNum]: updatedActivities };
    setPlanData(newPlanData);

    updateTripData(name as string, 'planning', newPlanData);
    updateTripData(name as string, 'expenses', updatedExpenses);
    setModalVisible(false);
  };

  const currentTimeOptions = timePicker.field === 'endTime' && formData.startTime
    ? timeOptions.filter(time => parseTime(time) > parseTime(formData.startTime))
    : timeOptions;

  const initialScrollIndex = Math.max(0, timePicker.field && formData[timePicker.field] ? currentTimeOptions.indexOf(formData[timePicker.field]) : 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>חזור</Text>
      </TouchableOpacity>
      
      <Text style={styles.header}>לו״ז: {name}</Text>
      
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        {daysArray.map((dayNum) => {
          const dayActivities = planData[dayNum] || [];
          const totalDayExpensesILS = dayActivities.reduce((sum: number, act: any) => sum + convertToILS(act.price, act.currency), 0);
          
          const groupedActivities: Record<string, any[]> = {};
          dayActivities.forEach((act: any) => {
            const key = `${act.startDec}-${act.endDec}`;
            if (!groupedActivities[key]) groupedActivities[key] = [];
            groupedActivities[key].push(act);
          });

          return (
            <View key={dayNum} style={styles.dayCard}>
              <TouchableOpacity style={styles.dayHeader} onPress={() => setExpandedDay(expandedDay === dayNum ? null : dayNum)} activeOpacity={0.8}>
                <Text style={styles.dayTitle}>יום #{dayNum}</Text>
                <Text style={styles.arrow}>{expandedDay === dayNum ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {expandedDay === dayNum && (
                <View style={styles.timelineContainer}>
                  <View style={styles.hoursColumn}>
                    {allHours.map((hour) => (
                      <View key={`h-${hour}`} style={styles.hourSlot}>
                        <Text style={styles.hourText}>{String(hour).padStart(2, '0')}:00</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.gridColumn}>
                    {allHours.map((hour) => (
                      <TouchableOpacity key={`g-${hour}`} style={styles.gridEmptySlot} onPress={() => openAddModal(dayNum, `${String(hour).padStart(2, '0')}:00`)}>
                        <Text style={styles.emptySlotText}>+ הוספת פעילות</Text>
                      </TouchableOpacity>
                    ))}

                    {Object.entries(groupedActivities).map(([key, acts]) => {
                      const [sStr, eStr] = key.split('-');
                      const topPosition = parseFloat(sStr) * ROW_HEIGHT;
                      const cardHeight = (parseFloat(eStr) - parseFloat(sStr)) * ROW_HEIGHT;

                      return (
                        <View key={key} style={[styles.activityGroup, { top: topPosition, height: cardHeight }]}>
                          <ScrollView showsVerticalScrollIndicator={false}>
                            {acts.map((act: any, idx: number) => {
                              const priceILS = convertToILS(act.price, act.currency);
                              const currencySymbol = CURRENCIES.find(c => c.code === act.currency)?.symbol || '';
                              return (
                                <View key={act.id}>
                                  <TouchableOpacity style={styles.activityBlock} onPress={() => openEditModal(dayNum, act)} activeOpacity={0.7}>
                                    <Text style={styles.actTitle}>{act.activity}</Text>
                                    <Text style={styles.actTime}>{act.startTime} - {act.endTime} • {getDurationText(act.startDec, act.endDec)}</Text>
                                    {act.price > 0 && (
                                      <Text style={styles.actPrice}>{act.price}{currencySymbol} {act.currency !== 'ILS' ? `(${priceILS} ₪)` : ''}</Text>
                                    )}
                                  </TouchableOpacity>
                                  {idx < acts.length - 1 && <View style={styles.dashedSeparator} />}
                                </View>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.dayTotalContainer}>
                    <Text style={styles.dayTotalText}>סה״כ הוצאות: {totalDayExpensesILS.toLocaleString()} ₪</Text>
                  </View>

                  <TouchableOpacity style={styles.addMainBtn} onPress={() => openAddModal(dayNum)}>
                    <Text style={styles.addMainBtnText}>+ פעילות חדשה</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* מודאלים */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingId ? 'עריכה' : 'תכנון חדש'}</Text>
            <TextInput style={styles.input} placeholder="שם הפעילות" value={formData.activity} onChangeText={(t) => setFormData({...formData, activity: t})} textAlign="right" placeholderTextColor="#C4B7B0" />
            
            <View style={styles.rowInputs}>
              <TouchableOpacity style={styles.timePickerBtn} onPress={() => setTimePicker({ visible: true, field: 'startTime' })}>
                <Text style={styles.timePickerText}>{formData.startTime || 'שעת התחלה'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timePickerBtn} onPress={() => setTimePicker({ visible: true, field: 'endTime' })}>
                <Text style={styles.timePickerText}>{formData.endTime || 'שעת סיום'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.currencySelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CURRENCIES.map(c => (
                    <TouchableOpacity key={c.code} style={[styles.currencyBtn, formData.currency === c.code && styles.currencyBtnActive]} onPress={() => setFormData({...formData, currency: c.code})}>
                      <Text style={[styles.currencyBtnText, formData.currency === c.code && styles.currencyBtnTextActive]}>{c.symbol}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="עלות" keyboardType="numeric" value={formData.price} onChangeText={(t) => setFormData({...formData, price: t})} textAlign="right" placeholderTextColor="#C4B7B0" />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveActivity}><Text style={styles.saveBtnText}>שמירה</Text></TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={styles.delBtn} onPress={handleDeleteActivity}><Text style={styles.delBtnText}>מחיקה</Text></TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelTxt}>ביטול</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={timePicker.visible} transparent animationType="slide">
        <View style={styles.timeModalOverlay}>
          <View style={styles.timeModalContainer}>
            <Text style={styles.timeModalTitle}>בחירת שעה</Text>
            <FlatList 
              data={currentTimeOptions} 
              keyExtractor={(item) => item}
              initialScrollIndex={initialScrollIndex}
              getItemLayout={(data, index) => ({ length: 55, offset: 55 * index, index })}
              style={{maxHeight: 280}}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.timeOption} onPress={() => { setFormData({ ...formData, [timePicker.field as string]: item }); setTimePicker({ visible: false, field: null }); }}>
                  <Text style={[styles.timeOptionText, timePicker.field && formData[timePicker.field as 'startTime'|'endTime'] === item && {fontWeight: '500', color: '#8C6A5D'}]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeTimeBtn} onPress={() => setTimePicker({ visible: false, field: null })}><Text style={styles.closeTimeBtnText}>סגירה</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, padding: 25, paddingTop: 60, backgroundColor: '#FDFBF7' }, 
  backBtn: { alignSelf: 'flex-start', marginBottom: 15 },
  backTxt: { fontSize: 15, color: '#A08C7F', fontWeight: '400', letterSpacing: 0.5 }, 
  header: { fontSize: 30, fontWeight: '300', color: '#4A3C31', textAlign: 'center', marginBottom: 25, letterSpacing: 1 }, 
  dayCard: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 20, overflow: 'hidden', shadowColor: '#8C6A5D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  dayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 22, backgroundColor: '#FFFFFF' },
  dayTitle: { fontSize: 18, fontWeight: '500', color: '#4A3C31', letterSpacing: 0.5 },
  arrow: { fontSize: 13, color: '#A08C7F' },
  timelineContainer: { backgroundColor: '#FFFCFA', paddingHorizontal: 15, paddingTop: 10 },
  hoursColumn: { position: 'absolute', right: 5, top: 10, width: 45, alignItems: 'center', zIndex: 1 },
  hourSlot: { height: ROW_HEIGHT, paddingTop: 2 },
  hourText: { fontSize: 12, fontWeight: '400', color: '#A08C7F' },
  gridColumn: { marginRight: 55, position: 'relative', borderRightWidth: 1, borderColor: '#F0E6DD', minHeight: 24 * ROW_HEIGHT },
  gridEmptySlot: { height: ROW_HEIGHT, borderBottomWidth: 1, borderColor: '#F0E6DD', borderStyle: 'solid', justifyContent: 'center', paddingLeft: 15 },
  emptySlotText: { color: '#D9CCC5', fontSize: 12, textAlign: 'left', fontWeight: '300' },
  activityGroup: { position: 'absolute', left: 5, right: 5, zIndex: 5, backgroundColor: 'rgba(245, 230, 232, 0.85)', borderRadius: 16, padding: 8 },
  activityBlock: { paddingVertical: 4 },
  dashedSeparator: { borderBottomWidth: 1, borderColor: '#C2A8A3', borderStyle: 'dashed', marginVertical: 8, opacity: 0.4 },
  actTitle: { fontSize: 16, fontWeight: '500', color: '#4A3C31', textAlign: 'right', letterSpacing: 0.3 },
  actTime: { fontSize: 13, color: '#8C6A5D', textAlign: 'right', marginTop: 3, fontWeight: '400' },
  actDuration: { fontSize: 12, color: '#A08C7F', textAlign: 'right', fontWeight: '300' },
  actPrice: { fontSize: 13, color: '#4A3C31', textAlign: 'right', marginTop: 6, fontWeight: '500', backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-end', overflow: 'hidden' },
  dayTotalContainer: { backgroundColor: '#FDFBF7', marginHorizontal: 10, marginTop: 20, padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6DD' },
  dayTotalText: { fontSize: 15, fontWeight: '500', color: '#8C6A5D', letterSpacing: 0.5 },
  addMainBtn: { backgroundColor: '#4A3C31', margin: 15, padding: 18, borderRadius: 24, alignItems: 'center', shadowColor: '#4A3C31', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10 },
  addMainBtnText: { color: '#FFFFFF', fontWeight: '500', fontSize: 15, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(74, 60, 49, 0.3)', justifyContent: 'center', padding: 30 },
  modalContainer: { backgroundColor: '#FDFBF7', padding: 30, borderRadius: 30 },
  modalTitle: { fontSize: 22, fontWeight: '400', color: '#4A3C31', textAlign: 'center', marginBottom: 25, letterSpacing: 0.5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0E6DD', padding: 16, borderRadius: 16, marginBottom: 16, color: '#4A3C31', fontSize: 15 },
  rowInputs: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  timePickerBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0E6DD', padding: 16, borderRadius: 16, alignItems: 'center' },
  timePickerText: { fontSize: 14, color: '#4A3C31', fontWeight: '400' },
  currencySelector: { flex: 1, flexDirection: 'row-reverse', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0E6DD', overflow: 'hidden' },
  currencyBtn: { paddingHorizontal: 14, justifyContent: 'center' },
  currencyBtnActive: { backgroundColor: '#8C6A5D' },
  currencyBtnText: { fontSize: 16, color: '#A08C7F', fontWeight: '400' },
  currencyBtnTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row-reverse', gap: 12, marginTop: 10 },
  saveBtn: { flex: 2, backgroundColor: '#8C6A5D', padding: 16, borderRadius: 20, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '500', fontSize: 15, letterSpacing: 0.5 },
  delBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0E6DD', padding: 16, borderRadius: 20, alignItems: 'center' },
  delBtnText: { color: '#A08C7F', fontWeight: '400', fontSize: 15 },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  cancelTxt: { color: '#A08C7F', fontWeight: '400', fontSize: 15 },
  timeModalOverlay: { flex: 1, backgroundColor: 'rgba(74, 60, 49, 0.3)', justifyContent: 'flex-end' },
  timeModalContainer: { backgroundColor: '#FDFBF7', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 40 },
  timeModalTitle: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 20, color: '#4A3C31', letterSpacing: 0.5 },
  timeOption: { height: 55, justifyContent: 'center', borderBottomWidth: 1, borderColor: '#F0E6DD' },
  timeOptionText: { fontSize: 18, textAlign: 'center', color: '#A08C7F', fontWeight: '300' },
  closeTimeBtn: { backgroundColor: '#F0E6DD', padding: 16, borderRadius: 20, alignItems: 'center', marginTop: 20 },
  closeTimeBtnText: { color: '#4A3C31', fontWeight: '500', fontSize: 15, letterSpacing: 0.5 }
});