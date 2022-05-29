import './App.css';
import DidWePlay from './DidWePlay';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <DidWePlay />
      </div>
    </QueryClientProvider>
  );
}

export default App;
