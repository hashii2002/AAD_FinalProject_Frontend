/* =====================================================
   USER MANAGEMENT
===================================================== */

let users = [];
let roles = [];

let editingUserId = null;

let userModal;


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    userModal = new bootstrap.Modal(
        document.getElementById("userModal")
    );

    loadUserInfo();

    await loadRoles();

    await loadUsers();

});


/* =====================================================
   LOAD USER INFO
===================================================== */

function loadUserInfo() {

    const username = localStorage.getItem("username") || "Admin";
    const role = localStorage.getItem("role") || "ADMIN";

    const avatar =
        username.charAt(0).toUpperCase();

    document.getElementById("sidebarUsername").textContent =
        username;

    document.getElementById("profileUsername").textContent =
        username;

    document.getElementById("sidebarAvatar").textContent =
        avatar;

    document.getElementById("profileAvatar").textContent =
        avatar;

    document.getElementById("sidebarRole").textContent =
        formatRole(role);

    document.getElementById("profileRole").textContent =
        formatRole(role);
}


/* =====================================================
   LOAD ROLES
===================================================== */

async function loadRoles() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/role/all`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (!response.ok) {

            if (response.status === 401 ||
                response.status === 403) {

                handleAuthError(response.status);

                return;
            }

            throw new Error("Failed to load roles");
        }

        const data = await response.json();

        roles = data.body || [];

        populateRoleSelect();
        populateRoleFilter();

    } catch (error) {

        console.error("Load roles error:", error);

        showToast(
            "Error",
            "Unable to load roles",
            false
        );
    }
}


/* =====================================================
   ROLE SELECT
===================================================== */

function populateRoleSelect() {

    const roleSelect =
        document.getElementById("roleId");

    roleSelect.innerHTML =
        `<option value="">Select role</option>`;

    roles.forEach(role => {

        const option =
            document.createElement("option");

        option.value = role.roleId;

        option.textContent =
            formatRole(role.roleName);

        roleSelect.appendChild(option);

    });
}


/* =====================================================
   ROLE FILTER
===================================================== */

function populateRoleFilter() {

    const filter =
        document.getElementById("roleFilter");

    filter.innerHTML =
        `<option value="">All Roles</option>`;

    roles.forEach(role => {

        const option =
            document.createElement("option");

        option.value = role.roleId;

        option.textContent =
            formatRole(role.roleName);

        filter.appendChild(option);

    });
}


/* =====================================================
   LOAD USERS
===================================================== */

async function loadUsers() {

    const tbody =
        document.getElementById("userTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                <div class="loading-state">
                    <div class="spinner-border"></div>
                    <span>Loading users...</span>
                </div>
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/user/all`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (!response.ok) {

            if (response.status === 401 ||
                response.status === 403) {

                handleAuthError(response.status);

                return;
            }

            throw new Error("Failed to load users");
        }

        const data = await response.json();

        users = data.body || [];

        updateSummary();

        renderUsers(users);

    } catch (error) {

        console.error("Load users error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    Unable to load users.
                </td>
            </tr>
        `;

        showToast(
            "Error",
            "Unable to load users",
            false
        );
    }
}


/* =====================================================
   RENDER USERS
===================================================== */

function renderUsers(userList) {

    const tbody =
        document.getElementById("userTableBody");

    tbody.innerHTML = "";

    if (!userList.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="loading-state">
                        <i class="bi bi-people"
                           style="font-size:30px;">
                        </i>

                        <span>
                            No users found
                        </span>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    userList.forEach((user, index) => {

        const row =
            document.createElement("tr");

        const role =
            getRoleById(user.roleId);

        const roleName =
            role ? role.roleName : "UNKNOWN";

        const fullName =
            `${user.firstName || ""} ${user.lastName || ""}`.trim();

        const initial =
            (user.username || "U")
                .charAt(0)
                .toUpperCase();


        row.innerHTML = `

            <td>
                ${index + 1}
            </td>


            <td>

                <div class="user-cell">

                    <div class="table-avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div class="user-name-box">

                        <span class="user-name">
                            ${escapeHtml(user.username)}
                        </span>

                        <span class="user-full-name">
                            ${escapeHtml(fullName)}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHtml(user.email || "-")}
            </td>


            <td>
                ${escapeHtml(user.phone || "-")}
            </td>


            <td>
                <span class="role-badge ${getRoleClass(roleName)}">
                    ${formatRole(roleName)}
                </span>
            </td>


            <td>

                <span class="status-badge
                    ${user.status === "ACTIVE"
                        ? "status-active"
                        : "status-inactive"}">

                    ${formatStatus(user.status)}

                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn action-edit"
                        onclick="editUser(${user.userId})"
                        title="Edit User">

                        <i class="bi bi-pencil-fill"></i>

                    </button>


                    ${
                        user.status === "ACTIVE"
                        ?
                        `
                        <button
                            class="action-btn action-delete"
                            onclick="deactivateUser(${user.userId})"
                            title="Deactivate User">

                            <i class="bi bi-person-x-fill"></i>

                        </button>
                        `
                        :
                        ""
                    }

                </div>

            </td>

        `;

        tbody.appendChild(row);

    });
}


/* =====================================================
   SUMMARY
===================================================== */

function updateSummary() {

    const total =
        users.length;

    const active =
        users.filter(
            user => user.status === "ACTIVE"
        ).length;

    const inactive =
        users.filter(
            user => user.status === "INACTIVE"
        ).length;

    const admins =
        users.filter(user => {

            const role =
                getRoleById(user.roleId);

            return role &&
                role.roleName === "ADMIN";

        }).length;


    document.getElementById("totalUsers")
        .textContent = total;

    document.getElementById("activeUsers")
        .textContent = active;

    document.getElementById("inactiveUsers")
        .textContent = inactive;

    document.getElementById("adminUsers")
        .textContent = admins;
}


/* =====================================================
   FILTER USERS
===================================================== */

function filterUsers() {

    const search =
        document.getElementById("searchUser")
            .value
            .trim()
            .toLowerCase();

    const role =
        document.getElementById("roleFilter")
            .value;

    const status =
        document.getElementById("statusFilter")
            .value;


    const filtered =
        users.filter(user => {

            const roleData =
                getRoleById(user.roleId);

            const roleName =
                roleData
                    ? roleData.roleName
                    : "";

            const fullName =
                `${user.firstName || ""} ${user.lastName || ""}`
                    .toLowerCase();


            const matchesSearch =
                !search ||
                (user.username || "")
                    .toLowerCase()
                    .includes(search) ||
                (user.email || "")
                    .toLowerCase()
                    .includes(search) ||
                fullName.includes(search);


            const matchesRole =
                !role ||
                String(user.roleId) === String(role);


            const matchesStatus =
                !status ||
                user.status === status;


            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );

        });


    renderUsers(filtered);
}


/* =====================================================
   OPEN ADD USER MODAL
===================================================== */

function openAddUserModal() {

    editingUserId = null;

    document.getElementById("userForm").reset();

    document.getElementById("userId").value = "";

    document.getElementById("status").value =
        "ACTIVE";


    document.getElementById("modalTitle")
        .textContent = "Add New User";

    document.getElementById("saveButtonText")
        .textContent = "Save User";

    document.getElementById("modalIcon").className =
        "bi bi-person-plus-fill";


    document.getElementById("password").required =
        true;

    document.getElementById("passwordRequired")
        .style.display = "inline";

    document.getElementById("passwordHelp")
        .textContent =
        "Password is required for new users";


    userModal.show();
}


/* =====================================================
   EDIT USER
===================================================== */

function editUser(userId) {

    const user =
        users.find(
            item => item.userId === userId
        );

    if (!user) {

        showToast(
            "Error",
            "User not found",
            false
        );

        return;
    }


    editingUserId = userId;


    document.getElementById("userId").value =
        user.userId;

    document.getElementById("username").value =
        user.username || "";

    document.getElementById("email").value =
        user.email || "";

    document.getElementById("password").value =
        "";

    document.getElementById("firstName").value =
        user.firstName || "";

    document.getElementById("lastName").value =
        user.lastName || "";

    document.getElementById("phone").value =
        user.phone || "";

    document.getElementById("roleId").value =
        user.roleId || "";

    document.getElementById("status").value =
        user.status || "ACTIVE";


    document.getElementById("modalTitle")
        .textContent = "Edit User";

    document.getElementById("saveButtonText")
        .textContent = "Update User";

    document.getElementById("modalIcon").className =
        "bi bi-person-gear";


    document.getElementById("password").required =
        false;

    document.getElementById("passwordRequired")
        .style.display = "none";

    document.getElementById("passwordHelp")
        .textContent =
        "Leave blank to keep the current password";


    userModal.show();
}


/* =====================================================
   SAVE USER
===================================================== */

async function saveUser() {

    const username =
        document.getElementById("username")
            .value
            .trim();

    const email =
        document.getElementById("email")
            .value
            .trim();

    const password =
        document.getElementById("password")
            .value;

    const firstName =
        document.getElementById("firstName")
            .value
            .trim();

    const lastName =
        document.getElementById("lastName")
            .value
            .trim();

    const phone =
        document.getElementById("phone")
            .value
            .trim();

    const roleId =
        document.getElementById("roleId")
            .value;

    const status =
        document.getElementById("status")
            .value;


    /* Required fields */

    if (!username ||
        !email ||
        !firstName ||
        !lastName ||
        !phone ||
        !roleId ||
        !status) {

        showToast(
            "Validation Error",
            "Please fill all required fields.",
            false
        );

        return;
    }


    /* Password only required for CREATE */

    if (!editingUserId && !password) {

        showToast(
            "Validation Error",
            "Password is required for a new user.",
            false
        );

        return;
    }


    if (password &&
        password.length < 8) {

        showToast(
            "Validation Error",
            "Password must be at least 8 characters.",
            false
        );

        return;
    }


    const userData = {

        roleId: Number(roleId),

        username: username,

        email: email,

        password:
            password || null,

        firstName: firstName,

        lastName: lastName,

        phone: phone,

        status: status

    };


    try {

        let url;
        let method;


        if (editingUserId) {

            url =
                `${API_BASE_URL}/v1/user/update`;

            method = "PUT";

            userData.userId =
                Number(editingUserId);

        } else {

            url =
                `${API_BASE_URL}/v1/user/save`;

            method = "POST";

        }


        const response =
            await fetch(
                url,
                {
                    method: method,

                    headers: {
                        ...getHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(userData)
                }
            );


        if (!response.ok) {

            if (response.status === 401 ||
                response.status === 403) {

                handleAuthError(response.status);

                return;
            }

            const errorData =
                await response.json()
                    .catch(() => null);

            throw new Error(
                errorData?.message ||
                "Operation failed"
            );
        }


        userModal.hide();


        showToast(
            "Success",
            editingUserId
                ? "User updated successfully."
                : "User created successfully.",
            true
        );


        await loadUsers();


    } catch (error) {

        console.error(
            "Save user error:",
            error
        );

        showToast(
            "Error",
            error.message ||
            "Unable to save user.",
            false
        );
    }
}


/* =====================================================
   DEACTIVATE USER
===================================================== */

async function deactivateUser(userId) {

    const user =
        users.find(
            item => item.userId === userId
        );

    if (!user) return;


    const confirmed =
        confirm(
            `Are you sure you want to deactivate "${user.username}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/user/${userId}`,
                {
                    method: "DELETE",

                    headers: getHeaders()
                }
            );


        if (!response.ok) {

            if (response.status === 401 ||
                response.status === 403) {

                handleAuthError(response.status);

                return;
            }

            const errorData =
                await response.json()
                    .catch(() => null);

            throw new Error(
                errorData?.message ||
                "Unable to deactivate user"
            );
        }


        showToast(
            "Success",
            "User deactivated successfully.",
            true
        );


        await loadUsers();


    } catch (error) {

        console.error(
            "Deactivate user error:",
            error
        );

        showToast(
            "Error",
            error.message ||
            "Unable to deactivate user.",
            false
        );
    }
}


/* =====================================================
   PASSWORD TOGGLE
===================================================== */

function toggleUserPassword() {

    const input =
        document.getElementById("password");

    const icon =
        document.getElementById("passwordIcon");


    if (input.type === "password") {

        input.type = "text";

        icon.className =
            "bi bi-eye-slash";

    } else {

        input.type = "password";

        icon.className =
            "bi bi-eye";

    }
}


/* =====================================================
   GET ROLE
===================================================== */

function getRoleById(roleId) {

    return roles.find(
        role =>
            String(role.roleId) ===
            String(roleId)
    );
}


/* =====================================================
   ROLE CLASS
===================================================== */

function getRoleClass(roleName) {

    switch (roleName) {

        case "ADMIN":
            return "role-admin";

        case "FLEET_MANAGER":
            return "role-fleet";

        case "CUSTOMER":
            return "role-customer";

        case "DRIVER":
            return "role-driver";

        default:
            return "";
    }
}


/* =====================================================
   FORMAT ROLE
===================================================== */

function formatRole(role) {

    if (!role) {
        return "-";
    }

    return role
        .replaceAll("_", " ")
        .replace(
            /\w\S*/g,
            word =>
                word.charAt(0).toUpperCase() +
                word.substring(1).toLowerCase()
        );
}


/* =====================================================
   FORMAT STATUS
===================================================== */

function formatStatus(status) {

    if (status === "ACTIVE") {
        return "Active";
    }

    if (status === "INACTIVE") {
        return "Inactive";
    }

    return status || "-";
}


/* =====================================================
   HEADERS
===================================================== */

function getHeaders() {

    const token =
        localStorage.getItem("accessToken");

    return {

        "Authorization":
            `Bearer ${token}`,

        "Accept":
            "application/json"

    };
}


/* =====================================================
   AUTH ERROR
===================================================== */

function handleAuthError(status) {

    if (status === 401) {

        alert(
            "Your session has expired. Please login again."
        );

        localStorage.clear();

        window.location.href =
            "../index.html";

        return;
    }


    if (status === 403) {

        alert(
            "You do not have permission to access User Management."
        );
    }
}

/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href =
        "../index.html";
}


/* =====================================================
   TOAST
===================================================== */

function showToast(
    title,
    message,
    success = true
) {

    const toastElement =
        document.getElementById("userToast");

    const toast =
        bootstrap.Toast.getOrCreateInstance(
            toastElement,
            {
                delay: 3000
            }
        );


    document.getElementById("toastTitle")
        .textContent = title;

    document.getElementById("toastMessage")
        .textContent = message;


    const icon =
        document.getElementById("toastIcon");

    if (success) {

        icon.innerHTML =
            `<i class="bi bi-check-lg"></i>`;

        icon.style.background =
            "#e8f8ef";

        icon.style.color =
            "#19a35f";

    } else {

        icon.innerHTML =
            `<i class="bi bi-x-lg"></i>`;

        icon.style.background =
            "#fff0f0";

        icon.style.color =
            "#e54848";
    }


    toast.show();
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}