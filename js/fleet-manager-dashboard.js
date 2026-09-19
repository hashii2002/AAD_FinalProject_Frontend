/* =========================================================
   FLEET MANAGER DASHBOARD
========================================================= */

let vehicleStatusChart = null;
let rentalStatusChart = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /*
         * Auth protection
         */

        const hasAccess =
            checkRoleAccess(["FLEET_MANAGER"]);


        if (!hasAccess) {
            return;
        }


        /*
         * Load username
         */

        loadFleetManagerUser();


        /*
         * Load dashboard data
         */

        await loadFleetDashboard();

    }
);


/* =========================================================
   LOAD USER
========================================================= */

function loadFleetManagerUser() {

    const username =
        localStorage.getItem("username");


    const headerUsername =
        document.getElementById(
            "headerUsername"
        );


    const welcomeUsername =
        document.getElementById(
            "welcomeUsername"
        );


    if (username) {

        if (headerUsername) {

            headerUsername.textContent =
                username;

        }


        if (welcomeUsername) {

            welcomeUsername.textContent =
                username;

        }

    }

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadFleetDashboard() {

    const token =
        localStorage.getItem("accessToken");


    if (!token) {

        return;
    }


    const headers = {

        "Authorization":
            `Bearer ${token}`,

        "Content-Type":
            "application/json"

    };


    try {

        /*
         * Load all required data
         */

        const results =
            await Promise.all([

                fetch(
                    `${API_BASE_URL}/v1/vehicle/all`,
                    {
                        method: "GET",
                        headers: headers
                    }
                ),

                fetch(
                    `${API_BASE_URL}/v1/rental/all`,
                    {
                        method: "GET",
                        headers: headers
                    }
                ),

                fetch(
                    `${API_BASE_URL}/v1/customer/all`,
                    {
                        method: "GET",
                        headers: headers
                    }
                ),

                fetch(
                    `${API_BASE_URL}/v1/maintenance/all`,
                    {
                        method: "GET",
                        headers: headers
                    }
                ),

                fetch(
                    `${API_BASE_URL}/v1/vehicleDocument/all`,
                    {
                        method: "GET",
                        headers: headers
                    }
                )

            ]);


        const [
            vehicleResponse,
            rentalResponse,
            customerResponse,
            maintenanceResponse,
            documentResponse
        ] = results;


        /*
         * Check unauthorized
         */

        if (
            vehicleResponse.status === 401 ||
            rentalResponse.status === 401
        ) {

            logout();

            return;
        }


        /*
         * Parse responses
         */

        const vehicleData =
            await getResponseData(
                vehicleResponse
            );


        const rentalData =
            await getResponseData(
                rentalResponse
            );


        const customerData =
            await getResponseData(
                customerResponse
            );


        const maintenanceData =
            await getResponseData(
                maintenanceResponse
            );


        const documentData =
            await getResponseData(
                documentResponse
            );


        /*
         * Extract arrays
         */

        const vehicles =
            Array.isArray(vehicleData)
                ? vehicleData
                : [];


        const rentals =
            Array.isArray(rentalData)
                ? rentalData
                : [];


        const customers =
            Array.isArray(customerData)
                ? customerData
                : [];


        const maintenance =
            Array.isArray(maintenanceData)
                ? maintenanceData
                : [];


        const documents =
            Array.isArray(documentData)
                ? documentData
                : [];


        /*
         * Update statistics
         */

        updateVehicleStatistics(
            vehicles
        );


        updateRentalStatistics(
            rentals
        );


        updateElement(
            "totalCustomers",
            customers.length
        );


        updateElement(
            "maintenanceRecords",
            maintenance.length
        );


        updateElement(
            "totalDocuments",
            documents.length
        );


        /*
         * Charts
         */

        createVehicleStatusChart(
            vehicles
        );


        createRentalStatusChart(
            rentals
        );


        /*
         * Recent rentals
         */

        renderRecentRentals(
            rentals
        );


    } catch (error) {

        console.error(
            "Fleet Manager Dashboard Error:",
            error
        );

    }

}


/* =========================================================
   RESPONSE DATA
========================================================= */

async function getResponseData(response) {

    if (!response.ok) {

        return [];

    }


    const data =
        await response.json();


    /*
     * Backend CommonResponse:
     *
     * {
     *     status: 0,
     *     body: [...],
     *     message: "..."
     * }
     */

    return data.body || [];

}


/* =========================================================
   UPDATE VEHICLE STATISTICS
========================================================= */

function updateVehicleStatistics(
    vehicles
) {

    const total =
        vehicles.length;


    const available =
        vehicles.filter(
            vehicle =>
                vehicle.status === "AVAILABLE"
        ).length;


    const rented =
        vehicles.filter(
            vehicle =>
                vehicle.status === "RENTED"
        ).length;


    const maintenance =
        vehicles.filter(
            vehicle =>
                vehicle.status === "MAINTENANCE"
        ).length;


    updateElement(
        "totalVehicles",
        total
    );


    updateElement(
        "availableVehicles",
        available
    );


    updateElement(
        "rentedVehicles",
        rented
    );


    updateElement(
        "maintenanceVehicles",
        maintenance
    );

}


/* =========================================================
   UPDATE RENTAL STATISTICS
========================================================= */

function updateRentalStatistics(
    rentals
) {

    const active =
        rentals.filter(
            rental =>
                rental.status === "ONGOING"
        ).length;


    updateElement(
        "activeRentals",
        active
    );

}


/* =========================================================
   UPDATE ELEMENT
========================================================= */

function updateElement(
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
   VEHICLE STATUS CHART
========================================================= */

function createVehicleStatusChart(
    vehicles
) {

    const canvas =
        document.getElementById(
            "vehicleStatusChart"
        );


    if (!canvas) {

        return;
    }


    const available =
        vehicles.filter(
            vehicle =>
                vehicle.status === "AVAILABLE"
        ).length;


    const rented =
        vehicles.filter(
            vehicle =>
                vehicle.status === "RENTED"
        ).length;


    const maintenance =
        vehicles.filter(
            vehicle =>
                vehicle.status === "MAINTENANCE"
        ).length;


    const unavailable =
        vehicles.filter(
            vehicle =>
                vehicle.status === "UNAVAILABLE"
        ).length;


    const reserved =
        vehicles.filter(
            vehicle =>
                vehicle.status === "RESERVED"
        ).length;


    if (vehicleStatusChart) {

        vehicleStatusChart.destroy();

    }


    vehicleStatusChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: [

                        "Available",
                        "Rented",
                        "Maintenance",
                        "Unavailable",
                        "Reserved"

                    ],

                    datasets: [

                        {

                            data: [

                                available,
                                rented,
                                maintenance,
                                unavailable,
                                reserved

                            ],

                            backgroundColor: [

                                "#22c55e",
                                "#3b82f6",
                                "#f59e0b",
                                "#94a3b8",
                                "#8b5cf6"

                            ],

                            borderWidth: 0,

                            hoverOffset: 5

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "70%",

                    plugins: {

                        legend: {

                            display: false

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (context) {

                                        return (
                                            " " +
                                            context.label +
                                            ": " +
                                            context.raw
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );


    renderVehicleLegend([
        {
            label: "Available",
            value: available,
            color: "#22c55e"
        },
        {
            label: "Rented",
            value: rented,
            color: "#3b82f6"
        },
        {
            label: "Maintenance",
            value: maintenance,
            color: "#f59e0b"
        },
        {
            label: "Unavailable",
            value: unavailable,
            color: "#94a3b8"
        },
        {
            label: "Reserved",
            value: reserved,
            color: "#8b5cf6"
        }
    ]);

}


/* =========================================================
   VEHICLE LEGEND
========================================================= */

function renderVehicleLegend(
    items
) {

    const container =
        document.getElementById(
            "vehicleLegend"
        );


    if (!container) {

        return;
    }


    container.innerHTML = "";


    items.forEach(
        function (item) {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "fleet-legend-item";


            element.innerHTML = `

                <span
                    class="fleet-legend-dot"
                    style="background:${item.color}">
                </span>

                <span>
                    ${item.label}
                    (${item.value})
                </span>

            `;


            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   RENTAL STATUS CHART
========================================================= */

function createRentalStatusChart(
    rentals
) {

    const canvas =
        document.getElementById(
            "rentalStatusChart"
        );


    if (!canvas) {

        return;
    }


    const confirmed =
        rentals.filter(
            rental =>
                rental.status === "CONFIRMED"
        ).length;


    const ongoing =
        rentals.filter(
            rental =>
                rental.status === "ONGOING"
        ).length;


    const completed =
        rentals.filter(
            rental =>
                rental.status === "COMPLETED"
        ).length;


    const cancelled =
        rentals.filter(
            rental =>
                rental.status === "CANCELLED"
        ).length;


    const pending =
        rentals.filter(
            rental =>
                rental.status === "PENDING"
        ).length;


    if (rentalStatusChart) {

        rentalStatusChart.destroy();

    }


    rentalStatusChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [

                        "Confirmed",
                        "Ongoing",
                        "Completed",
                        "Cancelled",
                        "Pending"

                    ],

                    datasets: [

                        {

                            label:
                                "Rentals",

                            data: [

                                confirmed,
                                ongoing,
                                completed,
                                cancelled,
                                pending

                            ],

                            backgroundColor: [

                                "#22c55e",
                                "#3b82f6",
                                "#64748b",
                                "#ef4444",
                                "#f59e0b"

                            ],

                            borderRadius: 7,

                            borderSkipped: false,

                            barThickness: 28

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0,

                                color: "#9ca3af",

                                font: {

                                    size: 10

                                }

                            },

                            grid: {

                                color: "#f0eef4"

                            },

                            border: {

                                display: false

                            }

                        },

                        x: {

                            ticks: {

                                color: "#6b7280",

                                font: {

                                    size: 10

                                }

                            },

                            grid: {

                                display: false

                            },

                            border: {

                                display: false

                            }

                        }

                    },

                    plugins: {

                        legend: {

                            display: false

                        }

                    }

                }

            }
        );

}


/* =========================================================
   RECENT RENTALS
========================================================= */

function renderRecentRentals(
    rentals
) {

    const tbody =
        document.getElementById(
            "recentRentalsBody"
        );


    if (!tbody) {

        return;
    }


    /*
     * Sort latest first
     */

    const sorted =
        [...rentals].sort(
            function (a, b) {

                return (
                    new Date(
                        b.startDate
                    ) -
                    new Date(
                        a.startDate
                    )
                );

            }
        );


    const recent =
        sorted.slice(0, 5);


    if (recent.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="fleet-table-loading">

                    No rental records found.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML = "";


    recent.forEach(
        function (rental) {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                rental.status ||
                "UNKNOWN";


            const statusClass =
                getRentalStatusClass(
                    status
                );


            row.innerHTML = `

                <td>

                    <span class="rental-id">

                        #${rental.rentalId ?? "-"}

                    </span>

                </td>


                <td>

                    <span class="rental-vehicle">

                        Vehicle #${rental.vehicleId ?? "-"}

                    </span>

                </td>


                <td>

                    <span class="rental-customer">

                        Customer #${rental.customerId ?? "-"}

                    </span>

                </td>


                <td>

                    <span
                        class="fleet-status ${statusClass}">

                        ${formatStatus(status)}

                    </span>

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getRentalStatusClass(
    status
) {

    switch (status) {

        case "ONGOING":
            return "ongoing";

        case "CONFIRMED":
            return "confirmed";

        case "COMPLETED":
            return "completed";

        case "CANCELLED":
            return "cancelled";

        case "PENDING":
            return "pending";

        default:
            return "completed";

    }

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    status
) {

    if (!status) {

        return "-";
    }


    return status
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