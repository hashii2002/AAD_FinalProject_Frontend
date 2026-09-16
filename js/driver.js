/* =====================================================
   DRIVER MANAGEMENT
===================================================== */

let drivers = [];
let users = [];

let editingDriverId = null;


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadAdminProfile();

    loadUsers();

    loadDrivers();

});


/* =====================================================
   GET TOKEN
===================================================== */

function getToken() {

    return localStorage.getItem("accessToken");

}


/* =====================================================
   COMMON HEADERS
===================================================== */

function getHeaders() {

    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
    };

}


/* =====================================================
   LOAD ADMIN PROFILE
===================================================== */

function loadAdminProfile() {

    const username =
        localStorage.getItem("username") || "Admin";

    const role =
        localStorage.getItem("role") || "Administrator";


    const avatar =
        username.charAt(0).toUpperCase();


    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const sidebarRole =
        document.getElementById("sidebarRole");


    const profileAvatar =
        document.getElementById("profileAvatar");

    const profileUsername =
        document.getElementById("profileUsername");

    const profileRole =
        document.getElementById("profileRole");


    if (sidebarAvatar) {
        sidebarAvatar.textContent = avatar;
    }

    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (sidebarRole) {
        sidebarRole.textContent =
            formatRole(role);
    }

    if (profileAvatar) {
        profileAvatar.textContent = avatar;
    }

    if (profileUsername) {
        profileUsername.textContent = username;
    }

    if (profileRole) {
        profileRole.textContent =
            formatRole(role);
    }

}


/* =====================================================
   FORMAT ROLE
===================================================== */

function formatRole(role) {

    if (!role) {
        return "Administrator";
    }

    if (role === "ADMIN") {
        return "Administrator";
    }

    if (role === "FLEET_MANAGER") {
        return "Fleet Manager";
    }

    return role.replaceAll("_", " ");

}


/* =====================================================
   LOAD USERS
===================================================== */

async function loadUsers() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/user/all`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load users"
            );

        }


        const result = await response.json();


        users =
            Array.isArray(result.body)
                ? result.body
                : [];


        populateUserSelect();


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );

        showToast(
            "Unable to load users",
            "error"
        );

    }

}


/* =====================================================
   POPULATE USER SELECT
===================================================== */

function populateUserSelect() {

    const select =
        document.getElementById("userId");


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select User</option>`;


    users.forEach(function (user) {

        const option =
            document.createElement("option");


        option.value =
            user.userId;


        const firstName =
            user.firstName || "";


        const lastName =
            user.lastName || "";


        const username =
            user.username || "User";


        const fullName =
            `${firstName} ${lastName}`.trim();


        let displayName =
            fullName
                ? `${fullName} (@${username})`
                : `@${username}`;


        option.textContent =
            `${displayName} - ID ${user.userId}`;


        select.appendChild(option);

    });

}


/* =====================================================
   LOAD DRIVERS
===================================================== */

async function loadDrivers() {

    const tableBody =
        document.getElementById("driverTableBody");


    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-cell">
                <div class="spinner-border spinner-border-sm"></div>
                Loading drivers...
            </td>
        </tr>
    `;


    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/driver/all`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );


        if (!response.ok) {

            if (response.status === 401) {

                showToast(
                    "Session expired. Please login again.",
                    "error"
                );

                return;
            }


            if (response.status === 403) {

                showToast(
                    "You do not have permission to view drivers.",
                    "error"
                );

                return;
            }


            throw new Error(
                "Unable to load drivers"
            );

        }


        const result =
            await response.json();


        drivers =
            Array.isArray(result.body)
                ? result.body
                : [];

        console.log("Driver API Response:", result.body);


        updateSummary();

        renderDrivers(drivers);


    } catch (error) {

        console.error(
            "Load drivers error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Unable to load drivers.
                </td>
            </tr>
        `;


        showToast(
            "Unable to load drivers",
            "error"
        );

    }

}


/* =====================================================
   RENDER DRIVERS
===================================================== */

function renderDrivers(driverList) {

    const tableBody =
        document.getElementById("driverTableBody");

    const emptyState =
        document.getElementById("emptyState");


    tableBody.innerHTML = "";


    if (!driverList || driverList.length === 0) {

        emptyState.classList.remove("d-none");

        return;

    }


    emptyState.classList.add("d-none");


    driverList.forEach(function (driver, index) {

        const row =
            document.createElement("tr");


        const user =
            findUserById(driver.userId);


        const username =
            user
                ? user.username
                : `User #${driver.driverId}`;


        const firstName =
            user?.firstName || "";


        const lastName =
            user?.lastName || "";


        const fullName =
            `${firstName} ${lastName}`.trim();


        const driverName =
            fullName || username;


        const initial =
            driverName
                .charAt(0)
                .toUpperCase();


        row.innerHTML = `

            <td>
                ${index + 1}
            </td>


            <td>

                <div class="driver-cell">

                    <div class="driver-avatar">
                        ${escapeHtml(initial)}
                    </div>


                    <div class="driver-name">

                        <strong>
                            ${escapeHtml(driverName)}
                        </strong>

                        <small>
                            @${escapeHtml(username)}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <span>
                    #${driver.userId}
                </span>

            </td>


            <td>

                <span class="license-number">
                    ${escapeHtml(driver.licenseNo || "-")}
                </span>

            </td>


            <td>

                ${statusBadge(driver.status)}

            </td>


            <td>

                <div class="action-buttons">

                    <button
                            class="action-btn edit"
                            onclick="editDriver(${driver.driverId})"
                            title="Edit Driver">

                        <i class="bi bi-pencil-fill"></i>

                    </button>


                    <button
                            class="action-btn delete"
                            onclick="deleteDriver(${driver.driverId})"
                            title="Delete Driver">

                        <i class="bi bi-trash-fill"></i>

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


/* =====================================================
   FIND USER
===================================================== */

function findUserById(userId) {

    return users.find(
        user => Number(user.userId) === Number(userId)
    );

}


/* =====================================================
   UPDATE SUMMARY
===================================================== */

function updateSummary() {

    const total =
        drivers.length;


    const available =
        drivers.filter(
            driver => driver.status === "AVAILABLE"
        ).length;


    const onTrip =
        drivers.filter(
            driver => driver.status === "ON_TRIP"
        ).length;


    const inactive =
        drivers.filter(
            driver =>
                driver.status === "INACTIVE" ||
                driver.status === "OFF_DUTY"
        ).length;


    document.getElementById("totalDrivers")
        .textContent = total;


    document.getElementById("availableDrivers")
        .textContent = available;


    document.getElementById("onTripDrivers")
        .textContent = onTrip;


    document.getElementById("inactiveDrivers")
        .textContent = inactive;

}

/* =====================================================
   FILTER DRIVERS
===================================================== */

function filterDrivers() {

    const searchElement =
        document.getElementById("searchInput");

    const statusElement =
        document.getElementById("statusFilter");


    let search =
        searchElement.value
            .trim()
            .toLowerCase();


    const status =
        statusElement.value;


    // Remove # if user searches like #1
    search =
        search.replace(/^#/, "");


    const filtered =
        drivers.filter(function (driver) {

            // Driver ID
            const driverId =
                String(driver.driverId ?? "")
                    .toLowerCase();


            // User ID
            const userId =
                String(driver.userId ?? "")
                    .toLowerCase();


            // License Number
            const licenseNo =
                String(driver.licenseNo ?? "")
                    .toLowerCase();


            // Find User
            const user =
                findUserById(driver.userId);


            const firstName =
                String(user?.firstName ?? "")
                    .toLowerCase();


            const lastName =
                String(user?.lastName ?? "")
                    .toLowerCase();


            const username =
                String(user?.username ?? "")
                    .toLowerCase();


            const fullName =
                `${firstName} ${lastName}`.trim();


            // Search
            const matchesSearch =
                search === "" ||

                driverId.includes(search) ||

                userId.includes(search) ||

                licenseNo.includes(search) ||

                firstName.includes(search) ||

                lastName.includes(search) ||

                fullName.includes(search) ||

                username.includes(search);


            // Status
            const matchesStatus =
                status === "" ||
                driver.status === status;


            return matchesSearch && matchesStatus;

        });


    console.log("Search:", search);
    console.log("Filtered Drivers:", filtered);


    renderDrivers(filtered);

}

/* =====================================================
   CLEAR FILTERS
===================================================== */

function clearFilters() {

    document.getElementById("searchInput")
        .value = "";


    document.getElementById("statusFilter")
        .value = "";


    renderDrivers(drivers);

}


/* =====================================================
   OPEN ADD MODAL
===================================================== */

function openAddDriverModal() {

    editingDriverId = null;


    document.getElementById("driverForm")
        .reset();


    document.getElementById("driverId")
        .value = "";


    document.getElementById("driverModalTitle")
        .textContent = "Add Driver";


    document.getElementById("saveDriverText")
        .textContent = "Save Driver";


    populateUserSelect();

}


/* =====================================================
   EDIT DRIVER
===================================================== */

async function editDriver(driverId) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/driver/select/${driverId}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load driver"
            );

        }


        const result =
            await response.json();


        const driver =
            result.body;


        if (!driver) {

            throw new Error(
                "Driver data not found"
            );

        }


        editingDriverId =
            driver.driverId;


        document.getElementById("driverId")
            .value = driver.driverId;


        document.getElementById("userId")
            .value = driver.userId;


        document.getElementById("licenseNo")
            .value = driver.licenseNo || "";


        document.getElementById("driverStatus")
            .value = driver.status || "";


        document.getElementById("driverModalTitle")
            .textContent = "Edit Driver";


        document.getElementById("saveDriverText")
            .textContent = "Update Driver";


        const modalElement =
            document.getElementById("driverModal");


        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );


        modal.show();


    } catch (error) {

        console.error(
            "Edit driver error:",
            error
        );


        showToast(
            "Unable to load driver details",
            "error"
        );

    }

}


/* =====================================================
   SAVE / UPDATE DRIVER
===================================================== */

async function saveDriver() {

    const userId =
        document.getElementById("userId")
            .value;


    const licenseNo =
        document.getElementById("licenseNo")
            .value
            .trim();


    const status =
        document.getElementById("driverStatus")
            .value;


    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (!userId) {

        showToast(
            "Please select a user.",
            "error"
        );

        return;

    }


    if (!licenseNo) {

        showToast(
            "License number is required.",
            "error"
        );

        return;

    }


    if (!status) {

        showToast(
            "Please select driver status.",
            "error"
        );

        return;

    }


    const driverData = {

        userId: Number(userId),

        licenseNo: licenseNo,

        status: status

    };


    const isEdit =
        editingDriverId !== null;


    const url =
        isEdit
            ? `${API_BASE_URL}/v1/driver/update`
            : `${API_BASE_URL}/v1/driver/save`;


    const method =
        isEdit
            ? "PUT"
            : "POST";


    if (isEdit) {

        driverData.driverId =
            Number(editingDriverId);

    }


    const saveButton =
        document.querySelector(".save-driver-btn");


    saveButton.disabled = true;


    document.getElementById("saveDriverText")
        .textContent =
            isEdit
                ? "Updating..."
                : "Saving...";


    try {

        const response =
            await fetch(
                url,
                {
                    method: method,

                    headers: getHeaders(),

                    body: JSON.stringify(driverData)
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            const message =
                result.message ||
                "Driver operation failed";


            throw new Error(message);

        }


        const modalElement =
            document.getElementById("driverModal");


        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }


        showToast(
            isEdit
                ? "Driver updated successfully."
                : "Driver saved successfully.",
            "success"
        );


        await loadDrivers();


        document.getElementById("driverForm")
            .reset();


        editingDriverId = null;


    } catch (error) {

        console.error(
            "Save driver error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save driver.",
            "error"
        );

    } finally {

        saveButton.disabled = false;


        document.getElementById("saveDriverText")
            .textContent =
                editingDriverId !== null
                    ? "Update Driver"
                    : "Save Driver";

    }

}


/* =====================================================
   DELETE DRIVER
===================================================== */

async function deleteDriver(driverId) {

    const driver =
        drivers.find(
            item =>
                Number(item.driverId) ===
                Number(driverId)
        );


    if (!driver) {
        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to delete driver #${driverId}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/driver/${driverId}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to delete driver"
            );

        }


        showToast(
            "Driver deleted successfully.",
            "success"
        );


        await loadDrivers();


    } catch (error) {

        console.error(
            "Delete driver error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete driver.",
            "error"
        );

    }

}


/* =====================================================
   STATUS BADGE
===================================================== */

function statusBadge(status) {

    const safeStatus =
        status || "UNKNOWN";


    let cssClass =
        "off-duty";


    if (safeStatus === "AVAILABLE") {
        cssClass = "available";
    }

    else if (safeStatus === "ON_TRIP") {
        cssClass = "on-trip";
    }

    else if (safeStatus === "OFF_DUTY") {
        cssClass = "off-duty";
    }

    else if (safeStatus === "INACTIVE") {
        cssClass = "inactive";
    }


    const label =
        formatStatus(safeStatus);


    return `
        <span class="driver-status ${cssClass}">
            ${escapeHtml(label)}
        </span>
    `;

}


/* =====================================================
   FORMAT STATUS
===================================================== */

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message, type = "success") {

    const toastElement =
        document.getElementById("driverToast");


    const toastMessage =
        document.getElementById("toastMessage");


    const toastIcon =
        document.getElementById("toastIcon");


    toastMessage.textContent =
        message;


    if (type === "error") {

        toastIcon.className =
            "bi bi-exclamation-circle-fill";

        toastIcon.style.color =
            "#ff6b81";

    } else {

        toastIcon.className =
            "bi bi-check-circle-fill";

        toastIcon.style.color =
            "#65d79a";

    }


    const toast =
        bootstrap.Toast.getOrCreateInstance(
            toastElement,
            {
                delay: 3000
            }
        );


    toast.show();

}