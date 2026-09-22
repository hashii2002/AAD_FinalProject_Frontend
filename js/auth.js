const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const errorMessage = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

if (togglePassword && passwordInput) {

    togglePassword.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.innerHTML =  '<i class="bi bi-eye-slash"></i>';

        } else {

            passwordInput.type = "password";

            togglePassword.innerHTML =  '<i class="bi bi-eye"></i>';
        }

    });

}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();
        const username = document.getElementById("username").value.trim();

        const password = passwordInput.value;

        if (errorMessage) {

            errorMessage.classList.add("d-none");

            errorMessage.textContent = "";
        }

        // VALIDATION
        if (!username || !password) {

            showError(  "Please enter your username and password." );

            return;
        }

        // LOADING STATE
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

                    headers: { "Content-Type": "application/json" },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );


            const data = await response.json();

            // RESPONSE ERROR
            if (!response.ok) {
                throw new Error( data.message || "Invalid username or password.");
            }


            // =================================================
            // GET LOGIN DATA
            // =================================================

            const token = data.body?.token;

            const userId = data.body?.userId;

            const loggedUsername = data.body?.username;

            const roleId = String(data.body?.role || "").trim();


            console.log("FULL LOGIN RESPONSE:",data);

            console.log( "ROLE ID FROM BACKEND:", roleId);

            if (!token) {
                throw new Error( "JWT token was not received from the server." );
            }

            // SAVE AUTHENTICATION INFORMATION

            localStorage.setItem( "accessToken", token);
            localStorage.setItem( "userId", userId);
            localStorage.setItem( "username", loggedUsername);

            let roleName;


            switch (roleId) {

                case "1":
                    roleName = "ADMIN";
                    break;

                case "2":
                    roleName = "FLEET_MANAGER";
                    break;

                case "3":
                    roleName = "DRIVER";
                    break;

                case "4":
                    roleName = "CUSTOMER";
                    break;

                default:
                    localStorage.clear();
                    showError( "Invalid user role. Please contact the administrator.");

                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.innerHTML = `
                            Sign In
                            <i class="bi bi-arrow-right ms-2"></i>
                        `;
                    }

                    return;
            }

            // SAVE ROLE NAME
            localStorage.setItem("role",roleName);
            console.log("ROLE NAME:", roleName);

            // REDIRECT USER ACCORDING TO ROLE
            switch (roleName) {

                case "ADMIN":
                    window.location.href = "pages/dashboard.html";
                    break;


                case "FLEET_MANAGER":
                    window.location.href = "pages/manager/fleet-manager-dashboard.html";
                    break;


                case "CUSTOMER":
                    window.location.href ="pages/customer/customer-dashboard.html";
                    break;


                case "DRIVER":
                    window.location.href ="pages/driver/driver-dashboard.html";
                    break;

                default:
                    localStorage.clear();
                    showError( "Invalid user role. Please contact the administrator.");

                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.innerHTML = `
                            Sign In
                            <i class="bi bi-arrow-right ms-2"></i>
                        `;
                    }

                    break;
            }


        } catch (error) {

            console.error("Login Error:", error );
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

// DISPLAY ERROR MESSAGE
function showError(message) {

    if (errorMessage) {

        errorMessage.textContent = message;

        errorMessage.classList.remove(
            "d-none"
        );
    }
}

// =====================================================
// LOGOUT FUNCTION
// =====================================================

function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    const currentPath = window.location.pathname;

    if (currentPath.includes("/customer/")) {

        window.location.href = "../../index.html";

    } else if (currentPath.includes("/manager/")) {

        window.location.href = "../../index.html";

    } else {

        window.location.href = "../index.html";

    }

}

// MOBILE SIDEBAR

function toggleSidebar() {

    const sidebar = document.querySelector(".sidebar");

    const overlay = document.querySelector(".sidebar-overlay");


    if (!sidebar) {
        return;
    }

    const isOpen = sidebar.classList.toggle("sidebar-open" );

    if (overlay) {
        overlay.classList.toggle("active",isOpen);
    }

}

// CLOSE MOBILE SIDEBAR

function closeSidebar() {

    const sidebar = document.querySelector(".sidebar");

    const overlay = document.querySelector(".sidebar-overlay");


    if (!sidebar) {

        return;
    }


    sidebar.classList.remove( "sidebar-open");


    if (overlay) {
        overlay.classList.remove( "active");
    }

}


// =====================================================
// MOBILE SIDEBAR EVENTS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const sidebar =
            document.querySelector(".sidebar");


        if (!sidebar) {

            return;
        }


        // =================================================
        // CLICK OUTSIDE SIDEBAR → CLOSE
        // =================================================

        document.addEventListener(
            "click",
            function (event) {

                if (window.innerWidth > 991) {

                    return;
                }


                const menuButton =
                    document.querySelector(
                        ".mobile-menu-btn"
                    );


                const clickedInsideSidebar =
                    sidebar.contains(
                        event.target
                    );


                const clickedMenuButton =
                    menuButton &&
                    menuButton.contains(
                        event.target
                    );


                if (
                    sidebar.classList.contains(
                        "sidebar-open"
                    ) &&
                    !clickedInsideSidebar &&
                    !clickedMenuButton
                ) {

                    closeSidebar();
                }

            }
        );


        // =================================================
        // CLICK MENU ITEM → CLOSE
        // =================================================

        const menuItems =
            sidebar.querySelectorAll(
                ".menu-item"
            );


        menuItems.forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        if (
                            window.innerWidth <= 991
                        ) {

                            closeSidebar();
                        }

                    }
                );

            }
        );


        // =================================================
        // CLICK LOGOUT → CLOSE
        // =================================================

        const logoutButton =
            sidebar.querySelector(
                ".logout-btn"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    if (
                        window.innerWidth <= 991
                    ) {

                        closeSidebar();
                    }

                }
            );
        }


        // =================================================
        // WINDOW RESIZE → CLOSE
        // =================================================

        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 991
                ) {

                    closeSidebar();
                }

            }
        );

    }
);


// =====================================================
// ROLE BASED PAGE ACCESS
// =====================================================

function checkRoleAccess(allowedRoles) {

    const token =
        localStorage.getItem(
            "accessToken"
        );

    const role =
        localStorage.getItem(
            "role"
        );


    // =================================================
    // NOT LOGGED IN
    // =================================================

    if (!token || !role) {

        window.location.href =
            "../index.html";

        return false;
    }


    // =================================================
    // ROLE NOT ALLOWED
    // =================================================

    if (!allowedRoles.includes(role)) {

        alert(
            "You do not have permission to access this page."
        );


        redirectByRole(
            role
        );


        return false;
    }


    return true;
}


// =====================================================
// ROLE BASED REDIRECT
// =====================================================

function redirectByRole(role) {

    switch (role) {

        case "ADMIN":
            window.location.href = "dashboard.html";
            break;

        case "FLEET_MANAGER":
            window.location.href ="manager/fleet-manager-dashboard.html";
            break;

        case "CUSTOMER":
            window.location.href ="customer/customer-dashboard.html";
            break;

        case "DRIVER":
            window.location.href = "driver/driver-dashboard.html";
            break;

        default:
            localStorage.clear();
            window.location.href = "../index.html";
    }
}