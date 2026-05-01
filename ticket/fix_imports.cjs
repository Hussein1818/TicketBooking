const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Fix admin pages in App.jsx
    content = content.replace(/\/pages\/admin pages\//g, '/pages/admin/');

    // 2. Fix auth pages in App.jsx
    content = content.replace(/\/pages\/auth pages\//g, '/pages/auth/');

    // 3. Fix useAuthStore imports
    // In src/services/axiosInterceptors.js: "../pages/auth pages/store/useAuthStore" -> "../store/useAuthStore"
    content = content.replace(/\.\.\/pages\/auth pages\/store\/useAuthStore/g, '../store/useAuthStore');
    
    // In src/components/: "../pages/auth pages/store/useAuthStore" -> "../store/useAuthStore"
    // Already covered above
    
    // In src/pages/admin/*.jsx: "../auth pages/store/useAuthStore" -> "../../store/useAuthStore"
    if (file.includes(path.join('src', 'pages', 'admin'))) {
        content = content.replace(/\.\.\/auth pages\/store\/useAuthStore/g, '../../store/useAuthStore');
        content = content.replace(/\.\.\/auth pages\/services/g, '../../services');
    }
    
    // In src/pages/bookings/*.jsx: "../auth pages/store/useAuthStore" -> "../../store/useAuthStore"
    if (file.includes(path.join('src', 'pages', 'bookings'))) {
        content = content.replace(/\.\.\/auth pages\/store\/useAuthStore/g, '../../store/useAuthStore');
    }

    // In src/pages/*.jsx: "./auth pages/store/useAuthStore" -> "../store/useAuthStore"
    if (file.includes(path.join('src', 'pages')) && !file.includes(path.join('src', 'pages', 'admin')) && !file.includes(path.join('src', 'pages', 'bookings')) && !file.includes(path.join('src', 'pages', 'auth'))) {
        content = content.replace(/\.\/auth pages\/store\/useAuthStore/g, '../store/useAuthStore');
    }

    // In src/pages/auth/*.jsx: "../auth pages/store/useAuthStore" -> "../../store/useAuthStore"
    if (file.includes(path.join('src', 'pages', 'auth'))) {
        content = content.replace(/\.\.\/\.\.\/pages\/auth pages\/store\/useAuthStore/g, '../../store/useAuthStore');
        content = content.replace(/\.\.\/store\/useAuthStore/g, '../../store/useAuthStore');
        content = content.replace(/\.\.\/services\/authApi/g, '../../services/authApi');
    }

    // Replace any remaining "auth pages/store" with relative path to store
    // This is just a fallback, but the above rules should cover everything.
    
    // 4. Update the path in AuthLayout if it has any, or any other imports
    content = content.replace(/\/auth pages\//g, '/auth/');
    content = content.replace(/\/admin pages\//g, '/admin/');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
