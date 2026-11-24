import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToolScreen from './ToolScreen';

export default function App() {
  return <SafeAreaProvider><ToolScreen /></SafeAreaProvider>;
}
