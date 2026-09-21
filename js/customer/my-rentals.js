/* =========================================================
   MY RENTALS - CUSTOMER
========================================================= */

let allRentals = [];
let filteredRentals = [];

let rentalDetailsModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    checkRoleAccess(["CUSTOMER"]);
    loadCustomerUser();

    const modalElement = document.getElementById("rentalDetailsModal");

    if (modalElement) {
        rentalDetailsModal =
            new bootstrap.Modal(modalElement);
    }

    setupEventListeners();
    await loadMyRentals();

});


/* =========================================================
   LOAD CUSTOMER USER
========================================================= */

function loadCustomerUser() {

    const username =
        localStorage.getItem("username") || "Customer";


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


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    const searchInput =
        document.getElementById("rentalSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const clearFilterBtn =
        document.getElementById("clearFilterBtn");

    const refreshButton =
        document.getElementById("refreshRentalsBtn");

    const retryButton =
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


    if (clearFilterBtn) {

        clearFilterBtn.addEventListener(
            "click",
            clearFilters
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadMyRentals
        );

    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadMyRentals
        );

    }

}

/* =========================================================
   LOAD MY RENTALS
========================================================= */

async function loadMyRentals() {

    showLoading();

    hideError();
    hideEmpty();

    const token =
        localStorage.getItem("accessToken");


    if (!token) {

        showError(
            "Your session has expired. Please login again."
        );

        return;

    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/rental/me`,
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


        if (!response.ok) {

            if (response.status === 401) {

                showError(
                    "Your session has expired. Please login again."
                );

                return;

            }


            if (response.status === 403) {

                showError(
                    "You are not authorized to view your rentals."
                );

                return;

            }


            throw new Error(
                `Request failed with status ${response.status}`
            );

        }


        const data =
            await response.json();

        allRentals =
            Array.isArray(data?.body)
                ? data.body
                : [];


        filteredRentals =
            [...allRentals];


        updateSummary();

        applyFilters();


    } catch (error) {

        console.error(
            "Load rentals error:",
            error
        );


        showError(
            "Unable to load your rentals. Please try again."
        );

    } finally {

        hideLoading();

    }

}

/* =========================================================
   APPLY FILTERS
========================================================= */
function applyFilters() {

    const searchInput =
        document.getElementById("rentalSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const searchTerm =
        normalizeSearchText(
            searchInput?.value || ""
        );


    const selectedStatus =
        statusFilter?.value || "ALL";


    filteredRentals =
        allRentals.filter(rental => {

            const rentalId =
                rental.rentalId ?? "";

            const vehicleId =
                rental.vehicleId ?? "";

            const rentalSearchText =
                normalizeSearchText(
                    `RENTAL #${rentalId}`
                );


            const vehicleSearchText =
                normalizeSearchText(
                    `Vehicle #${vehicleId}`
                );

            const matchesSearch =
                !searchTerm ||
                rentalSearchText.includes(searchTerm) ||
                vehicleSearchText.includes(searchTerm);


            const status =
                String(
                    rental.status || ""
                ).toUpperCase();


            const matchesStatus =
                selectedStatus === "ALL" ||
                status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    updateResultCount();

    renderRentals();
}


/* =========================================================
   NORMALIZE SEARCH TEXT
========================================================= */
function normalizeSearchText(value) {

    return String(value)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    const searchInput =
        document.getElementById("rentalSearch");

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
   UPDATE SUMMARY
========================================================= */

function updateSummary() {

    const total =
        allRentals.length;


    const active =
        allRentals.filter(
            rental =>
                String(rental.status || "")
                    .toUpperCase() === "ONGOING"
        ).length;


    const upcoming =
        allRentals.filter(rental => {

            const status =
                String(rental.status || "")
                    .toUpperCase();

            return (
                status === "PENDING" ||
                status === "CONFIRMED"
            );

        }).length;


    const completed =
        allRentals.filter(
            rental =>
                String(rental.status || "")
                    .toUpperCase() === "COMPLETED"
        ).length;


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
   RESULT COUNT
========================================================= */

function updateResultCount() {

    const resultCount =
        document.getElementById("resultCount");


    if (!resultCount) {
        return;
    }


    const count =
        filteredRentals.length;


    resultCount.textContent =
        `${count} rental${count === 1 ? "" : "s"}`;

}


/* =========================================================
   RENDER RENTALS
========================================================= */

function renderRentals() {

    const rentalsList =
        document.getElementById("rentalsList");


    if (!rentalsList) {
        return;
    }


    rentalsList.innerHTML = "";


    if (filteredRentals.length === 0) {

        rentalsList.classList.add("d-none");

        showEmpty();

        return;

    }


    hideEmpty();

    rentalsList.classList.remove("d-none");


    filteredRentals.forEach(
        rental => {

            const card =
                createRentalCard(rental);

            rentalsList.appendChild(card);

        }
    );

}


/* =========================================================
   CREATE RENTAL CARD
========================================================= */

function createRentalCard(rental) {

    const card =
        document.createElement("div");


    card.className =
        "rental-card";


    const rentalId =
        rental.rentalId ?? "-";


    const vehicleId =
        rental.vehicleId ?? "-";


    const status =
        String(
            rental.status || "UNKNOWN"
        ).toUpperCase();


    const startDate =
        formatDateTime(
            rental.startDate
        );


    const endDate =
        formatDateTime(
            rental.endDate
        );


    const totalAmount =
        formatCurrency(
            rental.totalAmount
        );


    const depositAmount =
        formatCurrency(
            rental.depositAmount
        );


    const rentalDays =
        rental.rentalDays ??
        calculateRentalDays(
            rental.startDate,
            rental.endDate
        );


    const pickupMileage =
        formatMileage(
            rental.pickupMileage
        );


    const returnMileage =
        formatMileage(
            rental.returnMileage
        );


    card.innerHTML = `

        <div class="rental-card-main">


            <!-- VEHICLE -->

            <div class="rental-vehicle-section">

                <div class="vehicle-placeholder">

                    <i class="bi bi-car-front-fill"></i>

                </div>


                <div class="rental-vehicle-info">

                    <div class="rental-number">
                        RENTAL #${escapeHtml(rentalId)}
                    </div>

                    <h3 class="rental-vehicle-title">
                        Vehicle #${escapeHtml(vehicleId)}
                    </h3>

                    <div class="rental-vehicle-meta">

                        <span>
                            <i class="bi bi-calendar3"></i>
                            ${escapeHtml(String(rentalDays || 0))}
                            day${Number(rentalDays) === 1 ? "" : "s"}
                        </span>

                        <span>
                            <i class="bi bi-speedometer2"></i>
                            Pickup:
                            ${escapeHtml(pickupMileage)}
                        </span>

                    </div>

                </div>

            </div>


            <!-- DATES -->

            <div class="rental-date-section">


                <div class="date-row">

                    <div class="date-icon">
                        <i class="bi bi-calendar-plus"></i>
                    </div>

                    <div class="date-info">

                        <span>Pickup</span>

                        <strong>
                            ${escapeHtml(startDate)}
                        </strong>

                    </div>

                </div>


                <div class="date-row">

                    <div class="date-icon">
                        <i class="bi bi-calendar-minus"></i>
                    </div>

                    <div class="date-info">

                        <span>Return</span>

                        <strong>
                            ${escapeHtml(endDate)}
                        </strong>

                    </div>

                </div>


            </div>


            <!-- AMOUNT -->

            <div class="rental-amount-section">

                <span class="amount-label">
                    Total Amount
                </span>

                <strong class="amount-value">
                    ${escapeHtml(totalAmount)}
                </strong>

                <span class="deposit-value">
                    Deposit: ${escapeHtml(depositAmount)}
                </span>

            </div>


            <!-- ACTION -->

            <div class="rental-action-section">

                <span class="status-badge ${getStatusClass(status)}">

                    ${escapeHtml(formatStatus(status))}

                </span>


                <button
                    type="button"
                    class="view-details-btn"
                    onclick="showRentalDetails(${rentalId})">

                    <i class="bi bi-eye"></i>
                    Details

                </button>

            </div>


        </div>

    `;


    return card;

}


/* =========================================================
   SHOW RENTAL DETAILS
========================================================= */

function showRentalDetails(rentalId) {

    const rental =
        allRentals.find(
            item =>
                Number(item.rentalId) ===
                Number(rentalId)
        );


    if (!rental) {

        showToast(
            "Rental details could not be found."
        );

        return;

    }


    const modalTitle =
        document.getElementById(
            "modalRentalTitle"
        );


    const modalContent =
        document.getElementById(
            "modalRentalContent"
        );


    if (!modalTitle || !modalContent) {
        return;
    }


    const status =
        String(
            rental.status || "UNKNOWN"
        ).toUpperCase();


    const rentalDays =
        rental.rentalDays ??
        calculateRentalDays(
            rental.startDate,
            rental.endDate
        );


    modalTitle.textContent =
        `Rental #${rental.rentalId}`;


    modalContent.innerHTML = `

        <div class="rental-detail-grid">


            <div class="detail-item">

                <span>Rental ID</span>

                <strong>
                    #${escapeHtml(rental.rentalId)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Status</span>

                <strong>
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Vehicle ID</span>

                <strong>
                    #${escapeHtml(rental.vehicleId)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Customer ID</span>

                <strong>
                    #${escapeHtml(rental.customerId)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Start Date</span>

                <strong>
                    ${escapeHtml(
                        formatDateTime(
                            rental.startDate
                        )
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>End Date</span>

                <strong>
                    ${escapeHtml(
                        formatDateTime(
                            rental.endDate
                        )
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Rental Days</span>

                <strong>
                    ${escapeHtml(
                        String(rentalDays ?? "-")
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Rental Rate ID</span>

                <strong>
                    ${escapeHtml(
                        rental.rentalRateId ?? "-"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Pickup Mileage</span>

                <strong>
                    ${escapeHtml(
                        formatMileage(
                            rental.pickupMileage
                        )
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Return Mileage</span>

                <strong>
                    ${escapeHtml(
                        formatMileage(
                            rental.returnMileage
                        )
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Deposit Amount</span>

                <strong>
                    ${escapeHtml(
                        formatCurrency(
                            rental.depositAmount
                        )
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>Total Amount</span>

                <strong>
                    ${escapeHtml(
                        formatCurrency(
                            rental.totalAmount
                        )
                    )}
                </strong>

            </div>


            ${
                rental.driverOption
                ? `
                    <div class="detail-item">

                        <span>Driver Option</span>

                        <strong>
                            ${escapeHtml(
                                rental.driverOption
                            )}
                        </strong>

                    </div>
                `
                : ""
            }


            ${
                rental.driverId
                ? `
                    <div class="detail-item">

                        <span>Driver ID</span>

                        <strong>
                            #${escapeHtml(
                                rental.driverId
                            )}
                        </strong>

                    </div>
                `
                : ""
            }


        </div>

    `;


    rentalDetailsModal.show();

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    switch (status) {

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
            return "status-default";

    }

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .toLowerCase()
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   FORMAT DATE TIME
========================================================= */

function formatDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return String(value);
    }


    return date.toLocaleString(
        "en-LK",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "LKR 0.00";
    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "LKR 0.00";
    }


    return new Intl.NumberFormat(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(number);

}


/* =========================================================
   FORMAT MILEAGE
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


    return `${number.toLocaleString("en-LK")} km`;

}


/* =========================================================
   CALCULATE RENTAL DAYS
========================================================= */

function calculateRentalDays(
    startDate,
    endDate
) {

    if (!startDate || !endDate) {
        return 0;
    }


    const start =
        new Date(startDate);

    const end =
        new Date(endDate);


    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return 0;
    }


    const difference =
        end.getTime() -
        start.getTime();


    return Math.max(
        1,
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        )
    );

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
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);


    if (element) {
        element.textContent = value;
    }

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    const loading =
        document.getElementById(
            "loadingState"
        );

    const list =
        document.getElementById(
            "rentalsList"
        );


    if (loading) {
        loading.classList.remove("d-none");
    }

    if (list) {
        list.classList.add("d-none");
    }

}


function hideLoading() {

    const loading =
        document.getElementById(
            "loadingState"
        );


    if (loading) {
        loading.classList.add("d-none");
    }

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmpty() {

    hideLoading();

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (empty) {
        empty.classList.remove("d-none");
    }

}


function hideEmpty() {

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (empty) {
        empty.classList.add("d-none");
    }

}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(message) {

    hideLoading();

    hideEmpty();


    const errorState =
        document.getElementById(
            "errorState"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (errorMessage) {
        errorMessage.textContent =
            message;
    }


    if (errorState) {
        errorState.classList.remove("d-none");
    }

}


function hideError() {

    const errorState =
        document.getElementById(
            "errorState"
        );


    if (errorState) {
        errorState.classList.add("d-none");
    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toastElement =
        document.getElementById(
            "rentalToast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    if (!toastElement || !toastMessage) {
        return;
    }


    toastMessage.textContent =
        message;


    const toast =
        bootstrap.Toast.getOrCreateInstance(
            toastElement
        );


    toast.show();

}

