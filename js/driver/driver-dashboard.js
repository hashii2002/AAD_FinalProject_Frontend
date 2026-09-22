/* =========================================================
   DRIVER DASHBOARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    checkRoleAccess(["DRIVER"]);

    initializeDashboard();

});


/* =========================================================
   GLOBAL DATA
========================================================= */

let driverProfile = null;
let assignedRentals = [];

let rentalStatusChart = null;
let assignmentBarChart = null;


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeDashboard() {

    setupSidebar();
    setupLogout();

    await Promise.all([
        loadDriverProfile(),
        loadAssignedRentals()
    ]);

    updateDashboard();

}


/* =========================================================
   DRIVER PROFILE
========================================================= */

async function loadDriverProfile() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/driver/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );


        if (!response.ok) {

            if (response.status === 401) {

                logout();

                return;
            }

            throw new Error(
                `Failed to load driver profile (${response.status})`
            );
        }


        const data = await response.json();


        if (data.status !== 0) {

            throw new Error(
                data.message || "Unable to load driver profile"
            );
        }


        driverProfile = data.body;


        renderDriverProfile();

    } catch (error) {

        console.error(
            "Driver profile error:",
            error
        );

        showDriverProfileError();

    }

}


/* =========================================================
   ASSIGNED RENTALS
========================================================= */

async function loadAssignedRentals() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/rentalDriver/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );


        if (!response.ok) {

            if (response.status === 401) {

                logout();

                return;
            }

            throw new Error(
                `Failed to load assigned rentals (${response.status})`
            );
        }


        const data = await response.json();


        if (data.status !== 0) {

            throw new Error(
                data.message ||
                "Unable to load assigned rentals"
            );
        }


        assignedRentals =
            Array.isArray(data.body)
                ? data.body
                : [];


    } catch (error) {

        console.error(
            "Assigned rentals error:",
            error
        );

        assignedRentals = [];

        showRentalLoadingError();

    }

}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard() {

    updateStatistics();

    updateCharts();

    renderRecentRentals();

    renderUpcomingRentals();

}


/* =========================================================
   DRIVER PROFILE RENDER
========================================================= */

function renderDriverProfile() {

    if (!driverProfile) {
        return;
    }


    const username =
        localStorage.getItem("username") ||
        "Driver";


    setText(
        "profileUsername",
        username
    );


    setText(
        "profileDriverId",
        driverProfile.driverId ?? "-"
    );


    setText(
        "profileLicense",
        driverProfile.licenseNo || "-"
    );


    const status =
        driverProfile.status || "UNKNOWN";


    setText(
        "driverStatus",
        formatEnum(status)
    );


    setText(
        "profileStatus",
        formatEnum(status)
    );


    applyStatusStyle(
        document.getElementById("profileStatus"),
        status
    );


    setText(
        "sidebarDriverName",
        username
    );


    setText(
        "topbarDriverName",
        username
    );


    setText(
        "welcomeDriverName",
        username
    );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        assignedRentals.length;


    const active =
        assignedRentals.filter(
            rental =>
                rental.status === "ONGOING"
        ).length;


    const completed =
        assignedRentals.filter(
            rental =>
                rental.status === "COMPLETED"
        ).length;


    setText(
        "totalAssignments",
        total
    );


    setText(
        "activeAssignments",
        active
    );


    setText(
        "completedAssignments",
        completed
    );

}


/* =========================================================
   CHART DATA
========================================================= */

function getRentalStatusCounts() {

    const statuses = [
        "PENDING",
        "CONFIRMED",
        "ONGOING",
        "COMPLETED",
        "CANCELLED"
    ];


    const counts = {};


    statuses.forEach(
        status => {
            counts[status] = 0;
        }
    );


    assignedRentals.forEach(
        rental => {

            const status =
                rental.status || "PENDING";


            if (counts[status] !== undefined) {

                counts[status]++;

            }

        }
    );


    return counts;

}


/* =========================================================
   CHARTS
========================================================= */

function updateCharts() {

    const counts =
        getRentalStatusCounts();


    renderDoughnutChart(counts);

    renderBarChart(counts);

}


/* =========================================================
   DOUGHNUT CHART
========================================================= */

function renderDoughnutChart(counts) {

    const canvas =
        document.getElementById(
            "rentalStatusChart"
        );


    const emptyMessage =
        document.getElementById(
            "chartEmptyMessage"
        );


    if (!canvas) {
        return;
    }


    const total =
        Object.values(counts)
            .reduce(
                (sum, value) =>
                    sum + value,
                0
            );


    if (total === 0) {

        canvas.style.display = "none";

        if (emptyMessage) {
            emptyMessage.style.display = "block";
        }

        return;
    }


    canvas.style.display = "block";

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }


    if (rentalStatusChart) {
        rentalStatusChart.destroy();
    }


    rentalStatusChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Pending",
                        "Confirmed",
                        "Ongoing",
                        "Completed",
                        "Cancelled"
                    ],

                    datasets: [
                        {
                            data: [
                                counts.PENDING,
                                counts.CONFIRMED,
                                counts.ONGOING,
                                counts.COMPLETED,
                                counts.CANCELLED
                            ],

                            backgroundColor: [
                                "#f5b84b",
                                "#5b8def",
                                "#7d2ae8",
                                "#32b76a",
                                "#e05252"
                            ],

                            borderWidth: 0,

                            hoverOffset: 5
                        }
                    ]

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

                                padding: 15,

                                font: {
                                    size: 10
                                }
                            }
                        },

                        tooltip: {

                            callbacks: {

                                label: function (context) {

                                    const value =
                                        context.raw || 0;

                                    const percentage =
                                        total > 0
                                            ? ((value / total) * 100)
                                                .toFixed(1)
                                            : 0;

                                    return `${context.label}: ${value} (${percentage}%)`;
                                }

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   BAR CHART
========================================================= */

function renderBarChart(counts) {

    const canvas =
        document.getElementById(
            "assignmentBarChart"
        );


    if (!canvas) {
        return;
    }


    if (assignmentBarChart) {
        assignmentBarChart.destroy();
    }


    assignmentBarChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: [
                        "Pending",
                        "Confirmed",
                        "Ongoing",
                        "Completed",
                        "Cancelled"
                    ],

                    datasets: [
                        {
                            label:
                                "Assigned Rentals",

                            data: [
                                counts.PENDING,
                                counts.CONFIRMED,
                                counts.ONGOING,
                                counts.COMPLETED,
                                counts.CANCELLED
                            ],

                            backgroundColor: [
                                "#f5b84b",
                                "#5b8def",
                                "#7d2ae8",
                                "#32b76a",
                                "#e05252"
                            ],

                            borderRadius: 7,

                            maxBarThickness: 45
                        }
                    ]

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
                                precision: 0,

                                font: {
                                    size: 10
                                }
                            },

                            grid: {
                                color: "#eeeeF2"
                            }

                        },

                        x: {

                            ticks: {

                                font: {
                                    size: 10
                                }

                            },

                            grid: {
                                display: false
                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   RECENT RENTALS
========================================================= */

function renderRecentRentals() {

    const container =
        document.getElementById(
            "recentRentalsContainer"
        );


    if (!container) {
        return;
    }


    if (!assignedRentals.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <p>No rental assignments found.</p>
            </div>
        `;

        return;
    }


    const rentals =
        [...assignedRentals]
            .sort(
                (a, b) =>
                    new Date(b.startDate || 0) -
                    new Date(a.startDate || 0)
            )
            .slice(0, 5);


    container.innerHTML =
        rentals
            .map(
                rental => {

                    const status =
                        rental.status || "PENDING";


                    return `
                        <div class="recent-rental">

                            <div class="rental-icon-box">
                                <i class="bi bi-car-front-fill"></i>
                            </div>

                            <div class="rental-main">

                                <strong>
                                    Rental #${rental.rentalId ?? "-"}
                                </strong>

                                <span>
                                    Vehicle #${rental.vehicleId ?? "-"}
                                    &nbsp;•&nbsp;
                                    ${formatDate(rental.startDate)}
                                </span>

                            </div>

                            <span
                                class="rental-status"
                                style="${getStatusStyle(status)}">

                                ${formatEnum(status)}

                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   UPCOMING RENTALS
========================================================= */

function renderUpcomingRentals() {

    const container =
        document.getElementById(
            "upcomingRentalsContainer"
        );


    if (!container) {
        return;
    }


    const now =
        new Date();


    const upcoming =
        assignedRentals
            .filter(
                rental => {

                    if (!rental.startDate) {
                        return false;
                    }

                    const start =
                        new Date(
                            rental.startDate
                        );

                    return start >= now &&
                        rental.status !== "CANCELLED" &&
                        rental.status !== "COMPLETED";
                }
            )
            .sort(
                (a, b) =>
                    new Date(a.startDate) -
                    new Date(b.startDate)
            )
            .slice(0, 5);


    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="bi bi-calendar2-check"></i>

                <p>
                    No upcoming assignments.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        upcoming
            .map(
                rental => {

                    const date =
                        new Date(
                            rental.startDate
                        );


                    const day =
                        date.getDate();


                    const month =
                        date.toLocaleString(
                            "en-US",
                            {
                                month: "short"
                            }
                        );


                    const status =
                        rental.status ||
                        "PENDING";


                    return `
                        <div class="upcoming-rental">

                            <div class="date-box">

                                <span class="day">
                                    ${day}
                                </span>

                                <span class="month">
                                    ${month.toUpperCase()}
                                </span>

                            </div>


                            <div class="upcoming-info">

                                <strong>
                                    Rental #${rental.rentalId ?? "-"}
                                </strong>

                                <span>
                                    Vehicle #${rental.vehicleId ?? "-"}
                                    &nbsp;•&nbsp;
                                    ${formatDate(
                                        rental.startDate
                                    )}
                                </span>

                            </div>


                            <span
                                class="rental-status"
                                style="${getStatusStyle(status)}">

                                ${formatEnum(status)}

                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById(
            "driverSidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    if (!sidebar || !overlay || !button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            sidebar.classList.add("show");

            overlay.classList.add("show");

        }
    );


    overlay.addEventListener(
        "click",
        closeSidebar
    );


    document
        .querySelectorAll(
            ".sidebar-link"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    function () {

                        closeSidebar();

                    }
                );

            }
        );


    window.addEventListener(
        "resize",
        function () {

            if (window.innerWidth > 900) {
                closeSidebar();
            }

        }
    );

}


function closeSidebar() {

    const sidebar =
        document.getElementById(
            "driverSidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    sidebar?.classList.remove("show");

    overlay?.classList.remove("show");

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            logout();

        }
    );

}


function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");

    window.location.href =
        "../../index.html";

}


/* =========================================================
   ERROR STATES
========================================================= */

function showDriverProfileError() {

    setText(
        "driverStatus",
        "Unavailable"
    );

    setText(
        "profileDriverId",
        "-"
    );

    setText(
        "profileLicense",
        "-"
    );

    setText(
        "profileStatus",
        "Unavailable"
    );

}


function showRentalLoadingError() {

    const container =
        document.getElementById(
            "recentRentalsContainer"
        );


    if (container) {

        container.innerHTML = `
            <div class="error-state">

                <i class="bi bi-exclamation-circle"></i>

                <span>
                    Unable to load rental assignments.
                </span>

            </div>
        `;

    }

}


/* =========================================================
   STATUS STYLE
========================================================= */

function applyStatusStyle(
    element,
    status
) {

    if (!element) {
        return;
    }


    const styles = {

        AVAILABLE: {
            background: "#e8f8ef",
            color: "#239654"
        },

        INACTIVE: {
            background: "#f1f1f3",
            color: "#70737b"
        },

        ON_TRIP: {
            background: "#eee7ff",
            color: "#7d2ae8"
        },

        OFF_DUTY: {
            background: "#fff1e8",
            color: "#d97931"
        }

    };


    const style =
        styles[status] ||
        {
            background: "#f1f1f3",
            color: "#666"
        };


    element.style.background =
        style.background;

    element.style.color =
        style.color;

}


function getStatusStyle(status) {

    const styles = {

        PENDING:
            "background:#fff4df;color:#c98412;",

        CONFIRMED:
            "background:#eaf2ff;color:#4777cf;",

        ONGOING:
            "background:#eee7ff;color:#7d2ae8;",

        COMPLETED:
            "background:#e8f8ef;color:#239654;",

        CANCELLED:
            "background:#fff0f0;color:#d34d4d;"

    };


    return styles[status] ||
        "background:#f1f1f3;color:#666;";
}


/* =========================================================
   FORMAT HELPERS
========================================================= */

function formatEnum(value) {

    if (!value) {
        return "-";
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


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


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
            value ?? "-";

    }

}