import './App.css';
import DidWePlay from './DidWePlay';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <DidWePlay />
      </main>
    </QueryClientProvider>
  );
}

export default App;
