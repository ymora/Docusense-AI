import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { GlobalConfirmation } from './components/UI/GlobalConfirmation';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { useViewportHeight } from './hooks/useViewportHeight';
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