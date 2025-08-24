import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { GlobalConfirmation } from './components/UI/GlobalConfirmation';
import PerformanceMonitor from './components/UI/PerformanceMonitor';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { useViewportHeight } from './hooks/useViewportHeight';
import { useThemeSync } from './hooks/useThemeSync';
import './App.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
  },
]);

function App() {
  // Initialiser la gestion de la hauteur d'écran
  useViewportHeight();
  
  // Synchroniser le thème avec le DOM
  useThemeSync();
  
  return (
    <ConfirmationProvider>
      <div className="App h-screen">
        <RouterProvider router={router} />
        <GlobalConfirmation />
        <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
      </div>
    </ConfirmationProvider>
  );
}

export default App;