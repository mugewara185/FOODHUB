// import React, { Component, type ErrorInfo, type ReactNode } from 'react';
// import { Box, Typography, Button, Paper, Alert } from '@mui/material';
// import { Refresh, Home, ArrowBack } from '@mui/icons-material';
// import { withRouter, type NavigateFunction } from 'react-router-dom';
// import * as Sentry from '@sentry/react';

// interface Props {
//   children: ReactNode;
//   navigate?: NavigateFunction;
//   fallback?: ReactNode;
// }

// interface State {
//   hasError: boolean;
//   error: Error | null;
//   errorInfo: ErrorInfo | null;
// }

// class ErrorBoundaryComponent extends Component<Props, State> {
//   constructor(props: Props) {
//     super(props);
//     this.state = {
//       hasError: false,
//       error: null,
//       errorInfo: null,
//     };
//   }

//   static getDerivedStateFromError(error: Error): State {
//     return {
//       hasError: true,
//       error,
//       errorInfo: null,
//     };
//   }

//   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
//     // Log to Sentry
//     Sentry.captureException(error, { extra: errorInfo });
    
//     this.setState({
//       error,
//       errorInfo,
//     });
//   }

//   handleRefresh = () => {
//     window.location.reload();
//   };

//   handleGoBack = () => {
//     this.props.navigate?.(-1);
//   };

//   handleGoHome = () => {
//     this.props.navigate?.('/');
//   };

//   render() {
//     if (this.state.hasError) {
//       if (this.props.fallback) {
//         return this.props.fallback;
//       }

//       return (
//         <Box
//           sx={{
//             minHeight: '100vh',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             p: 3,
//           }}
//         >
//           <Paper
//             elevation={0}
//             sx={{
//               p: 4,
//               maxWidth: 500,
//               textAlign: 'center',
//               borderRadius: 3,
//             }}
//           >
//             <Typography variant="h3" gutterBottom>
//               😕
//             </Typography>
//             <Typography variant="h5" fontWeight={700} gutterBottom>
//               Something went wrong
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//               We're sorry, but something unexpected happened. Our team has been notified.
//             </Typography>

//             <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
//               <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
//                 {this.state.error?.message || 'Unknown error'}
//               </Typography>
//             </Alert>

//             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
//               <Button
//                 variant="contained"
//                 startIcon={<Refresh />}
//                 onClick={this.handleRefresh}
//               >
//                 Refresh Page
//               </Button>
//               <Button
//                 variant="outlined"
//                 startIcon={<Home />}
//                 onClick={this.handleGoHome}
//               >
//                 Go Home
//               </Button>
//               <Button
//                 variant="text"
//                 startIcon={<ArrowBack />}
//                 onClick={this.handleGoBack}
//               >
//                 Go Back
//               </Button>
//             </Box>

//             {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
//               <Box
//                 sx={{
//                   mt: 3,
//                   p: 2,
//                   bgcolor: 'grey.100',
//                   borderRadius: 2,
//                   textAlign: 'left',
//                   maxHeight: 200,
//                   overflow: 'auto',
//                 }}
//               >
//                 <Typography variant="caption" component="pre">
//                   {this.state.errorInfo.componentStack}
//                 </Typography>
//               </Box>
//             )}
//           </Paper>
//         </Box>
//       );
//     }

//     return this.props.children;
//   }
// }

// // Wrap with router to have navigation
// export const ErrorBoundary = withRouter(ErrorBoundaryComponent);