import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { Provider } from "react-redux";
import { store } from "./store";

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
<Provider store={store}>
  <App />
</Provider>