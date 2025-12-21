// Get token from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Display token info if present
if (token) {
    document.getElementById('tokenDisplay').textContent = token.substring(0, 8) + '...';
    document.getElementById('tokenInfo').style.display = 'block';
} else {
    showAlert('error', 'Invalid reset link. Please request a new password reset.');
    document.getElementById('resetForm').style.display = 'none';
}

// Password validation
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const resetBtn = document.getElementById('resetBtn');

function validatePassword() {
    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Check requirements
    const requirements = {
        'req-length': password.length >= 8,
        'req-lowercase': /[a-z]/.test(password),
        'req-uppercase': /[A-Z]/.test(password),
        'req-number': /[0-9]/.test(password),
        'req-special': /[!@#$%^&*]/.test(password),
        'req-match': password === confirmPassword && password.length > 0
    };

    // Update UI for each requirement
    Object.keys(requirements).forEach(reqId => {
        const element = document.getElementById(reqId);
        if (requirements[reqId]) {
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
        }
    });

    // Enable/disable submit button
    const allValid = Object.values(requirements).every(valid => valid);
    resetBtn.disabled = !allValid;

    return allValid;
}

newPasswordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePassword);

// Form submission
document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
        showAlert('error', 'Please ensure all password requirements are met.');
        return;
    }

    if (!token) {
        showAlert('error', 'Invalid reset token. Please request a new password reset.');
        return;
    }

    const newPassword = newPasswordInput.value;

    // Show loading
    document.getElementById('loading').style.display = 'block';
    resetBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/password-reset/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showAlert('success', 'Password reset successfully! You can now login with your new password.');
            document.getElementById('resetForm').style.display = 'none';
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/api/auth/login';
            }, 3000);
        } else {
            throw new Error(result.error || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Reset error:', error);
        showAlert('error', error.message || 'Failed to reset password. Please try again.');
        
        if (error.message.includes('expired')) {
            document.getElementById('tokenInfo').className = 'token-info token-expired';
            document.getElementById('resetForm').style.display = 'none';
        }
    } finally {
        document.getElementById('loading').style.display = 'none';
        resetBtn.disabled = false;
    }
});

function showAlert(type, message) {
    const alert = document.getElementById('alert');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alert.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
}

// Check if token is expired on page load
if (token) {
    // You could add a token validation endpoint here
    // For now, we'll let the form submission handle validation
}