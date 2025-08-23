import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { GlobalConfirmation } from './components/UI/GlobalConfirmation';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { useViewportHeight } from './hooks/useViewportHeight';
import { useThemeSync } from './hooks/useThemeSync';
import { useUnifiedAuth } from './hooks/useUnifiedAuth';
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
  
  // Authentification unifiée automatique
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  
  // Afficher un loader pendant l'authentification
  if (isLoading) {
    return (
      <div className="App h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Connexion en cours...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ConfirmationProvider>
      <div className="App h-screen">
        <RouterProvider router={router} />
        <GlobalConfirmation />
      </div>
    </ConfirmationProvider>
  );
}

export default App;