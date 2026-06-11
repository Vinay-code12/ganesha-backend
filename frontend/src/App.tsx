import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useAuthStore } from './context/authStore';
import { useEffect } from 'react';

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Apply saved dark mode on mount
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'true' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
