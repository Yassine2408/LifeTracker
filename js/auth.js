// auth.js - Handles authentication functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if we're on the register page
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Check if user is already logged in
    checkAuthState();
});

async function checkAuthState() {
    const user = await checkUser();
    
    // If user is logged in and we're on an auth page, redirect to app
    if (user) {
        const currentPath = window.location.pathname;
        if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
            window.location.href = 'index.html';
        }
    } else {
        // If user is not logged in and we're on the app page, redirect to login
        const currentPath = window.location.pathname;
        if (currentPath.includes('index.html') || currentPath === '/') {
            window.location.href = 'login.html';
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Disable form
    toggleFormState(false);
    
    // Sign in user
    const result = await signIn(email, password);
    
    if (result.success) {
        // Redirect to app
        window.location.href = 'index.html';
    } else {
        // Show error
        showError(result.error);
        toggleFormState(true);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Disable form
    toggleFormState(false);
    
    // Register user
    const result = await signUp(email, password, fullName);
    
    if (result.success) {
        // Show success message and redirect to login
        alert('Registration successful! Please check your email to confirm your account.');
        window.location.href = 'login.html';
    } else {
        // Show error
        showError(result.error);
        toggleFormState(true);
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function toggleFormState(enabled) {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input');
    const button = form.querySelector('button');
    
    inputs.forEach(input => {
        input.disabled = !enabled;
    });
    
    button.disabled = !enabled;
    
    if (!enabled) {
        button.textContent = 'Please wait...';
    } else {
        button.textContent = form.id === 'login-form' ? 'Login' : 'Register';
    }
} 