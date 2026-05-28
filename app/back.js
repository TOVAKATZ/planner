import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DestinationScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter(); // הפעלת הנתב

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>מה תרצי לעשות עכשיו?</Text>
      
      <View style={styles.buttonsContainer}>
        {/* כפתור תכנון - עכשיו הוא מנווט למסך התכנון השעתי! */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={() => router.push({ pathname: '/planning', params: { name: name } })}
        >
          <Text style={styles.buttonText}>תכנון 🗓️</Text>
        </TouchableOpacity>

        {/* כפתור זכרונות */}
        <TouchableOpacity style={[styles.mainButton, styles.memoryButton]}>
          <Text style={styles.buttonText}>זכרונות 📸</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E1', 
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4A3B32',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#7A6B62',
    marginBottom: 50,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 30,
    gap: 20, 
  },
  mainButton: {
    backgroundColor: '#4A3B32', 
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  memoryButton: {
    backgroundColor: '#E8B4B8', 
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF5E1',
  },
});