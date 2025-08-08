import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
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
    <div className="App min-h-screen-dynamic">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;