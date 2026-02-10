import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import {AuthProvider} from './contexts/AuthContext';
import App from './App';
// import theme from './appp/theme';
import foodtheme from './appp/foodTheme';
import './index.css';

// import '@fontsource/roboto/300.css';
// import '@fontsource/roboto/400.css';
// import '@fontsource/roboto/500.css';
// import '@fontsource/roboto/700.css';
// import '@fontsource/poppins/300.css';
// import '@fontsource/poppins/400.css';
// import '@fontsource/poppins/500.css';
// import '@fontsource/poppins/600.css';
// import '@fontsource/poppins/700.css';

import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* <ThemeProvider theme={theme}> */}
      <ThemeProvider theme={foodtheme}>
        <CssBaseline />
        {/* <AuthProvider> */}
          <App />
        {/* </AuthProvider> */}
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);