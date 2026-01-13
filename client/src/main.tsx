import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { AppMantineProvider } from './app/providers/MantineProvider';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <AppMantineProvider>
        <App />
      </AppMantineProvider>
    </ReduxProvider>
  </React.StrictMode>,
);
