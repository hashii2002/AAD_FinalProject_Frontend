/* =========================================================
   CUSTOMER - BROWSE VEHICLES
========================================================= */

let vehicles = [];
let models = [];
let categories = [];
let brands = [];

let vehicleDetailsModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        if (
            typeof checkRoleAccess === "function"
        ) {

            const allowed =
                checkRoleAccess(["CUSTOMER"]);

            if (allowed === false) {
                return;
            }

        }


        setupCustomerProfile();

        setupSidebar();

        setupLogout();

        setupFilters();

        setupResetButtons();


        const modalElement =
            document.getElementById(
                "vehicleDetailsModal"
            );


        if (modalElement) {

            vehicleDetailsModal =
                new bootstrap.Modal(
                    modalElement
                );

        }


        await loadVehicleData();

    }
);


/* =========================================================
   CUSTOMER PROFILE
========================================================= */

function setupCustomerProfile() {

    const username =
        localStorage.getItem("username")
        || "Customer";


    const firstLetter =
        username
            .charAt(0)
            .toUpperCase();


    const sidebarUsername =
        document.getElementById(
            "sidebarUsername"
        );

    const topbarUsername =
        document.getElementById(
            "topbarUsername"
        );

    const sidebarAvatar =
        document.getElementById(
            "sidebarAvatar"
        );

    const topbarAvatar =
        document.getElementById(
            "topbarAvatar"
        );


    if (sidebarUsername) {

        sidebarUsername.textContent =
            username;

    }


    if (topbarUsername) {

        topbarUsername.textContent =
            username;

    }


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            firstLetter;

    }


    if (topbarAvatar) {

        topbarAvatar.textContent =
            firstLetter;

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById(
            "customerSidebar"
        );

    const menuButton =
        document.getElementById(
            "mobileMenuButton"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        !sidebar ||
        !menuButton ||
        !overlay
    ) {
        return;
    }


    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.add(
                "sidebar-open"
            );

            overlay.classList.add(
                "show"
            );

        }
    );


    overlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "sidebar-open"
            );

            overlay.classList.remove(
                "show"
            );

        }
    );


    document
        .querySelectorAll(".sidebar-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "sidebar-open"
                    );

                    overlay.classList.remove(
                        "show"
                    );

                }
            );

        });

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        () => {

            if (
                typeof logout ===
                "function"
            ) {

                logout();

                return;

            }


            localStorage.clear();

            window.location.href =
                "../../index.html";

        }
    );

}


/* =========================================================
   LOAD VEHICLE DATA
========================================================= */

async function loadVehicleData() {

    showLoading();

    try {

        const [
            vehicleData,
            modelData,
            categoryData,
            brandData
        ] = await Promise.all([

            fetchVehicles(),

            fetchModels(),

            fetchCategories(),

            fetchBrands()

        ]);


        vehicles =
            vehicleData;

        models =
            modelData;

        categories =
            categoryData;

        brands =
            brandData;


        populateCategoryFilter();

        populateBrandFilter();

        updateSummary();

        renderVehicles();


    } catch (error) {

        console.error(
            "Vehicle loading error:",
            error
        );

        showLoadingError(
            error.message
            || "Unable to load vehicles."
        );

    }

}


/* =========================================================
   FETCH VEHICLES
========================================================= */

async function fetchVehicles() {

    const response =
        await authenticatedFetch(
            `${API_BASE_URL}/v1/vehicle/all`
        );


    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load vehicles."
        );

    }


    const data =
        await response.json();


    return extractBodyArray(data);

}


/* =========================================================
   FETCH MODELS
========================================================= */

async function fetchModels() {

    const response =
        await authenticatedFetch(
            `${API_BASE_URL}/v1/model/all`
        );


    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load vehicle models."
        );

    }


    const data =
        await response.json();


    return extractBodyArray(data);

}


/* =========================================================
   FETCH CATEGORIES
========================================================= */

async function fetchCategories() {

    const response =
        await authenticatedFetch(
            `${API_BASE_URL}/v1/category/all`
        );


    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load vehicle categories."
        );

    }


    const data =
        await response.json();


    return extractBodyArray(data);

}


/* =========================================================
   FETCH BRANDS
========================================================= */

async function fetchBrands() {

    const response =
        await authenticatedFetch(
            `${API_BASE_URL}/v1/brand/all`
        );


    if (!response.ok) {

        throw await createApiError(
            response,
            "Failed to load vehicle brands."
        );

    }


    const data =
        await response.json();


    return extractBodyArray(data);

}


/* =========================================================
   AUTHENTICATED FETCH
========================================================= */

async function authenticatedFetch(
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


    return fetch(
        url,
        {
            ...options,
            headers
        }
    );

}


/* =========================================================
   RESPONSE BODY
========================================================= */

function extractBodyArray(data) {

    if (!data) {
        return [];
    }


    if (Array.isArray(data)) {
        return data;
    }


    if (Array.isArray(data.body)) {
        return data.body;
    }


    return [];

}


/* =========================================================
   API ERROR
========================================================= */

async function createApiError(
    response,
    defaultMessage
) {

    try {

        const data =
            await response.json();


        return new Error(
            data.message
            || defaultMessage
        );

    } catch {

        return new Error(
            defaultMessage
        );

    }

}


/* =========================================================
   FILTER SETUP
========================================================= */

function setupFilters() {

    const search =
        document.getElementById(
            "vehicleSearch"
        );

    const category =
        document.getElementById(
            "categoryFilter"
        );

    const brand =
        document.getElementById(
            "brandFilter"
        );

    const status =
        document.getElementById(
            "statusFilter"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderVehicles
        );

    }


    if (category) {

        category.addEventListener(
            "change",
            renderVehicles
        );

    }


    if (brand) {

        brand.addEventListener(
            "change",
            renderVehicles
        );

    }


    if (status) {

        status.addEventListener(
            "change",
            renderVehicles
        );

    }

}


/* =========================================================
   RESET BUTTONS
========================================================= */

function setupResetButtons() {

    const resetButton =
        document.getElementById(
            "resetFilters"
        );

    const emptyResetButton =
        document.getElementById(
            "emptyResetButton"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );

    }


    if (emptyResetButton) {

        emptyResetButton.addEventListener(
            "click",
            resetFilters
        );

    }

}


/* =========================================================
   POPULATE CATEGORY FILTER
========================================================= */

function populateCategoryFilter() {

    const select =
        document.getElementById(
            "categoryFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            All Categories
        </option>

    `;


    categories.forEach(
        category => {

            const categoryId =
                category.categoryId;


            const categoryName =
                getCategoryName(
                    category
                );


            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${categoryId}">
                        ${escapeHtml(
                            categoryName
                        )}
                    </option>
                `
            );

        }
    );

}


/* =========================================================
   POPULATE BRAND FILTER
========================================================= */

function populateBrandFilter() {

    const select =
        document.getElementById(
            "brandFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            All Brands
        </option>

    `;


    brands.forEach(
        brand => {

            const brandId =
                brand.brandId;


            const brandName =
                brand.brandName
                || "Unknown Brand";


            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${brandId}">
                        ${escapeHtml(
                            brandName
                        )}
                    </option>
                `
            );

        }
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const available =
        vehicles.filter(
            vehicle =>
                normalizeStatus(
                    vehicle.status
                ) === "AVAILABLE"
        ).length;


    const categoryIds =
        new Set(
            vehicles
                .map(
                    vehicle =>
                        vehicle.categoryId
                )
                .filter(
                    id =>
                        id !== null &&
                        id !== undefined
                )
        );


    const modelIds =
        new Set(
            vehicles
                .map(
                    vehicle =>
                        vehicle.modelId
                )
                .filter(
                    id =>
                        id !== null &&
                        id !== undefined
                )
        );


    setText(
        "availableCount",
        available
    );


    setText(
        "categoryCount",
        categoryIds.size
    );


    setText(
        "modelCount",
        modelIds.size
    );

}


/* =========================================================
   RENDER VEHICLES
========================================================= */

function renderVehicles() {

    const grid =
        document.getElementById(
            "vehicleGrid"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const loading =
        document.getElementById(
            "vehicleLoading"
        );


    if (!grid) {
        return;
    }


    if (loading) {

        loading.style.display =
            "none";

    }


    const filteredVehicles =
        getFilteredVehicles();


    setText(
        "resultCount",
        `${filteredVehicles.length} ${
            filteredVehicles.length === 1
                ? "vehicle"
                : "vehicles"
        }`
    );


    if (
        filteredVehicles.length === 0
    ) {

        grid.innerHTML = "";

        if (emptyState) {

            emptyState.style.display =
                "block";

        }

        return;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    grid.innerHTML =
        filteredVehicles
            .map(
                vehicle =>
                    createVehicleCard(
                        vehicle
                    )
            )
            .join("");


    attachVehicleDetailsEvents();

}


/* =========================================================
   FILTER VEHICLES
========================================================= */

function getFilteredVehicles() {

    const search =
        (
            document.getElementById(
                "vehicleSearch"
            )?.value
            || ""
        )
            .trim()
            .toLowerCase();


    const categoryId =
        document.getElementById(
            "categoryFilter"
        )?.value
        || "";


    const brandId =
        document.getElementById(
            "brandFilter"
        )?.value
        || "";


    const status =
        document.getElementById(
            "statusFilter"
        )?.value
        || "";


    return vehicles.filter(
        vehicle => {

            const model =
                getModelById(
                    vehicle.modelId
                );


            const category =
                getCategoryById(
                    vehicle.categoryId
                );


            const brand =
                model
                    ? getBrandById(
                        model.brandId
                    )
                    : null;


            const modelName =
                getModelName(
                    model
                );


            const brandName =
                brand?.brandName
                || "";


            const categoryName =
                getCategoryName(
                    category
                );


            const vehicleNumber =
                vehicle.vehicleNo
                || "";


            const color =
                vehicle.color
                || "";


            const searchableText =
                [
                    modelName,
                    brandName,
                    categoryName,
                    vehicleNumber,
                    color
                ]
                    .join(" ")
                    .toLowerCase();


            const matchesSearch =
                !search
                || searchableText.includes(
                    search
                );


            const matchesCategory =
                !categoryId
                || String(
                    vehicle.categoryId
                ) === String(
                    categoryId
                );


            const matchesBrand =
                !brandId
                || String(
                    model?.brandId
                ) === String(
                    brandId
                );


            const matchesStatus =
                !status
                || normalizeStatus(
                    vehicle.status
                ) ===
                normalizeStatus(
                    status
                );


            return (
                matchesSearch &&
                matchesCategory &&
                matchesBrand &&
                matchesStatus
            );

        }
    );

}


/* =========================================================
   VEHICLE CARD
========================================================= */

function createVehicleCard(
    vehicle
) {

    const model =
        getModelById(
            vehicle.modelId
        );


    const category =
        getCategoryById(
            vehicle.categoryId
        );


    const brand =
        model
            ? getBrandById(
                model.brandId
            )
            : null;


    const modelName =
        getModelName(
            model
        );


    const brandName =
        brand?.brandName
        || "Vehicle";


    const categoryName =
        getCategoryName(
            category
        );


    const status =
        normalizeStatus(
            vehicle.status
        );


    const statusClass =
        getStatusClass(
            status
        );


    const fuel =
        model?.fuelType
        || "-";


    const transmission =
        model?.transmissionType
        || "-";


    const seats =
        model?.seatingCapacity
        || "-";


    return `

        <article
                class="vehicle-card">


            <!-- VISUAL -->

            <div
                    class="vehicle-visual">


                <div
                        class="vehicle-icon">

                    <i
                            class="bi bi-car-front-fill">
                    </i>

                </div>


                <span
                        class="vehicle-status
                        ${statusClass}">

                    ${formatStatus(
                        status
                    )}

                </span>


            </div>



            <!-- BODY -->

            <div
                    class="vehicle-card-body">


                <span
                        class="vehicle-brand">

                    ${escapeHtml(
                        brandName
                    )}

                </span>


                <h3
                        class="vehicle-name">

                    ${escapeHtml(
                        modelName
                    )}

                </h3>


                <span
                        class="vehicle-number">

                    ${escapeHtml(
                        vehicle.vehicleNo
                        || "Vehicle number unavailable"
                    )}

                </span>



                <!-- FEATURES -->

                <div
                        class="vehicle-features">


                    <div
                            class="vehicle-feature">

                        <i
                                class="bi bi-fuel-pump">
                        </i>

                        <span>
                            Fuel
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatEnum(
                                    fuel
                                )
                            )}
                        </strong>

                    </div>


                    <div
                            class="vehicle-feature">

                        <i
                                class="bi bi-gear">
                        </i>

                        <span>
                            Transmission
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatEnum(
                                    transmission
                                )
                            )}
                        </strong>

                    </div>


                    <div
                            class="vehicle-feature">

                        <i
                                class="bi bi-people">
                        </i>

                        <span>
                            Seats
                        </span>

                        <strong>
                            ${escapeHtml(
                                String(
                                    seats
                                )
                            )}
                        </strong>

                    </div>


                </div>



                <!-- FOOTER -->

                <div
                        class="vehicle-card-footer">


                    <span
                            class="vehicle-category">

                        <i
                                class="bi bi-grid">
                        </i>

                        ${escapeHtml(
                            categoryName
                        )}

                    </span>


                    <button
                            type="button"
                            class="details-btn"
                            data-vehicle-id="${vehicle.vehicleId}">

                        View Details

                        <i
                                class="bi bi-arrow-right">
                        </i>

                    </button>


                </div>


            </div>


        </article>

    `;

}


/* =========================================================
   DETAILS EVENTS
========================================================= */

function attachVehicleDetailsEvents() {

    document
        .querySelectorAll(
            ".details-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const vehicleId =
                            Number(
                                button.dataset
                                    .vehicleId
                            );


                        openVehicleDetails(
                            vehicleId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   OPEN DETAILS
========================================================= */

function openVehicleDetails(
    vehicleId
) {

    const vehicle =
        vehicles.find(
            item =>
                Number(
                    item.vehicleId
                ) === Number(
                    vehicleId
                )
        );


    if (!vehicle) {
        return;
    }


    const model =
        getModelById(
            vehicle.modelId
        );


    const category =
        getCategoryById(
            vehicle.categoryId
        );


    const brand =
        model
            ? getBrandById(
                model.brandId
            )
            : null;


    const status =
        normalizeStatus(
            vehicle.status
        );


    setText(
        "modalVehicleTitle",
        `${brand?.brandName || ""} ${
            getModelName(model)
        }`
    );


    setText(
        "modalVehicleBrand",
        brand?.brandName
        || "Vehicle"
    );


    setText(
        "modalVehicleName",
        getModelName(model)
    );


    setText(
        "modalVehicleNumber",
        vehicle.vehicleNo
        || "-"
    );


    setText(
        "modalCategory",
        getCategoryName(
            category
        )
    );


    setText(
        "modalModel",
        getModelName(
            model
        )
    );


    setText(
        "modalYear",
        vehicle.year
        || "-"
    );


    setText(
        "modalColor",
        vehicle.color
        || "-"
    );


    const statusElement =
        document.getElementById(
            "modalVehicleStatus"
        );


    if (statusElement) {

        statusElement.textContent =
            formatStatus(
                status
            );


        statusElement.className =
            `vehicle-status ${
                getStatusClass(
                    status
                )
            }`;

    }


    if (vehicleDetailsModal) {

        vehicleDetailsModal.show();

    }

}


/* =========================================================
   FIND MODEL
========================================================= */

function getModelById(
    modelId
) {

    return models.find(
        model =>
            Number(
                model.modelId
            ) === Number(
                modelId
            )
    );

}


/* =========================================================
   FIND CATEGORY
========================================================= */

function getCategoryById(
    categoryId
) {

    return categories.find(
        category =>
            Number(
                category.categoryId
            ) === Number(
                categoryId
            )
    );

}


/* =========================================================
   FIND BRAND
========================================================= */

function getBrandById(
    brandId
) {

    return brands.find(
        brand =>
            Number(
                brand.brandId
            ) === Number(
                brandId
            )
    );

}


/* =========================================================
   MODEL NAME
========================================================= */

function getModelName(
    model
) {

    if (!model) {
        return "Vehicle";
    }


    return (
        model.modelName
        || "Vehicle Model"
    );

}


/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(
    category
) {

    if (!category) {
        return "General";
    }


    /*
     * Your VehicleCategoryDTO/entity
     * uses Categoryname enum.
     */

    return (
        category.category
        || category.categoryName
        || "General"
    );

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    switch (
        normalizeStatus(status)
    ) {

        case "AVAILABLE":
            return "available";

        case "RENTED":
            return "rented";

        case "MAINTENANCE":
            return "maintenance";

        case "UNAVAILABLE":
            return "unavailable";

        case "RESERVED":
            return "reserved";

        default:
            return "unavailable";

    }

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(
    status
) {

    return String(
        status || ""
    )
        .trim()
        .toUpperCase();

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    status
) {

    const value =
        normalizeStatus(
            status
        );


    if (!value) {
        return "Unknown";
    }


    return value
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


/* =========================================================
   FORMAT ENUM
========================================================= */

function formatEnum(
    value
) {

    if (!value) {
        return "-";
    }


    return String(value)
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


/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

    const search =
        document.getElementById(
            "vehicleSearch"
        );

    const category =
        document.getElementById(
            "categoryFilter"
        );

    const brand =
        document.getElementById(
            "brandFilter"
        );

    const status =
        document.getElementById(
            "statusFilter"
        );


    if (search) {
        search.value = "";
    }

    if (category) {
        category.value = "";
    }

    if (brand) {
        brand.value = "";
    }

    if (status) {
        status.value = "";
    }


    renderVehicles();

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    const loading =
        document.getElementById(
            "vehicleLoading"
        );

    const grid =
        document.getElementById(
            "vehicleGrid"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (loading) {

        loading.style.display =
            "flex";

    }


    if (grid) {

        grid.innerHTML = "";

    }


    if (empty) {

        empty.style.display =
            "none";

    }

}


/* =========================================================
   LOADING ERROR
========================================================= */

function showLoadingError(
    message
) {

    const loading =
        document.getElementById(
            "vehicleLoading"
        );


    const grid =
        document.getElementById(
            "vehicleGrid"
        );


    if (loading) {

        loading.innerHTML = `

            <div class="empty-icon">

                <i class="bi bi-exclamation-circle"></i>

            </div>

            <p>
                ${escapeHtml(
                    message
                )}
            </p>

        `;

    }


    if (grid) {

        grid.innerHTML = "";

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
            value;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}