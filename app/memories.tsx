import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TripContext } from './TripContext';

export default function Journal() {
  const { name, start, end } = useLocalSearchParams();
  const router = useRouter(); 
  const { tripsData, updateTripData } = useContext(TripContext);
  
  let journalData = tripsData[name as string]?.journal || {};
  if (typeof journalData === 'string') {
    journalData = {}; 
  }
  
  const [expandedDay, setExpandedDay] = useState<number | 'full' | null>(null);

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

  const getHebrewDayName = (num: number) => {
    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני', 'תשיעי', 'עשירי', 'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר'];
    return num <= hebrewDays.length ? hebrewDays[num - 1] : num.toString();
  };

  const renderFullJournal = () => {
    const filledDays = daysArray.filter(dayNum => journalData[dayNum] && journalData[dayNum].trim().length > 0);
    if (filledDays.length === 0) {
      return <Text style={styles.emptyFullJournal}>עדיין לא נכתבו זכרונות...</Text>;
    }
    return filledDays.map((dayNum, index) => (
      <View key={`full-${dayNum}`} style={{ marginBottom: index === filledDays.length - 1 ? 0 : 30 }}>
        <Text style={styles.fullJournalDayTitle}>יום {getHebrewDayName(dayNum)}</Text>
        <Text style={styles.fullJournalText}>{journalData[dayNum].trim()}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>חזור</Text>
      </TouchableOpacity>
      
      <Text style={styles.header}>יומן מסע</Text>
      {start && end ? <Text style={styles.subHeader}>{start} - {end}</Text> : null}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        
        <View style={styles.fullJournalCard}>
          <TouchableOpacity style={styles.fullJournalHeader} onPress={() => setExpandedDay(expandedDay === 'full' ? null : 'full')} activeOpacity={0.8}>
            <Text style={styles.fullJournalTitle}>היומן המלא</Text>
            <Text style={styles.arrowFull}>{expandedDay === 'full' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedDay === 'full' && (
            <View style={styles.fullJournalContent}>{renderFullJournal()}</View>
          )}
        </View>

        {daysArray.map((dayNum) => (
          <View key={dayNum} style={styles.dayCard}>
            <TouchableOpacity style={styles.dayHeader} onPress={() => setExpandedDay(expandedDay === dayNum ? null : dayNum)} activeOpacity={0.7}>
              <Text style={styles.dayTitle}>יום {getHebrewDayName(dayNum)}</Text>
              <Text style={styles.arrow}>{expandedDay === dayNum ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expandedDay === dayNum && (
              <TextInput multiline placeholder="ספרי על החוויות שלך..." value={journalData[dayNum] || ''} onChangeText={(t) => updateTripData(name as string, 'journal', { ...journalData, [dayNum]: t })} style={styles.inputArea} placeholderTextColor="#C4B7B0" />
            )}
          </View>
        ))}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, padding: 30, paddingTop: 60, backgroundColor: '#FDFBF7' }, 
  backBtn: { alignSelf: 'flex-start', marginBottom: 15 },
  backTxt: { fontSize: 15, color: '#A08C7F', fontWeight: '400', letterSpacing: 0.5 }, 
  header: { fontSize: 32, textAlign: 'center', fontWeight: '300', color: '#4A3C31', letterSpacing: 1 }, 
  subHeader: { fontSize: 14, textAlign: 'center', color: '#A08C7F', marginBottom: 35, fontWeight: '300', letterSpacing: 0.5 }, 
  list: { flex: 1 },
  fullJournalCard: { backgroundColor: '#8C6A5D', borderRadius: 24, marginBottom: 30, overflow: 'hidden', shadowColor: '#8C6A5D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 4 },
  fullJournalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  fullJournalTitle: { fontSize: 18, fontWeight: '400', color: '#FFFFFF', letterSpacing: 0.5 },
  arrowFull: { fontSize: 12, color: '#FFFFFF' },
  fullJournalContent: { backgroundColor: '#FFFFFF', padding: 30, borderTopWidth: 1, borderTopColor: '#A88B80' },
  fullJournalDayTitle: { fontSize: 17, fontWeight: '500', color: '#4A3C31', marginBottom: 10, textAlign: 'right', letterSpacing: 0.5 },
  fullJournalText: { fontSize: 15, color: '#6B5A52', textAlign: 'right', lineHeight: 26, fontWeight: '300' },
  emptyFullJournal: { fontSize: 15, color: '#C4B7B0', textAlign: 'center', fontStyle: 'italic', fontWeight: '300' },
  dayCard: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#F0E6DD', shadowColor: '#4A3C31', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
  dayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 22, backgroundColor: '#FFFFFF' },
  dayTitle: { fontSize: 16, fontWeight: '400', color: '#4A3C31', letterSpacing: 0.5 },
  arrow: { fontSize: 12, color: '#C4B7B0' },
  inputArea: { backgroundColor: '#FCF9F6', padding: 25, minHeight: 180, textAlignVertical: 'top', fontSize: 15, color: '#4A3C31', textAlign: 'right', borderTopWidth: 1, borderTopColor: '#F0E6DD', lineHeight: 24, fontWeight: '300' } 
});