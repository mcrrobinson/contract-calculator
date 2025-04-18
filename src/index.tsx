import ReactDOM from 'react-dom/client';
import React from 'react';
import App from './App'; // Assuming your main App component is in './App.tsx' or './App.jsx'

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}