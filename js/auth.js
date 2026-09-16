const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const errorMessage = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

// Show / Hide Password
if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            passwordInput.type = "password";
            togglePassword.innerHTML = '<i class="bi bi-eye"></i>';
        }
    });
}

// Login (Check if loginForm exists before adding Event Listener)
if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = passwordInput.value;

        // Clear previous error
        if (errorMessage) {
            errorMessage.classList.add("d-none");
            errorMessage.textContent = "";
        }

        // Validation
        if (!username || !password) {
            showError("Please enter your username and password.");
            return;
        }

        // Loading state
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Signing in...
            `;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/v1/user/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid username or password."
                );
            }

            const token = data.body?.token;
            const userId = data.body?.userId;
            const loggedUsername = data.body?.username;
            const role = data.body?.role;

            if (!token) {
                throw new Error(
                    "JWT token was not received from the server."
                );
            }

            // Save authentication information
            localStorage.setItem("accessToken", token);
            localStorage.setItem("userId", userId);
            localStorage.setItem("username", loggedUsername);
            localStorage.setItem("role", role);

            // Redirect to Dashboard
            window.location.href = "pages/dashboard.html";

        } catch (error) {
            console.error("Login Error:", error);
            showError(error.message);

            if (loginButton) {
                loginButton.disabled = false;
                loginButton.innerHTML = `
                    Sign In
                    <i class="bi bi-arrow-right ms-2"></i>
                `;
            }
        }
    });
}

// Display error message
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove("d-none");
    }
}

// Logout Function
function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    // Root directory path redirect
    window.location.href = "../index.html";
}