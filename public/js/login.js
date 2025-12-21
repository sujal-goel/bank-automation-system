// User type tabs functionality
const userTypeTabs = document.querySelectorAll('.user-type-tab');
const demoAccounts = document.getElementById('demoAccounts');

userTypeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        userTypeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update demo accounts based on user type
        updateDemoAccounts(tab.dataset.type);
    });
});

function updateDemoAccounts(userType) {
    const demoAccountsData = {
        customer: [
            { email: 'customer@example.com', password: 'Customer@123', label: 'Customer' },
            { email: 'john.doe@example.com', password: 'JohnDoe@123', label: 'Customer (John)' }
        ],
        employee: [
            { email: 'employee@bank.com', password: 'Employee@123', label: 'Bank Officer' },
            { email: 'manager@bank.com', password: 'Manager@123', label: 'Branch Manager' }
        ],
        admin: [
            { email: 'admin@bank.com', password: 'Admin@123', label: 'System Admin' },
            { email: 'superadmin@bank.com', password: 'SuperAdmin@123', label: 'Super Admin' }
        ]
    };

    const accounts = demoAccountsData[userType] || demoAccountsData.customer;
    const accountsHtml = accounts.map(account => 
        `<div class="demo-account" data-email="${account.email}" data-password="${account.password}">
            <strong>${account.label}:</strong> ${account.email} / ${account.password}
        </div>`
    ).join('');

    demoAccounts.innerHTML = `
        <h4>Demo Accounts (Development Mode)</h4>
        ${accountsHtml}
    `;

    // Re-attach click handlers for demo accounts
    attachDemoAccountHandlers();
}

function attachDemoAccountHandlers() {
    const demoAccountElements = document.querySelectorAll('.demo-account');
    demoAccountElements.forEach(account => {
        account.addEventListener('click', () => {
            const email = account.dataset.email;
            const password = account.dataset.password;
            
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            
            showAlert('info', 'Demo credentials filled. Click "Sign In" to login.');
        });
    });
}

// Initialize demo account handlers
document.addEventListener('DOMContentLoaded', () => {
    attachDemoAccountHandlers();
});

// Password toggle functionality
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
}

// Form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showAlert('error', 'Please enter both email and password.');
        return;
    }

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loginBtn').disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Store token
            if (rememberMe) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
            } else {
                sessionStorage.setItem('authToken', result.token);
                sessionStorage.setItem('user', JSON.stringify(result.user));
            }

            showAlert('success', `Welcome back, ${result.user.firstName}! Redirecting to dashboard...`);
            
            // Redirect based on user role
            setTimeout(() => {
                redirectToDashboard(result.user.role);
            }, 2000);
        } else {
            throw new Error(result.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('error', error.message || 'Login failed. Please check your credentials and try again.');
        
        // Handle specific error cases
        if (error.message.includes('pending_verification')) {
            showAlert('info', 'Please verify your email address before logging in. Check your inbox for the verification link.');
        } else if (error.message.includes('pending_approval')) {
            showAlert('info', 'Your account is pending admin approval. Please wait for approval or contact support.');
        } else if (error.message.includes('suspended') || error.message.includes('inactive')) {
            showAlert('error', 'Your account has been suspended or deactivated. Please contact support for assistance.');
        }
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loginBtn').disabled = false;
    }
});

function redirectToDashboard(role) {
    // Redirect based on user role
    const dashboardUrls = {
        'customer': '/dashboard/customer',
        'employee': '/dashboard/employee',
        'bank_officer': '/dashboard/employee',
        'senior_bank_officer': '/dashboard/employee',
        'branch_manager': '/dashboard/manager',
        'compliance_officer': '/dashboard/compliance',
        'senior_compliance_officer': '/dashboard/compliance',
        'compliance_manager': '/dashboard/compliance',
        'risk_analyst': '/dashboard/risk',
        'risk_manager': '/dashboard/risk',
        'system_admin': '/dashboard/admin',
        'developer': '/dashboard/admin',
        'it_manager': '/dashboard/admin',
        'department_admin': '/dashboard/admin',
        'admin': '/dashboard/admin',
        'super_admin': '/dashboard/admin'
    };

    const dashboardUrl = dashboardUrls[role] || '/dashboard';
    
    // For now, redirect to signup demo since dashboards aren't implemented yet
    window.location.href = '/api/auth/profile';
}

function showAlert(type, message) {
    const alert = document.getElementById('alert');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alert.style.display = 'block';
    
    // Auto-hide success and info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const existingToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (existingToken) {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (user.firstName) {
            showAlert('info', `You are already logged in as ${user.firstName}. Redirecting...`);
            setTimeout(() => {
                redirectToDashboard(user.role);
            }, 2000);
        }
    }

    // Handle URL parameters for messages
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const messageType = urlParams.get('type') || 'info';

    if (message) {
        showAlert(messageType, decodeURIComponent(message));
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
});