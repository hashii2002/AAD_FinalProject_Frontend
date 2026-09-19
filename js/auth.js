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

            console.log("FULL LOGIN RESPONSE:", data);
            console.log("ROLE FROM BACKEND:", data.body?.role);

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

            // Redirect user according to role
            switch (String(role)) {

                case "1":
                    window.location.href = "pages/dashboard.html";
                    break;

                case "2":
                    window.location.href = "pages/fleet-manager-dashboard.html";
                    break;

                case "4":
                    window.location.href = "pages/customer-dashboard.html";
                    break;

                case "3":
                    window.location.href = "pages/driver-dashboard.html";
                    break;

                default:
                    localStorage.clear();
                    showError("Invalid user role. Please contact the administrator.");

                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.innerHTML = `
                            Sign In
                            <i class="bi bi-arrow-right ms-2"></i>
                        `;
                    }
            }

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

/* =====================================================
   MOBILE SIDEBAR
===================================================== */

function toggleSidebar() {

    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!sidebar) {
        return;
    }

    const isOpen = sidebar.classList.toggle("sidebar-open");

    // Overlay show / hide
    if (overlay) {
        overlay.classList.toggle("active", isOpen);
    }

}


/* =====================================================
   CLOSE MOBILE SIDEBAR
===================================================== */

function closeSidebar() {

    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!sidebar) {
        return;
    }

    sidebar.classList.remove("sidebar-open");

    if (overlay) {
        overlay.classList.remove("active");
    }

}

/* =====================================================
   MOBILE SIDEBAR EVENTS
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        return;
    }


    /* =================================================
       1. CLICK OUTSIDE SIDEBAR → CLOSE
    ================================================= */

    document.addEventListener("click", function (event) {

        if (window.innerWidth > 991) {
            return;
        }

        const menuButton = document.querySelector(".mobile-menu-btn");

        const clickedInsideSidebar =
            sidebar.contains(event.target);

        const clickedMenuButton =
            menuButton && menuButton.contains(event.target);

        if (
            sidebar.classList.contains("sidebar-open") &&
            !clickedInsideSidebar &&
            !clickedMenuButton
        ) {
            closeSidebar();
        }

    });


    /* =================================================
       2. CLICK MENU ITEM → CLOSE
    ================================================= */

    const menuItems =
        sidebar.querySelectorAll(".menu-item");

    menuItems.forEach(function (item) {

        item.addEventListener("click", function () {

            if (window.innerWidth <= 991) {
                closeSidebar();
            }

        });

    });


    /* =================================================
       3. CLICK LOGOUT → CLOSE
    ================================================= */

    const logoutButton =
        sidebar.querySelector(".logout-btn");

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            if (window.innerWidth <= 991) {
                closeSidebar();
            }

        });

    }


    /* =================================================
       4. WINDOW RESIZE → CLOSE
    ================================================= */

    window.addEventListener("resize", function () {

        if (window.innerWidth > 991) {
            closeSidebar();
        }

    });

});

/* =====================================================
   ROLE BASED PAGE ACCESS
===================================================== */

function checkRoleAccess(allowedRoles) {

    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token || !role) {
        window.location.href = "../index.html";
        return false;
    }

    if (!allowedRoles.includes(role)) {

        alert("You do not have permission to access this page.");

        redirectByRole(role);

        return false;
    }

    return true;
}


/* =====================================================
   ROLE BASED REDIRECT
===================================================== */

function redirectByRole(role) {

    switch (role) {

        case "ADMIN":
            window.location.href = "dashboard.html";
            break;

        case "FLEET_MANAGER":
            window.location.href = "fleet-manager-dashboard.html";
            break;

        case "CUSTOMER":
            window.location.href = "customer-dashboard.html";
            break;

        case "DRIVER":
            window.location.href = "driver-dashboard.html";
            break;

        default:
            localStorage.clear();
            window.location.href = "../index.html";
    }
}