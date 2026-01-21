import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { AppMantineProvider } from './app/providers/MantineProvider';
import { App } from './App';

import './app/styles/reset.scss';
import './app/styles/globals.scss';
import './app/styles/variables.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <AppMantineProvider>
        <App />
      </AppMantineProvider>
    </ReduxProvider>
  </React.StrictMode>,
);
