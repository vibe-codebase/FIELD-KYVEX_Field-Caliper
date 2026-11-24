import { createRoot } from 'react-dom/client';
import '@fontsource/red-hat-display/latin-500.css';
import '@fontsource/red-hat-display/latin-600.css';
import '@fontsource/red-hat-display/latin-700.css';
import '@fontsource/red-hat-display/latin-800.css';
import '@fontsource/red-hat-mono/latin-500.css';
import '@fontsource/red-hat-mono/latin-600.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
