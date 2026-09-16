/* =========================================================
   CUSTOMER MANAGEMENT
========================================================= */

let customers = [];
let users = [];

let customerModal;
let viewCustomerModal;
let deleteCustomerModal;

let currentCustomerId = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    if (typeof loadUserInfo === "function") {
        loadUserInfo();
    }

    customerModal =
        new bootstrap.Modal(document.getElementById("customerModal"));

    viewCustomerModal =
        new bootstrap.Modal(document.getElementById("viewCustomerModal"));

    deleteCustomerModal =
        new bootstrap.Modal(document.getElementById("deleteCustomerModal"));

    await loadUsers();
    await loadCustomers();

});


/* =========================================================
   GET TOKEN
========================================================= */

function getToken() {

    return localStorage.getItem("accessToken");

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(url, options = {}) {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const response = await fetch(
        API_BASE_URL + url,
        {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (response.status === 401) {

        showToast(
            "Authentication Error",
            "Your session has expired. Please login again.",
            true
        );

        setTimeout(() => {

            if (typeof logout === "function") {
                logout();
            }

        }, 1200);

        throw new Error("Unauthorized");

    }

    if (!response.ok) {

        let message = "Something went wrong.";

        if (data) {

            if (data.message) {
                message = data.message;
            }

            if (data.body && typeof data.body === "string") {
                message = data.body;
            }

        }

        throw new Error(message);

    }

    return data;

}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    try {

        const response = await apiRequest("/v1/user/all");

        users = response.body || [];

    } catch (error) {

        console.error("Failed to load users:", error);

        users = [];

    }

}


/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

    try {

        showTableLoading();

        const response =
            await apiRequest("/v1/customer/all");

        customers = response.body || [];

        updateSummaryCards();

        renderCustomers(customers);

    } catch (error) {

        console.error("Failed to load customers:", error);

        showToast(
            "Load Failed",
            error.message || "Unable to load customers.",
            true
        );

        customers = [];

        updateSummaryCards();

        renderCustomers([]);

    }

}


/* =========================================================
   RENDER CUSTOMERS
========================================================= */

function renderCustomers(customerList) {

    const tableBody =
        document.getElementById("customerTableBody");

    const emptyState =
        document.getElementById("emptyCustomerState");


    tableBody.innerHTML = "";


    if (!customerList || customerList.length === 0) {

        emptyState.classList.remove("d-none");

        return;

    }


    emptyState.classList.add("d-none");


    customerList.forEach((customer, index) => {

        const user =
            findUserById(customer.userId);


        const displayName =
            getUserDisplayName(user, customer);


        const username =
            user ? user.username : "User ID " + customer.userId;


        const avatar =
            getInitials(displayName);


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${index + 1}
            </td>


            <td>

                <div class="customer-cell">

                    <div class="customer-avatar">
                        ${escapeHtml(avatar)}
                    </div>

                    <div class="customer-main-info">

                        <strong title="${escapeHtml(displayName)}">
                            ${escapeHtml(displayName)}
                        </strong>

                        <small>
                            @${escapeHtml(username)}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <span class="nic-value">
                    ${escapeHtml(customer.nic || "-")}
                </span>

            </td>


            <td>

                <span class="address-value"
                      title="${escapeHtml(customer.address || "")}">

                    ${escapeHtml(customer.address || "-")}

                </span>

            </td>


            <td>

                <span class="license-value">
                    ${escapeHtml(customer.drivingLicenseNumber || "-")}
                </span>

            </td>


            <td>

                <span class="user-id-badge">
                    #${customer.userId ?? "-"}
                </span>

            </td>


            <td>

                <div class="customer-actions">

                    <button class="action-btn view-btn"
                            title="View Customer"
                            onclick="viewCustomer(${customer.customerId})">

                        <i class="bi bi-eye-fill"></i>

                    </button>


                    <button class="action-btn edit-btn"
                            title="Edit Customer"
                            onclick="openEditCustomerModal(${customer.customerId})">

                        <i class="bi bi-pencil-fill"></i>

                    </button>


                    <button class="action-btn delete-btn"
                            title="Delete Customer"
                            onclick="openDeleteCustomerModal(
                                ${customer.customerId}
                            )">

                        <i class="bi bi-trash3-fill"></i>

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


/* =========================================================
   FIND USER
========================================================= */

function findUserById(userId) {

    if (userId === null || userId === undefined) {
        return null;
    }

    return users.find(
        user => Number(user.userId) === Number(userId)
    ) || null;

}


/* =========================================================
   USER DISPLAY NAME
========================================================= */

function getUserDisplayName(user, customer) {

    if (user) {

        const fullName =
            `${user.firstName || ""} ${user.lastName || ""}`.trim();

        if (fullName) {
            return fullName;
        }

        if (user.username) {
            return user.username;
        }

    }

    return "Customer #" + (customer.customerId || "");

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {

    if (!name) {
        return "C";
    }

    const parts =
        name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummaryCards() {

    const total =
        customers.length;

    const profiles =
        customers.filter(
            customer =>
                customer.userId !== null &&
                customer.userId !== undefined
        ).length;

    const nicCount =
        customers.filter(
            customer =>
                customer.nic &&
                customer.nic.trim() !== ""
        ).length;

    const licenseCount =
        customers.filter(
            customer =>
                customer.drivingLicenseNumber &&
                customer.drivingLicenseNumber.trim() !== ""
        ).length;


    document.getElementById("totalCustomers").textContent =
        total;

    document.getElementById("profileCount").textContent =
        profiles;

    document.getElementById("nicCount").textContent =
        nicCount;

    document.getElementById("licenseCount").textContent =
        licenseCount;

}


/* =========================================================
   SEARCH
========================================================= */

function filterCustomers() {

    const searchValue = document
        .getElementById("searchCustomer")
        .value
        .toLowerCase()
        .trim();

    if (searchValue === "") {
        renderCustomers(customers);
        return;
    }

    const filteredCustomers = customers.filter(customer => {

        const user = findUserById(customer.userId);

        const customerName = user
            ? getUserDisplayName(user).toLowerCase()
            : "";

        const customerId = String(customer.customerId || "").toLowerCase();

        const userId = String(customer.userId || "").toLowerCase();

        return customerName.includes(searchValue)
            || customerId.includes(searchValue)
            || userId.includes(searchValue);
    });

    renderCustomers(filteredCustomers);
}



/* =========================================================
   CLEAR SEARCH
========================================================= */

function clearCustomerSearch() {

    document.getElementById("searchCustomer").value = "";

    renderCustomers(customers);

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddCustomerModal() {

    currentCustomerId = null;

    document.getElementById("customerForm").reset();

    document.getElementById("customerId").value = "";

    document.getElementById("customerModalTitle").textContent =
        "Add Customer";

    document.getElementById("saveCustomerBtn").innerHTML =
        `<i class="bi bi-check-lg"></i> Save Customer`;

    customerModal.show();

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditCustomerModal(customerId) {

    const customer =
        customers.find(
            item =>
                Number(item.customerId) === Number(customerId)
        );


    if (!customer) {

        showToast(
            "Error",
            "Customer not found.",
            true
        );

        return;

    }


    currentCustomerId =
        customer.customerId;


    document.getElementById("customerId").value =
        customer.customerId;

    document.getElementById("userId").value =
        customer.userId || "";

    document.getElementById("nic").value =
        customer.nic || "";

    document.getElementById("address").value =
        customer.address || "";

    document.getElementById("drivingLicenseNumber").value =
        customer.drivingLicenseNumber || "";


    document.getElementById("customerModalTitle").textContent =
        "Edit Customer";


    document.getElementById("saveCustomerBtn").innerHTML =
        `<i class="bi bi-save"></i> Update Customer`;


    customerModal.show();

}


/* =========================================================
   SAVE / UPDATE CUSTOMER
========================================================= */

async function saveCustomer() {

    const userId =
        document.getElementById("userId")
            .value
            .trim();

    const nic =
        document.getElementById("nic")
            .value
            .trim();

    const address =
        document.getElementById("address")
            .value
            .trim();

    const drivingLicenseNumber =
        document.getElementById("drivingLicenseNumber")
            .value
            .trim();


    /* BASIC VALIDATION */

    if (!userId) {

        showToast(
            "Validation Error",
            "User ID is required.",
            true
        );

        return;

    }


    if (!nic) {

        showToast(
            "Validation Error",
            "NIC is required.",
            true
        );

        return;

    }


    if (!address) {

        showToast(
            "Validation Error",
            "Address is required.",
            true
        );

        return;

    }


    if (!drivingLicenseNumber) {

        showToast(
            "Validation Error",
            "Driving license number is required.",
            true
        );

        return;

    }


    const customerData = {

        userId: Number(userId),

        nic: nic,

        address: address,

        drivingLicenseNumber: drivingLicenseNumber

    };


    const saveButton =
        document.getElementById("saveCustomerBtn");


    saveButton.disabled = true;


    try {

        /* =================================================
           UPDATE
        ================================================= */

        if (currentCustomerId) {

            customerData.customerId =
                Number(currentCustomerId);


            await apiRequest(
                "/v1/customer/update",
                {
                    method: "PUT",
                    body: JSON.stringify(customerData)
                }
            );


            customerModal.hide();


            showToast(
                "Success",
                "Customer updated successfully."
            );

        }


        /* =================================================
           SAVE
        ================================================= */

        else {

            await apiRequest(
                "/v1/customer/save",
                {
                    method: "POST",
                    body: JSON.stringify(customerData)
                }
            );


            customerModal.hide();


            showToast(
                "Success",
                "Customer saved successfully."
            );

        }


        await loadUsers();
        await loadCustomers();


    } catch (error) {

        console.error(error);

        showToast(
            "Operation Failed",
            error.message || "Unable to save customer.",
            true
        );

    } finally {

        saveButton.disabled = false;

    }

}


/* =========================================================
   VIEW CUSTOMER
========================================================= */

async function viewCustomer(customerId) {

    const customer =
        customers.find(
            item =>
                Number(item.customerId) === Number(customerId)
        );


    if (!customer) {

        showToast(
            "Error",
            "Customer not found.",
            true
        );

        return;

    }


    const user =
        findUserById(customer.userId);


    let userDetails = user;


    /*
       If the user was not loaded from /user/all,
       try selecting the user directly.
    */

    if (!userDetails && customer.userId) {

        try {

            const response =
                await apiRequest(
                    `/v1/user/select/${customer.userId}`
                );

            userDetails =
                response.body || null;

        } catch (error) {

            console.warn(
                "Unable to load user details:",
                error
            );

        }

    }


    const displayName =
        getUserDisplayName(
            userDetails,
            customer
        );


    const username =
        userDetails
            ? userDetails.username || "-"
            : "-";


    const avatar =
        getInitials(displayName);


    document.getElementById("viewCustomerAvatar")
        .textContent = avatar;


    document.getElementById("viewCustomerName")
        .textContent = displayName;


    document.getElementById("viewCustomerUsername")
        .textContent = "@" + username;


    document.getElementById("viewCustomerId")
        .textContent = customer.customerId || "-";


    document.getElementById("viewUserId")
        .textContent = customer.userId || "-";


    document.getElementById("viewNic")
        .textContent = customer.nic || "-";


    document.getElementById("viewLicense")
        .textContent =
        customer.drivingLicenseNumber || "-";


    document.getElementById("viewAddress")
        .textContent =
        customer.address || "-";


    document.getElementById("viewEmail")
        .textContent =
        userDetails?.email || "-";


    document.getElementById("viewPhone")
        .textContent =
        userDetails?.phone || "-";


    document.getElementById("viewEditButton")
        .onclick = function () {

            viewCustomerModal.hide();

            setTimeout(() => {

                openEditCustomerModal(
                    customer.customerId
                );

            }, 250);

        };


    viewCustomerModal.show();

}


/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteCustomerModal(customerId) {

    const customer =
        customers.find(
            item =>
                Number(item.customerId) === Number(customerId)
        );


    if (!customer) {

        showToast(
            "Error",
            "Customer not found.",
            true
        );

        return;

    }


    const user =
        findUserById(customer.userId);


    const displayName =
        getUserDisplayName(
            user,
            customer
        );


    document.getElementById("deleteCustomerId")
        .value = customer.customerId;


    document.getElementById("deleteCustomerName")
        .textContent = displayName;


    deleteCustomerModal.show();

}


/* =========================================================
   CONFIRM DELETE
========================================================= */

async function confirmDeleteCustomer() {

    const customerId =
        document.getElementById("deleteCustomerId")
            .value;


    if (!customerId) {

        showToast(
            "Error",
            "Customer ID is missing.",
            true
        );

        return;

    }


    try {

        await apiRequest(
            `/v1/customer/${customerId}`,
            {
                method: "DELETE"
            }
        );


        deleteCustomerModal.hide();


        showToast(
            "Success",
            "Customer deleted successfully."
        );


        await loadCustomers();


    } catch (error) {

        console.error(error);

        showToast(
            "Delete Failed",
            error.message || "Unable to delete customer.",
            true
        );

    }

}


/* =========================================================
   TABLE LOADING
========================================================= */

function showTableLoading() {

    const tableBody =
        document.getElementById("customerTableBody");

    const emptyState =
        document.getElementById("emptyCustomerState");


    emptyState.classList.add("d-none");


    tableBody.innerHTML = `

        <tr>

            <td colspan="7"
                class="text-center py-5">

                <div class="spinner-border"
                     style="color:#7d2ae8;"
                     role="status">

                    <span class="visually-hidden">
                        Loading...
                    </span>

                </div>

                <div class="mt-2 text-muted small">
                    Loading customers...
                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(title, message, isError = false) {

    const toastElement =
        document.getElementById("customerToast");


    document.getElementById("toastTitle")
        .textContent = title;


    document.getElementById("toastMessage")
        .textContent = message;


    const icon =
        document.getElementById("toastIcon");


    if (isError) {

        icon.classList.add("error");

        icon.innerHTML =
            `<i class="bi bi-x-lg"></i>`;

    } else {

        icon.classList.remove("error");

        icon.innerHTML =
            `<i class="bi bi-check-lg"></i>`;

    }


    const toast =
        bootstrap.Toast.getOrCreateInstance(
            toastElement,
            {
                delay: 3500
            }
        );


    toast.show();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}