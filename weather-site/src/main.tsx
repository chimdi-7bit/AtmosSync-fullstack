import React from 'react'  // Import the React library for component definition
import ReactDOM from 'react-dom/client'  // Import the ReactDOM library for rendering to the DOM
import App from './App'  // Import the main App component of the weather application (removing extension for TS compatibility)
import './index.css'  // Import global styles for the application

ReactDOM.createRoot(document.getElementById('root')!).render(  // Create the React root and render the application
  <React.StrictMode>  // Enable strict mode for better development feedback
    <App />  // Render the App component inside the root
  </React.StrictMode>,  // End of strict mode wrapper
)  // End of the render function
