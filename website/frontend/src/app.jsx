import './css/app.css';
import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Capture recovery/invite hashes before Supabase client initializes and strips them
if (window.location.hash && (window.location.hash.includes('type=recovery') || window.location.hash.includes('type=invite'))) {
    sessionStorage.setItem('supabase_recovery_hash', window.location.hash);
}

import App from './components/App';

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);