/* =========================================================
   RENTAL MANAGEMENT
========================================================= */

let rentals = [];
let customers = [];
let vehicles = [];
let drivers = [];
let rentalRates = [];
let categories = [];

let rentalModal;
let viewRentalModal;

let editingRentalId = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    rentalModal = new bootstrap.Modal(
        document.getElementById("rentalModal")
    );

    viewRentalModal = new bootstrap.Modal(
        document.getElementById("viewRentalModal")
    );

    loadUserInfo();

    await loadInitialData();

    await loadRentals();

    setupDateValidation();

});


/* =========================================================
   LOAD INITIAL DATA
========================================================= */

async function loadInitialData() {

    await Promise.all([
        loadCustomers(),
        loadVehicles(),
        loadDrivers(),
        loadRentalRates(),
        loadCategories()
    ]);

}


/* =========================================================
   AUTH HEADER
========================================================= */

function getAuthHeaders() {

    const token = localStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };

}


/* =========================================================
   LOAD USER INFO
========================================================= */

function loadUserInfo() {

    const username =
        localStorage.getItem("username") || "Admin";

    const role =
        localStorage.getItem("role") || "Administrator";

    const avatar =
        username.charAt(0).toUpperCase();

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const sidebarRole =
        document.getElementById("sidebarRole");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const profileUsername =
        document.getElementById("profileUsername");

    const profileRole =
        document.getElementById("profileRole");

    const profileAvatar =
        document.getElementById("profileAvatar");


    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (sidebarRole) {
        sidebarRole.textContent = formatRole(role);
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = avatar;
    }

    if (profileUsername) {
        profileUsername.textContent = username;
    }

    if (profileRole) {
        profileRole.textContent = formatRole(role);
    }

    if (profileAvatar) {
        profileAvatar.textContent = avatar;
    }

}


/* =========================================================
   FORMAT ROLE
========================================================= */

function formatRole(role) {

    if (!role) {
        return "Administrator";
    }

    return role
        .replace("ROLE_", "")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());

}


/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/customer/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load customers");
        }

        const data = await response.json();

        customers = Array.isArray(data.body)
            ? data.body
            : [];

        populateCustomerSelect();

    } catch (error) {

        console.error("Customer API Error:", error);

        showToast(
            "Error",
            "Unable to load customers.",
            "error"
        );

    }

}


/* =========================================================
   LOAD VEHICLES
========================================================= */

async function loadVehicles() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/vehicle/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load vehicles");
        }

        const data = await response.json();

        vehicles = Array.isArray(data.body)
            ? data.body
            : [];

        populateVehicleSelect();

    } catch (error) {

        console.error("Vehicle API Error:", error);

        showToast(
            "Error",
            "Unable to load vehicles.",
            "error"
        );

    }

}


/* =========================================================
   LOAD DRIVERS
========================================================= */

async function loadDrivers() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/driver/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load drivers");
        }

        const data = await response.json();

        drivers = Array.isArray(data.body)
            ? data.body
            : [];

        populateDriverSelect();

    } catch (error) {

        console.error("Driver API Error:", error);

        showToast(
            "Error",
            "Unable to load drivers.",
            "error"
        );

    }

}


/* =========================================================
   LOAD RENTAL RATES
========================================================= */

async function loadRentalRates() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/rentalRate/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load rental rates");
        }

        const data = await response.json();

        rentalRates = Array.isArray(data.body)
            ? data.body
            : [];

        populateRentalRateSelect();

    } catch (error) {

        console.error("Rental Rate API Error:", error);

        showToast(
            "Error",
            "Unable to load rental rates.",
            "error"
        );

    }

}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/category/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load categories");
        }

        const data = await response.json();

        categories = Array.isArray(data.body)
            ? data.body
            : [];

    } catch (error) {

        console.error("Category API Error:", error);

    }

}


/* =========================================================
   POPULATE CUSTOMER SELECT
========================================================= */

function populateCustomerSelect() {

    const select =
        document.getElementById("customerId");

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">Select Customer</option>`;

    customers.forEach(customer => {

        const name =
            getCustomerName(customer);

        const option =
            document.createElement("option");

        option.value = customer.customerId;

        option.textContent =
            `${name} - ${customer.nic || "NIC N/A"}`;

        select.appendChild(option);

    });

}


/* =========================================================
   POPULATE VEHICLE SELECT
========================================================= */

function populateVehicleSelect() {

    const select =
        document.getElementById("vehicleId");

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">Select Vehicle</option>`;

    vehicles.forEach(vehicle => {

        const option =
            document.createElement("option");

        option.value = vehicle.vehicleId;

        option.textContent =
            `${vehicle.vehicleNo || "Vehicle"} - ${getCategoryName(vehicle.categoryId)}`;

        select.appendChild(option);

    });

}


/* =========================================================
   POPULATE DRIVER SELECT
========================================================= */

function populateDriverSelect() {

    const select =
        document.getElementById("driverId");

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">Select Driver</option>`;

    drivers.forEach(driver => {

        const status =
            driver.status || "";

        const option =
            document.createElement("option");

        option.value = driver.driverId;

        option.textContent =
            `${getDriverName(driver)}${status ? " - " + formatEnum(status) : ""}`;

        option.dataset.status = status;

        select.appendChild(option);

    });

}


/* =========================================================
   POPULATE RENTAL RATE SELECT
========================================================= */

function populateRentalRateSelect() {

    const select =
        document.getElementById("rentalRateId");

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">Auto select by vehicle category</option>`;

    rentalRates.forEach(rate => {

        const option =
            document.createElement("option");

        option.value = rate.rateId;

        option.textContent =
            `Daily Rs. ${formatMoney(rate.dailyRate)} | Monthly Rs. ${formatMoney(rate.monthlyRate)}`;

        option.dataset.categoryId =
            rate.categoryId;

        select.appendChild(option);

    });

}


/* =========================================================
   LOAD RENTALS
========================================================= */

async function loadRentals() {

    const tableBody =
        document.getElementById("rentalTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="table-loading">
                        <div class="spinner-border spinner-border-sm"></div>
                        <span>Loading rentals...</span>
                    </div>
                </td>
            </tr>
        `;

    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/rental/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {

            if (response.status === 401) {
                logout();
                return;
            }

            throw new Error("Failed to load rentals");

        }

        const data = await response.json();

        rentals = Array.isArray(data.body)
            ? data.body
            : [];

        renderRentals(rentals);

        updateRentalStats();

    } catch (error) {

        console.error("Rental API Error:", error);

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="table-empty">
                            Unable to load rental records.
                        </div>
                    </td>
                </tr>
            `;

        }

        showToast(
            "Error",
            "Unable to load rental records.",
            "error"
        );

    }

}


/* =========================================================
   RENDER RENTALS
========================================================= */

function renderRentals(list) {

    const tableBody =
        document.getElementById("rentalTableBody");

    if (!tableBody) {
        return;
    }

    if (!list || list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="table-empty">
                        <i class="bi bi-calendar-x"></i>
                        <span>No rental records found.</span>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = list.map(
        (rental, index) => {

            const customer =
                findCustomer(rental.customerId);

            const vehicle =
                findVehicle(rental.vehicleId);

            const driver =
                findDriver(rental.driverId);


            const customerName =
                customer
                    ? getCustomerName(customer)
                    : `Customer #${rental.customerId}`;


            const vehicleNo =
                vehicle
                    ? vehicle.vehicleNo
                    : `Vehicle #${rental.vehicleId}`;


            const status =
                rental.status || "PENDING";


            return `
                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>

                        <span class="rental-id-main">
                            #${rental.rentalId}
                        </span>

                        <span class="rental-id-sub">
                            ${rental.rentalDays || calculateDays(
                                rental.startDate,
                                rental.endDate
                            )} Day(s)
                        </span>

                    </td>


                    <td>

                        <div class="customer-cell">

                            <strong>
                                ${escapeHtml(customerName)}
                            </strong>

                            <small>
                                ${customer && customer.nic
                                    ? escapeHtml(customer.nic)
                                    : "Customer ID: " + rental.customerId}
                            </small>

                        </div>

                    </td>


                    <td>

                        <div class="vehicle-cell">

                            <strong>
                                ${escapeHtml(vehicleNo)}
                            </strong>

                            <small>
                                ${vehicle
                                    ? escapeHtml(
                                        getCategoryName(vehicle.categoryId)
                                      )
                                    : "Vehicle"}
                            </small>

                        </div>

                    </td>


                    <td>

                        <div class="date-cell">

                            <div class="date-start">
                                ${formatDate(rental.startDate)}
                            </div>

                            <div class="date-end">
                                → ${formatDate(rental.endDate)}
                            </div>

                        </div>

                    </td>


                    <td>

                        ${
                            rental.driverOption === "WITH_DRIVER"
                            ? `
                                <span class="driver-badge">
                                    <i class="bi bi-person-badge"></i>
                                    ${driver
                                        ? escapeHtml(getDriverName(driver))
                                        : "Driver #" + rental.driverId}
                                </span>
                              `
                            : `
                                <span class="no-driver">
                                    Without Driver
                                </span>
                              `
                        }

                    </td>


                    <td class="amount-cell">

                        Rs.
                        ${formatMoney(rental.totalAmount)}

                    </td>


                    <td>

                        <span class="rental-status ${getStatusClass(status)}">

                            ${formatEnum(status)}

                        </span>

                    </td>


                    <td>

                        <div class="action-buttons">

                            <button
                                    type="button"
                                    class="table-action-btn view-btn"
                                    onclick="viewRental(${rental.rentalId})"
                                    title="View">

                                <i class="bi bi-eye"></i>

                            </button>


                            ${
                                status !== "CANCELLED" &&
                                status !== "COMPLETED"
                                ? `
                                    <button
                                            type="button"
                                            class="table-action-btn edit-btn"
                                            onclick="editRental(${rental.rentalId})"
                                            title="Edit">

                                        <i class="bi bi-pencil-fill"></i>

                                    </button>
                                  `
                                : ""
                            }


                            ${
                                status !== "CANCELLED" &&
                                status !== "COMPLETED"
                                ? `
                                    <button
                                            type="button"
                                            class="table-action-btn delete-btn"
                                            onclick="cancelRental(${rental.rentalId})"
                                            title="Cancel">

                                        <i class="bi bi-x-lg"></i>

                                    </button>
                                  `
                                : ""
                            }

                        </div>

                    </td>

                </tr>
            `;

        }
    ).join("");

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateRentalStats() {

    const total =
        rentals.length;

    const pending =
        rentals.filter(
            rental => rental.status === "PENDING"
        ).length;

    const ongoing =
        rentals.filter(
            rental => rental.status === "ONGOING"
        ).length;

    const completed =
        rentals.filter(
            rental => rental.status === "COMPLETED"
        ).length;


    document.getElementById("totalRentals").textContent =
        total;

    document.getElementById("pendingRentals").textContent =
        pending;

    document.getElementById("ongoingRentals").textContent =
        ongoing;

    document.getElementById("completedRentals").textContent =
        completed;

}


/* =========================================================
   FILTER RENTALS
========================================================= */

function filterRentals() {

    const search =
        document.getElementById("searchRental")
            .value
            .trim()
            .toLowerCase();

    const status =
        document.getElementById("statusFilter")
            .value;


    const filtered =
        rentals.filter(rental => {

            const customer =
                findCustomer(rental.customerId);

            const vehicle =
                findVehicle(rental.vehicleId);


            const customerName =
                customer
                    ? getCustomerName(customer)
                    : "";


            const vehicleNo =
                vehicle
                    ? vehicle.vehicleNo
                    : "";


            const searchText =
                `
                    ${rental.rentalId}
                    ${customerName}
                    ${vehicleNo}
                    ${rental.customerId}
                    ${rental.vehicleId}
                    ${rental.status || ""}
                `
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchText.includes(search);


            const matchesStatus =
                !status ||
                rental.status === status;


            return matchesSearch && matchesStatus;

        });


    renderRentals(filtered);

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearRentalFilters() {

    document.getElementById("searchRental").value = "";

    document.getElementById("statusFilter").value = "";

    renderRentals(rentals);

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddRentalModal() {

    editingRentalId = null;

    document.getElementById("rentalModalTitle").textContent =
        "Add New Rental";

    document.getElementById("saveRentalText").textContent =
        "Save Rental";


    document.getElementById("rentalForm").reset();

    document.getElementById("rentalId").value = "";

    document.getElementById("rentalStatus").value =
        "PENDING";


    document.querySelector(
        'input[name="driverOption"][value="WITHOUT_DRIVER"]'
    ).checked = true;


    document.getElementById("driverSelectWrapper")
        .classList.add("d-none");


    document.getElementById("driverId").value = "";


    document.getElementById("previewDays").textContent =
        "0";

    document.getElementById("previewTotal").textContent =
        "Rs. 0.00";


    rentalModal.show();

}


/* =========================================================
   EDIT RENTAL
========================================================= */

function editRental(rentalId) {

    const rental =
        rentals.find(
            item => Number(item.rentalId) === Number(rentalId)
        );


    if (!rental) {

        showToast(
            "Error",
            "Rental record not found.",
            "error"
        );

        return;
    }


    editingRentalId =
        rental.rentalId;


    document.getElementById("rentalModalTitle").textContent =
        "Edit Rental";


    document.getElementById("saveRentalText").textContent =
        "Update Rental";


    document.getElementById("rentalId").value =
        rental.rentalId;


    document.getElementById("customerId").value =
        rental.customerId || "";


    document.getElementById("vehicleId").value =
        rental.vehicleId || "";


    document.getElementById("startDate").value =
        toDateTimeLocal(rental.startDate);


    document.getElementById("endDate").value =
        toDateTimeLocal(rental.endDate);


    document.getElementById("pickupMileage").value =
        rental.pickupMileage ?? "";


    document.getElementById("returnMileage").value =
        rental.returnMileage ?? "";


    document.getElementById("depositAmount").value =
        rental.depositAmount ?? "";


    document.getElementById("rentalStatus").value =
        rental.status || "PENDING";


    handleVehicleChange();


    setTimeout(() => {

        document.getElementById("rentalRateId").value =
            rental.rentalRateId || "";

    }, 100);


    const driverOption =
        rental.driverOption || "WITHOUT_DRIVER";


    const radio =
        document.querySelector(
            `input[name="driverOption"][value="${driverOption}"]`
        );


    if (radio) {
        radio.checked = true;
    }


    handleDriverOptionChange();


    if (rental.driverId) {

        document.getElementById("driverId").value =
            rental.driverId;

    }


    calculateRentalPreview();

    rentalModal.show();

}


/* =========================================================
   SAVE RENTAL
========================================================= */

async function saveRental() {

    const customerId =
        document.getElementById("customerId").value;

    const vehicleId =
        document.getElementById("vehicleId").value;

    const startDate =
        document.getElementById("startDate").value;

    const endDate =
        document.getElementById("endDate").value;

    const pickupMileage =
        document.getElementById("pickupMileage").value;

    const returnMileage =
        document.getElementById("returnMileage").value;

    const depositAmount =
        document.getElementById("depositAmount").value;

    const rentalRateId =
        document.getElementById("rentalRateId").value;

    const status =
        document.getElementById("rentalStatus").value;

    const driverOption =
        document.querySelector(
            'input[name="driverOption"]:checked'
        )?.value || "WITHOUT_DRIVER";

    const driverId =
        document.getElementById("driverId").value;


    /* -----------------------------------------------------
       CLIENT SIDE VALIDATION
    ----------------------------------------------------- */

    if (!customerId) {

        showToast(
            "Validation",
            "Please select a customer.",
            "error"
        );

        return;
    }


    if (!vehicleId) {

        showToast(
            "Validation",
            "Please select a vehicle.",
            "error"
        );

        return;
    }


    if (!startDate || !endDate) {

        showToast(
            "Validation",
            "Start date and end date are required.",
            "error"
        );

        return;
    }


    if (
        new Date(endDate) <=
        new Date(startDate)
    ) {

        showToast(
            "Validation",
            "End date must be after start date.",
            "error"
        );

        return;
    }


    if (
        pickupMileage === "" ||
        Number(pickupMileage) < 0
    ) {

        showToast(
            "Validation",
            "Pickup mileage must be non-negative.",
            "error"
        );

        return;
    }


    if (
        returnMileage !== "" &&
        Number(returnMileage) < Number(pickupMileage)
    ) {

        showToast(
            "Validation",
            "Return mileage cannot be less than pickup mileage.",
            "error"
        );

        return;
    }


    if (
        depositAmount === "" ||
        Number(depositAmount) < 0
    ) {

        showToast(
            "Validation",
            "Deposit amount must be non-negative.",
            "error"
        );

        return;
    }


    if (
        driverOption === "WITH_DRIVER" &&
        !driverId
    ) {

        showToast(
            "Validation",
            "Please select a driver.",
            "error"
        );

        return;
    }


    /* -----------------------------------------------------
       REQUEST BODY
    ----------------------------------------------------- */

    const rentalData = {

        rentalId:
            editingRentalId
                ? Number(editingRentalId)
                : null,

        startDate:
            startDate,

        endDate:
            endDate,

        pickupMileage:
            Number(pickupMileage),

        returnMileage:
            returnMileage === ""
                ? null
                : Number(returnMileage),

        depositAmount:
            Number(depositAmount),

        status:
            status,

        customerId:
            Number(customerId),

        vehicleId:
            Number(vehicleId),

        rentalRateId:
            rentalRateId
                ? Number(rentalRateId)
                : null,

        driverOption:
            driverOption,

        driverId:
            driverOption === "WITH_DRIVER"
                ? Number(driverId)
                : null

    };


    const isEdit =
        editingRentalId !== null;


    const url =
        isEdit
            ? `${API_BASE_URL}/v1/rental/update`
            : `${API_BASE_URL}/v1/rental/save`;


    const method =
        isEdit
            ? "PUT"
            : "POST";


    const saveButton =
        document.querySelector(".btn-modal-save");


    saveButton.disabled = true;


    document.getElementById("saveRentalText").textContent =
        isEdit
            ? "Updating..."
            : "Saving...";


    try {

        const response =
            await fetch(
                url,
                {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(rentalData)
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Rental operation failed"
            );

        }


        rentalModal.hide();


        showToast(
            "Success",
            isEdit
                ? "Rental updated successfully."
                : "Rental saved successfully.",
            "success"
        );


        await loadRentals();


    } catch (error) {

        console.error(
            "Save Rental Error:",
            error
        );


        showToast(
            "Error",
            error.message ||
            "Unable to save rental.",
            "error"
        );

    } finally {

        saveButton.disabled = false;

        document.getElementById("saveRentalText").textContent =
            isEdit
                ? "Update Rental"
                : "Save Rental";

    }

}


/* =========================================================
   CANCEL RENTAL
========================================================= */

async function cancelRental(rentalId) {

    const rental =
        rentals.find(
            item => Number(item.rentalId) === Number(rentalId)
        );


    if (!rental) {
        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to cancel Rental #${rentalId}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/rental/${rentalId}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to cancel rental"
            );

        }


        showToast(
            "Success",
            "Rental cancelled successfully.",
            "success"
        );


        await loadRentals();


    } catch (error) {

        console.error(
            "Cancel Rental Error:",
            error
        );


        showToast(
            "Error",
            error.message ||
            "Unable to cancel rental.",
            "error"
        );

    }

}


/* =========================================================
   VIEW RENTAL
========================================================= */

function viewRental(rentalId) {

    const rental =
        rentals.find(
            item => Number(item.rentalId) === Number(rentalId)
        );


    if (!rental) {
        return;
    }


    const customer =
        findCustomer(rental.customerId);

    const vehicle =
        findVehicle(rental.vehicleId);

    const driver =
        findDriver(rental.driverId);


    const customerName =
        customer
            ? getCustomerName(customer)
            : `Customer #${rental.customerId}`;


    const vehicleNo =
        vehicle
            ? vehicle.vehicleNo
            : `Vehicle #${rental.vehicleId}`;


    const content =
        document.getElementById(
            "rentalDetailsContent"
        );


    content.innerHTML = `

        <div class="rental-detail-grid">


            <div class="detail-item">

                <span>Rental ID</span>

                <strong>
                    #${rental.rentalId}
                </strong>

            </div>


            <div class="detail-item">

                <span>Status</span>

                <strong>
                    <span class="rental-status ${getStatusClass(rental.status)}">
                        ${formatEnum(rental.status)}
                    </span>
                </strong>

            </div>


            <div class="detail-item">

                <span>Customer</span>

                <strong>
                    ${escapeHtml(customerName)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Vehicle</span>

                <strong>
                    ${escapeHtml(vehicleNo)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Start Date</span>

                <strong>
                    ${formatDate(rental.startDate)}
                </strong>

            </div>


            <div class="detail-item">

                <span>End Date</span>

                <strong>
                    ${formatDate(rental.endDate)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Rental Days</span>

                <strong>
                    ${rental.rentalDays || calculateDays(
                        rental.startDate,
                        rental.endDate
                    )}
                    Day(s)
                </strong>

            </div>


            <div class="detail-item">

                <span>Driver Option</span>

                <strong>
                    ${formatEnum(rental.driverOption)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Pickup Mileage</span>

                <strong>
                    ${rental.pickupMileage ?? "-"} KM
                </strong>

            </div>


            <div class="detail-item">

                <span>Return Mileage</span>

                <strong>
                    ${rental.returnMileage ?? "-"} KM
                </strong>

            </div>


            <div class="detail-item">

                <span>Deposit Amount</span>

                <strong>
                    Rs. ${formatMoney(rental.depositAmount)}
                </strong>

            </div>


            <div class="detail-item">

                <span>Total Amount</span>

                <strong>
                    Rs. ${formatMoney(rental.totalAmount)}
                </strong>

            </div>


            <div class="detail-item full">

                <span>Assigned Driver</span>

                <strong>
                    ${
                        rental.driverOption === "WITH_DRIVER"
                        ? (
                            driver
                                ? escapeHtml(
                                    getDriverName(driver)
                                  )
                                : "Driver #" + rental.driverId
                          )
                        : "Without Driver"
                    }
                </strong>

            </div>


        </div>

    `;


    viewRentalModal.show();

}


/* =========================================================
   VEHICLE CHANGE
========================================================= */

function handleVehicleChange() {

    const vehicleId =
        document.getElementById("vehicleId").value;


    if (!vehicleId) {
        return;
    }


    const vehicle =
        findVehicle(Number(vehicleId));


    if (!vehicle) {
        return;
    }


    const categoryId =
        vehicle.categoryId;


    const rateSelect =
        document.getElementById("rentalRateId");


    if (!categoryId || !rateSelect) {
        return;
    }


    const matchingRate =
        rentalRates.find(
            rate =>
                Number(rate.categoryId) ===
                Number(categoryId)
        );


    if (matchingRate) {

        rateSelect.value =
            matchingRate.rateId;

    } else {

        rateSelect.value = "";

    }


    calculateRentalPreview();

}


/* =========================================================
   DRIVER OPTION CHANGE
========================================================= */

function handleDriverOptionChange() {

    const selected =
        document.querySelector(
            'input[name="driverOption"]:checked'
        )?.value;


    const wrapper =
        document.getElementById(
            "driverSelectWrapper"
        );


    const driverSelect =
        document.getElementById(
            "driverId"
        );


    if (selected === "WITH_DRIVER") {

        wrapper.classList.remove("d-none");

        driverSelect.required = true;

        filterAvailableDrivers();

    } else {

        wrapper.classList.add("d-none");

        driverSelect.required = false;

        driverSelect.value = "";

    }

}


/* =========================================================
   FILTER AVAILABLE DRIVERS
========================================================= */

function filterAvailableDrivers() {

    const select = document.getElementById("driverId");

    if (!select) {
        return;
    }

    select.innerHTML = `<option value="">Select Driver</option>`;

    drivers.forEach(driver => {

        const option = document.createElement("option");

        // Actual Driver ID sent to backend
        option.value = driver.driverId;

        // Driver ID shown in dropdown
        option.textContent =
            `Driver #${driver.driverId} - ${getDriverName(driver)} - ${driver.licenseNo || "License N/A"}`;

        select.appendChild(option);
    });
}


/* =========================================================
   RENTAL PREVIEW
========================================================= */

function calculateRentalPreview() {

    const startDate =
        document.getElementById("startDate").value;

    const endDate =
        document.getElementById("endDate").value;


    const previewDays =
        document.getElementById("previewDays");

    const previewTotal =
        document.getElementById("previewTotal");


    if (!startDate || !endDate) {

        previewDays.textContent = "0";

        previewTotal.textContent =
            "Rs. 0.00";

        return;
    }


    const days =
        calculateDays(
            startDate,
            endDate
        );


    previewDays.textContent =
        days;


    const rateId =
        document.getElementById("rentalRateId").value;


    const rate =
        rentalRates.find(
            item =>
                Number(item.rateId) ===
                Number(rateId)
        );


    if (!rate) {

        previewTotal.textContent =
            "Rs. 0.00";

        return;
    }


    let total;


    if (days >= 30) {

        const months =
            Math.floor(days / 30);

        const remainingDays =
            days % 30;


        total =
            (months * Number(rate.monthlyRate || 0)) +
            (remainingDays * Number(rate.dailyRate || 0));

    } else {

        total =
            days *
            Number(rate.dailyRate || 0);

    }


    previewTotal.textContent =
        "Rs. " + formatMoney(total);

}


/* =========================================================
   DATE VALIDATION
========================================================= */

function setupDateValidation() {

    const start =
        document.getElementById("startDate");

    const end =
        document.getElementById("endDate");


    start.addEventListener(
        "change",
        () => {

            if (start.value) {

                end.min =
                    start.value;

            }

            calculateRentalPreview();

        }
    );


    end.addEventListener(
        "change",
        () => {

            calculateRentalPreview();

        }
    );

}


/* =========================================================
   FIND CUSTOMER
========================================================= */

function findCustomer(customerId) {

    return customers.find(
        customer =>
            Number(customer.customerId) ===
            Number(customerId)
    );

}


/* =========================================================
   FIND VEHICLE
========================================================= */

function findVehicle(vehicleId) {

    return vehicles.find(
        vehicle =>
            Number(vehicle.vehicleId) ===
            Number(vehicleId)
    );

}


/* =========================================================
   FIND DRIVER
========================================================= */

function findDriver(driverId) {

    return drivers.find(
        driver =>
            Number(driver.driverId) ===
            Number(driverId)
    );

}


/* =========================================================
   CUSTOMER NAME
========================================================= */

function getCustomerName(customer) {

    if (!customer) {
        return "Unknown Customer";
    }


    if (customer.firstName || customer.lastName) {

        return (
            (customer.firstName || "") +
            " " +
            (customer.lastName || "")
        ).trim();

    }


    if (customer.username) {
        return customer.username;
    }


    return `Customer #${customer.customerId}`;

}


/* =========================================================
   DRIVER NAME
========================================================= */

function getDriverName(driver) {

    if (!driver) {
        return "Unknown Driver";
    }


    if (driver.driverName) {
        return driver.driverName;
    }


    if (driver.firstName || driver.lastName) {

        return (
            (driver.firstName || "") +
            " " +
            (driver.lastName || "")
        ).trim();

    }


    if (driver.username) {
        return driver.username;
    }


    return `Driver #${driver.driverId}`;

}


/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(categoryId) {

    const category =
        categories.find(
            item =>
                Number(item.categoryId) ===
                Number(categoryId)
        );


    if (!category) {
        return "Category";
    }


    return category.category ||
        category.categoryName ||
        "Category";

}


/* =========================================================
   CALCULATE DAYS
========================================================= */

function calculateDays(startDate, endDate) {

    if (!startDate || !endDate) {
        return 0;
    }


    const start =
        new Date(startDate);

    const end =
        new Date(endDate);


    const milliseconds =
        end - start;


    const days =
        Math.floor(
            milliseconds /
            (1000 * 60 * 60 * 24)
        );


    return days <= 0
        ? 1
        : days;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return dateValue;
    }


    return date.toLocaleString(
        "en-GB",
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
   DATE TIME LOCAL
========================================================= */

function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return value.substring(0, 16);
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
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   FORMAT ENUM
========================================================= */

function formatEnum(value) {

    if (!value) {
        return "-";
    }


    return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

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
            return "status-pending";

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
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
   TOAST
========================================================= */

function showToast(title, message, type = "success") {

    const toast =
        document.getElementById("rentalToast");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");

    const toastIcon =
        document.getElementById("toastIcon");


    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;


    if (type === "error") {

        toastIcon.innerHTML =
            `<i class="bi bi-exclamation-circle-fill"></i>`;

        toastIcon.style.color =
            "#dc4f62";

    } else {

        toastIcon.innerHTML =
            `<i class="bi bi-check-circle-fill"></i>`;

        toastIcon.style.color =
            "#179b5d";

    }


    const bsToast =
        bootstrap.Toast.getOrCreateInstance(
            toast,
            {
                delay: 3500
            }
        );


    bsToast.show();

}