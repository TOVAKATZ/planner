import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Dashboard() {
  const router = useRouter();
  const { name, start, end } = useLocalSearchParams();
  
  const menu = [
    { t: 'לו"ז', p: '/planning' }, 
    { t: 'יומן מסע', p: '/memories' }, 
    { t: 'רשימת ציוד', p: '/packing' }, 
    { t: 'תקציב והוצאות', p: '/expenses' }
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{name}</Text>
      
      <View style={styles.menuGrid}>
        {menu.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuButton} 
            onPress={() => router.push({ pathname: item.p as any, params: { name, start, end } })}
            activeOpacity={0.8}
          >
            <Text style={styles.menuText}>{item.t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>חזרה ליעדים</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, padding: 35, backgroundColor: '#FDFBF7', justifyContent: 'center' }, 
  header: { fontSize: 34, textAlign: 'center', marginBottom: 50, fontWeight: '300', color: '#4A3C31', letterSpacing: 1 }, 
  menuGrid: { gap: 18, marginBottom: 40 },
  menuButton: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 24, shadowColor: '#8C6A5D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }, 
  menuText: { color: '#8C6A5D', textAlign: 'center', fontSize: 18, fontWeight: '500', letterSpacing: 0.5 }, 
  backButton: { alignItems: 'center', padding: 10 }, 
  backText: { color: '#A08C7F', fontWeight: '400', fontSize: 15, letterSpacing: 0.5 } 
});