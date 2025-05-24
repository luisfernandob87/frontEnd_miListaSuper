import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    https: {
      // Assuming cert.pem and key.pem are in the project root
      key: './cert.key',
      cert: './cert.crt'
    }
  }
})
