document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    initializeDashboard();

});


let vehicleStatusChart;
let rentalStatusChart;
let revenueChart;
let categoryChart;


async function initializeDashboard() {

    try {

        showLoading();

        setupUserInformation();

        const [  vehicles,customers,drivers,rentals,payments,maintenance,reviews,categories] = await Promise.all([

            fetchData("/v1/vehicle/all"),
            fetchData("/v1/customer/all"),
            fetchData("/v1/driver/all"),
            fetchData("/v1/rental/all"),
            fetchData("/v1/payment/all"),
            fetchData("/v1/maintenance/all"),
            fetchData("/v1/review/all"),
            fetchData("/v1/category/all")

        ]);


        const dashboardData = {

            vehicles,
            customers,
            drivers,
            rentals,
            payments,
            maintenance,
            reviews,
            categories

        };


        updateStatistics(dashboardData);

        createVehicleStatusChart(vehicles);

        createRentalStatusChart(rentals);

        createRevenueChart(payments);

        createCategoryChart(vehicles, categories);

        loadRecentRentals(rentals);

        hideLoading();


    } catch (error) {

        console.error("Dashboard Error:", error);

        showDashboardError(
            error.message || "Unable to load dashboard data."
        );

    }

}


/* ================= API ================= */

async function fetchData(endpoint) {

    const token = localStorage.getItem("accessToken");

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );


    if (response.status === 401) {

        localStorage.clear();

        window.location.href = "index.html";

        throw new Error("Session expired. Please login again.");

    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access dashboard data."
        );

    }


    if (!response.ok) {

        throw new Error(
            `Failed to load ${endpoint}`
        );

    }


    const data = await response.json();

    return data.body || [];

}


/* ================= USER ================= */

function setupUserInformation() {

    const username =
        localStorage.getItem("username") || "User";

    document.getElementById("sidebarUsername")
        .textContent = username;

    document.getElementById("headerUsername")
        .textContent = username;

}


/* ================= STATISTICS ================= */

function updateStatistics(data) {

    const vehicles = data.vehicles || [];
    const customers = data.customers || [];
    const drivers = data.drivers || [];
    const rentals = data.rentals || [];
    const payments = data.payments || [];
    const maintenance = data.maintenance || [];
    const reviews = data.reviews || [];


    /* Vehicles */

    const availableVehicles =
        vehicles.filter(
            vehicle => vehicle.status === "AVAILABLE"
        ).length;


    document.getElementById("totalVehicles")
        .textContent = vehicles.length;

    document.getElementById("availableVehicles")
        .textContent = availableVehicles;


    /* Rentals */

    const activeRentalStatuses = [
        "PENDING",
        "CONFIRMED",
        "ONGOING",
        "ACTIVE"
    ];


    const activeRentals =
        rentals.filter(
            rental =>
                activeRentalStatuses.includes(
                    rental.status
                )
        ).length;


    document.getElementById("activeRentals")
        .textContent = activeRentals;


    /* Customers */

    document.getElementById("totalCustomers")
        .textContent = customers.length;


    /* Drivers */

    document.getElementById("totalDrivers")
        .textContent = drivers.length;


    /* Revenue */

    const paidPayments =
        payments.filter(
            payment =>
                payment.paymentStatus === "PAID"
        );


    const totalRevenue =
        paidPayments.reduce(
            (total, payment) =>
                total + Number(payment.amount || 0),
            0
        );


    document.getElementById("totalRevenue")
        .textContent = formatCurrency(totalRevenue);


    document.getElementById("chartRevenueTotal")
        .textContent = formatCurrency(totalRevenue);


    /* Pending payments */

    const pendingPayments =
        payments.filter(
            payment =>
                payment.paymentStatus === "PENDING"
        ).length;


    document.getElementById("pendingPayments")
        .textContent = pendingPayments;


    /* Maintenance */

    document.getElementById("maintenanceCount")
        .textContent = maintenance.length;


    /* Reviews */

    let averageRating = 0;

    if (reviews.length > 0) {

        const totalRating =
            reviews.reduce(
                (total, review) =>
                    total + Number(review.rating || 0),
                0
            );

        averageRating =
            totalRating / reviews.length;

    }


    document.getElementById("averageRating")
        .textContent = averageRating.toFixed(1);

}


/* ================= VEHICLE STATUS CHART ================= */

function createVehicleStatusChart(vehicles) {

    const statusCounts = {};


    vehicles.forEach(vehicle => {

        const status =
            vehicle.status || "UNKNOWN";

        statusCounts[status] =
            (statusCounts[status] || 0) + 1;

    });


    const labels =
        Object.keys(statusCounts);


    const values =
        Object.values(statusCounts);


    const canvas =
        document.getElementById("vehicleStatusChart");


    if (vehicleStatusChart) {
        vehicleStatusChart.destroy();
    }


    vehicleStatusChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [{

                    data: values,

                    borderWidth: 0

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
                            padding: 18
                        }

                    }

                }

            }

        });

}


/* ================= RENTAL STATUS ================= */

function createRentalStatusChart(rentals) {

    const statusCounts = {};


    rentals.forEach(rental => {

        const status =
            rental.status || "UNKNOWN";

        statusCounts[status] =
            (statusCounts[status] || 0) + 1;

    });


    const labels =
        Object.keys(statusCounts);


    const values =
        Object.values(statusCounts);


    const canvas =
        document.getElementById("rentalStatusChart");


    if (rentalStatusChart) {
        rentalStatusChart.destroy();
    }


    rentalStatusChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{

                    label: "Rentals",

                    data: values,

                    borderRadius: 8,

                    borderWidth: 0

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

                    y: {

                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        }

                    },

                    x: {

                        grid: {
                            display: false
                        }

                    }

                }

            }

        });

}


/* ================= REVENUE CHART ================= */

function createRevenueChart(payments) {

    const monthlyRevenue = {};

    const currentDate = new Date();


    /*
     * Last 6 months
     */

    for (let i = 5; i >= 0; i--) {

        const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
        );


        const key =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;


        monthlyRevenue[key] = 0;

    }


    payments
        .filter(
            payment =>
                payment.paymentStatus === "PAID"
        )
        .forEach(payment => {

            if (!payment.paymentDate) {
                return;
            }


            const date =
                new Date(payment.paymentDate);


            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;


            if (
                Object.prototype.hasOwnProperty.call(
                    monthlyRevenue,
                    key
                )
            ) {

                monthlyRevenue[key] +=
                    Number(payment.amount || 0);

            }

        });


    const labels =
        Object.keys(monthlyRevenue)
            .map(key => {

                const [year, month] =
                    key.split("-");

                const date =
                    new Date(
                        Number(year),
                        Number(month) - 1
                    );

                return date.toLocaleString(
                    "en-US",
                    {
                        month: "short"
                    }
                );

            });


    const values =
        Object.values(monthlyRevenue);


    const canvas =
        document.getElementById("revenueChart");


    if (revenueChart) {
        revenueChart.destroy();
    }


    revenueChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "Revenue",

                    data: values,

                    tension: 0.4,

                    fill: true,

                    pointRadius: 4,

                    pointHoverRadius: 6

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {

                    intersect: false,

                    mode: "index"

                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

                                return " Rs. " +
                                    Number(
                                        context.raw
                                    ).toLocaleString();

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function (value) {

                                return "Rs. " +
                                    Number(value)
                                        .toLocaleString();

                            }

                        }

                    },

                    x: {

                        grid: {
                            display: false
                        }

                    }

                }

            }

        });

}


/* ================= CATEGORY CHART ================= */

function createCategoryChart(
    vehicles,
    categories
) {

    const categoryMap = {};


    /*
     * VehicleDTO has categoryId.
     * CategoryDTO is expected to contain:
     *
     * categoryId
     * category
     *
     */

    categories.forEach(category => {

        categoryMap[category.categoryId] =
            category.category ||
            `Category ${category.categoryId}`;

    });


    const categoryCounts = {};


    vehicles.forEach(vehicle => {

        const categoryName =
            categoryMap[vehicle.categoryId] ||
            "Unknown";


        categoryCounts[categoryName] =
            (categoryCounts[categoryName] || 0) + 1;

    });


    const labels =
        Object.keys(categoryCounts);


    const values =
        Object.values(categoryCounts);


    const canvas =
        document.getElementById("categoryChart");


    if (categoryChart) {
        categoryChart.destroy();
    }


    categoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [{

                    data: values,

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "62%",

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }

                    }

                }

            }

        });

}


/* ================= RECENT RENTALS ================= */

function loadRecentRentals(rentals) {

    const tbody =
        document.getElementById(
            "recentRentalsBody"
        );


    tbody.innerHTML = "";


    if (!rentals || rentals.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    <i class="bi bi-calendar-x"></i>
                    <span>No rental records found.</span>
                </td>
            </tr>
        `;

        return;

    }


    const sortedRentals =
        [...rentals].sort(
            (a, b) =>
                new Date(b.startDate) -
                new Date(a.startDate)
        );


    const recentRentals =
        sortedRentals.slice(0, 5);


    recentRentals.forEach(rental => {

        const row =
            document.createElement("tr");


        const status =
            rental.status || "UNKNOWN";


        row.innerHTML = `

            <td>
                <strong>
                    #${rental.rentalId ?? "-"}
                </strong>
            </td>

            <td>
                Customer #${rental.customerId ?? "-"}
            </td>

            <td>
                Vehicle #${rental.vehicleId ?? "-"}
            </td>

            <td>
                ${formatDate(rental.startDate)}
            </td>

            <td>
                ${formatDate(rental.endDate)}
            </td>

            <td>
                <span class="status-badge ${getStatusClass(status)}">
                    ${formatStatus(status)}
                </span>
            </td>

            <td>
                <strong>
                    ${formatCurrency(
                        rental.totalAmount || 0
                    )}
                </strong>
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* ================= HELPERS ================= */

function formatCurrency(value) {

    return "Rs. " +
        Number(value || 0)
            .toLocaleString(
                "en-LK",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return "-";
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


function formatStatus(status) {

    return String(status)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


function getStatusClass(status) {

    switch (status) {

        case "AVAILABLE":
        case "PAID":
        case "COMPLETED":
            return "status-success";

        case "PENDING":
        case "RESERVED":
        case "ONGOING":
            return "status-warning";

        case "RENTED":
        case "CONFIRMED":
            return "status-info";

        case "MAINTENANCE":
        case "CANCELLED":
        case "REFUNDED":
            return "status-danger";

        default:
            return "status-neutral";

    }

}


/* ================= LOADING ================= */

function showLoading() {

    document
        .getElementById("dashboardLoading")
        .classList.remove("d-none");

    document
        .getElementById("dashboardContent")
        .classList.add("d-none");

}


function hideLoading() {

    document
        .getElementById("dashboardLoading")
        .classList.add("d-none");

    document
        .getElementById("dashboardContent")
        .classList.remove("d-none");

}


function showDashboardError(message) {

    document
        .getElementById("dashboardLoading")
        .classList.add("d-none");

    document
        .getElementById("dashboardError")
        .classList.remove("d-none");

    document
        .getElementById("dashboardErrorMessage")
        .textContent = message;

}


/* ================= MOBILE SIDEBAR ================= */

const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById(
        "sidebarOverlay"
    );


if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "sidebar-open"
            );

            sidebarOverlay.classList.toggle(
                "show"
            );

        }
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        function () {

            sidebar.classList.remove(
                "sidebar-open"
            );

            sidebarOverlay.classList.remove(
                "show"
            );

        }
    );

}


/* ================= LOGOUT ================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "userId"
            );

            localStorage.removeItem(
                "username"
            );

            localStorage.removeItem(
                "role"
            );

            window.location.href =
                "index.html";

        }
    );

}