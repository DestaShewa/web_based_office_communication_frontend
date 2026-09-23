import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';

function App() {
  return (
    <>
      <Toaster position="top-right" expand={false} richColors />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
