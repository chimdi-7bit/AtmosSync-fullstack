import { defineConfig } from 'vite'  // Import the defineConfig helper from Vite for type safety
import react from '@vitejs/plugin-react'  // Import the official React plugin for Vite

// https://vitejs.dev/config/  - Official Vite configuration documentation
export default defineConfig({  // Export the Vite configuration object
  plugins: [react()],  // Use the React plugin to handle JSX and other React features
})  // End of the configuration object
