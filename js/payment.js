/* =========================================================
   PAYMENT MANAGEMENT
========================================================= */

let payments = [];

let editingPaymentId = null;

let paymentModal;
let refundModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const paymentModalElement = document.getElementById("paymentModal");
    const refundModalElement = document.getElementById("refundModal");

    if (paymentModalElement) {
        paymentModal = new bootstrap.Modal(paymentModalElement);
    }

    if (refundModalElement) {
        refundModal = new bootstrap.Modal(refundModalElement);
    }

    loadUserInfo();

    await loadPayments();

    setupBalancePreview();
});


/* =========================================================
   AUTH HEADER
========================================================= */

function getAuthHeaders() {

    const token = localStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


/* =========================================================
   LOAD USER INFO
========================================================= */
function loadUserInfo() {

    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    const usernameElement = document.getElementById("topbarUsername");
    const roleElement = document.getElementById("topbarRole");
    const avatarElement = document.getElementById("topbarUserAvatar");

    if (usernameElement && username) {
        usernameElement.textContent = username;
    }

    if (roleElement && role) {
        roleElement.textContent = formatEnum(role);
    }

    if (avatarElement && username) {
        avatarElement.textContent = username
            .trim()
            .charAt(0)
            .toUpperCase();
    }
}


/* =========================================================
   LOAD PAYMENTS
========================================================= */

async function loadPayments() {

    const loading = document.getElementById("paymentLoading");
    const tableBody = document.getElementById("paymentTableBody");

    try {

        if (loading) {
            loading.style.display = "flex";
        }

        if (tableBody) {
            tableBody.innerHTML = "";
        }

        const response = await fetch(
            `${API_BASE_URL}/v1/payment/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {

            if (response.status === 401) {
                showToast(
                    "Authentication Error",
                    "Your session has expired. Please login again.",
                    "error"
                );

                return;
            }

            throw new Error("Failed to load payments");
        }

        const result = await response.json();

        payments = Array.isArray(result.body)
            ? result.body
            : [];

        updatePaymentSummary();

        filterPayments();

    } catch (error) {

        console.error("Payment API Error:", error);

        showToast(
            "Error",
            "Unable to load payment records.",
            "error"
        );

    } finally {

        if (loading) {
            loading.style.display = "none";
        }
    }
}


/* =========================================================
   SUMMARY
========================================================= */

function updatePaymentSummary() {

    const total = payments.length;

    const paid = payments.filter(
        payment => payment.paymentStatus === "PAID"
    ).length;

    const pending = payments.filter(
        payment => payment.paymentStatus === "PENDING"
    ).length;

    const refunded = payments.filter(
        payment => payment.paymentStatus === "REFUNDED"
    ).length;

    const paidPayments = payments.filter(
        payment => payment.paymentStatus === "PAID"
    );

    const totalCollected = paidPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    document.getElementById("totalPayments").textContent = total;
    document.getElementById("paidPayments").textContent = paid;
    document.getElementById("pendingPayments").textContent = pending;
    document.getElementById("refundedPayments").textContent = refunded;
    document.getElementById("totalCollected").textContent = formatCurrency(totalCollected);

    updatePaymentMethodTotals(paidPayments);
}


/* =========================================================
   PAYMENT METHOD TOTALS
========================================================= */

function updatePaymentMethodTotals(paidPayments) {

    let cash = 0;
    let card = 0;
    let online = 0;
    let bank = 0;

    paidPayments.forEach(payment => {

        const amount = Number(payment.amount || 0);

        switch (payment.paymentMethod) {

            case "CASH":
                cash += amount;
                break;

            case "CARD":
                card += amount;
                break;

            case "ONLINE":
                online += amount;
                break;

            case "BANK_TRANSFER":
                bank += amount;
                break;
        }
    });

    document.getElementById("cashTotal").textContent =  formatCurrency(cash);

    document.getElementById("cardTotal").textContent = formatCurrency(card);

    document.getElementById("onlineTotal").textContent = formatCurrency(online + bank);
}


/* =========================================================
   FILTER PAYMENTS
========================================================= */

function filterPayments() {

    const searchInput = document.getElementById("paymentSearch");

    const statusFilter = document.getElementById("statusFilter");

    const methodFilter = document.getElementById("methodFilter");


    /* Get search value */
    const searchValue =  searchInput?.value  ?.trim()  .toLowerCase() || "";

    /* Get filters */
    const status = statusFilter?.value || "";

    const method = methodFilter?.value || "";

    const normalizedSearch = searchValue.replace(/[\s#_-]+/g, "");

    const filteredPayments = payments.filter(payment => {


    /* =================================================
         PAYMENT REFERENCE
    ================================================= */

    const reference =String(payment.paymentReference || "")  .toLowerCase();

    const normalizedReference =reference.replace(/[\s#_-]+/g, "");


    /* =================================================
        CUSTOMER NAME
    ================================================= */

    const customerName =String(payment.customerName || "") .toLowerCase() .trim();

    const normalizedCustomerName =customerName.replace(/[\s#_-]+/g, "");    


    /* =================================================
        CUSTOMER ID
    ================================================= */

    const customerId =payment.customerId !== null && payment.customerId !== undefined? String(payment.customerId): "";

    const normalizedCustomerId =customerId.replace(/[\s#_-]+/g, "");


    /* =================================================
        RENTAL ID
    ================================================= */

    const rentalId = payment.rentalId !== null && payment.rentalId !== undefined ? String(payment.rentalId) : "";

    const normalizedRentalId = rentalId.replace(/[\s#_-]+/g, "");


    /* =================================================
        PAYMENT ID
    ================================================= */

    const paymentId = payment.paymentId !== null && payment.paymentId !== undefined? String(payment.paymentId) : "";

    const normalizedPaymentId = paymentId.replace(/[\s#_-]+/g, "");


/* =================================================
        EXTRA SEARCH TEXT
================================================= */

    const rentalText =`rental${rentalId}`;

    const customerText = `customer${customerId}`;


/* =================================================
        SEARCH MATCH
 ================================================= */

        const matchesSearch =!searchValue ||

            /* Payment reference */
            reference.includes(searchValue) ||

            normalizedReference.includes(normalizedSearch) ||

            /* Customer name */
            customerName.includes(searchValue) ||

            normalizedCustomerName.includes(normalizedSearch) ||

            /* Customer ID */
            customerId.includes(searchValue) ||

            normalizedCustomerId.includes(normalizedSearch) ||

            customerText.includes(normalizedSearch) ||

            /* Rental ID */
            rentalId.includes(searchValue) ||

            normalizedRentalId.includes(normalizedSearch) ||

            rentalText.includes(normalizedSearch) ||

            /* Payment ID */
            paymentId.includes(searchValue) ||

            normalizedPaymentId.includes(normalizedSearch);


        /* =================================================
           STATUS MATCH
        ================================================= */

        const matchesStatus = !status || payment.paymentStatus === status;


        /* =================================================
           METHOD MATCH
        ================================================= */

        const matchesMethod = !method || payment.paymentMethod === method;


        return ( matchesSearch && matchesStatus && matchesMethod);
    });


    /* Render filtered results */
    renderPayments(filteredPayments);
}


/* =========================================================
   RENDER PAYMENTS
========================================================= */

function renderPayments(paymentList) {

    const tableBody = document.getElementById("paymentTableBody");

    const emptyState = document.getElementById("emptyPaymentState");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!paymentList.length) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    paymentList.forEach(payment => {

        const row = document.createElement("tr");

        const status = payment.paymentStatus || "PENDING";

        const method = payment.paymentMethod || "-";

        const customerName = payment.customerName || "Unknown Customer";

        const customerId = payment.customerId ? `Customer #${payment.customerId}` : "Customer";

        const amount = Number(payment.amount || 0);

        const discount = Number(payment.discount || 0);

        const balance = Number(payment.balance || 0);

        const paymentDate = formatDateTime(payment.paymentDate);

        const canRefund = status !== "REFUNDED";

        row.innerHTML = `

            <td>

                <div class="payment-reference">

                    <div class="payment-reference-icon">
                        <i class="bi bi-credit-card"></i>
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(
                                payment.paymentReference || "-"
                            )}
                        </strong>

                        <small>
                            #${payment.paymentId ?? "-"}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <div class="customer-cell">

                    <strong>
                        ${escapeHtml(customerName)}
                    </strong>

                    <small>
                        ${escapeHtml(customerId)}
                    </small>

                </div>

            </td>


            <td>

                <span class="rental-id-badge">
                    <i class="bi bi-calendar-check"></i>
                    Rental #${payment.rentalId ?? "-"}
                </span>

            </td>


            <td>

                <span class="amount-cell">
                    ${formatCurrency(amount)}
                </span>

            </td>


            <td>

                <span class="discount-cell">
                    ${formatCurrency(discount)}
                </span>

            </td>


            <td>

                <span class="balance-cell">
                    ${formatCurrency(balance)}
                </span>

            </td>


            <td>

                ${getPaymentMethodBadge(method)}

            </td>


            <td>
                ${paymentDate}
            </td>


            <td>

                ${getPaymentStatusBadge(status)}

            </td>


            <td>

                <div class="payment-actions">

                    <button
                            type="button"
                            class="payment-action-btn payment-edit-btn"
                            title="Edit Payment"
                            onclick="editPayment(${payment.paymentId})">

                        <i class="bi bi-pencil"></i>

                    </button>


                    <button
                            type="button"
                            class="payment-action-btn payment-refund-btn"
                            title="Refund Payment"
                            onclick="openRefundModal(${payment.paymentId})"
                            ${!canRefund ? "disabled" : ""}>

                        <i class="bi bi-arrow-counterclockwise"></i>

                    </button>

                </div>

            </td>

        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   PAYMENT METHOD BADGE
========================================================= */

function getPaymentMethodBadge(method) {

    let className = "method-online";
    let icon = "bi-globe2";

    switch (method) {

        case "CASH":
            className = "method-cash";
            icon = "bi-cash-stack";
            break;

        case "CARD":
            className = "method-card";
            icon = "bi-credit-card";
            break;

        case "ONLINE":
            className = "method-online";
            icon = "bi-globe2";
            break;

        case "BANK_TRANSFER":
            className = "method-bank";
            icon = "bi-bank";
            break;
    }

    return `
        <span class="method-badge ${className}">
            <i class="bi ${icon}"></i>
            ${formatEnum(method)}
        </span>
    `;
}


/* =========================================================
   PAYMENT STATUS BADGE
========================================================= */

function getPaymentStatusBadge(status) {

    let className = "status-pending";

    if (status === "PAID") {
        className = "status-paid";
    } else if (status === "REFUNDED") {
        className = "status-refunded";
    }

    return `
        <span class="payment-status ${className}">
            ${formatEnum(status)}
        </span>
    `;
}


/* =========================================================
   OPEN ADD PAYMENT MODAL
========================================================= */

function openAddPaymentModal() {

    editingPaymentId = null;

    document.getElementById("paymentForm").reset();

    document.getElementById("paymentId").value = "";

    document.getElementById("paymentModalTitle").textContent =
        "Add Payment";

    document.getElementById("savePaymentText").textContent =
        "Save Payment";

    document.getElementById("paymentStatus").value =
        "PAID";

    document.getElementById("paymentDiscount").value =
        "0";

    document.getElementById("paymentDate").value =
        getCurrentDateTimeLocal();

    updateBalancePreview();

    paymentModal.show();
}


/* =========================================================
   EDIT PAYMENT
========================================================= */

function editPayment(paymentId) {

    const payment = payments.find(
        item => item.paymentId === paymentId
    );

    if (!payment) {

        showToast(
            "Error",
            "Payment record not found.",
            "error"
        );

        return;
    }

    editingPaymentId = paymentId;

    document.getElementById("paymentId").value =
        payment.paymentId;

    document.getElementById("paymentReference").value =
        payment.paymentReference || "";

    document.getElementById("rentalId").value =
        payment.rentalId || "";

    document.getElementById("paymentAmount").value =
        payment.amount ?? "";

    document.getElementById("paymentDiscount").value =
        payment.discount ?? 0;

    document.getElementById("paymentMethod").value =
        payment.paymentMethod || "";

    document.getElementById("paymentStatus").value =
        payment.paymentStatus || "PENDING";

    document.getElementById("paymentDate").value =
        convertToDateTimeLocal(payment.paymentDate);

    document.getElementById("paymentModalTitle").textContent =
        "Edit Payment";

    document.getElementById("savePaymentText").textContent =
        "Update Payment";

    updateBalancePreview();

    paymentModal.show();
}


/* =========================================================
   SAVE / UPDATE PAYMENT
========================================================= */

async function savePayment(event) {

    event.preventDefault();

    const paymentId =
        document.getElementById("paymentId").value;

    const amount =
        Number(document.getElementById("paymentAmount").value || 0);

    const discount =
        Number(document.getElementById("paymentDiscount").value || 0);

    const balance =
        Math.max(0, amount - discount);

    const paymentDTO = {

        paymentId: paymentId
            ? Number(paymentId)
            : null,

        paymentReference:
            document.getElementById("paymentReference").value.trim(),

        amount: amount,

        discount: discount,

        balance: balance,

        paymentDate:
            document.getElementById("paymentDate").value
                ? document.getElementById("paymentDate").value
                : null,

        paymentMethod:
            document.getElementById("paymentMethod").value,

        paymentStatus:
            document.getElementById("paymentStatus").value,

        rentalId:
            Number(document.getElementById("rentalId").value)

    };


    if (!paymentDTO.paymentReference) {

        showToast(
            "Validation",
            "Payment reference is required.",
            "error"
        );

        return;
    }


    if (!paymentDTO.rentalId || paymentDTO.rentalId <= 0) {

        showToast(
            "Validation",
            "Please enter a valid rental ID.",
            "error"
        );

        return;
    }


    if (paymentDTO.amount <= 0) {

        showToast(
            "Validation",
            "Payment amount must be greater than zero.",
            "error"
        );

        return;
    }


    if (paymentDTO.discount < 0) {

        showToast(
            "Validation",
            "Discount cannot be negative.",
            "error"
        );

        return;
    }


    if (paymentDTO.discount > paymentDTO.amount) {

        showToast(
            "Validation",
            "Discount cannot be greater than payment amount.",
            "error"
        );

        return;
    }


    const saveButton =
        document.querySelector(".save-payment-btn");

    const saveText =
        document.getElementById("savePaymentText");

    try {

        saveButton.disabled = true;

        saveText.textContent =
            editingPaymentId
                ? "Updating..."
                : "Saving...";


        const url =
            editingPaymentId
                ? `${API_BASE_URL}/v1/payment/update`
                : `${API_BASE_URL}/v1/payment/save`;

        const method =
            editingPaymentId
                ? "PUT"
                : "POST";


        const response = await fetch(
            url,
            {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(paymentDTO)
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Payment operation failed"
            );
        }


        paymentModal.hide();


        showToast(
            "Success",
            editingPaymentId
                ? "Payment updated successfully."
                : "Payment saved successfully.",
            "success"
        );


        await loadPayments();


    } catch (error) {

        console.error("Payment Save Error:", error);

        showToast(
            "Error",
            error.message ||
            "Unable to save payment.",
            "error"
        );

    } finally {

        saveButton.disabled = false;

        saveText.textContent =
            editingPaymentId
                ? "Update Payment"
                : "Save Payment";
    }
}


/* =========================================================
   OPEN REFUND MODAL
========================================================= */

function openRefundModal(paymentId) {

    const payment = payments.find(
        item => item.paymentId === paymentId
    );

    if (!payment) {

        showToast(
            "Error",
            "Payment record not found.",
            "error"
        );

        return;
    }

    if (payment.paymentStatus === "REFUNDED") {

        showToast(
            "Information",
            "This payment is already refunded.",
            "error"
        );

        return;
    }

    document.getElementById("refundPaymentId").value =
        paymentId;

    refundModal.show();
}


/* =========================================================
   CONFIRM REFUND
========================================================= */

async function confirmRefund() {

    const paymentId =
        document.getElementById("refundPaymentId").value;

    if (!paymentId) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/payment/${paymentId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to refund payment"
            );
        }


        refundModal.hide();


        showToast(
            "Success",
            "Payment refunded successfully.",
            "success"
        );


        await loadPayments();


    } catch (error) {

        console.error("Refund Error:", error);

        showToast(
            "Error",
            error.message ||
            "Unable to refund payment.",
            "error"
        );
    }
}


/* =========================================================
   BALANCE PREVIEW
========================================================= */

function setupBalancePreview() {

    const amountInput =
        document.getElementById("paymentAmount");

    const discountInput =
        document.getElementById("paymentDiscount");

    if (amountInput) {
        amountInput.addEventListener(
            "input",
            updateBalancePreview
        );
    }

    if (discountInput) {
        discountInput.addEventListener(
            "input",
            updateBalancePreview
        );
    }
}


function updateBalancePreview() {

    const amount =
        Number(
            document.getElementById("paymentAmount")?.value || 0
        );

    const discount =
        Number(
            document.getElementById("paymentDiscount")?.value || 0
        );

    const balance =
        Math.max(0, amount - discount);

    const preview =
        document.getElementById("balancePreview");

    if (preview) {
        preview.textContent =
            formatCurrency(balance);
    }
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const hours =
        String(date.getHours())
            .padStart(2, "0");

    const minutes =
        String(date.getMinutes())
            .padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}


/* =========================================================
   DATE TO DATETIME-LOCAL
========================================================= */

function convertToDateTimeLocal(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const hours =
        String(date.getHours())
            .padStart(2, "0");

    const minutes =
        String(date.getMinutes())
            .padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


/* =========================================================
   CURRENT DATETIME
========================================================= */

function getCurrentDateTimeLocal() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    const hours =
        String(now.getHours())
            .padStart(2, "0");

    const minutes =
        String(now.getMinutes())
            .padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

    const number =
        Number(value || 0);

    return "LKR " + number.toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   ENUM FORMAT
========================================================= */

function formatEnum(value) {

    if (!value) {
        return "-";
    }

    return String(value)
        .toLowerCase()
        .split("_")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");
}


/* =========================================================
   HTML ESCAPE
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


/* =========================================================
   TOAST
========================================================= */

function showToast(title, message, type = "success") {

    const toastElement =
        document.getElementById("paymentToast");

    const titleElement =
        document.getElementById("toastTitle");

    const messageElement =
        document.getElementById("toastMessage");

    const icon =
        document.querySelector(".toast-status-icon i");


    titleElement.textContent = title;

    messageElement.textContent = message;


    if (type === "error") {

        icon.className =
            "bi bi-exclamation-circle-fill";

        icon.style.color = "#dc2626";

    } else {

        icon.className =
            "bi bi-check-circle-fill";

        icon.style.color = "#16a34a";
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
   SIDEBAR
========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

/* =========================================================
   REFRESH PAYMENTS
========================================================= */

async function refreshPayments() {

    /* Clear search */
    const searchInput =
        document.getElementById("paymentSearch");

    if (searchInput) {
        searchInput.value = "";
    }


    /* Reset status filter */
    const statusFilter =
        document.getElementById("statusFilter");

    if (statusFilter) {
        statusFilter.value = "";
    }


    /* Reset method filter */
    const methodFilter =
        document.getElementById("methodFilter");

    if (methodFilter) {
        methodFilter.value = "";
    }


    /* Reload payment data */
    await loadPayments();
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href =
        "../index.html";
}