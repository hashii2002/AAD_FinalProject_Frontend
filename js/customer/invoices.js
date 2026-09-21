/* =========================================================
   CUSTOMER INVOICES
========================================================= */

let invoices = [];

let invoicePreviewModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    checkRoleAccess(["CUSTOMER"]);

    loadInvoiceUser();

    invoicePreviewModal = new bootstrap.Modal(
        document.getElementById("invoicePreviewModal")
    );

    await loadInvoices();

});


/* =========================================================
   AUTH HEADERS
========================================================= */

function getAuthHeaders() {

    const token =
        localStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

}


/* =========================================================
   LOAD USER
========================================================= */

function loadInvoiceUser() {

    const username =
        localStorage.getItem("username");


    const profileUsername =
        document.getElementById("profileUsername");


    const profileAvatar =
        document.getElementById("profileAvatar");


    const sidebarUsername =
        document.getElementById("sidebarUsername");


    const sidebarAvatar =
        document.getElementById("sidebarAvatar");


    if (username) {

        const firstLetter =
            username.charAt(0).toUpperCase();


        if (profileUsername) {

            profileUsername.textContent =
                username;

        }


        if (profileAvatar) {

            profileAvatar.textContent =
                firstLetter;

        }


        if (sidebarUsername) {

            sidebarUsername.textContent =
                username;

        }


        if (sidebarAvatar) {

            sidebarAvatar.textContent =
                firstLetter;

        }

    }

}


/* =========================================================
   LOAD CUSTOMER INVOICES
========================================================= */

async function loadInvoices() {

    const tbody =
        document.getElementById("invoiceTableBody");

    const emptyState =
        document.getElementById("invoiceEmptyState");


    try {

        tbody.innerHTML = `

            <tr>

                <td colspan="7"
                    class="text-center py-5">

                    <div class="spinner-border spinner-border-sm text-primary"
                         role="status">

                    </div>

                    <span class="ms-2">
                        Loading invoices...
                    </span>

                </td>

            </tr>

        `;


        const response =
            await fetch(
                `${API_BASE_URL}/v1/invoice/me`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load invoices."
            );

        }


        invoices =
            Array.isArray(data.body)
                ? data.body
                : [];


        updateInvoiceStatistics(invoices);

        applyFilters();


    } catch (error) {

        console.error(
            "Customer Invoice Error:",
            error
        );


        invoices = [];

        updateInvoiceStatistics([]);

        tbody.innerHTML = "";


        emptyState.style.display = "block";

        emptyState.querySelector("h4").textContent =
            "Unable to load invoices";

        emptyState.querySelector("p").textContent =
            error.message ||
            "Please try again later.";

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateInvoiceStatistics(invoiceList) {

    const total =
        invoiceList.length;


    const issued =
        invoiceList.filter(
            invoice =>
                String(invoice.status || "")
                    .toUpperCase() === "ISSUED"
        ).length;


    const paid =
        invoiceList.filter(
            invoice =>
                String(invoice.status || "")
                    .toUpperCase() === "PAID"
        ).length;


    const outstanding =
        invoiceList.reduce(
            (sum, invoice) => {

                const status =
                    String(invoice.status || "")
                        .toUpperCase();


                if (status === "CANCELLED") {

                    return sum;

                }


                return sum +
                    Math.max(
                        0,
                        Number(invoice.balance || 0)
                    );

            },
            0
        );


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
        "outstandingAmount"
    ).textContent =
        formatCurrency(outstanding);

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const searchInput =
        document.getElementById("invoiceSearch");


    const statusFilter =
        document.getElementById("invoiceStatusFilter");


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "ALL";


    const filteredInvoices =
        invoices.filter(invoice => {


            const invoiceId =
                String(
                    invoice.invoiceId ?? ""
                ).toLowerCase();


            const rentalId =
                String(
                    invoice.rentalId ?? ""
                ).toLowerCase();


            const customerId =
                String(
                    invoice.customerId ?? ""
                ).toLowerCase();


            const customerName =
                String(
                    invoice.customerName ?? ""
                )
                .trim()
                .toLowerCase();


            const invoiceNumber =
                `#inv-${String(
                    invoice.invoiceId ?? ""
                ).padStart(4, "0")}`;


            const matchesSearch =
                search === "" ||

                invoiceId.includes(search) ||

                rentalId.includes(search) ||

                customerId.includes(search) ||

                customerName.includes(search) ||

                invoiceNumber.includes(search);


            const invoiceStatus =
                String(
                    invoice.status || ""
                ).toUpperCase();


            const matchesStatus =
                status === "ALL" ||
                invoiceStatus === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderInvoices(filteredInvoices);

}


/* =========================================================
   RENDER INVOICES
========================================================= */

function renderInvoices(invoiceList) {

    const tbody =
        document.getElementById(
            "invoiceTableBody"
        );


    const emptyState =
        document.getElementById(
            "invoiceEmptyState"
        );


    tbody.innerHTML = "";


    if (
        !invoiceList ||
        invoiceList.length === 0
    ) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    invoiceList.forEach(invoice => {

        const row =
            document.createElement("tr");


        const status =
            String(
                invoice.status || "ISSUED"
            ).toUpperCase();


        const statusClass =
            status
                .toLowerCase()
                .replace("_", "-");


        const balance =
            Number(
                invoice.balance || 0
            );


        const invoiceNumber =
            `#INV-${String(
                invoice.invoiceId
            ).padStart(4, "0")}`;


        row.innerHTML = `

            <td>

                <span class="invoice-number">

                    ${invoiceNumber}

                </span>

            </td>


            <td>

                <span class="invoice-rental-id">

                    #${invoice.rentalId ?? "-"}

                </span>

            </td>


            <td>

                ${formatDate(
                    invoice.issueDate
                )}

            </td>


            <td>

                <span class="invoice-total">

                    ${formatCurrency(
                        invoice.totalAmount
                    )}

                </span>

            </td>


            <td>

                <span class="
                    invoice-balance
                    ${balance <= 0
                        ? "zero"
                        : "pending"}
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

                <button
                    type="button"
                    class="invoice-view-btn"
                    title="View Invoice"
                    onclick="viewInvoice(${invoice.invoiceId})">

                    <i class="bi bi-eye"></i>

                </button>

            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   VIEW INVOICE
========================================================= */

function viewInvoice(invoiceId) {

    const invoice =
        invoices.find(
            item =>
                Number(item.invoiceId) ===
                Number(invoiceId)
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
        `#INV-${String(
            invoice.invoiceId
        ).padStart(4, "0")}`;


    document.getElementById(
        "previewInvoiceTitle"
    ).textContent =
        invoiceNumber;


    document.getElementById(
        "printInvoiceNumber"
    ).textContent =
        invoiceNumber;


    document.getElementById(
        "printCustomerName"
    ).textContent =
        invoice.customerName ||
        localStorage.getItem("username") ||
        "Customer";


    document.getElementById(
        "printCustomerId"
    ).textContent =
        `Customer ID: ${
            invoice.customerId ?? "-"
        }`;


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


    const status =
        String(
            invoice.status || "-"
        ).toUpperCase();


    document.getElementById(
        "printInvoiceStatus"
    ).textContent =
        formatStatus(status);


    document.getElementById(
        "printSubTotal"
    ).textContent =
        formatCurrency(
            invoice.subTotal
        );


    document.getElementById(
        "printDiscount"
    ).textContent =
        `- ${formatCurrency(
            invoice.discount
        )}`;


    document.getElementById(
        "printSubTotalBottom"
    ).textContent =
        formatCurrency(
            invoice.subTotal
        );


    document.getElementById(
        "printDiscountBottom"
    ).textContent =
        `- ${formatCurrency(
            invoice.discount
        )}`;


    document.getElementById(
        "printTotalAmount"
    ).textContent =
        formatCurrency(
            invoice.totalAmount
        );


    const totalAmount =
        Number(
            invoice.totalAmount || 0
        );


    const balance =
        Number(
            invoice.balance || 0
        );


    const paidAmount =
        Math.max(
            0,
            totalAmount - balance
        );


    document.getElementById(
        "printPaidAmount"
    ).textContent =
        formatCurrency(
            paidAmount
        );


    document.getElementById(
        "printBalance"
    ).textContent =
        formatCurrency(
            balance
        );

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearInvoiceFilters() {

    const search =
        document.getElementById(
            "invoiceSearch"
        );


    const status =
        document.getElementById(
            "invoiceStatusFilter"
        );


    if (search) {

        search.value = "";

    }


    if (status) {

        status.value = "ALL";

    }


    applyFilters();

}


/* =========================================================
   PRINT INVOICE
========================================================= */

function printInvoice() {

    window.print();

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


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    if (!status) {

        return "-";

    }


    return String(status)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}