import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// No <StrictMode>: its dev double-mount re-creates the rapier physics world and
// ecctrl's listeners/camera state (double-spawn bugs). Game state will live in
// zustand/useFrame, which StrictMode doesn't help police anyway.
createRoot(document.getElementById('root')!).render(<App />);
