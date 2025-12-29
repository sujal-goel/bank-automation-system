const API_BASE = 'http://localhost:3000';

function showTab(tabName, event) {
    // Hide all form sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected form section
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function showResponse(elementId, message, isSuccess) {
    const responseEl = document.getElementById(elementId);
    responseEl.textContent = message;
    responseEl.className = `response ${isSuccess ? 'success' : 'error'}`;
    responseEl.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        responseEl.style.display = 'none';
    }, 10000);
}

function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (key.includes('.')) {
            const keys = key.split('.');
            if (!data[keys[0]]) data[keys[0]] = {};
            data[keys[0]][keys[1]] = value;
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

async function submitForm(endpoint, data, responseElementId, token = null) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            showResponse(responseElementId, result.message, true);
            if (result.verificationToken) {
                showResponse(responseElementId, 
                    result.message + `\n\nVerification Token: ${result.verificationToken}\n(In production, this would be sent via email)`, 
                    true
                );
            }
        } else {
            showResponse(responseElementId, result.error || 'An error occurred', false);
        }
    } catch (error) {
        showResponse(responseElementId, `Network error: ${error.message}`, false);
    }
}

async function loginAsAdmin() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@bank.com',
                password: 'Admin@123'
            })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            document.getElementById('adminToken').value = result.token;
            showResponse('adminResponse', 'Admin login successful! Token has been filled automatically.', true);
        } else {
            showResponse('adminResponse', result.error || 'Login failed', false);
        }
    } catch (error) {
        showResponse('adminResponse', `Login error: ${error.message}`, false);
    }
}

// Password validation
function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    
    return minLength && hasLower && hasUpper && hasNumber && hasSpecial;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName, e);
        });
    });

    // Admin login button
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', loginAsAdmin);
    }

    // Form submissions
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = getFormData(e.target);
            await submitForm('/api/auth/signup/customer', data, 'customerResponse');
        });
    }

    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = getFormData(e.target);
            await submitForm('/api/auth/signup/employee', data, 'employeeResponse');
        });
    }

    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = getFormData(e.target);
            const token = document.getElementById('adminToken').value;
            
            if (!token) {
                showResponse('adminResponse', 'Please login as admin first to get a token', false);
                return;
            }
            
            await submitForm('/api/auth/signup/admin', data, 'adminResponse', token);
        });
    }

    // Add password validation feedback
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.name === 'password') {
            input.addEventListener('input', (e) => {
                const isValid = validatePassword(e.target.value);
                e.target.style.borderColor = isValid ? '#28a745' : '#dc3545';
            });
        }
    });
});