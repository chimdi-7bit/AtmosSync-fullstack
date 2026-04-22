import React from 'react'  // Import the React library for building user interfaces
import ReactDOM from 'react-dom/client'  // Import the ReactDOM library for rendering components to the DOM
import App from './App'  // Import the root component without the extension for TS compatibility
import './index.css'  // Import the global CSS styles for the application

ReactDOM.createRoot(document.getElementById('root')!).render(  // Mount the React application on the root element
  <React.StrictMode>  // Enable strict mode for better error detection during development
    <App />  // Render the root App component
  </React.StrictMode>,  // End of strict mode wrapper
)  // End of the render function call
