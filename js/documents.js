/* =========================================================
   VEHICLE DOCUMENT MANAGEMENT
========================================================= */

let documents = [];

let editingDocumentId = null;

let documentModal;
let expiryAlertModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    documentModal = new bootstrap.Modal(
        document.getElementById("documentModal")
    );

    expiryAlertModal = new bootstrap.Modal(
        document.getElementById("expiryAlertModal")
    );


    loadDocumentUser();


    document
        .getElementById("documentForm")
        .addEventListener(
            "submit",
            handleDocumentSubmit
        );

    const logoutButton = document.getElementById("documentsLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            logout();
        });
    }


    await loadDocuments();

    await loadExpiryAlerts();

});

/* =========================================================
   AUTH
========================================================= */

function getDocumentHeaders() {

    const token =
        localStorage.getItem("accessToken");


    return {

        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


/* =========================================================
   USER
========================================================= */

function loadDocumentUser() {

    const username =
        localStorage.getItem("username");

    const role =
        localStorage.getItem("role");


    if (username) {

        document.getElementById(
            "documentUsername"
        ).textContent = username;

    }


    if (role) {

        document.getElementById(
            "documentUserRole"
        ).textContent = role;

    }

}


/* =========================================================
   LOAD DOCUMENTS
========================================================= */

async function loadDocuments() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/vehicleDocument/all`,
                {
                    method: "GET",
                    headers: getDocumentHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load documents"
            );

        }


        documents =
            data.body || [];


        renderDocuments(documents);

        updateDocumentStatistics(documents);


    } catch (error) {

        console.error(
            "Document API Error:",
            error
        );

        alert(
            "Unable to load vehicle documents."
        );

    }

}


/* =========================================================
   LOAD EXPIRY ALERTS
========================================================= */

async function loadExpiryAlerts() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/vehicleDocument/expiry-alerts`,
                {
                    method: "GET",
                    headers: getDocumentHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load expiry alerts"
            );

        }


        const alerts =
            data.body || [];


        updateExpiryNotification(alerts);

        renderExpiryAlerts(alerts);


    } catch (error) {

        console.error(
            "Expiry Alert Error:",
            error
        );

    }

}


/* =========================================================
   NOTIFICATION
========================================================= */

function updateExpiryNotification(alerts) {

    const badge =
        document.getElementById(
            "documentNotificationBadge"
        );


    const banner =
        document.getElementById(
            "expiryAlertBanner"
        );


    const count =
        alerts.length;


    badge.textContent = count;


    if (count > 0) {

        badge.style.display = "flex";

        banner.style.display = "flex";


        document.getElementById(
            "expiryAlertTitle"
        ).textContent =
            `${count} Document${count > 1 ? "s" : ""} Expiring Soon`;


        document.getElementById(
            "expiryAlertText"
        ).textContent =
            "Vehicle document expiry is approaching within the next 7 days.";

    } else {

        badge.style.display = "none";

        banner.style.display = "none";

    }

}


/* =========================================================
   RENDER EXPIRY ALERTS
========================================================= */

function renderExpiryAlerts(alerts) {

    const container =
        document.getElementById(
            "expiryAlertList"
        );


    container.innerHTML = "";


    if (!alerts || alerts.length === 0) {

        container.innerHTML = `

            <div class="document-empty-state">

                <div class="document-empty-icon">

                    <i class="bi bi-check-circle"></i>

                </div>

                <h4>
                    No expiry alerts
                </h4>

                <p>
                    No vehicle documents are expiring
                    within the next 7 days.
                </p>

            </div>

        `;

        return;

    }


    alerts.forEach(documentItem => {

        const daysLeft =
            calculateDaysLeft(
                documentItem.expiryDate
            );


        const type =
            formatDocumentType(
                documentItem.documentType
            );


        const item =
            document.createElement("div");


        item.className =
            "expiry-alert-item";


        item.innerHTML = `

            <div class="expiry-alert-item-icon">

                <i class="bi bi-file-earmark-text"></i>

            </div>


            <div class="expiry-alert-item-content">

                <strong>
                    ${escapeHtml(type)}
                </strong>

                <span>
                    Vehicle ID: ${documentItem.vehicleId ?? "-"}
                    &nbsp; • &nbsp;
                    Document No: ${escapeHtml(
                        documentItem.documentNumber || "-"
                    )}
                </span>

            </div>


            <div class="expiry-alert-days">

                <strong>
                    ${daysLeft === 0
                        ? "Today"
                        : daysLeft === 1
                            ? "1 Day"
                            : `${daysLeft} Days`
                    }
                </strong>

                <span>
                    ${formatDate(documentItem.expiryDate)}
                </span>

            </div>

        `;


        container.appendChild(item);

    });

}


/* =========================================================
   OPEN EXPIRY ALERTS
========================================================= */

function openExpiryAlerts() {

    expiryAlertModal.show();

}


/* =========================================================
   RENDER DOCUMENTS
========================================================= */

function renderDocuments(documentList) {

    const tbody =
        document.getElementById(
            "documentTableBody"
        );


    const emptyState =
        document.getElementById(
            "documentEmptyState"
        );


    tbody.innerHTML = "";


    if (!documentList || documentList.length === 0) {

        emptyState.style.display = "block";

        return;

    }


    emptyState.style.display = "none";


    documentList.forEach(documentItem => {

        const row =
            document.createElement("tr");


        const status =
            documentItem.status || "PENDING";


        const statusClass =
            status.toLowerCase();


        const daysLeft =
            calculateDaysLeft(
                documentItem.expiryDate
            );


        let expiryClass = "safe";


        if (daysLeft <= 7) {

            expiryClass = "warning";

        }


        if (daysLeft < 0) {

            expiryClass = "danger";

        }


        let daysText = "";


        if (daysLeft < 0) {

            daysText =
                `${Math.abs(daysLeft)} days overdue`;

        } else if (daysLeft === 0) {

            daysText =
                "Expires today";

        } else if (daysLeft === 1) {

            daysText =
                "1 day remaining";

        } else {

            daysText =
                `${daysLeft} days remaining`;

        }


        row.innerHTML = `

            <td>

                <div class="document-type">

                    <div class="document-type-icon">

                        <i class="bi bi-file-earmark-text"></i>

                    </div>

                    <div>

                        <span class="document-type-name">

                            ${escapeHtml(
                                formatDocumentType(
                                    documentItem.documentType
                                )
                            )}

                        </span>

                        <span class="document-type-sub">

                            Document ID:
                            ${documentItem.documentId ?? "-"}

                        </span>

                    </div>

                </div>

            </td>


            <td>

                <span class="vehicle-id">

                    #${documentItem.vehicleId ?? "-"}

                </span>

            </td>


            <td>

                <span class="document-number">

                    ${escapeHtml(
                        documentItem.documentNumber || "-"
                    )}

                </span>

            </td>


            <td>

                ${formatDate(
                    documentItem.issueDate
                )}

            </td>


            <td>

                <span
                    class="document-expiry-date ${expiryClass}">

                    ${formatDate(
                        documentItem.expiryDate
                    )}

                </span>

                <span
                    class="document-days-left">

                    ${daysText}

                </span>

            </td>


            <td>

                <span
                    class="
                        document-status
                        ${statusClass}
                    ">

                    ${formatStatus(status)}

                </span>

            </td>


            <td>

                <div class="document-action-group">

                    <button
                        type="button"
                        class="document-action-btn"
                        title="Edit"
                        onclick="editDocument(
                            ${documentItem.documentId}
                        )">

                        <i class="bi bi-pencil"></i>

                    </button>


                    <button
                        type="button"
                        class="document-action-btn danger"
                        title="Delete"
                        onclick="deleteDocument(
                            ${documentItem.documentId}
                        )">

                        <i class="bi bi-trash"></i>

                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   STATISTICS
========================================================= */

function updateDocumentStatistics(documentList) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const total =
        documentList.length;


    const valid =
        documentList.filter(
            item =>
                item.status === "VALID"
        ).length;


    const expired =
        documentList.filter(
            item => {

                if (!item.expiryDate) {
                    return item.status === "EXPIRED";
                }

                const expiry =
                    new Date(
                        item.expiryDate
                    );

                expiry.setHours(
                    0,
                    0,
                    0,
                    0
                );

                return expiry < today;

            }
        ).length;


    const expiringSoon =
        documentList.filter(
            item => {

                if (!item.expiryDate) {
                    return false;
                }

                const days =
                    calculateDaysLeft(
                        item.expiryDate
                    );

                return (
                    days >= 0 &&
                    days <= 7
                );

            }
        ).length;


    document.getElementById(
        "totalDocumentCount"
    ).textContent = total;


    document.getElementById(
        "validDocumentCount"
    ).textContent = valid;


    document.getElementById(
        "expiringDocumentCount"
    ).textContent = expiringSoon;


    document.getElementById(
        "expiredDocumentCount"
    ).textContent = expired;

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openDocumentModal() {

    editingDocumentId = null;


    document.getElementById(
        "documentForm"
    ).reset();


    document.getElementById(
        "documentId"
    ).value = "";


    document.getElementById(
        "documentModalTitle"
    ).textContent =
        "Add Document";


    document.getElementById(
        "documentSubmitBtn"
    ).innerHTML = `

        <i class="bi bi-check2-circle"></i>

        Save Document

    `;


    documentModal.show();

}


/* =========================================================
   EDIT
========================================================= */

function editDocument(documentId) {

    const documentItem =
        documents.find(
            item =>
                item.documentId === documentId
        );


    if (!documentItem) {
        return;
    }


    editingDocumentId =
        documentId;


    document.getElementById(
        "documentId"
    ).value =
        documentItem.documentId;


    document.getElementById(
        "vehicleId"
    ).value =
        documentItem.vehicleId;


    document.getElementById(
        "documentType"
    ).value =
        documentItem.documentType;


    document.getElementById(
        "documentNumber"
    ).value =
        documentItem.documentNumber;


    document.getElementById(
        "issueDate"
    ).value =
        documentItem.issueDate;


    document.getElementById(
        "expiryDate"
    ).value =
        documentItem.expiryDate;


    document.getElementById(
        "documentStatus"
    ).value =
        documentItem.status;


    document.getElementById(
        "documentModalTitle"
    ).textContent =
        "Update Document";


    document.getElementById(
        "documentSubmitBtn"
    ).innerHTML = `

        <i class="bi bi-arrow-repeat"></i>

        Update Document

    `;


    documentModal.show();

}


/* =========================================================
   SAVE / UPDATE
========================================================= */

async function handleDocumentSubmit(event) {

    event.preventDefault();


    const documentData = {

        vehicleId:
            Number(
                document.getElementById(
                    "vehicleId"
                ).value
            ),

        documentType:
            document.getElementById(
                "documentType"
            ).value,

        documentNumber:
            document.getElementById(
                "documentNumber"
            ).value.trim(),

        issueDate:
            document.getElementById(
                "issueDate"
            ).value,

        expiryDate:
            document.getElementById(
                "expiryDate"
            ).value,

        status:
            document.getElementById(
                "documentStatus"
            ).value

    };


    let url;

    let method;


    if (editingDocumentId === null) {

        url =
            `${API_BASE_URL}/v1/vehicleDocument/save`;

        method = "POST";

    } else {

        documentData.documentId =
            editingDocumentId;

        url =
            `${API_BASE_URL}/v1/vehicleDocument/update`;

        method = "PUT";

    }


    try {

        const response =
            await fetch(
                url,
                {
                    method: method,
                    headers: getDocumentHeaders(),
                    body:
                        JSON.stringify(
                            documentData
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Document operation failed"
            );

        }


        documentModal.hide();


        alert(
            editingDocumentId === null
                ? "Vehicle document saved successfully."
                : "Vehicle document updated successfully."
        );


        editingDocumentId = null;


        await loadDocuments();

        await loadExpiryAlerts();


    } catch (error) {

        console.error(
            "Document Save Error:",
            error
        );

        alert(
            error.message
        );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteDocument(documentId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this vehicle document?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/vehicleDocument/${documentId}`,
                {
                    method: "DELETE",
                    headers: getDocumentHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to delete document"
            );

        }


        alert(
            "Vehicle document deleted successfully."
        );


        await loadDocuments();

        await loadExpiryAlerts();


    } catch (error) {

        console.error(
            "Delete Document Error:",
            error
        );

        alert(
            error.message
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function searchDocuments() {

    applyDocumentFilters();

}


/* =========================================================
   FILTER
========================================================= */

function filterDocuments() {

    applyDocumentFilters();

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyDocumentFilters() {

    const search =
        document.getElementById(
            "documentSearch"
        ).value
            .trim()
            .toLowerCase();


    const type =
        document.getElementById(
            "documentTypeFilter"
        ).value;


    const status =
        document.getElementById(
            "documentStatusFilter"
        ).value;


    const filtered =
        documents.filter(
            documentItem => {

                const searchableText = `

                    ${documentItem.documentId}

                    ${documentItem.vehicleId}

                    ${documentItem.documentNumber}

                    ${documentItem.documentType}

                    ${formatDocumentType(
                        documentItem.documentType
                    )}

                `.toLowerCase();


                const matchesSearch =
                    searchableText.includes(
                        search
                    );


                const matchesType =
                    type === "ALL" ||
                    documentItem.documentType === type;


                const matchesStatus =
                    status === "ALL" ||
                    documentItem.status === status;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus
                );

            }
        );


    renderDocuments(filtered);

}


/* =========================================================
   DAYS LEFT
========================================================= */

function calculateDaysLeft(expiryDate) {

    if (!expiryDate) {
        return 9999;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const expiry =
        new Date(expiryDate);


    expiry.setHours(
        0,
        0,
        0,
        0
    );


    return Math.ceil(
        (
            expiry.getTime() -
            today.getTime()
        ) /
        (1000 * 60 * 60 * 24)
    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(
        date.getTime()
    )) {

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
   TYPE FORMAT
========================================================= */

function formatDocumentType(type) {

    if (!type) {
        return "-";
    }


    return type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   STATUS FORMAT
========================================================= */

function formatStatus(status) {

    if (!status) {
        return "-";
    }


    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
