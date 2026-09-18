/* =========================================================
   MAINTENANCE MANAGEMENT
========================================================= */

let maintenanceRecords = [];

let editingMaintenanceId = null;

let maintenanceModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    maintenanceModal = new bootstrap.Modal(
        document.getElementById("maintenanceModal")
    );


    loadMaintenanceUser();


    document
        .getElementById("maintenanceForm")
        .addEventListener(
            "submit",
            handleMaintenanceSubmit
        );


    await loadMaintenanceRecords();

});


/* =========================================================
   AUTH HEADERS
========================================================= */

function getMaintenanceHeaders() {

    const token =
        localStorage.getItem("accessToken");


    return {

        "Content-Type": "application/json",

        "Authorization": `Bearer ${token}`

    };

}

/* =========================================================
   USER
========================================================= */

function loadMaintenanceUser() {

    const username =
        localStorage.getItem("username");

    const role =
        localStorage.getItem("role");


    /* =========================================
       USERNAME
    ========================================= */

    if (username) {

        // Top-right username
        const topUsername =
            document.getElementById(
                "maintenanceUsername"
            );

        if (topUsername) {
            topUsername.textContent = username;
        }

        const maintenanceAvatar =
            document.getElementById(
                "maintenanceAvatar"
            );

        if (maintenanceAvatar) {

            maintenanceAvatar.textContent =
                username
                    .trim()
                    .charAt(0)
                    .toUpperCase();

        }


        // Sidebar footer username
        const sidebarUsername =
            document.getElementById(
                "sidebarUsername"
            );

        if (sidebarUsername) {
            sidebarUsername.textContent = username;
        }


        /* =====================================
           AVATAR - FIRST LETTER
        ===================================== */

        const sidebarAvatar =
            document.getElementById(
                "sidebarAvatar"
            );

        if (sidebarAvatar) {

            sidebarAvatar.textContent =
                username
                    .trim()
                    .charAt(0)
                    .toUpperCase();

        }

    }


    /* =========================================
       ROLE
    ========================================= */

    if (role) {

        const topRole =
            document.getElementById(
                "maintenanceUserRole"
            );

        if (topRole) {
            topRole.textContent = role;
        }


        const sidebarRole =
            document.getElementById(
                "sidebarRole"
            );

        if (sidebarRole) {
            sidebarRole.textContent = role;
        }

    }

}


/* =========================================================
   LOAD RECORDS
========================================================= */

async function loadMaintenanceRecords() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/maintenance/all`,
                {
                    method: "GET",
                    headers: getMaintenanceHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load maintenance records"
            );

        }


        maintenanceRecords =
            data.body || [];


        renderMaintenanceRecords(
            maintenanceRecords
        );


        updateMaintenanceStatistics(
            maintenanceRecords
        );


    } catch (error) {

        console.error(
            "Maintenance API Error:",
            error
        );


        showMaintenanceMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   RENDER
========================================================= */

function renderMaintenanceRecords(records) {

    const tbody =
        document.getElementById(
            "maintenanceTableBody"
        );


    const emptyState =
        document.getElementById(
            "maintenanceEmptyState"
        );


    tbody.innerHTML = "";


    if (!records || records.length === 0) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    records.forEach(record => {

        const row =
            document.createElement("tr");


        const status =
            record.status || "SCHEDULED";


        const statusClass =
            status
                .toLowerCase()
                .replace("_", "-");


        row.innerHTML = `

            <td>

                <span class="maintenance-record-id">

                    #MNT-${String(
                        record.maintenanceId
                    ).padStart(4, "0")}

                </span>

            </td>


            <td>

                <span class="maintenance-vehicle-id">

                    <i class="bi bi-car-front"></i>

                    Vehicle #${record.vehicleId ?? "-"}

                </span>

            </td>


            <td>

                <span class="maintenance-type">

                    ${formatMaintenanceType(
                        record.maintenanceType
                    )}

                </span>


                <span class="maintenance-description">

                    ${escapeMaintenanceHtml(
                        record.description || "-"
                    )}

                </span>

            </td>


            <td>

                ${formatMaintenanceDate(
                    record.serviceDate
                )}

            </td>


            <td>

                ${formatMaintenanceDate(
                    record.nextServiceDate
                )}

            </td>


            <td>

                <span class="maintenance-mileage">

                    ${formatNumber(
                        record.mileageAtService
                    )} km

                </span>

            </td>


            <td>

                <span class="maintenance-cost">

                    ${formatCurrency(
                        record.cost
                    )}

                </span>

            </td>


            <td>

                <span class="
                    maintenance-status
                    ${statusClass}
                ">

                    ${formatMaintenanceStatus(
                        status
                    )}

                </span>

            </td>


            <td>

                <div class="maintenance-action-group">


                    <button
                        type="button"
                        class="maintenance-action-btn"
                        title="View"
                        onclick="viewMaintenance(${record.maintenanceId})">

                        <i class="bi bi-eye"></i>

                    </button>


                    <button
                        type="button"
                        class="maintenance-action-btn"
                        title="Edit"
                        onclick="editMaintenance(${record.maintenanceId})">

                        <i class="bi bi-pencil"></i>

                    </button>


                    ${
                        status !== "CANCELLED"

                        ?

                        `
                        <button
                            type="button"
                            class="maintenance-action-btn danger"
                            title="Cancel"
                            onclick="cancelMaintenance(${record.maintenanceId})">

                            <i class="bi bi-x-circle"></i>

                        </button>
                        `

                        :

                        ""
                    }


                </div>

            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   STATISTICS
========================================================= */

function updateMaintenanceStatistics(records) {

    document.getElementById(
        "totalMaintenanceCount"
    ).textContent = records.length;


    document.getElementById(
        "scheduledMaintenanceCount"
    ).textContent =
        records.filter(
            record =>
                record.status === "SCHEDULED"
        ).length;


    document.getElementById(
        "progressMaintenanceCount"
    ).textContent =
        records.filter(
            record =>
                record.status === "IN_PROGRESS"
        ).length;


    document.getElementById(
        "completedMaintenanceCount"
    ).textContent =
        records.filter(
            record =>
                record.status === "COMPLETED"
        ).length;

}


/* =========================================================
   OPEN CREATE
========================================================= */

function openMaintenanceModal() {

    editingMaintenanceId = null;


    document
        .getElementById("maintenanceForm")
        .reset();


    document.getElementById(
        "maintenanceId"
    ).value = "";


    document.getElementById(
        "maintenanceModalTitle"
    ).textContent =
        "Add Maintenance Record";


    document.getElementById(
        "maintenanceSubmitBtn"
    ).innerHTML = `

        <i class="bi bi-check2-circle"></i>

        Save Maintenance

    `;


    maintenanceModal.show();

}


/* =========================================================
   EDIT
========================================================= */

function editMaintenance(maintenanceId) {

    const record =
        maintenanceRecords.find(
            item =>
                item.maintenanceId === maintenanceId
        );


    if (!record) {
        return;
    }


    if (record.status === "CANCELLED") {

        showMaintenanceMessage(
            "Cancelled maintenance record cannot be updated.",
            "error"
        );

        return;

    }


    editingMaintenanceId =
        maintenanceId;


    document.getElementById(
        "maintenanceId"
    ).value =
        record.maintenanceId;


    document.getElementById(
        "maintenanceVehicleId"
    ).value =
        record.vehicleId || "";


    document.getElementById(
        "maintenanceType"
    ).value =
        record.maintenanceType || "";


    document.getElementById(
        "maintenanceDescription"
    ).value =
        record.description || "";


    document.getElementById(
        "maintenanceServiceDate"
    ).value =
        record.serviceDate || "";


    document.getElementById(
        "maintenanceNextServiceDate"
    ).value =
        record.nextServiceDate || "";


    document.getElementById(
        "maintenanceCost"
    ).value =
        record.cost ?? "";


    document.getElementById(
        "maintenanceMileage"
    ).value =
        record.mileageAtService ?? "";


    document.getElementById(
        "maintenanceStatus"
    ).value =
        record.status || "";


    document.getElementById(
        "maintenanceModalTitle"
    ).textContent =
        "Update Maintenance Record";


    document.getElementById(
        "maintenanceSubmitBtn"
    ).innerHTML = `

        <i class="bi bi-arrow-repeat"></i>

        Update Maintenance

    `;


    maintenanceModal.show();

}


/* =========================================================
   SUBMIT
========================================================= */

async function handleMaintenanceSubmit(event) {

    event.preventDefault();


    const maintenanceData = {

        maintenanceType:
            document.getElementById(
                "maintenanceType"
            ).value,

        description:
            document.getElementById(
                "maintenanceDescription"
            ).value.trim(),

        serviceDate:
            document.getElementById(
                "maintenanceServiceDate"
            ).value,

        nextServiceDate:
            document.getElementById(
                "maintenanceNextServiceDate"
            ).value || null,

        cost:
            Number(
                document.getElementById(
                    "maintenanceCost"
                ).value
            ),

        status:
            document.getElementById(
                "maintenanceStatus"
            ).value,

        mileageAtService:
            Number(
                document.getElementById(
                    "maintenanceMileage"
                ).value
            ),

        vehicleId:
            Number(
                document.getElementById(
                    "maintenanceVehicleId"
                ).value
            )

    };


    if (editingMaintenanceId !== null) {

        maintenanceData.maintenanceId =
            editingMaintenanceId;

    }


    const url =
        editingMaintenanceId === null

            ? `${API_BASE_URL}/v1/maintenance/save`

            : `${API_BASE_URL}/v1/maintenance/update`;


    const method =
        editingMaintenanceId === null
            ? "POST"
            : "PUT";


    try {

        const response =
            await fetch(
                url,
                {
                    method: method,
                    headers: getMaintenanceHeaders(),
                    body: JSON.stringify(
                        maintenanceData
                    )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Maintenance operation failed"
            );

        }


        maintenanceModal.hide();


        showMaintenanceMessage(

            editingMaintenanceId === null

                ? "Maintenance record saved successfully."

                : "Maintenance record updated successfully.",

            "success"

        );


        editingMaintenanceId = null;


        await loadMaintenanceRecords();


    } catch (error) {

        console.error(
            "Maintenance Save Error:",
            error
        );


        showMaintenanceMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   VIEW
========================================================= */

function viewMaintenance(maintenanceId) {

    const record =
        maintenanceRecords.find(
            item =>
                item.maintenanceId === maintenanceId
        );


    if (!record) {
        return;
    }


    alert(

        "Maintenance Record\n\n" +

        "Record ID: MNT-" +
        String(record.maintenanceId)
            .padStart(4, "0") +

        "\nVehicle ID: " +
        record.vehicleId +

        "\nType: " +
        formatMaintenanceType(
            record.maintenanceType
        ) +

        "\nService Date: " +
        formatMaintenanceDate(
            record.serviceDate
        ) +

        "\nNext Service: " +
        formatMaintenanceDate(
            record.nextServiceDate
        ) +

        "\nCost: " +
        formatCurrency(record.cost) +

        "\nMileage: " +
        formatNumber(
            record.mileageAtService
        ) +
        " km" +

        "\nStatus: " +
        formatMaintenanceStatus(
            record.status
        ) +

        "\n\nDescription:\n" +
        (record.description || "-")

    );

}


/* =========================================================
   CANCEL
========================================================= */

async function cancelMaintenance(maintenanceId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this maintenance record?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/maintenance/${maintenanceId}`,
                {
                    method: "DELETE",
                    headers: getMaintenanceHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to cancel maintenance record"
            );

        }


        showMaintenanceMessage(
            "Maintenance record cancelled successfully.",
            "success"
        );


        await loadMaintenanceRecords();


    } catch (error) {

        console.error(
            "Maintenance Cancel Error:",
            error
        );


        showMaintenanceMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function searchMaintenance() {

    const searchInput = document.getElementById("maintenanceSearch");

    const statusInput = document.getElementById("maintenanceStatusFilter");

    const search = searchInput ? searchInput.value : "";

    const status =  statusInput ? statusInput.value : "ALL";

    applyMaintenanceFilters(search,status );

}

/* =========================================================
   FILTER
========================================================= */

function filterMaintenance() {

    const searchInput =document.getElementById("maintenanceSearch");

    const statusInput =document.getElementById("maintenanceStatusFilter");


    const search =searchInput? searchInput.value: "";
    const status = statusInput ? statusInput.value : "ALL";


    applyMaintenanceFilters(search,status);

}

/* =========================================================
   APPLY FILTERS
========================================================= */

function applyMaintenanceFilters(search, status) {

    const searchValue =String(search || "").trim().toLowerCase();

    /* =============================================
       FILTER RECORDS
    ============================================= */

    const filtered = maintenanceRecords.filter(record => {

            const maintenanceId = Number(record.maintenanceId);
            const maintenanceDisplay = "#MNT-" + String(maintenanceId).padStart(4, "0");
            const vehicleId = Number(record.vehicleId);
            const vehicleDisplay = "Vehicle #" + String(vehicleId);

            let matchesSearch = true;


            if (searchValue !== "") {

                const maintenanceText = maintenanceDisplay.toLowerCase();
                const vehicleText = vehicleDisplay.toLowerCase();
                const maintenanceNumber = String(maintenanceId);
                const vehicleNumber =String(vehicleId);

                matchesSearch =maintenanceText.includes( searchValue)||

                    maintenanceText .replace("#", "") .includes(searchValue)||

                    maintenanceNumber.includes( searchValue)||

                    vehicleText.includes(searchValue)||

                    vehicleNumber.includes( searchValue);

            }

            const matchesStatus = status === "ALL" || record.status === status;
                return (matchesSearch && matchesStatus);

        });

        // show result

    renderMaintenanceRecords(
        filtered
    );

}
/* =========================================================
   FORMAT TYPE
========================================================= */

function formatMaintenanceType(type) {

    if (!type) {
        return "-";
    }


    return type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatMaintenanceStatus(status) {

    if (!status) {
        return "-";
    }


    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatMaintenanceDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue + "T00:00:00");


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


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

    const amount =
        Number(value || 0);


    return new Intl.NumberFormat(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(amount);

}


/* =========================================================
   NUMBER
========================================================= */

function formatNumber(value) {

    return new Intl.NumberFormat(
        "en-LK",
        {
            maximumFractionDigits: 2
        }
    ).format(
        Number(value || 0)
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeMaintenanceHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   MESSAGE
========================================================= */

function showMaintenanceMessage(
    message,
    type
) {

    alert(message);

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleMaintenanceSidebar() {

    const sidebar =
        document.getElementById("sidebar");


    if (sidebar) {

        sidebar.classList.toggle(
            "sidebar-open"
        );

    }

}