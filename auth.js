// Constants
const API_BASE_URL = 'http://localhost:8080';
const TOKEN_KEY = 'just_do_it_token';

// DOM Elements
const togglePasswordButtons = document.querySelectorAll('.toggle-password');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Password visibility toggle
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
        const input = button.previousElementSibling;
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        button.classList.toggle('fa-eye');
        button.classList.toggle('fa-eye-slash');
    });
});

// Token management
const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

// API calls
const handleResponse = async (response) => {
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    
    return data;
};

const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await handleResponse(response);
        setToken(data.token);
        return data;
    } catch (error) {
        throw new Error(error.message || 'Login failed');
    }
};

const register = async (name, email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await handleResponse(response);
        setToken(data.token);
        return data;
    } catch (error) {
        throw new Error(error.message || 'Registration failed');
    }
};

// Form handling
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await login(email, password);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            const result = await register(name, email, password);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

// Check authentication status
const checkAuth = () => {
    const token = getToken();
    const isAuthPage = window.location.pathname.includes('login.html') || 
                      window.location.pathname.includes('register.html');
    
    if (!token && !isAuthPage) {
        window.location.href = 'login.html';
    } else if (token && isAuthPage) {
        window.location.href = 'index.html';
    }
};

// Run auth check on page load
checkAuth();
