import { Stack } from 'expo-router';
import { TripProvider } from './TripContext';

export default function RootLayout() {
  return (
    <TripProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </TripProvider>
  );
}