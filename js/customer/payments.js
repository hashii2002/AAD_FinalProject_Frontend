/* =========================================================
   CUSTOMER PAYMENTS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    checkRoleAccess(["CUSTOMER"]);

    loadCustomerDetails();

    loadPayments();

    setupPaymentEvents();

});


/* =========================================================
   ELEMENTS
========================================================= */

const paymentsList =
    document.getElementById("paymentsList");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const errorState =
    document.getElementById("errorState");

const paymentErrorMessage =
    document.getElementById("errorMessage");

const paymentSearch =
    document.getElementById("paymentSearch");

const paymentStatusFilter =
    document.getElementById("paymentStatusFilter");

const paymentCount =
    document.getElementById("paymentCount");

const totalPayments =
    document.getElementById("totalPayments");

const paidPayments =
    document.getElementById("paidPayments");

const pendingPayments =
    document.getElementById("pendingPayments");

const refundedPayments =
    document.getElementById("refundedPayments");

const paymentDetailsBody =
    document.getElementById("paymentDetailsBody");


/* =========================================================
   DATA
========================================================= */

let allPayments = [];

let filteredPayments = [];


/* =========================================================
   CUSTOMER DETAILS
========================================================= */

function loadCustomerDetails() {

    const username =
        localStorage.getItem("username");

    if (username) {

        const sidebarUsername =
            document.getElementById("sidebarUsername");

        const topbarUsername =
            document.getElementById("topbarUsername");


        if (sidebarUsername) {
            sidebarUsername.textContent = username;
        }

        if (topbarUsername) {
            topbarUsername.textContent = username;
        }
    }
}


/* =========================================================
   LOAD PAYMENTS
========================================================= */

async function loadPayments() {

    showLoading();

    try {

        const token =
            localStorage.getItem("accessToken");


        if (!token) {

            redirectByRole("CUSTOMER");

            return;
        }


        const response = await fetch(
            `${API_BASE_URL}/v1/payment/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );


        if (!response.ok) {

            let message =
                "Failed to load payment history.";

            try {

                const errorData =
                    await response.json();

                message =
                    errorData.message ||
                    errorData.body ||
                    message;

            } catch (error) {
                // Ignore JSON parsing error
            }

            throw new Error(message);
        }


        const responseData =
            await response.json();


        allPayments =
            extractPaymentData(responseData);


        updateSummary();

        applyFilters();


    } catch (error) {

        console.error(
            "Payment loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load payment history."
        );
    }
}


/* =========================================================
   EXTRACT RESPONSE
========================================================= */

function extractPaymentData(responseData) {

    if (!responseData) {
        return [];
    }


    let body =
        responseData.body;


    if (Array.isArray(body)) {
        return body;
    }


    if (
        body &&
        Array.isArray(body.body)
    ) {
        return body.body;
    }


    if (
        body &&
        Array.isArray(body.content)
    ) {
        return body.content;
    }


    if (Array.isArray(responseData)) {
        return responseData;
    }


    return [];
}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupPaymentEvents() {

    paymentSearch.addEventListener(
        "input",
        applyFilters
    );


    paymentStatusFilter.addEventListener(
        "change",
        applyFilters
    );


    document
        .getElementById("clearPaymentFilters")
        .addEventListener(
            "click",
            clearFilters
        );


    document
        .getElementById("refreshPaymentsBtn")
        .addEventListener(
            "click",
            loadPayments
        );


    document
        .getElementById("retryBtn")
        .addEventListener(
            "click",
            loadPayments
        );
}

/* =========================================================
   FILTER
========================================================= */

function applyFilters() {

    const searchValue =
        paymentSearch.value
            .trim()
            .toLowerCase();


    const statusValue =
        paymentStatusFilter.value;


    filteredPayments =
        allPayments.filter(function (payment) {

            const reference =
                String(
                    payment.paymentReference || ""
                )
                .trim()
                .toLowerCase();

            const rentalId =
                payment.rentalId !== null &&
                payment.rentalId !== undefined
                    ? String(payment.rentalId)
                        .trim()
                        .toLowerCase()
                    : "";


            const rentalDisplay =
                rentalId
                    ? `rental #${rentalId}`
                    : "";

            const paymentDate =
                formatDate(payment.paymentDate)
                    .trim()
                    .toLowerCase();

            const matchesSearch =
                !searchValue ||
                reference.includes(searchValue) ||
                paymentDate.includes(searchValue) ||
                rentalDisplay.includes(searchValue) ||
                rentalId === searchValue;

            const paymentStatus =
                String(
                    payment.paymentStatus || ""
                ).toUpperCase();


            const matchesStatus =
                statusValue === "ALL" ||
                paymentStatus === statusValue;


            return (
                matchesSearch &&
                matchesStatus
            );
        });


    renderPayments();
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    paymentSearch.value = "";

    paymentStatusFilter.value = "ALL";

    applyFilters();
}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary() {

    const total =
        allPayments.length;


    const paid =
        allPayments.filter(
            payment =>
                getPaymentStatus(payment) === "PAID"
        ).length;


    const pending =
        allPayments.filter(
            payment =>
                getPaymentStatus(payment) === "PENDING"
        ).length;


    const refunded =
        allPayments.filter(
            payment =>
                getPaymentStatus(payment) === "REFUNDED"
        ).length;


    totalPayments.textContent =
        total;

    paidPayments.textContent =
        paid;

    pendingPayments.textContent =
        pending;

    refundedPayments.textContent =
        refunded;
}


/* =========================================================
   RENDER PAYMENTS
========================================================= */

function renderPayments() {

    hideLoading();

    hideError();


    paymentCount.textContent =
        `${filteredPayments.length} ${
            filteredPayments.length === 1
                ? "payment"
                : "payments"
        }`;


    if (filteredPayments.length === 0) {

        paymentsList.classList.add("d-none");

        emptyState.classList.remove("d-none");

        return;
    }


    emptyState.classList.add("d-none");

    paymentsList.classList.remove("d-none");


    paymentsList.innerHTML =
        filteredPayments
            .map(createPaymentCard)
            .join("");
}


/* =========================================================
   CREATE PAYMENT CARD
========================================================= */

function createPaymentCard(payment) {

    const status =
        getPaymentStatus(payment);


    const reference =
        payment.paymentReference ||
        `PAY-${payment.paymentId || "N/A"}`;


    const rentalId =
        payment.rentalId ??
        "N/A";


    const paymentDate =
        formatDate(payment.paymentDate);


    const amount =
        formatCurrency(payment.amount);


    const balance =
        formatCurrency(payment.balance);


    return `

        <article class="payment-card">

            <div class="payment-card-main">


                <!-- Reference -->

                <div class="payment-reference-section">

                    <div class="payment-icon">

                        <i class="bi bi-credit-card-2-front"></i>

                    </div>


                    <div class="payment-reference-info">

                        <div class="payment-label">
                            Payment Reference
                        </div>

                        <h3 class="payment-reference">
                            ${escapeHtml(reference)}
                        </h3>

                        <div class="payment-rental">

                            <i class="bi bi-calendar2-check"></i>

                            Rental #${escapeHtml(
                                String(rentalId)
                            )}

                        </div>

                    </div>

                </div>


                <!-- Date -->

                <div class="payment-date-section">

                    <div class="payment-date-icon">

                        <i class="bi bi-calendar3"></i>

                    </div>


                    <div class="payment-date-info">

                        <span>
                            Payment Date
                        </span>

                        <strong>
                            ${escapeHtml(paymentDate)}
                        </strong>

                    </div>

                </div>


                <!-- Amount -->

                <div class="payment-amount-section">

                    <span class="payment-amount-label">
                        Amount
                    </span>

                    <strong class="payment-amount">
                        ${escapeHtml(amount)}
                    </strong>

                    <span class="payment-balance">
                        Balance: ${escapeHtml(balance)}
                    </span>

                </div>


                <!-- Action -->

                <div class="payment-action-section">

                    <span class="payment-status ${
                        getStatusClass(status)
                    }">

                        ${escapeHtml(
                            formatStatus(status)
                        )}

                    </span>


                    <button
                        type="button"
                        class="payment-details-btn"
                        onclick="showPaymentDetails(
                            ${payment.paymentId}
                        )">

                        <i class="bi bi-eye"></i>

                        Details

                    </button>

                </div>

            </div>

        </article>

    `;
}


/* =========================================================
   PAYMENT DETAILS
========================================================= */

function showPaymentDetails(paymentId) {

    const payment =
        allPayments.find(
            item =>
                Number(item.paymentId) ===
                Number(paymentId)
        );


    if (!payment) {
        return;
    }


    const status =
        getPaymentStatus(payment);


    const reference =
        payment.paymentReference ||
        "N/A";


    const amount =
        formatCurrency(payment.amount);


    const discount =
        formatCurrency(payment.discount);


    const balance =
        formatCurrency(payment.balance);


    const paymentDate =
        formatDate(payment.paymentDate);


    const paymentMethod =
        formatEnum(payment.paymentMethod);


    const rentalId =
        payment.rentalId ?? "N/A";


    paymentDetailsBody.innerHTML = `

        <div class="payment-detail-grid">


            <div class="payment-detail-item">

                <span>
                    Payment ID
                </span>

                <strong>
                    #${escapeHtml(
                        String(payment.paymentId ?? "N/A")
                    )}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Rental ID
                </span>

                <strong>
                    #${escapeHtml(
                        String(rentalId)
                    )}
                </strong>

            </div>


            <div class="payment-detail-item full-width">

                <span>
                    Payment Reference
                </span>

                <strong>
                    ${escapeHtml(reference)}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Amount
                </span>

                <strong>
                    ${escapeHtml(amount)}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Discount
                </span>

                <strong>
                    ${escapeHtml(discount)}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Balance
                </span>

                <strong>
                    ${escapeHtml(balance)}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Payment Date
                </span>

                <strong>
                    ${escapeHtml(paymentDate)}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Payment Method
                </span>

                <strong>
                    ${escapeHtml(paymentMethod)}
                </strong>

            </div>


            <div class="payment-detail-item">

                <span>
                    Payment Status
                </span>

                <strong>
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </strong>

            </div>

        </div>

    `;


    const modalElement =
        document.getElementById(
            "paymentDetailsModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();
}


/* =========================================================
   PAYMENT STATUS
========================================================= */

function getPaymentStatus(payment) {

    return String(
        payment.paymentStatus || "UNKNOWN"
    ).toUpperCase();
}


function getStatusClass(status) {

    switch (status) {

        case "PENDING":
            return "payment-status-pending";

        case "PAID":
            return "payment-status-paid";

        case "REFUNDED":
            return "payment-status-refunded";

        default:
            return "payment-status-default";
    }
}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(value) {

    if (!value) {
        return "Unknown";
    }


    return String(value)
        .toLowerCase()
        .split("_")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


/* =========================================================
   FORMAT ENUM
========================================================= */

function formatEnum(value) {

    if (!value) {
        return "N/A";
    }


    return String(value)
        .toLowerCase()
        .split("_")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "N/A";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

        return String(value);
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

    const amount =
        Number(value);


    if (
        value === null ||
        value === undefined ||
        Number.isNaN(amount)
    ) {

        return "LKR 0.00";
    }


    return `LKR ${amount.toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    loadingState.classList.remove("d-none");

    paymentsList.classList.add("d-none");

    emptyState.classList.add("d-none");

    errorState.classList.add("d-none");
}


function hideLoading() {

    loadingState.classList.add("d-none");
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    hideLoading();

    paymentsList.classList.add("d-none");

    emptyState.classList.add("d-none");

    errorState.classList.remove("d-none");

    paymentErrorMessage.textContent =
        message;
}


function hideError() {

    errorState.classList.add("d-none");
}