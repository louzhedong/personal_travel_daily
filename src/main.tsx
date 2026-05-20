import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './modules/App';
import { registerTravelServiceWorker } from './pwa/registerServiceWorker';
import './styles/index.css';

registerTravelServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
