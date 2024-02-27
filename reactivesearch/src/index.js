import React from 'react';
import  { createRoot } from 'react-dom/client';
import LogTable from './Logs';
import App from './App';
import registerServiceWorker from './registerServiceWorker';







//< React18
//ReactDOM.render(<App />, document.getElementById('root'));

//React 18+
const logs = createRoot(document.getElementById('logs'));
logs.render(<LogTable />);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
registerServiceWorker();
