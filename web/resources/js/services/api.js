import axios from 'axios';

// Read CSRF token from the meta tag injected by Laravel's Blade template
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

const api = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken,
    },
    withCredentials: true,
});

export default api;
