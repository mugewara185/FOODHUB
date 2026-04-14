/**
 * Logger Test Component
 * 
 * Use this to verify the logger system is working correctly.
 * You can add this component temporarily to test before integrating elsewhere.
 * 
 * Place in: src/core/dev/components/LoggerTest.tsx
 */

import React, { useState } from 'react';
import { useLogger, useCategoryLogs, useErrorLogs, useLogsByLevel } from '@/core/dev/logger';
import { logAPI, logComponent, logRedux, logAuth, logPerformance } from '@/core/dev/logger';

export const LoggerTest: React.FC = () => {
  const { info, warn, error, debug, critical, clearLogs, exportLogs } = useLogger();
  const { logs } = useLogger();
  const apiLogs = useCategoryLogs('API');
  const errorLogs = useErrorLogs();
  const [output, setOutput] = useState<string>('');

  const testBasicLogging = () => {
    debug('TEST', 'This is a debug message', { level: 'DEBUG' });
    info('TEST', 'This is an info message', { level: 'INFO' });
    warn('TEST', 'This is a warning message', { level: 'WARN' });
    error('TEST', 'This is an error message', { level: 'ERROR' });
    critical('TEST', 'This is a critical message', { level: 'CRITICAL' });
    
    setOutput('✅ Basic logging test completed - check console for colored logs!');
  };

  const testAPILogging = () => {
    logAPI.request('/api/users', 'GET', { params: { page: 1 } });
    logAPI.response('/api/users', 200, { users: ['user1', 'user2'] });
    logAPI.error('/api/users', new Error('Network failed'));
    
    setOutput('✅ API logging test completed - check console!');
  };

  const testComponentLogging = () => {
    logComponent.mount('LoggerTest');
    logComponent.effect('LoggerTest', 'testEffect');
    logComponent.render('LoggerTest', { props: 'test' });
    
    setOutput('✅ Component logging test completed - check console!');
  };

  const testReduxLogging = () => {
    logRedux.action('fetchUsers', { page: 1 });
    logRedux.dispatch('fetchUsers/fulfilled');
    logRedux.state('users', { data: ['user1', 'user2'] });
    
    setOutput('✅ Redux logging test completed - check console!');
  };

  const testAuthLogging = () => {
    logAuth.login('user@example.com', 'email');
    logAuth.token('set', 'token_exists');
    
    setOutput('✅ Auth logging test completed - check console!');
  };

  const testPerformanceLogging = () => {
    logPerformance.start('testOperation');
    setTimeout(() => {
      logPerformance.end('testOperation');
      setOutput('✅ Performance logging test completed - check console!');
    }, 500);
  };

  const handleExportLogs = () => {
    const json = exportLogs('json');
    const csv = exportLogs('csv');
    
    console.log('=== JSON EXPORT ===');
    console.log(json);
    console.log('=== CSV EXPORT ===');
    console.log(csv);
    
    setOutput(`✅ Exported ${logs.length} logs - check console!`);
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #007bff',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h2>🧪 Logger System Test Component</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
        <p><strong>Total Logs:</strong> {logs.length}</p>
        <p><strong>API Logs:</strong> {apiLogs.length}</p>
        <p><strong>Error Logs:</strong> {errorLogs.length}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <button onClick={testBasicLogging} style={buttonStyle}>
          📝 Test Basic Logging
        </button>
        <button onClick={testAPILogging} style={buttonStyle}>
          🌐 Test API Logging
        </button>
        <button onClick={testComponentLogging} style={buttonStyle}>
          ⚛️ Test Component Logging
        </button>
        <button onClick={testReduxLogging} style={buttonStyle}>
          🔄 Test Redux Logging
        </button>
        <button onClick={testAuthLogging} style={buttonStyle}>
          🔐 Test Auth Logging
        </button>
        <button onClick={testPerformanceLogging} style={buttonStyle}>
          ⏱️ Test Performance Logging
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <button onClick={handleExportLogs} style={{ ...buttonStyle, backgroundColor: '#28a745' }}>
          💾 Export Logs
        </button>
        <button onClick={() => { clearLogs(); setOutput('✅ Logs cleared!'); }} style={{ ...buttonStyle, backgroundColor: '#dc3545' }}>
          🗑️ Clear Logs
        </button>
      </div>

      {output && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          border: '1px solid #c3e6cb',
          marginTop: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          {output}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#fff3cd',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <p><strong>📍 Instructions:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Click any button above to test logging</li>
          <li>Open browser <strong>Developer Tools (F12)</strong> and go to <strong>Console</strong> tab</li>
          <li>You should see colorized logs for each test</li>
          <li>Export to see JSON/CSV format</li>
          <li>Check localStorage under <code>zom2_logs</code> key</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#e2e3e5',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <p><strong>✅ Logger is working if:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Console shows colorized logs (DEBUG=Gray, INFO=Blue, WARN=Orange, ERROR=Red, CRITICAL=Dark Red)</li>
          <li>Log counter increases after each test</li>
          <li>Export shows valid JSON/CSV</li>
          <li>Logs persist in localStorage</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#cce5ff',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <p><strong>🚀 Next Steps:</strong></p>
        <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Remove this test component from your app</li>
          <li>Copy examples from <code>LOGGER_PRACTICAL_EXAMPLES.ts</code></li>
          <li>Integrate logger into API interceptors</li>
          <li>Add logging to Redux middleware</li>
          <li>Use <code>useLogger()</code> hook in components</li>
        </ol>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};

export default LoggerTest;
