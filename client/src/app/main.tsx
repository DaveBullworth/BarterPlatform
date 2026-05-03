import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';

import { store } from './store';
import { QueryProvider } from './providers/QueryProvider';
import { AppMantineProvider } from './providers/MantineProvider';
import { ApiProvider } from './providers/ApiProvider';
import { App } from './App';

import './styles/globals.scss';
import './styles/variables.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <ApiProvider>
        <QueryProvider>
          <AppMantineProvider>
            <App />
          </AppMantineProvider>
        </QueryProvider>
      </ApiProvider>
    </ReduxProvider>
  </React.StrictMode>,
);
