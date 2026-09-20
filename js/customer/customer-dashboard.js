/* =========================================================
   DRIVEGO CUSTOMER DASHBOARD
========================================================= */

let customerRentals = [];
let customerPayments = [];
let customerInvoices = [];
let rentalStatusChart = null;
let paymentStatusChart = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /*
     * Customer only page
     */
    if (typeof checkRoleAccess === "function") {
        const allowed = checkRoleAccess(["CUSTOMER"]);

        if (allowed === false) {
            return;
        }
    }

    setupCustomerProfile();
    setupSidebar();
    setupLogout();

    await loadCustomerDashboard();

});


/* =========================================================
   CUSTOMER PROFILE
========================================================= */

function setupCustomerProfile() {

    const username =
        localStorage.getItem("username") || "Customer";

    const firstLetter =
        username.charAt(0).toUpperCase();

    const welcomeUsername =
        document.getElementById("welcomeUsername");

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const topbarUsername =
        document.getElementById("topbarUsername");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const topbarAvatar =
        document.getElementById("topbarAvatar");


    if (welcomeUsername) {
        welcomeUsername.textContent = username;
    }

    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (topbarUsername) {
        topbarUsername.textContent = username;
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = firstLetter;
    }

    if (topbarAvatar) {
        topbarAvatar.textContent = firstLetter;
    }
}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById("customerSidebar");

    const menuButton =
        document.getElementById("mobileMenuButton");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (!sidebar || !menuButton || !overlay) {
        return;
    }


    menuButton.addEventListener("click", () => {

        sidebar.classList.add("sidebar-open");

        overlay.classList.add("show");

    });


    overlay.addEventListener("click", () => {

        sidebar.classList.remove("sidebar-open");

        overlay.classList.remove("show");

    });


    document
        .querySelectorAll(".sidebar-link")
        .forEach(link => {

            link.addEventListener("click", () => {

                sidebar.classList.remove("sidebar-open");

                overlay.classList.remove("show");

            });

        });

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", () => {

        if (typeof logout === "function") {

            logout();

            return;
        }

        localStorage.clear();

        window.location.href = "../../index.html";

    });

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadCustomerDashboard() {

    try {

        showDashboardLoading();


        /*
         * Only CUSTOMER-permitted APIs
         */
        const [
            rentals,
            payments,
            invoices
        ] = await Promise.all([

            fetchMyRentals(),

            fetchMyPayments(),

            fetchMyInvoices()

        ]);


        customerRentals = rentals;

        customerPayments = payments;

        customerInvoices = invoices;


        updateStatistics();

        createRentalStatusChart();

        createPaymentStatusChart();

        renderUpcomingRental();

        renderRecentRentals();


    } catch (error) {

        console.error(
            "Customer dashboard loading error:",
            error
        );

        showDashboardError(error);

    }

}


/* =========================================================
   GET MY RENTALS
========================================================= */

async function fetchMyRentals() {

    const response = await authenticatedFetch(
        `${API_BASE_URL}/v1/rental/me`
    );

    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load your rentals"
        );

    }

    const data = await response.json();

    return extractBodyArray(data);

}


/* =========================================================
   GET MY PAYMENTS
========================================================= */

async function fetchMyPayments() {

    const response = await authenticatedFetch(
        `${API_BASE_URL}/v1/payment/me`
    );

    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load your payments"
        );

    }

    const data = await response.json();

    return extractBodyArray(data);

}


/* =========================================================
   GET MY INVOICES
========================================================= */

async function fetchMyInvoices() {

    const response = await authenticatedFetch(
        `${API_BASE_URL}/v1/invoice/me`
    );

    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load your invoices"
        );

    }

    const data = await response.json();

    return extractBodyArray(data);

}


/* =========================================================
   AUTHENTICATED FETCH
========================================================= */

async function authenticatedFetch(url, options = {}) {

    const token =
        localStorage.getItem("accessToken");

    const headers = {

        "Content-Type": "application/json",

        "Accept": "application/json",

        ...(options.headers || {})

    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    return fetch(url, {

        ...options,

        headers

    });

}


/* =========================================================
   COMMON RESPONSE BODY
========================================================= */

function extractBodyArray(data) {

    if (!data) {
        return [];
    }


    if (Array.isArray(data)) {
        return data;
    }


    if (Array.isArray(data.body)) {
        return data.body;
    }


    return [];

}


/* =========================================================
   API ERROR
========================================================= */

async function createApiError(
    response,
    defaultMessage
) {

    try {

        const data =
            await response.json();

        return new Error(
            data.message || defaultMessage
        );

    } catch {

        return new Error(
            defaultMessage
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        customerRentals.length;


    const active =
        customerRentals.filter(
            rental =>
                isActiveRental(rental)
        ).length;


    const completed =
        customerRentals.filter(
            rental =>
                normalizeStatus(rental.status)
                === "COMPLETED"
        ).length;


    const totalPaid =
        customerPayments
            .filter(payment =>
                normalizeStatus(payment.paymentStatus)
                === "PAID"
            )
            .reduce(
                (sum, payment) =>
                    sum + Number(payment.amount || 0),
                0
            );


    setText(
        "totalRentals",
        total
    );

    setText(
        "activeRentals",
        active
    );

    setText(
        "completedRentals",
        completed
    );

    setText(
        "totalPaid",
        formatCurrency(totalPaid)
    );

}


/* =========================================================
   RENTAL STATUS
========================================================= */

function createRentalStatusChart() {

    const canvas =
        document.getElementById(
            "rentalStatusChart"
        );

    if (!canvas) {
        return;
    }


    const statusCounts = {

        PENDING: 0,

        ONGOING: 0,

        COMPLETED: 0,

        CANCELLED: 0

    };


    customerRentals.forEach(rental => {

        const status =
            normalizeStatus(
                rental.status
            );


        if (statusCounts.hasOwnProperty(status)) {

            statusCounts[status]++;

        }

    });


    if (rentalStatusChart) {

        rentalStatusChart.destroy();

    }


    rentalStatusChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Pending",
                    "Ongoing",
                    "Completed",
                    "Cancelled"
                ],

                datasets: [{

                    data: [

                        statusCounts.PENDING,

                        statusCounts.ONGOING,

                        statusCounts.COMPLETED,

                        statusCounts.CANCELLED

                    ],

                    backgroundColor: [

                        "#f59e0b",

                        "#3b82f6",

                        "#22c55e",

                        "#ef4444"

                    ],

                    borderWidth: 0,

                    hoverOffset: 6

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "68%",

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            usePointStyle: true,

                            pointStyle: "circle",

                            padding: 16,

                            font: {

                                size: 11

                            }

                        }

                    }

                }

            }

        });

}


/* =========================================================
   PAYMENT STATUS CHART
========================================================= */

function createPaymentStatusChart() {

    const canvas =
        document.getElementById(
            "paymentStatusChart"
        );

    if (!canvas) {
        return;
    }


    const statusCounts = {

        PENDING: 0,

        PAID: 0,

        REFUNDED: 0

    };


    customerPayments.forEach(payment => {

        const status =
            normalizeStatus(
                payment.paymentStatus
            );


        if (statusCounts.hasOwnProperty(status)) {

            statusCounts[status]++;

        }

    });


    if (paymentStatusChart) {

        paymentStatusChart.destroy();

    }


    paymentStatusChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [

                    "Pending",

                    "Paid",

                    "Refunded"

                ],

                datasets: [{

                    label: "Payments",

                    data: [

                        statusCounts.PENDING,

                        statusCounts.PAID,

                        statusCounts.REFUNDED

                    ],

                    backgroundColor: [

                        "#f59e0b",

                        "#22c55e",

                        "#6366f1"

                    ],

                    borderRadius: 7,

                    borderSkipped: false,

                    maxBarThickness: 45

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    x: {

                        grid: {

                            display: false

                        },

                        ticks: {

                            font: {

                                size: 11

                            }

                        }

                    },

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0,

                            font: {

                                size: 10

                            }

                        },

                        grid: {

                            color: "#f0f1f4"

                        }

                    }

                }

            }

        });

}


/* =========================================================
   UPCOMING RENTAL
========================================================= */

function renderUpcomingRental() {

    const container =
        document.getElementById(
            "upcomingRentalContainer"
        );

    if (!container) {
        return;
    }


    const activeRentals =
        customerRentals
            .filter(rental =>
                isActiveRental(rental)
            )
            .sort(
                (a, b) =>
                    new Date(a.endDate) -
                    new Date(b.endDate)
            );


    if (activeRentals.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="bi bi-calendar-x"></i>
                </div>

                <h4>
                    No upcoming rentals
                </h4>

                <p>
                    You don't have any active rental
                    at the moment.
                </p>

            </div>

        `;

        return;
    }


    const rental =
        activeRentals[0];


    const vehicleName =
        getVehicleDisplayName(rental);


    const vehicleNumber =
        getVehicleNumber(rental);


    container.innerHTML = `

        <div class="upcoming-rental">

            <div class="upcoming-vehicle">

                <div class="vehicle-placeholder">

                    <i class="bi bi-car-front-fill"></i>

                </div>

                <div>

                    <strong>
                        ${escapeHtml(vehicleName)}
                    </strong>

                    <span>
                        ${escapeHtml(vehicleNumber)}
                    </span>

                </div>

            </div>


            <div class="upcoming-details">

                <div class="detail-item">

                    <span>
                        Return Date
                    </span>

                    <strong>
                        ${formatDate(rental.endDate)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Rental Status
                    </span>

                    <strong>
                        ${formatStatus(rental.status)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Start Date
                    </span>

                    <strong>
                        ${formatDate(rental.startDate)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Total Amount
                    </span>

                    <strong>
                        ${formatCurrency(
                            rental.totalAmount
                        )}
                    </strong>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   RECENT RENTALS
========================================================= */

function renderRecentRentals() {

    const container =
        document.getElementById(
            "recentRentalsList"
        );

    if (!container) {
        return;
    }


    const recent =
        [...customerRentals]
            .sort(
                (a, b) =>
                    new Date(
                        b.startDate || 0
                    ) -
                    new Date(
                        a.startDate || 0
                    )
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="bi bi-car-front"></i>
                </div>

                <h4>
                    No rentals yet
                </h4>

                <p>
                    Your rental history will appear here.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        recent.map(rental => {

            const vehicleName =
                getVehicleDisplayName(rental);

            const vehicleNumber =
                getVehicleNumber(rental);

            const status =
                normalizeStatus(
                    rental.status
                );


            return `

                <div class="rental-row">

                    <div class="rental-info">

                        <div class="rental-icon">

                            <i class="bi bi-car-front-fill"></i>

                        </div>

                        <div class="rental-text">

                            <strong>
                                ${escapeHtml(
                                    vehicleName
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    vehicleNumber
                                )}
                                •
                                ${formatDate(
                                    rental.startDate
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="rental-right">

                        <strong>
                            ${formatCurrency(
                                rental.totalAmount
                            )}
                        </strong>

                        <span
                            class="status-badge
                            ${getStatusClass(status)}">

                            ${formatStatus(
                                status
                            )}

                        </span>

                    </div>

                </div>

            `;

        }).join("");

}


/* =========================================================
   ACTIVE RENTAL CHECK
========================================================= */

function isActiveRental(rental) {

    const status =
        normalizeStatus(
            rental.status
        );


    return [

        "ONGOING",
        "ACTIVE",
        "RENTED"

    ].includes(status);

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    switch (normalizeStatus(status)) {

        case "ONGOING":
        case "ACTIVE":
        case "RENTED":
            return "ongoing";

        case "COMPLETED":
            return "completed";

        case "PENDING":
            return "pending";

        case "CANCELLED":
            return "cancelled";

        default:
            return "pending";

    }

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(
        status || ""
    )
        .trim()
        .toUpperCase();

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    const value =
        normalizeStatus(status);

    if (!value) {
        return "Unknown";
    }


    return value
        .toLowerCase()
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/* =========================================================
   VEHICLE NAME
========================================================= */

function getVehicleDisplayName(rental) {

    /*
     * Current RentalDTO only guarantees vehicleId.
     * If backend later sends vehicle details,
     * these fields will also work.
     */

    if (rental.vehicle) {

        if (rental.vehicle.model) {

            return (
                rental.vehicle.model.modelName ||
                "Vehicle"
            );

        }

        return (
            rental.vehicle.vehicleNo ||
            "Vehicle"
        );

    }


    if (rental.vehicleName) {

        return rental.vehicleName;

    }


    return `Vehicle #${rental.vehicleId || "-"}`;

}


/* =========================================================
   VEHICLE NUMBER
========================================================= */

function getVehicleNumber(rental) {

    if (rental.vehicle?.vehicleNo) {

        return rental.vehicle.vehicleNo;

    }

    if (rental.vehicleNo) {

        return rental.vehicleNo;

    }

    return `Vehicle ID: ${rental.vehicleId || "-"}`;

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-LK",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount) {

    const value =
        Number(amount || 0);


    return "Rs. " +
        value.toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   LOADING
========================================================= */

function showDashboardLoading() {

    const upcoming =
        document.getElementById(
            "upcomingRentalContainer"
        );

    const recent =
        document.getElementById(
            "recentRentalsList"
        );


    if (upcoming) {

        upcoming.innerHTML = `

            <div class="loading-state">

                <div class="spinner-border"
                     role="status">
                </div>

                <span>
                    Loading dashboard...
                </span>

            </div>

        `;

    }


    if (recent) {

        recent.innerHTML = `

            <div class="loading-state">

                <div class="spinner-border"
                     role="status">
                </div>

                <span>
                    Loading rentals...
                </span>

            </div>

        `;

    }

}


/* =========================================================
   ERROR
========================================================= */

function showDashboardError(error) {

    const message =
        error?.message ||
        "Unable to load dashboard data.";


    const upcoming =
        document.getElementById(
            "upcomingRentalContainer"
        );


    const recent =
        document.getElementById(
            "recentRentalsList"
        );


    if (upcoming) {

        upcoming.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="bi bi-exclamation-circle"></i>
                </div>

                <h4>
                    Unable to load data
                </h4>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        `;

    }


    if (recent) {

        recent.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="bi bi-exclamation-circle"></i>
                </div>

                <h4>
                    Unable to load rentals
                </h4>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;

    }

}