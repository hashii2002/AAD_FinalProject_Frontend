/* =========================================================
   INVOICE MANAGEMENT
========================================================= */

let invoices = [];

let editingInvoiceId = null;

let invoiceModal;
let invoicePreviewModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    invoiceModal = new bootstrap.Modal(
        document.getElementById("invoiceModal")
    );

    invoicePreviewModal = new bootstrap.Modal(
        document.getElementById("invoicePreviewModal")
    );


    loadInvoiceUser();

    document
        .getElementById("invoiceForm")
        .addEventListener("submit", handleInvoiceSubmit);

    const logoutButton = document.getElementById("invoiceLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            logout();
        });
    }


    await loadInvoices();

});

/* =========================================================
   AUTH HEADER
========================================================= */

function getAuthHeaders() {

    const token = localStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

}


/* =========================================================
   USER
========================================================= */

function loadInvoiceUser() {

    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");


    /* =====================================================
       TOPBAR USER
    ===================================================== */

    const profileUsername =
        document.getElementById("profileUsername");

    const profileRole =
        document.getElementById("profileRole");

    const profileAvatar =
        document.getElementById("profileAvatar");


    if (username) {

        profileUsername.textContent = username;

        profileAvatar.textContent =
            username.charAt(0).toUpperCase();

    }


    if (role) {

        profileRole.textContent =
            formatUserRole(role);

    }


    /* =====================================================
       SIDEBAR FOOTER USER
    ===================================================== */

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const sidebarRole =
        document.getElementById("sidebarRole");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");


    if (username) {

        sidebarUsername.textContent =
            username;

        sidebarAvatar.textContent =
            username.charAt(0).toUpperCase();

    }


    if (role) {

        sidebarRole.textContent =
            formatUserRole(role);

    }

}


/* =========================================================
   FORMAT ROLE
========================================================= */

function formatUserRole(role) {

    if (!role) {
        return "";
    }

    return role
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


/* =========================================================
   LOAD ALL INVOICES
========================================================= */

async function loadInvoices() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/invoice/all`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (!response.ok) {

            throw new Error(
                "Failed to load invoices"
            );

        }


        const data = await response.json();

        invoices = data.body || [];

        renderInvoices(invoices);

        updateInvoiceStatistics(invoices);


    } catch (error) {

        console.error(
            "Invoice API Error:",
            error
        );

        showInvoiceMessage(
            "Unable to load invoices.",
            "error"
        );

    }

}


/* =========================================================
   RENDER INVOICES
========================================================= */

function renderInvoices(invoiceList) {

    const tbody =
        document.getElementById("invoiceTableBody");

    const emptyState =
        document.getElementById("invoiceEmptyState");


    tbody.innerHTML = "";


    if (!invoiceList || invoiceList.length === 0) {

        emptyState.style.display = "block";

        return;

    }


    emptyState.style.display = "none";


    invoiceList.forEach(invoice => {

        const row =
            document.createElement("tr");


        const status =
            invoice.status || "ISSUED";


        const statusClass =
            status
                .toLowerCase()
                .replace("_", "-");


        const customerName =
            invoice.customerName ||
            "Unknown Customer";


        const balance =
            Number(invoice.balance || 0);


        row.innerHTML = `

            <td>

                <span class="invoice-number">
                    #INV-${String(invoice.invoiceId).padStart(4, "0")}
                </span>

            </td>


            <td>

                <span class="invoice-customer-name">
                    ${escapeHtml(customerName)}
                </span>

                <span class="invoice-customer-id">
                    Customer ID: ${invoice.customerId ?? "-"}
                </span>

            </td>


            <td>
                #${invoice.rentalId ?? "-"}
            </td>


            <td>
                ${formatDate(invoice.issueDate)}
            </td>


            <td>

                <span class="invoice-amount">
                    ${formatCurrency(invoice.totalAmount)}
                </span>

            </td>


            <td>

                <span class="
                    invoice-balance
                    ${balance <= 0 ? "zero" : "pending"}
                ">

                    ${formatCurrency(balance)}

                </span>

            </td>


            <td>

                <span class="
                    invoice-status
                    ${statusClass}
                ">

                    ${formatStatus(status)}

                </span>

            </td>


            <td>

                <div class="invoice-action-group">

                    <button
                        class="invoice-action-btn"
                        title="View Invoice"
                        onclick="viewInvoice(${invoice.invoiceId})">

                        <i class="bi bi-eye"></i>

                    </button>


                    <button
                        class="invoice-action-btn"
                        title="Edit Invoice"
                        onclick="editInvoice(${invoice.invoiceId})">

                        <i class="bi bi-pencil"></i>

                    </button>


                    <button
                        class="invoice-action-btn"
                        title="Print Invoice"
                        onclick="quickPrintInvoice(${invoice.invoiceId})">

                        <i class="bi bi-printer"></i>

                    </button>


                    ${
                        status !== "CANCELLED"
                        ?

                        `
                        <button
                            class="invoice-action-btn danger"
                            title="Cancel Invoice"
                            onclick="cancelInvoice(${invoice.invoiceId})">

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

function updateInvoiceStatistics(invoiceList) {

    const total =
        invoiceList.length;


    const issued =
        invoiceList.filter(
            invoice => invoice.status === "ISSUED"
        ).length;


    const paid =
        invoiceList.filter(
            invoice => invoice.status === "PAID"
        ).length;


    const outstanding =
        invoiceList.filter(
            invoice =>
                Number(invoice.balance || 0) > 0 &&
                invoice.status !== "CANCELLED"
        ).length;


    document.getElementById(
        "totalInvoiceCount"
    ).textContent = total;


    document.getElementById(
        "issuedInvoiceCount"
    ).textContent = issued;


    document.getElementById(
        "paidInvoiceCount"
    ).textContent = paid;


    document.getElementById(
        "outstandingInvoiceCount"
    ).textContent = outstanding;

}


/* =========================================================
   OPEN CREATE MODAL
========================================================= */

function openInvoiceModal() {

    editingInvoiceId = null;


    document.getElementById(
        "invoiceForm"
    ).reset();


    document.getElementById(
        "invoiceId"
    ).value = "";


    document.getElementById(
        "invoiceModalTitle"
    ).textContent = "Create Invoice";


    document.getElementById(
        "invoiceSubmitBtn"
    ).innerHTML = `
        <i class="bi bi-check2-circle"></i>
        Save Invoice
    `;


    invoiceModal.show();

}


/* =========================================================
   EDIT INVOICE
========================================================= */

function editInvoice(invoiceId) {

    const invoice =
        invoices.find(
            item => item.invoiceId === invoiceId
        );


    if (!invoice) {
        return;
    }


    if (invoice.status === "CANCELLED") {

        showInvoiceMessage(
            "Cancelled invoice cannot be updated.",
            "error"
        );

        return;

    }


    editingInvoiceId = invoiceId;


    document.getElementById(
        "invoiceId"
    ).value = invoice.invoiceId;


    document.getElementById(
        "rentalId"
    ).value = invoice.rentalId || "";


    document.getElementById(
        "invoiceDiscount"
    ).value = invoice.discount || 0;


    if (invoice.issueDate) {

        document.getElementById(
            "invoiceIssueDate"
        ).value =
            convertToDateTimeLocal(invoice.issueDate);

    }


    document.getElementById(
        "invoiceModalTitle"
    ).textContent = "Update Invoice";


    document.getElementById(
        "invoiceSubmitBtn"
    ).innerHTML = `
        <i class="bi bi-arrow-repeat"></i>
        Update Invoice
    `;


    invoiceModal.show();

}


/* =========================================================
   SAVE / UPDATE
========================================================= */

async function handleInvoiceSubmit(event) {

    event.preventDefault();


    const rentalId =
        Number(
            document.getElementById("rentalId").value
        );


    const discountValue =
        document.getElementById(
            "invoiceDiscount"
        ).value;


    const issueDateValue =
        document.getElementById(
            "invoiceIssueDate"
        ).value;


    const invoiceData = {

        rentalId: rentalId,

        discount:
            discountValue === ""
                ? 0
                : Number(discountValue),

        issueDate:
            issueDateValue
                ? new Date(issueDateValue).toISOString()
                : null

    };


    if (editingInvoiceId !== null) {

        invoiceData.invoiceId =
            editingInvoiceId;

    }


    const url =
        editingInvoiceId === null

            ? `${API_BASE_URL}/v1/invoice/save`

            : `${API_BASE_URL}/v1/invoice/update`;


    const method =
        editingInvoiceId === null
            ? "POST"
            : "PUT";


    try {

        const response =
            await fetch(
                url,
                {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(invoiceData)
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Invoice operation failed"
            );

        }


        invoiceModal.hide();


        showInvoiceMessage(
            editingInvoiceId === null

                ? "Invoice saved successfully."

                : "Invoice updated successfully.",

            "success"
        );


        editingInvoiceId = null;


        await loadInvoices();


    } catch (error) {

        console.error(
            "Invoice Save Error:",
            error
        );


        showInvoiceMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   VIEW INVOICE
========================================================= */

function viewInvoice(invoiceId) {

    const invoice =
        invoices.find(
            item => item.invoiceId === invoiceId
        );


    if (!invoice) {
        return;
    }


    populateInvoicePreview(invoice);

    invoicePreviewModal.show();

}


/* =========================================================
   POPULATE PREVIEW
========================================================= */

function populateInvoicePreview(invoice) {

    const invoiceNumber =
        `#INV-${String(invoice.invoiceId).padStart(4, "0")}`;


    document.getElementById(
        "previewInvoiceTitle"
    ).textContent = invoiceNumber;


    document.getElementById(
        "printInvoiceNumber"
    ).textContent = invoiceNumber;


    document.getElementById(
        "printCustomerName"
    ).textContent =
        invoice.customerName ||
        "Customer";


    document.getElementById(
        "printCustomerId"
    ).textContent =
        `Customer ID: ${invoice.customerId ?? "-"}`;


    document.getElementById(
        "printIssueDate"
    ).textContent =
        formatDate(invoice.issueDate);


    document.getElementById(
        "printRentalId"
    ).textContent =
        invoice.rentalId ?? "-";


    document.getElementById(
        "printPaymentId"
    ).textContent =
        invoice.paymentId ?? "-";


    document.getElementById(
        "printInvoiceStatus"
    ).textContent =
        formatStatus(invoice.status);


    document.getElementById(
        "printSubTotal"
    ).textContent =
        formatCurrency(invoice.subTotal);


    document.getElementById(
        "printDiscount"
    ).textContent =
        `- ${formatCurrency(invoice.discount)}`;


    document.getElementById(
        "printSubTotalBottom"
    ).textContent =
        formatCurrency(invoice.subTotal);


    document.getElementById(
        "printDiscountBottom"
    ).textContent =
        `- ${formatCurrency(invoice.discount)}`;


    document.getElementById(
        "printTotalAmount"
    ).textContent =
        formatCurrency(invoice.totalAmount);


    const paidAmount =
        Math.max(
            0,
            Number(invoice.totalAmount || 0) -
            Number(invoice.balance || 0)
        );


    document.getElementById(
        "printPaidAmount"
    ).textContent =
        formatCurrency(paidAmount);


    document.getElementById(
        "printBalance"
    ).textContent =
        formatCurrency(invoice.balance);

}


/* =========================================================
   QUICK PRINT
========================================================= */

function quickPrintInvoice(invoiceId) {

    const invoice =
        invoices.find(
            item => item.invoiceId === invoiceId
        );


    if (!invoice) {
        return;
    }


    populateInvoicePreview(invoice);

    invoicePreviewModal.show();


    setTimeout(() => {

        printInvoice();

    }, 500);

}


/* =========================================================
   PRINT / DOWNLOAD PDF
========================================================= */

function printInvoice() {

    window.print();

}


/* =========================================================
   CANCEL INVOICE
========================================================= */

async function cancelInvoice(invoiceId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this invoice?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/v1/invoice/${invoiceId}`,
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
                "Failed to cancel invoice"
            );

        }


        showInvoiceMessage(
            "Invoice cancelled successfully.",
            "success"
        );


        await loadInvoices();


    } catch (error) {

        console.error(
            "Cancel Invoice Error:",
            error
        );


        showInvoiceMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function searchInvoices() {

    const search =document.getElementById("invoiceSearch") .value .trim() .toLowerCase();

    const status =document.getElementById("invoiceStatusFilter")  .value;

    applyInvoiceFilters(search, status);
}


/* =========================================================
   FILTER
========================================================= */

function filterInvoices() {

    const search = document.getElementById("invoiceSearch") .value.trim() .toLowerCase();

    const status = document.getElementById("invoiceStatusFilter") .value;

    applyInvoiceFilters(search, status);
}


/* =========================================================
   APPLY SEARCH + FILTER
========================================================= */

function applyInvoiceFilters(search, status) {

    const filtered = invoices.filter(invoice => {

        const invoiceId = String(invoice.invoiceId ?? "").toLowerCase();

        const rentalId = String(invoice.rentalId ?? "").toLowerCase();

        const customerId = String(invoice.customerId ?? "") .toLowerCase();

        const customerName = String(invoice.customerName ?? "").trim() .toLowerCase();


        /* Display formats */

        const formattedInvoiceId = `inv-${String(invoice.invoiceId ?? "")}`.toLowerCase();

        const formattedInvoiceNumber =`#inv-${String(invoice.invoiceId ?? "") .padStart(4, "0")}`.toLowerCase();


        /* Search */

        const matchesSearch = search === "" ||

            invoiceId.includes(search) ||

            rentalId.includes(search) ||

            customerId.includes(search) ||

            customerName.includes(search) ||

            formattedInvoiceId.includes(search) ||

            formattedInvoiceNumber.includes(search);

        const matchesStatus = status === "ALL" || invoice.status === status;


        return matchesSearch && matchesStatus;

    });


    renderInvoices(filtered);
}


/* =========================================================
   FORMAT CURRENCY
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
   FORMAT DATE
========================================================= */

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


/* =========================================================
   DATETIME LOCAL
========================================================= */

function convertToDateTimeLocal(value) {

    const date =
        new Date(value);


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
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

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

function showInvoiceMessage(message, type) {

    if (type === "success") {

        alert(message);

    } else {

        alert(message);

    }

}
