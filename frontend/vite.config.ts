import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from "vite-plugin-svgr";


export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-colorful/dist/index.css': path.resolve(
        __dirname,
        'src/styles/react-colorful.css'
      ),
      
    },
  },
});
