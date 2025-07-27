import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import FileManager from './components/FileManager/FileManager';
import './App.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <FileManager />
      </Layout>
    ),
  },
]);

function App() {
  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;