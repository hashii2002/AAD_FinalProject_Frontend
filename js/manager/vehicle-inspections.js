/* =========================================================
   VEHICLE INSPECTION MANAGEMENT
   FLEET MANAGER VERSION
========================================================= */

let inspections = [];
let vehicles = [];
let rentals = [];

let editingInspectionId = null;

let inspectionModal = null;
let viewInspectionModal = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* -----------------------------------------------------
       Fleet Manager access only
    ----------------------------------------------------- */

    if (typeof checkRoleAccess === "function") {

        if (!checkRoleAccess(["FLEET_MANAGER"])) {
            return;
        }

    }


    const inspectionModalElement =
        document.getElementById("inspectionModal");

    const viewInspectionModalElement =
        document.getElementById("viewInspectionModal");


    if (inspectionModalElement) {

        inspectionModal =
            new bootstrap.Modal(
                inspectionModalElement
            );

    }


    if (viewInspectionModalElement) {

        viewInspectionModal =
            new bootstrap.Modal(
                viewInspectionModalElement
            );

    }


    loadInspectionUser();

    setupInspectionEvents();

    await loadInspectionPage();

});


/* =========================================================
   CURRENT FLEET MANAGER
========================================================= */

function loadInspectionUser() {

    const username =
        localStorage.getItem("username") ||
        "Fleet Manager";


    const userId =
        localStorage.getItem("userId");


    const role =
        localStorage.getItem("role");


    /*
       Safety check
    */

    if (role !== "FLEET_MANAGER") {

        console.warn(
            "Vehicle Inspection page accessed by invalid role."
        );

        return;

    }


    /*
       First letter
    */

    const firstLetter =
        username
            .trim()
            .charAt(0)
            .toUpperCase() || "F";


    /*
       Topbar
    */

    const topbarUsername =
        document.getElementById("topbarUsername");

    const topbarRole =
        document.getElementById("topbarRole");

    const topbarAvatar =
        document.getElementById("topbarAvatar");


    if (topbarUsername) {
        topbarUsername.textContent = username;
    }


    if (topbarRole) {
        topbarRole.textContent = "Fleet Manager";
    }


    if (topbarAvatar) {

        topbarAvatar.textContent =
            firstLetter;

        topbarAvatar.classList.add(
            "user-letter-avatar"
        );

    }


    /*
       Sidebar
    */

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const sidebarRole =
        document.getElementById("sidebarRole");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");


    if (sidebarUsername) {
        sidebarUsername.textContent =
            username;
    }


    if (sidebarRole) {
        sidebarRole.textContent =
            "Fleet Manager";
    }


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            firstLetter;

        sidebarAvatar.classList.add(
            "user-letter-avatar"
        );

    }


    /*
       Automatically assign logged-in
       Fleet Manager as inspector.
    */

    const inspectorIdInput =
        document.getElementById(
            "inspectedById"
        );


    if (inspectorIdInput && userId) {

        inspectorIdInput.value =
            userId;

    }


    const inspectorName =
        document.getElementById(
            "currentInspectorName"
        );


    if (inspectorName) {

        inspectorName.textContent =
            username;

    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupInspectionEvents() {


    const addButton =
        document.getElementById(
            "addInspectionBtn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            openInspectionModal
        );

    }


    const saveButton =
        document.getElementById(
            "saveInspectionBtn"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveInspection
        );

    }


    const search =
        document.getElementById(
            "searchInspection"
        );


    if (search) {

        search.addEventListener(
            "input",
            applyInspectionFilters
        );

    }


    const typeFilter =
        document.getElementById(
            "inspectionTypeFilter"
        );


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyInspectionFilters
        );

    }


    const vehicleFilter =
        document.getElementById(
            "vehicleFilter"
        );


    if (vehicleFilter) {

        vehicleFilter.addEventListener(
            "change",
            applyInspectionFilters
        );

    }


    const clearButton =
        document.getElementById(
            "clearFiltersBtn"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearInspectionFilters
        );

    }


    const notes =
        document.getElementById("notes");


    if (notes) {

        notes.addEventListener(
            "input",
            () => {

                const counter =
                    document.getElementById(
                        "notesCounter"
                    );


                if (counter) {

                    counter.textContent =
                        notes.value.length;

                }

            }
        );

    }

}


/* =========================================================
   LOAD PAGE
========================================================= */

async function loadInspectionPage() {

    try {

        showInspectionLoading();


        /*
           IMPORTANT:
           Fleet Manager does NOT need:

           /v1/user/all
           /v1/role/all

           Only required APIs are loaded.
        */

        await Promise.all([
            loadVehicles(),
            loadRentals(),
            loadInspections()
        ]);


        populateVehicleFilter();

        populateVehicleSelect();

        populateRentalSelect();

        updateInspectionSummary();

        renderInspections(inspections);


    } catch (error) {

        console.error(
            "Inspection page loading error:",
            error
        );


        showInspectionError(
            error.message ||
            "Unable to load vehicle inspection data."
        );

    }

}


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const token =
        localStorage.getItem(
            "accessToken"
        );


    const headers = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

        ...(options.headers || {})

    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,
                headers
            }
        );


    /*
       Unauthorized
    */

    if (response.status === 401) {

        localStorage.clear();

        window.location.href =
            "../../index.html";


        throw new Error(
            "Session expired. Please login again."
        );

    }


    /*
       Forbidden
    */

    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access this resource."
        );

    }


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        let message =
            "Request failed.";


        if (data) {

            message =
                data.message ||
                data.body?.message ||
                message;

        }


        throw new Error(message);

    }


    return data;

}


/* =========================================================
   LOAD INSPECTIONS
========================================================= */

async function loadInspections() {

    const response =
        await apiRequest(
            "/v1/vehicle-inspection/all"
        );


    inspections =
        Array.isArray(response.body)
            ? response.body
            : [];


    console.log(
        "Vehicle Inspections:",
        inspections
    );

}


/* =========================================================
   LOAD VEHICLES
========================================================= */

async function loadVehicles() {

    const response =
        await apiRequest(
            "/v1/vehicle/all"
        );


    vehicles =
        Array.isArray(response.body)
            ? response.body
            : [];

}


/* =========================================================
   LOAD RENTALS
========================================================= */

async function loadRentals() {

    const response =
        await apiRequest(
            "/v1/rental/all"
        );


    rentals =
        Array.isArray(response.body)
            ? response.body
            : [];

}


/* =========================================================
   VEHICLE FILTER
========================================================= */

function populateVehicleFilter() {

    const select =
        document.getElementById(
            "vehicleFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">All Vehicles</option>`;


    vehicles.forEach(vehicle => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            vehicle.vehicleId;


        option.textContent =
            getVehicleDisplay(vehicle);


        select.appendChild(option);

    });

}


/* =========================================================
   VEHICLE SELECT
========================================================= */

function populateVehicleSelect() {

    const select =
        document.getElementById(
            "vehicleId"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select vehicle</option>`;


    vehicles.forEach(vehicle => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            vehicle.vehicleId;


        option.textContent =
            getVehicleDisplay(vehicle);


        select.appendChild(option);

    });

}


/* =========================================================
   RENTAL SELECT
========================================================= */

function populateRentalSelect() {

    const select =
        document.getElementById(
            "rentalId"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select rental</option>`;


    rentals.forEach(rental => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            rental.rentalId;


        option.textContent =
            getRentalDisplay(rental);


        select.appendChild(option);

    });

}


/* =========================================================
   DISPLAY HELPERS
========================================================= */

function getVehicleDisplay(vehicle) {

    if (!vehicle) {
        return "Vehicle";
    }


    const vehicleNumber =
        vehicle.vehicleNo ||
        `Vehicle #${vehicle.vehicleId}`;


    return `${vehicleNumber} (ID: ${vehicle.vehicleId})`;

}


function getRentalDisplay(rental) {

    if (!rental) {
        return "Rental";
    }


    return `Rental #${rental.rentalId}`;

}


/* =========================================================
   SUMMARY
========================================================= */

function updateInspectionSummary() {

    const total =
        inspections.length;


    const pickup =
        inspections.filter(
            item =>
                item.inspectionType ===
                "PICKUP"
        ).length;


    const returned =
        inspections.filter(
            item =>
                item.inspectionType ===
                "RETURN"
        ).length;


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const todayCount =
        inspections.filter(item => {

            if (!item.inspectionDate) {
                return false;
            }


            return item.inspectionDate
                .startsWith(today);

        }).length;


    setText(
        "totalInspections",
        total
    );


    setText(
        "pickupInspections",
        pickup
    );


    setText(
        "returnInspections",
        returned
    );


    setText(
        "todayInspections",
        todayCount
    );

}


/* =========================================================
   FILTER
========================================================= */

function applyInspectionFilters() {

    const search =
        document.getElementById(
            "searchInspection"
        )?.value
            .trim()
            .toLowerCase() || "";


    const type =
        document.getElementById(
            "inspectionTypeFilter"
        )?.value || "";


    const vehicleId =
        document.getElementById(
            "vehicleFilter"
        )?.value || "";


    const filtered =
        inspections.filter(item => {


            const vehicle =
                vehicles.find(
                    vehicle =>
                        vehicle.vehicleId ===
                        item.vehicleId
                );


            const vehicleText =
                getVehicleDisplay(vehicle)
                    .toLowerCase();


            const rentalText =
                `rental #${item.rentalId}`
                    .toLowerCase();


            const inspectionText =
                `inspection #${item.inspectionId}`
                    .toLowerCase();


            const matchesSearch =
                !search ||
                vehicleText.includes(search) ||
                rentalText.includes(search) ||
                inspectionText.includes(search);


            const matchesType =
                !type ||
                item.inspectionType ===
                type;


            const matchesVehicle =
                !vehicleId ||
                String(item.vehicleId) ===
                String(vehicleId);


            return (
                matchesSearch &&
                matchesType &&
                matchesVehicle
            );

        });


    renderInspections(filtered);

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearInspectionFilters() {

    const search =
        document.getElementById(
            "searchInspection"
        );


    const type =
        document.getElementById(
            "inspectionTypeFilter"
        );


    const vehicle =
        document.getElementById(
            "vehicleFilter"
        );


    if (search) {
        search.value = "";
    }


    if (type) {
        type.value = "";
    }


    if (vehicle) {
        vehicle.value = "";
    }


    renderInspections(inspections);

}


/* =========================================================
   RENDER
========================================================= */

function renderInspections(data) {

    const grid =
        document.getElementById(
            "inspectionGrid"
        );


    const empty =
        document.getElementById(
            "inspectionEmpty"
        );


    const loading =
        document.getElementById(
            "inspectionLoading"
        );


    if (!grid) {
        return;
    }


    loading?.classList.add(
        "d-none"
    );


    grid.innerHTML = "";


    const countText =
        document.getElementById(
            "inspectionCountText"
        );


    if (countText) {

        countText.textContent =
            `${data.length} record${
                data.length !== 1
                    ? "s"
                    : ""
            }`;

    }


    if (data.length === 0) {

        empty?.classList.remove(
            "d-none"
        );

        return;

    }


    empty?.classList.add(
        "d-none"
    );


    data
        .sort(
            (a, b) =>
                new Date(
                    b.inspectionDate || 0
                ) -
                new Date(
                    a.inspectionDate || 0
                )
        )
        .forEach(
            inspection => {

                grid.appendChild(
                    createInspectionCard(
                        inspection
                    )
                );

            }
        );

}


/* =========================================================
   INSPECTION CARD
========================================================= */

function createInspectionCard(
    inspection
) {

    const card =
        document.createElement(
            "div"
        );


    const isReturn =
        inspection.inspectionType ===
        "RETURN";


    card.className =
        `inspection-card ${
            isReturn
                ? "return-card"
                : ""
        }`;


    const vehicle =
        vehicles.find(
            item =>
                item.vehicleId ===
                inspection.vehicleId
        );


    const typeClass =
        isReturn
            ? "return"
            : "pickup";


    const typeLabel =
        isReturn
            ? "RETURN"
            : "PICKUP";


    card.innerHTML = `

        <div class="inspection-card-top">

            <div class="inspection-card-id">

                <div class="inspection-card-icon">

                    <i class="bi ${
                        isReturn
                            ? "bi-box-arrow-left"
                            : "bi-box-arrow-in-right"
                    }"></i>

                </div>


                <div>

                    <h6>
                        Inspection #${
                            inspection.inspectionId
                        }
                    </h6>

                    <span>
                        ${
                            formatDateTime(
                                inspection.inspectionDate
                            )
                        }
                    </span>

                </div>

            </div>


            <span class="inspection-type-badge ${typeClass}">

                <i class="bi ${
                    isReturn
                        ? "bi-box-arrow-left"
                        : "bi-box-arrow-in-right"
                }"></i>

                ${typeLabel}

            </span>

        </div>


        <div class="inspection-card-relations">

            <div class="relation-item">

                <span>VEHICLE</span>

                <strong>
                    ${escapeHtml(
                        getVehicleDisplay(
                            vehicle
                        )
                    )}
                </strong>

            </div>


            <div class="relation-item">

                <span>RENTAL</span>

                <strong>
                    Rental #${
                        inspection.rentalId
                    }
                </strong>

            </div>

        </div>


        <div class="inspection-details-grid">


            <div class="inspection-detail-item">

                <div class="detail-icon">

                    <i class="bi bi-fuel-pump-fill"></i>

                </div>

                <span>Fuel Level</span>

                <strong>
                    ${escapeHtml(
                        inspection.fuelLevel ||
                        "-"
                    )}
                </strong>

            </div>


            <div class="inspection-detail-item">

                <div class="detail-icon">

                    <i class="bi bi-speedometer2"></i>

                </div>

                <span>Mileage</span>

                <strong>
                    ${
                        formatMileage(
                            inspection.mileage
                        )
                    }
                </strong>

            </div>


            <div class="inspection-detail-item">

                <div class="detail-icon">

                    <i class="bi bi-person-check-fill"></i>

                </div>

                <span>Inspector</span>

                <strong>
                    Fleet Manager
                </strong>

            </div>

        </div>


        ${
            inspection.notes
                ? `
                    <div class="inspection-notes">

                        <div class="inspection-notes-title">

                            <i class="bi bi-chat-left-text-fill"></i>

                            Inspection Notes

                        </div>

                        <p>
                            ${escapeHtml(
                                inspection.notes
                            )}
                        </p>

                    </div>
                  `
                : ""
        }


        <div class="inspection-card-actions">


            <button
                    type="button"
                    class="inspection-action-btn"
                    title="View"
                    onclick="viewInspection(
                        ${inspection.inspectionId}
                    )">

                <i class="bi bi-eye"></i>

            </button>


            <button
                    type="button"
                    class="inspection-action-btn"
                    title="Edit"
                    onclick="editInspection(
                        ${inspection.inspectionId}
                    )">

                <i class="bi bi-pencil-square"></i>

            </button>


            <button
                    type="button"
                    class="inspection-action-btn delete"
                    title="Delete"
                    onclick="deleteInspection(
                        ${inspection.inspectionId}
                    )">

                <i class="bi bi-trash3"></i>

            </button>

        </div>

    `;


    return card;

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openInspectionModal() {

    editingInspectionId =
        null;


    const form =
        document.getElementById(
            "inspectionForm"
        );


    if (form) {
        form.reset();
    }


    setText(
        "inspectionModalTitle",
        "New Vehicle Inspection"
    );


    setText(
        "saveInspectionText",
        "Save Inspection"
    );


    setText(
        "notesCounter",
        "0"
    );


    const id =
        document.getElementById(
            "inspectionId"
        );


    if (id) {
        id.value = "";
    }


    const date =
        document.getElementById(
            "inspectionDate"
        );


    if (date) {

        date.value =
            getCurrentDateTimeLocal();

    }


    /*
       Always assign logged-in
       Fleet Manager.
    */

    const currentUserId =
        localStorage.getItem(
            "userId"
        );


    const inspectorId =
        document.getElementById(
            "inspectedById"
        );


    if (inspectorId) {

        inspectorId.value =
            currentUserId || "";

    }


    const inspectorName =
        document.getElementById(
            "currentInspectorName"
        );


    if (inspectorName) {

        inspectorName.textContent =
            localStorage.getItem(
                "username"
            ) ||
            "Fleet Manager";

    }


    if (inspectionModal) {

        inspectionModal.show();

    }

}


/* =========================================================
   EDIT
========================================================= */

async function editInspection(id) {

    try {

        const response =
            await apiRequest(
                `/v1/vehicle-inspection/select/${id}`
            );


        const data =
            response.body;


        editingInspectionId =
            data.inspectionId;


        document.getElementById(
            "inspectionId"
        ).value =
            data.inspectionId;


        document.getElementById(
            "inspectionType"
        ).value =
            data.inspectionType || "";


        document.getElementById(
            "inspectionDate"
        ).value =
            toDateTimeLocal(
                data.inspectionDate
            );


        document.getElementById(
            "vehicleId"
        ).value =
            data.vehicleId || "";


        document.getElementById(
            "rentalId"
        ).value =
            data.rentalId || "";


        document.getElementById(
            "fuelLevel"
        ).value =
            data.fuelLevel || "";


        document.getElementById(
            "mileage"
        ).value =
            data.mileage ?? "";


        /*
           Do NOT trust old inspector ID.
           Current logged-in Fleet Manager
           becomes inspector.
        */

        document.getElementById(
            "inspectedById"
        ).value =
            localStorage.getItem(
                "userId"
            ) || "";


        document.getElementById(
            "currentInspectorName"
        ).textContent =
            localStorage.getItem(
                "username"
            ) ||
            "Fleet Manager";


        document.getElementById(
            "notes"
        ).value =
            data.notes || "";


        document.getElementById(
            "notesCounter"
        ).textContent =
            (data.notes || "").length;


        document.getElementById(
            "inspectionModalTitle"
        ).textContent =
            "Edit Vehicle Inspection";


        document.getElementById(
            "saveInspectionText"
        ).textContent =
            "Update Inspection";


        if (inspectionModal) {

            inspectionModal.show();

        }

    } catch (error) {

        console.error(
            "Edit inspection error:",
            error
        );


        showToast(
            error.message ||
            "Unable to load inspection.",
            "danger"
        );

    }

}


/* =========================================================
   SAVE / UPDATE
========================================================= */

async function saveInspection() {

    const inspectionType =
        document.getElementById(
            "inspectionType"
        ).value;


    const inspectionDate =
        document.getElementById(
            "inspectionDate"
        ).value;


    const vehicleId =
        document.getElementById(
            "vehicleId"
        ).value;


    const rentalId =
        document.getElementById(
            "rentalId"
        ).value;


    const fuelLevel =
        document.getElementById(
            "fuelLevel"
        ).value
            .trim();


    const mileageValue =
        document.getElementById(
            "mileage"
        ).value;


    const notes =
        document.getElementById(
            "notes"
        ).value
            .trim();


    /*
       Current logged-in Fleet Manager
    */

    const inspectedById =
        localStorage.getItem(
            "userId"
        );


    /* -----------------------------------------------------
       Validation
    ----------------------------------------------------- */

    if (!inspectionType) {

        showToast(
            "Please select inspection type.",
            "warning"
        );

        return;

    }


    if (!vehicleId) {

        showToast(
            "Please select a vehicle.",
            "warning"
        );

        return;

    }


    if (!rentalId) {

        showToast(
            "Please select a rental.",
            "warning"
        );

        return;

    }


    if (!fuelLevel) {

        showToast(
            "Please enter fuel level.",
            "warning"
        );

        return;

    }


    if (
        mileageValue === "" ||
        Number(mileageValue) < 0
    ) {

        showToast(
            "Please enter a valid mileage.",
            "warning"
        );

        return;

    }


    if (!inspectedById) {

        showToast(
            "Fleet Manager user ID is missing. Please login again.",
            "warning"
        );

        return;

    }


    /*
       Rental → Vehicle validation
    */

    const selectedRental =
        rentals.find(
            rental =>
                String(
                    rental.rentalId
                ) ===
                String(rentalId)
        );


    if (
        selectedRental &&
        selectedRental.vehicleId != null &&
        String(
            selectedRental.vehicleId
        ) !==
        String(vehicleId)
    ) {

        showToast(
            "Selected vehicle does not belong to this rental.",
            "warning"
        );

        return;

    }


    /*
       Request payload
    */

    const payload = {

        inspectionId:
            editingInspectionId ||
            null,

        inspectionType:
            inspectionType,

        inspectionDate:
            inspectionDate
                ? new Date(
                    inspectionDate
                ).toISOString()
                : null,

        fuelLevel:
            fuelLevel,

        mileage:
            Number(
                mileageValue
            ),

        notes:
            notes ||
            null,

        vehicleId:
            Number(
                vehicleId
            ),

        rentalId:
            Number(
                rentalId
            ),

        inspectedById:
            Number(
                inspectedById
            )

    };


    const saveButton =
        document.getElementById(
            "saveInspectionBtn"
        );


    const saveText =
        document.getElementById(
            "saveInspectionText"
        );


    if (saveButton) {
        saveButton.disabled = true;
    }


    if (saveText) {

        saveText.textContent =
            editingInspectionId
                ? "Updating..."
                : "Saving...";

    }


    try {


        if (editingInspectionId) {

            await apiRequest(
                "/v1/vehicle-inspection/update",
                {
                    method: "PUT",
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            showToast(
                "Vehicle inspection updated successfully.",
                "success"
            );


        } else {

            await apiRequest(
                "/v1/vehicle-inspection/save",
                {
                    method: "POST",
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            showToast(
                "Vehicle inspection saved successfully.",
                "success"
            );

        }


        if (inspectionModal) {
            inspectionModal.hide();
        }


        await loadInspectionPage();


    } catch (error) {

        console.error(
            "Save inspection error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save inspection.",
            "danger"
        );


    } finally {

        if (saveButton) {
            saveButton.disabled = false;
        }


        if (saveText) {

            saveText.textContent =
                editingInspectionId
                    ? "Update Inspection"
                    : "Save Inspection";

        }

    }

}


/* =========================================================
   VIEW
========================================================= */

async function viewInspection(id) {

    try {

        const response =
            await apiRequest(
                `/v1/vehicle-inspection/select/${id}`
            );


        const inspection =
            response.body;


        const vehicle =
            vehicles.find(
                item =>
                    item.vehicleId ===
                    inspection.vehicleId
            );


        const isReturn =
            inspection.inspectionType ===
            "RETURN";


        const typeClass =
            isReturn
                ? "return"
                : "pickup";


        const typeText =
            isReturn
                ? "RETURN INSPECTION"
                : "PICKUP INSPECTION";


        const details =
            document.getElementById(
                "inspectionDetails"
            );


        if (!details) {
            return;
        }


        details.innerHTML = `

            <div class="view-details-header">

                <div>

                    <h5 class="mb-1">
                        Inspection #${
                            inspection.inspectionId
                        }
                    </h5>

                    <small class="text-muted">

                        ${
                            formatDateTime(
                                inspection.inspectionDate
                            )
                        }

                    </small>

                </div>


                <span
                    class="
                        view-inspection-type
                        inspection-type-badge
                        ${typeClass}
                    ">

                    <i class="bi ${
                        isReturn
                            ? "bi-box-arrow-left"
                            : "bi-box-arrow-in-right"
                    }"></i>

                    ${typeText}

                </span>

            </div>


            <div class="view-details-grid">


                <div class="view-detail-box">

                    <span>
                        Vehicle
                    </span>

                    <strong>
                        ${escapeHtml(
                            getVehicleDisplay(
                                vehicle
                            )
                        )}
                    </strong>

                </div>


                <div class="view-detail-box">

                    <span>
                        Rental
                    </span>

                    <strong>
                        Rental #${
                            inspection.rentalId
                        }
                    </strong>

                </div>


                <div class="view-detail-box">

                    <span>
                        Fuel Level
                    </span>

                    <strong>
                        ${escapeHtml(
                            inspection.fuelLevel ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="view-detail-box">

                    <span>
                        Mileage
                    </span>

                    <strong>
                        ${
                            formatMileage(
                                inspection.mileage
                            )
                        }
                    </strong>

                </div>


                <div class="view-detail-box">

                    <span>
                        Inspected By
                    </span>

                    <strong>
                        Fleet Manager
                    </strong>

                </div>


                <div class="view-detail-box">

                    <span>
                        Inspection Date
                    </span>

                    <strong>
                        ${
                            formatDateTime(
                                inspection.inspectionDate
                            )
                        }
                    </strong>

                </div>


                <div class="view-detail-box full-width">

                    <span>
                        Notes
                    </span>

                    <strong>
                        ${
                            escapeHtml(
                                inspection.notes ||
                                "No inspection notes recorded."
                            )
                        }
                    </strong>

                </div>

            </div>

        `;


        if (viewInspectionModal) {

            viewInspectionModal.show();

        }

    } catch (error) {

        console.error(
            "View inspection error:",
            error
        );


        showToast(
            error.message ||
            "Unable to load inspection.",
            "danger"
        );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteInspection(id) {

    const confirmed =
        confirm(
            `Are you sure you want to delete Inspection #${id}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/v1/vehicle-inspection/${id}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Vehicle inspection deleted successfully.",
            "success"
        );


        await loadInspectionPage();


    } catch (error) {

        console.error(
            "Delete inspection error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete inspection.",
            "danger"
        );

    }

}


/* =========================================================
   LOADING
========================================================= */

function showInspectionLoading() {

    document.getElementById(
        "inspectionLoading"
    )?.classList.remove(
        "d-none"
    );


    document.getElementById(
        "inspectionEmpty"
    )?.classList.add(
        "d-none"
    );


    const grid =
        document.getElementById(
            "inspectionGrid"
        );


    if (grid) {
        grid.innerHTML = "";
    }

}


/* =========================================================
   ERROR
========================================================= */

function showInspectionError(
    message
) {

    const grid =
        document.getElementById(
            "inspectionGrid"
        );


    document.getElementById(
        "inspectionLoading"
    )?.classList.add(
        "d-none"
    );


    document.getElementById(
        "inspectionEmpty"
    )?.classList.remove(
        "d-none"
    );


    if (grid) {

        grid.innerHTML = `

            <div class="alert alert-danger m-3">

                <i class="bi bi-exclamation-triangle-fill me-2"></i>

                ${escapeHtml(message)}

            </div>

        `;

    }

}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent = value;
    }

}


function formatMileage(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    return `${Number(
        value
    ).toLocaleString()} km`;

}


function formatDateTime(value) {

    if (!value) {
        return "Date not available";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

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


function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const offset =
        date.getTimezoneOffset();


    const localDate =
        new Date(
            date.getTime() -
            offset * 60000
        );


    return localDate
        .toISOString()
        .slice(0, 16);

}


function getCurrentDateTimeLocal() {

    const now =
        new Date();


    const offset =
        now.getTimezoneOffset();


    const localDate =
        new Date(
            now.getTime() -
            offset * 60000
        );


    return localDate
        .toISOString()
        .slice(0, 16);

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const existing =
        document.getElementById(
            "inspectionToast"
        );


    if (existing) {
        existing.remove();
    }


    const icon =
        type === "success"
            ? "bi-check-circle-fill"
            : type === "warning"
                ? "bi-exclamation-triangle-fill"
                : "bi-x-circle-fill";


    const iconColor =
        type === "success"
            ? "#16a34a"
            : type === "warning"
                ? "#d97706"
                : "#dc2626";


    const toast =
        document.createElement(
            "div"
        );


    toast.id =
        "inspectionToast";


    toast.style.cssText = `

        position: fixed;

        right: 24px;

        bottom: 24px;

        z-index: 9999;

        min-width: 300px;

        max-width: 420px;

        padding: 14px 16px;

        border-radius: 12px;

        background: #ffffff;

        color: #374151;

        border: 1px solid #e5e7eb;

        box-shadow:
            0 15px 40px
            rgba(17,24,39,0.15);

        font-size: 12px;

        font-weight: 600;

        display: flex;

        align-items: center;

        gap: 10px;

    `;


    toast.innerHTML = `

        <i
            class="bi ${icon}"
            style="
                font-size:18px;
                color:${iconColor};
            ">
        </i>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(() => {

        toast.style.opacity =
            "0";

        toast.style.transform =
            "translateY(10px)";

        toast.style.transition =
            "0.25s ease";


        setTimeout(
            () => toast.remove(),
            250
        );

    }, 3000);

}