/* =========================================================
   DRIVEGO - DRIVER ASSIGNED RENTALS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    checkRoleAccess(["DRIVER"]);

    initializePage();

});


/* =========================================================
   GLOBAL DATA
========================================================= */

let allRentals = [];
let filteredRentals = [];

let rentalDetailsModal = null;


/* =========================================================
   INITIALIZE
========================================================= */

function initializePage() {

    loadDriverIdentity();

    setupSidebar();

    setupEvents();

    const modalElement =
        document.getElementById("rentalDetailsModal");

    if (modalElement) {
        rentalDetailsModal =
            new bootstrap.Modal(modalElement);
    }

    loadAssignedRentals();

}


/* =========================================================
   DRIVER IDENTITY
========================================================= */

function loadDriverIdentity() {

    const username =
        localStorage.getItem("username") || "Driver";


    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const headerUsername =
        document.getElementById("headerUsername");


    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (headerUsername) {
        headerUsername.textContent = username;
    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById("driverSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");


    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener(
            "click",
            function () {

                sidebar.classList.add("open");

                overlay.classList.add("show");

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(function (item) {

            item.addEventListener(
                "click",
                closeSidebar
            );

        });


    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function () {

                if (typeof logout === "function") {

                    logout();

                } else {

                    localStorage.clear();

                    window.location.href =
                        "../../index.html";

                }

            }
        );

    }

}


function closeSidebar() {

    const sidebar =
        document.getElementById("driverSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (overlay) {
        overlay.classList.remove("show");
    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");

    const clearFilters =
        document.getElementById("clearFilters");

    const retryBtn =
        document.getElementById("retryBtn");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (clearFilters) {

        clearFilters.addEventListener(
            "click",
            clearAllFilters
        );

    }


    if (retryBtn) {

        retryBtn.addEventListener(
            "click",
            loadAssignedRentals
        );

    }

}


/* =========================================================
   LOAD ASSIGNED RENTALS
========================================================= */

async function loadAssignedRentals() {

    showLoading();


    try {

        const token =
            localStorage.getItem("accessToken");


        if (!token) {

            throw new Error(
                "Authentication token not found."
            );

        }


        const response =
            await fetch(
                `${API_BASE_URL}/v1/rentalDriver/me`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        if (response.status === 401) {

            localStorage.clear();

            window.location.href =
                "../../index.html";

            return;

        }


        if (response.status === 403) {

            throw new Error(
                "You do not have permission to view assigned rentals."
            );

        }


        if (!response.ok) {

            let message =
                "Failed to load assigned rentals.";

            try {

                const errorData =
                    await response.json();

                message =
                    errorData.message ||
                    errorData.body ||
                    message;

            } catch (e) {
                // Ignore invalid JSON
            }

            throw new Error(message);

        }


        const data =
            await response.json();


        if (data.status !== 0) {

            throw new Error(
                data.message ||
                "Unable to retrieve assigned rentals."
            );

        }


        allRentals =
            Array.isArray(data.body)
                ? data.body
                : [];


        filteredRentals =
            [...allRentals];


        updateSummary();

        applyFilters();

        hideLoading();


    } catch (error) {

        console.error(
            "Assigned rentals loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load assigned rentals."
        );

    }

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const total =
        allRentals.length;


    const active =
        allRentals.filter(function (rental) {

            return String(
                rental.status || ""
            ).toUpperCase() === "ONGOING";

        }).length;


    const upcoming =
        allRentals.filter(function (rental) {

            const status =
                String(
                    rental.status || ""
                ).toUpperCase();

            return (
                status === "PENDING" ||
                status === "CONFIRMED"
            );

        }).length;


    const completed =
        allRentals.filter(function (rental) {

            return String(
                rental.status || ""
            ).toUpperCase() === "COMPLETED";

        }).length;


    setText(
        "totalRentals",
        total
    );

    setText(
        "activeRentals",
        active
    );

    setText(
        "upcomingRentals",
        upcoming
    );

    setText(
        "completedRentals",
        completed
    );

}


/* =========================================================
   FILTER
========================================================= */

function applyFilters() {

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");


    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();


    const status =
        (
            statusFilter?.value ||
            "ALL"
        ).toUpperCase();


    filteredRentals =
        allRentals.filter(function (rental) {


            /* -----------------------------------------
               SEARCH
            ----------------------------------------- */

            const rentalId =
                String(
                    rental.rentalId ?? ""
                ).toLowerCase();


            const vehicleId =
                String(
                    rental.vehicleId ?? ""
                ).toLowerCase();


            const customerId =
                String(
                    rental.customerId ?? ""
                ).toLowerCase();


            const vehicleNo =
                String(
                    rental.vehicle?.vehicleNo ?? ""
                ).toLowerCase();


            const brandName =
                String(
                    rental.vehicle?.brandName ?? ""
                ).toLowerCase();


            const modelName =
                String(
                    rental.vehicle?.modelName ?? ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                rentalId.includes(search) ||
                vehicleId.includes(search) ||
                customerId.includes(search) ||
                vehicleNo.includes(search) ||
                brandName.includes(search) ||
                modelName.includes(search);


            /* -----------------------------------------
               STATUS
            ----------------------------------------- */

            const rentalStatus =
                String(
                    rental.status || ""
                ).toUpperCase();


            const matchesStatus =
                status === "ALL" ||
                rentalStatus === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderRentals();

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearAllFilters() {

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");


    if (searchInput) {
        searchInput.value = "";
    }


    if (statusFilter) {
        statusFilter.value = "ALL";
    }


    applyFilters();

}


/* =========================================================
   RENDER RENTALS
========================================================= */

function renderRentals() {

    const container =
        document.getElementById(
            "rentalsContainer"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    updateRentalCount();


    if (filteredRentals.length === 0) {

        container.style.display = "none";

        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;

    }


    if (emptyState) {
        emptyState.style.display = "none";
    }


    container.style.display = "flex";


    filteredRentals.forEach(
        function (rental) {

            container.appendChild(
                createRentalCard(rental)
            );

        }
    );

}


/* =========================================================
   CREATE RENTAL CARD
========================================================= */

function createRentalCard(rental) {

    const card =
        document.createElement("article");

    card.className =
        "rental-card";


    const vehicle =
        rental.vehicle || {};


    const status =
        String(
            rental.status || "UNKNOWN"
        ).toUpperCase();


    const statusClass =
        getStatusClass(status);


    const statusText =
        formatEnum(status);


    const vehicleName =
        buildVehicleName(vehicle);


    const startDate =
        formatDateTime(
            rental.startDate
        );


    const endDate =
        formatDateTime(
            rental.endDate
        );


    const rentalDays =
        rental.rentalDays ??
        calculateRentalDays(
            rental.startDate,
            rental.endDate
        );


    card.innerHTML = `

        <!-- Vehicle -->
        <div class="rental-main">

            <div class="vehicle-icon">
                <i class="bi bi-car-front-fill"></i>
            </div>

            <div class="rental-main-content">

                <div class="rental-number">
                    RENTAL #${escapeHtml(
                        rental.rentalId ?? "-"
                    )}
                </div>

                <h3 class="vehicle-name">
                    ${escapeHtml(vehicleName)}
                </h3>

                <div class="vehicle-meta">

                    <span>
                        <i class="bi bi-car-front"></i>
                        Vehicle #${escapeHtml(
                            rental.vehicleId ?? "-"
                        )}
                    </span>

                    ${
                        vehicle.vehicleNo
                            ? `
                            <span>
                                <i class="bi bi-upc-scan"></i>
                                ${escapeHtml(
                                    vehicle.vehicleNo
                                )}
                            </span>
                            `
                            : ""
                    }

                    <span>
                        <i class="bi bi-calendar3"></i>
                        ${escapeHtml(
                            rentalDays ?? "-"
                        )} days
                    </span>

                </div>

            </div>

        </div>


        <!-- Dates -->
        <div class="rental-dates">

            <div class="date-item">

                <div class="date-icon">
                    <i class="bi bi-calendar-plus"></i>
                </div>

                <div class="date-text">

                    <span>PICKUP</span>

                    <strong>
                        ${escapeHtml(startDate)}
                    </strong>

                </div>

            </div>


            <div class="date-item">

                <div class="date-icon">
                    <i class="bi bi-calendar-minus"></i>
                </div>

                <div class="date-text">

                    <span>RETURN</span>

                    <strong>
                        ${escapeHtml(endDate)}
                    </strong>

                </div>

            </div>

        </div>


        <!-- Customer -->
        <div class="rental-customer">

            <span class="info-label">
                CUSTOMER
            </span>

            <span class="customer-id">
                #${escapeHtml(
                    rental.customerId ?? "-"
                )}
            </span>

            <span class="rental-days">

                <i class="bi bi-person"></i>

                Assigned Customer

            </span>

        </div>


        <!-- Action -->
        <div class="rental-action">

            <span class="status-badge ${statusClass}">
                ${escapeHtml(statusText)}
            </span>

            <button
                    type="button"
                    class="details-btn"
                    data-rental-id="${escapeHtml(
                        rental.rentalId
                    )}">

                <i class="bi bi-eye"></i>

                Details

            </button>

        </div>

    `;


    const detailsBtn =
        card.querySelector(
            ".details-btn"
        );


    if (detailsBtn) {

        detailsBtn.addEventListener(
            "click",
            function () {

                openRentalDetails(
                    rental
                );

            }
        );

    }


    return card;

}


/* =========================================================
   OPEN RENTAL DETAILS
========================================================= */

function openRentalDetails(rental) {

    if (!rentalDetailsModal) {
        return;
    }


    const vehicle =
        rental.vehicle || {};


    const status =
        String(
            rental.status || "-"
        ).toUpperCase();


    /* -----------------------------------------
       BASIC
    ----------------------------------------- */

    setText(
        "modalRentalId",
        rental.rentalId ?? "-"
    );


    const statusElement =
        document.getElementById(
            "modalStatus"
        );


    if (statusElement) {

        statusElement.textContent =
            formatEnum(status);

        statusElement.className =
            `status-badge ${getStatusClass(status)}`;

    }


    /* -----------------------------------------
       VEHICLE
    ----------------------------------------- */

    setText(
        "modalVehicleId",
        vehicle.vehicleId ??
        rental.vehicleId ??
        "-"
    );


    setText(
        "modalVehicleNo",
        vehicle.vehicleNo ??
        "-"
    );


    setText(
        "modalBrand",
        vehicle.brandName ??
        "-"
    );


    setText(
        "modalModel",
        vehicle.modelName ??
        "-"
    );


    setText(
        "modalCategory",
        formatEnum(
            vehicle.categoryName
        )
    );


    setText(
        "modalYear",
        vehicle.year ??
        "-"
    );


    setText(
        "modalColor",
        vehicle.color ??
        "-"
    );


    setText(
        "modalFuel",
        formatEnum(
            vehicle.fuelType
        )
    );


    setText(
        "modalTransmission",
        formatEnum(
            vehicle.transmissionType
        )
    );


    setText(
        "modalSeats",
        vehicle.seatingCapacity ??
        "-"
    );


    /* -----------------------------------------
       RENTAL
    ----------------------------------------- */

    setText(
        "modalCustomerId",
        rental.customerId ??
        "-"
    );


    setText(
        "modalRentalDays",
        rental.rentalDays ??
        calculateRentalDays(
            rental.startDate,
            rental.endDate
        ) ??
        "-"
    );


    setText(
        "modalStartDate",
        formatDateTime(
            rental.startDate
        )
    );


    setText(
        "modalEndDate",
        formatDateTime(
            rental.endDate
        )
    );


    setText(
        "modalPickupMileage",
        formatMileage(
            rental.pickupMileage
        )
    );


    setText(
        "modalReturnMileage",
        formatMileage(
            rental.returnMileage
        )
    );


    setText(
        "modalDriverOption",
        formatEnum(
            rental.driverOption
        )
    );


    setText(
        "modalDriverId",
        rental.driverId ??
        "-"
    );


    setText(
        "modalRateId",
        rental.rentalRateId ??
        "-"
    );


    rentalDetailsModal.show();

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    switch (
        String(status || "")
            .toUpperCase()
    ) {

        case "PENDING":
            return "status-pending";

        case "CONFIRMED":
            return "status-confirmed";

        case "ONGOING":
            return "status-ongoing";

        case "COMPLETED":
            return "status-completed";

        case "CANCELLED":
            return "status-cancelled";

        default:
            return "status-confirmed";

    }

}


/* =========================================================
   ENUM FORMAT
========================================================= */

function formatEnum(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }


    return String(value)
        .toLowerCase()
        .split("_")
        .map(function (word) {

            return word.charAt(0).toUpperCase() +
                word.slice(1);

        })
        .join(" ");

}


/* =========================================================
   VEHICLE NAME
========================================================= */

function buildVehicleName(vehicle) {

    const brand =
        vehicle.brandName || "";

    const model =
        vehicle.modelName || "";


    const combined =
        `${brand} ${model}`.trim();


    if (combined) {
        return combined;
    }


    if (vehicle.vehicleNo) {
        return `Vehicle ${vehicle.vehicleNo}`;
    }


    if (vehicle.vehicleId) {
        return `Vehicle #${vehicle.vehicleId}`;
    }


    return "Assigned Vehicle";

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return String(value);

    }


    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   RENTAL DAYS
========================================================= */

function calculateRentalDays(
    startDate,
    endDate
) {

    if (!startDate || !endDate) {
        return null;
    }


    const start =
        new Date(startDate);

    const end =
        new Date(endDate);


    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return null;
    }


    const difference =
        end.getTime() -
        start.getTime();


    if (difference < 0) {
        return null;
    }


    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );

}


/* =========================================================
   MILEAGE
========================================================= */

function formatMileage(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return String(value);
    }


    return number.toLocaleString(
        "en-US"
    ) + " km";

}


/* =========================================================
   RENTAL COUNT
========================================================= */

function updateRentalCount() {

    const rentalCount =
        document.getElementById(
            "rentalCount"
        );


    if (!rentalCount) {
        return;
    }


    const count =
        filteredRentals.length;


    rentalCount.textContent =
        `${count} ${count === 1 ? "rental" : "rentals"}`;

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    const loading =
        document.getElementById(
            "loadingState"
        );

    const error =
        document.getElementById(
            "errorState"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );

    const container =
        document.getElementById(
            "rentalsContainer"
        );


    if (loading) {
        loading.style.display = "block";
    }

    if (error) {
        error.style.display = "none";
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (container) {
        container.style.display = "none";
    }

}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(message) {

    const loading =
        document.getElementById(
            "loadingState"
        );

    const error =
        document.getElementById(
            "errorState"
        );

    const container =
        document.getElementById(
            "rentalsContainer"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (loading) {
        loading.style.display = "none";
    }

    if (container) {
        container.style.display = "none";
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.textContent =
            message;
    }

    if (error) {
        error.style.display = "block";
    }

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
            value === null ||
            value === undefined ||
            value === ""
                ? "-"
                : value;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function hideLoading() {

    loadingState.classList.add("d-none");

    errorState.classList.add("d-none");

    emptyState.classList.add("d-none");

    rentalsContainer.classList.remove("d-none");
}