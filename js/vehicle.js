const API = API_BASE_URL;

let vehicles = [];
let brands = [];
let categories = [];
let models = [];

let vehicleModal;
let brandModal;
let categoryModal;
let modelModal;


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    vehicleModal = new bootstrap.Modal(
        document.getElementById("vehicleModal")
    );

    brandModal = new bootstrap.Modal(
        document.getElementById("brandModal")
    );

    categoryModal = new bootstrap.Modal(
        document.getElementById("categoryModal")
    );

    modelModal = new bootstrap.Modal(
        document.getElementById("modelModal")
    );

    loadUserInfo();

    await loadBrands();
    await loadCategories();
    await loadModels();
    await loadVehicles();

});


/* =========================================
   AUTH
========================================= */

function getToken() {
    return localStorage.getItem("accessToken");
}


function authHeaders() {

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };

}


/* =========================================
   USER INFO
========================================= */

function loadUserInfo() {

    const username =
        localStorage.getItem("username") || "Admin";

    const role =
        localStorage.getItem("role") || "ADMIN";

    document.getElementById("sidebarUsername").textContent = username;
    document.getElementById("profileUsername").textContent = username;

    document.getElementById("sidebarRole").textContent =
        formatRole(role);

    document.getElementById("profileRole").textContent =
        formatRole(role);

    const initial = username.charAt(0).toUpperCase();

    document.getElementById("sidebarAvatar").textContent = initial;
    document.getElementById("profileAvatar").textContent = initial;

}


function formatRole(role) {

    return role
        .replace("ROLE_", "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, c => c.toUpperCase());

}


/* =========================================
   TAB SWITCH
========================================= */

function switchTab(tabName) {

    document.querySelectorAll(".management-tabs .nav-link")
        .forEach(button => {
            button.classList.remove("active");
        });

    document.querySelector(
        `.management-tabs .nav-link[data-tab="${tabName}"]`
    ).classList.add("active");


    document.querySelectorAll(".tab-content")
        .forEach(tab => {
            tab.classList.remove("active");
        });

    document.getElementById(tabName + "Tab")
        .classList.add("active");


    const addButton =
        document.getElementById("mainAddButton");

    if (tabName === "vehicles") {

        addButton.style.display = "inline-flex";
        addButton.innerHTML =
            '<i class="bi bi-plus-lg"></i> Add Vehicle';

        addButton.onclick = openVehicleModal;

    } else if (tabName === "brands") {

        addButton.style.display = "inline-flex";
        addButton.innerHTML =
            '<i class="bi bi-plus-lg"></i> Add Brand';

        addButton.onclick = openBrandModal;

    } else if (tabName === "categories") {

        addButton.style.display = "inline-flex";
        addButton.innerHTML =
            '<i class="bi bi-plus-lg"></i> Add Category';

        addButton.onclick = openCategoryModal;

    } else if (tabName === "models") {

        addButton.style.display = "inline-flex";
        addButton.innerHTML =
            '<i class="bi bi-plus-lg"></i> Add Model';

        addButton.onclick = openModelModal;

    }

}


/* =========================================
   VEHICLES
========================================= */

async function loadVehicles() {

    try {

        const response = await fetch(
            `${API}/v1/vehicle/all`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load vehicles");
        }

        const data = await response.json();

        vehicles = data.body || [];

        renderVehicles();

        updateVehicleSummary();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load vehicles",
            "error"
        );

    }

}


function renderVehicles(list = vehicles) {

    const tbody =
        document.getElementById("vehicleTableBody");

    tbody.innerHTML = "";

    const emptyState =
        document.getElementById("vehicleEmptyState");


    if (list.length === 0) {

        emptyState.classList.add("show");

        return;

    }

    emptyState.classList.remove("show");


    list.forEach((vehicle, index) => {

        const model =
            models.find(m => m.modelId === vehicle.modelId);

        const category =
            categories.find(
                c => c.categoryId === vehicle.categoryId
            );


        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${index + 1}</td>

            <td>
                <div class="vehicle-name">
                    ${escapeHtml(vehicle.vehicleNo)}
                </div>

                <div class="vehicle-number">
                    Vehicle ID #${vehicle.vehicleId}
                </div>
            </td>

            <td>
                ${model
                    ? escapeHtml(model.modelName)
                    : "Unknown"}
            </td>

            <td>
                ${category
                    ? escapeHtml(formatEnum(category.category))
                    : "Unknown"}
            </td>

            <td>${vehicle.year}</td>

            <td>${escapeHtml(vehicle.color)}</td>

            <td>
                ${statusBadge(vehicle.status)}
            </td>

            <td class="text-end">

                <button class="action-btn edit-btn"
                        title="Edit"
                        onclick="editVehicle(${vehicle.vehicleId})">

                    <i class="bi bi-pencil-fill"></i>

                </button>

                <button class="action-btn delete-btn"
                        title="Delete"
                        onclick="deleteVehicle(${vehicle.vehicleId})">

                    <i class="bi bi-trash-fill"></i>

                </button>

            </td>

        `;

        tbody.appendChild(row);

    });

}


function updateVehicleSummary() {

    document.getElementById("totalVehicles").textContent =
        vehicles.length;

    document.getElementById("availableVehicles").textContent =
        vehicles.filter(v => v.status === "AVAILABLE").length;

    document.getElementById("rentedVehicles").textContent =
        vehicles.filter(v => v.status === "RENTED").length;

    document.getElementById("maintenanceVehicles").textContent =
        vehicles.filter(v => v.status === "MAINTENANCE").length;

}


function filterVehicles() {

    const search =
        document.getElementById("vehicleSearch")
            .value
            .toLowerCase()
            .trim();

    const status =
        document.getElementById("vehicleStatusFilter").value;

    const category =
        document.getElementById("vehicleCategoryFilter").value;


    const filtered = vehicles.filter(vehicle => {

        const matchesSearch =
            vehicle.vehicleNo.toLowerCase().includes(search) ||
            vehicle.color.toLowerCase().includes(search);

        const matchesStatus =
            !status || vehicle.status === status;

        const matchesCategory =
            !category ||
            vehicle.categoryId == category;

        return matchesSearch &&
               matchesStatus &&
               matchesCategory;

    });


    renderVehicles(filtered);

}


async function openVehicleModal() {

    resetVehicleForm();

    await populateVehicleFormOptions();

    document.getElementById("vehicleModalTitle").textContent =
        "Add New Vehicle";

    vehicleModal.show();

}


async function editVehicle(id) {

    try {

        const response = await fetch(
            `${API}/v1/vehicle/select/${id}`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Vehicle not found");
        }

        const data = await response.json();

        const vehicle = data.body;

        await populateVehicleFormOptions();

        document.getElementById("vehicleId").value =
            vehicle.vehicleId;

        document.getElementById("vehicleNo").value =
            vehicle.vehicleNo;

        document.getElementById("vehicleColor").value =
            vehicle.color;

        document.getElementById("vehicleYear").value =
            vehicle.year;

        document.getElementById("vehicleStatus").value =
            vehicle.status;

        const model =
            models.find(m => m.modelId === vehicle.modelId);

        if (model) {

            document.getElementById("vehicleBrand").value =
                model.brandId;

            loadModelOptions();

            document.getElementById("vehicleModel").value =
                vehicle.modelId;

        }

        document.getElementById("vehicleCategory").value =
            vehicle.categoryId;


        document.getElementById("vehicleModalTitle").textContent =
            "Edit Vehicle";

        vehicleModal.show();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load vehicle",
            "error"
        );

    }

}


document.getElementById("vehicleForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const id =
            document.getElementById("vehicleId").value;


        const vehicle = {

            vehicleId: id ? Number(id) : null,

            modelId: Number(
                document.getElementById("vehicleModel").value
            ),

            categoryId: Number(
                document.getElementById("vehicleCategory").value
            ),

            color:
                document.getElementById("vehicleColor").value.trim(),

            vehicleNo:
                document.getElementById("vehicleNo").value.trim(),

            status:
                document.getElementById("vehicleStatus").value,

            year:
                Number(
                    document.getElementById("vehicleYear").value
                )

        };


        const url = id
            ? `${API}/v1/vehicle/update`
            : `${API}/v1/vehicle/save`;

        const method = id ? "PUT" : "POST";


        try {

            const response = await fetch(
                url,
                {
                    method: method,
                    headers: authHeaders(),
                    body: JSON.stringify(vehicle)
                }
            );

            const data = await response.json();

            if (!response.ok) {

                showToast(
                    data.message || "Vehicle operation failed",
                    "error"
                );

                return;
            }


            vehicleModal.hide();

            showToast(
                id
                    ? "Vehicle updated successfully"
                    : "Vehicle saved successfully",
                "success"
            );

            await loadVehicles();

        } catch (error) {

            console.error(error);

            showToast(
                "Server connection error",
                "error"
            );

        }

    });


async function deleteVehicle(id) {

    if (!confirm(
        "Are you sure you want to delete this vehicle?"
    )) {
        return;
    }


    try {

        const response = await fetch(
            `${API}/v1/vehicle/${id}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {

            showToast(
                data.message || "Unable to delete vehicle",
                "error"
            );

            return;
        }


        showToast(
            "Vehicle deleted successfully",
            "success"
        );

        await loadVehicles();

    } catch (error) {

        console.error(error);

        showToast(
            "Server connection error",
            "error"
        );

    }

}


/* =========================================
   BRANDS
========================================= */

async function loadBrands() {

    try {

        const response = await fetch(
            `${API}/v1/brand/all`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load brands");
        }

        const data = await response.json();

        brands = data.body || [];

        renderBrands();

        populateBrandSelects();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load brands",
            "error"
        );

    }

}


function renderBrands(list = brands) {

    const tbody =
        document.getElementById("brandTableBody");

    tbody.innerHTML = "";


    list.forEach((brand, index) => {

        tbody.innerHTML += `

            <tr>

                <td>${index + 1}</td>

                <td>
                    <strong>${escapeHtml(brand.brandName)}</strong>
                </td>

                <td>
                    ${escapeHtml(formatEnum(brand.country))}
                </td>

                <td class="text-end">

                    <button class="action-btn edit-btn"
                            onclick="editBrand(${brand.brandId})">

                        <i class="bi bi-pencil-fill"></i>

                    </button>

                    <button class="action-btn delete-btn"
                            onclick="deleteBrand(${brand.brandId})">

                        <i class="bi bi-trash-fill"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


function populateBrandSelects() {

    const selects = [
        document.getElementById("vehicleBrand"),
        document.getElementById("modelBrand")
    ];


    selects.forEach(select => {

        if (!select) return;

        const current =
            select.value;

        select.innerHTML =
            `<option value="">Select Brand</option>`;


        brands.forEach(brand => {

            select.innerHTML += `
                <option value="${brand.brandId}">
                    ${escapeHtml(brand.brandName)}
                </option>
            `;

        });

        if (current) {
            select.value = current;
        }

    });

}


function openBrandModal() {

    document.getElementById("brandForm").reset();
    document.getElementById("brandId").value = "";

    document.getElementById("brandModalTitle").textContent =
        "Add Brand";

    brandModal.show();

}


async function editBrand(id) {

    const brand =
        brands.find(b => b.brandId === id);

    if (!brand) return;

    document.getElementById("brandId").value =
        brand.brandId;

    document.getElementById("brandName").value =
        brand.brandName;

    document.getElementById("brandCountry").value =
        brand.country;

    document.getElementById("brandModalTitle").textContent =
        "Edit Brand";

    brandModal.show();

}


document.getElementById("brandForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const id =
            document.getElementById("brandId").value;


        const body = {

            brandId: id ? Number(id) : null,

            brandName:
                document.getElementById("brandName").value.trim(),

            country:
                document.getElementById("brandCountry").value

        };


        const response = await fetch(
            id
                ? `${API}/v1/brand/update`
                : `${API}/v1/brand/save`,
            {
                method: id ? "PUT" : "POST",
                headers: authHeaders(),
                body: JSON.stringify(body)
            }
        );


        const data = await response.json();

        if (!response.ok) {

            showToast(
                data.message || "Brand operation failed",
                "error"
            );

            return;

        }


        brandModal.hide();

        showToast(
            id
                ? "Brand updated successfully"
                : "Brand saved successfully",
            "success"
        );

        await loadBrands();

        await loadModels();

    });


async function deleteBrand(id) {

    if (!confirm(
        "Delete this brand?"
    )) return;


    const response = await fetch(
        `${API}/v1/brand/${id}`,
        {
            method: "DELETE",
            headers: authHeaders()
        }
    );


    const data = await response.json();

    if (!response.ok) {

        showToast(
            data.message || "Unable to delete brand",
            "error"
        );

        return;
    }


    showToast(
        "Brand deleted successfully",
        "success"
    );

    await loadBrands();

}


/* =========================================
   CATEGORIES
========================================= */

async function loadCategories() {

    try {

        const response = await fetch(
            `${API}/v1/category/all`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load categories");
        }

        const data = await response.json();

        categories = data.body || [];

        renderCategories();

        populateCategorySelects();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load categories",
            "error"
        );

    }

}


function renderCategories(list = categories) {

    const tbody =
        document.getElementById("categoryTableBody");

    tbody.innerHTML = "";


    list.forEach((category, index) => {

        tbody.innerHTML += `

            <tr>

                <td>${index + 1}</td>

                <td>
                    <strong>
                        ${escapeHtml(
                            formatEnum(category.category)
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        category.description || "No description"
                    )}
                </td>

                <td class="text-end">

                    <button class="action-btn edit-btn"
                            onclick="editCategory(${category.categoryId})">

                        <i class="bi bi-pencil-fill"></i>

                    </button>

                    <button class="action-btn delete-btn"
                            onclick="deleteCategory(${category.categoryId})">

                        <i class="bi bi-trash-fill"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


function populateCategorySelects() {

    const vehicleCategory =
        document.getElementById("vehicleCategory");

    const filter =
        document.getElementById("vehicleCategoryFilter");


    vehicleCategory.innerHTML =
        `<option value="">Select Category</option>`;

    filter.innerHTML =
        `<option value="">All Categories</option>`;


    categories.forEach(category => {

        const name =
            formatEnum(category.category);

        vehicleCategory.innerHTML += `
            <option value="${category.categoryId}">
                ${escapeHtml(name)}
            </option>
        `;

        filter.innerHTML += `
            <option value="${category.categoryId}">
                ${escapeHtml(name)}
            </option>
        `;

    });

}


function openCategoryModal() {

    document.getElementById("categoryForm").reset();

    document.getElementById("categoryId").value = "";

    document.getElementById("categoryModalTitle").textContent =
        "Add Category";

    categoryModal.show();

}


async function editCategory(id) {

    const category =
        categories.find(c => c.categoryId === id);

    if (!category) return;


    document.getElementById("categoryId").value =
        category.categoryId;

    document.getElementById("categoryName").value =
        category.category;

    document.getElementById("categoryDescription").value =
        category.description || "";


    document.getElementById("categoryModalTitle").textContent =
        "Edit Category";

    categoryModal.show();

}


document.getElementById("categoryForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const id =
            document.getElementById("categoryId").value;


        const body = {

            categoryId: id ? Number(id) : null,

            category:
                document.getElementById("categoryName").value,

            description:
                document.getElementById("categoryDescription")
                    .value.trim()

        };


        const response = await fetch(
            id
                ? `${API}/v1/category/update`
                : `${API}/v1/category/save`,
            {
                method: id ? "PUT" : "POST",
                headers: authHeaders(),
                body: JSON.stringify(body)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            showToast(
                data.message || "Category operation failed",
                "error"
            );

            return;

        }


        categoryModal.hide();

        showToast(
            id
                ? "Category updated successfully"
                : "Category saved successfully",
            "success"
        );

        await loadCategories();

        await loadVehicles();

    });


async function deleteCategory(id) {

    if (!confirm(
        "Delete this vehicle category?"
    )) return;


    const response = await fetch(
        `${API}/v1/category/${id}`,
        {
            method: "DELETE",
            headers: authHeaders()
        }
    );


    const data = await response.json();


    if (!response.ok) {

        showToast(
            data.message || "Unable to delete category",
            "error"
        );

        return;

    }


    showToast(
        "Category deleted successfully",
        "success"
    );

    await loadCategories();

}


/* =========================================
   MODELS
========================================= */

async function loadModels() {

    try {

        const response = await fetch(
            `${API}/v1/model/all`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load models");
        }

        const data = await response.json();

        models = data.body || [];

        renderModels();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load models",
            "error"
        );

    }

}


function renderModels(list = models) {

    const tbody =
        document.getElementById("modelTableBody");

    tbody.innerHTML = "";


    list.forEach((model, index) => {

        const brand =
            brands.find(
                b => b.brandId === model.brandId
            );


        tbody.innerHTML += `

            <tr>

                <td>${index + 1}</td>

                <td>
                    <strong>
                        ${escapeHtml(model.modelName)}
                    </strong>
                </td>

                <td>
                    ${brand
                        ? escapeHtml(brand.brandName)
                        : "Unknown"}
                </td>

                <td>
                    ${escapeHtml(
                        formatEnum(model.fuelType)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        formatEnum(model.transmissionType)
                    )}
                </td>

                <td>
                    ${model.seatingCapacity}
                </td>

                <td class="text-end">

                    <button class="action-btn edit-btn"
                            onclick="editModel(${model.modelId})">

                        <i class="bi bi-pencil-fill"></i>

                    </button>

                    <button class="action-btn delete-btn"
                            onclick="deleteModel(${model.modelId})">

                        <i class="bi bi-trash-fill"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


function loadModelOptions() {

    const brandId =
        document.getElementById("vehicleBrand").value;

    const modelSelect =
        document.getElementById("vehicleModel");


    modelSelect.innerHTML =
        `<option value="">Select Model</option>`;


    if (!brandId) return;


    models
        .filter(model => model.brandId == brandId)
        .forEach(model => {

            modelSelect.innerHTML += `
                <option value="${model.modelId}">
                    ${escapeHtml(model.modelName)}
                </option>
            `;

        });

}


function openModelModal() {

    document.getElementById("modelForm").reset();

    document.getElementById("modelId").value = "";

    populateBrandSelects();

    document.getElementById("modelModalTitle").textContent =
        "Add Vehicle Model";

    modelModal.show();

}


async function editModel(id) {

    const model =
        models.find(m => m.modelId === id);

    if (!model) return;


    populateBrandSelects();


    document.getElementById("modelId").value =
        model.modelId;

    document.getElementById("modelBrand").value =
        model.brandId;

    document.getElementById("modelName").value =
        model.modelName;

    document.getElementById("modelFuelType").value =
        model.fuelType;

    document.getElementById("modelSeats").value =
        model.seatingCapacity;

    document.getElementById("modelTransmission").value =
        model.transmissionType;


    document.getElementById("modelModalTitle").textContent =
        "Edit Vehicle Model";

    modelModal.show();

}


document.getElementById("modelForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const id =
            document.getElementById("modelId").value;


        const body = {

            modelId: id ? Number(id) : null,

            brandId:
                Number(
                    document.getElementById("modelBrand").value
                ),

            modelName:
                document.getElementById("modelName")
                    .value.trim(),

            fuelType:
                document.getElementById("modelFuelType").value,

            seatingCapacity:
                Number(
                    document.getElementById("modelSeats").value
                ),

            transmissionType:
                document.getElementById("modelTransmission").value

        };


        const response = await fetch(
            id
                ? `${API}/v1/model/update`
                : `${API}/v1/model/save`,
            {
                method: id ? "PUT" : "POST",
                headers: authHeaders(),
                body: JSON.stringify(body)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            showToast(
                data.message || "Model operation failed",
                "error"
            );

            return;

        }


        modelModal.hide();

        showToast(
            id
                ? "Model updated successfully"
                : "Model saved successfully",
            "success"
        );

        await loadModels();

        await loadVehicles();

    });


async function deleteModel(id) {

    if (!confirm(
        "Delete this vehicle model?"
    )) return;


    const response = await fetch(
        `${API}/v1/model/${id}`,
        {
            method: "DELETE",
            headers: authHeaders()
        }
    );


    const data = await response.json();


    if (!response.ok) {

        showToast(
            data.message || "Unable to delete model",
            "error"
        );

        return;

    }


    showToast(
        "Model deleted successfully",
        "success"
    );

    await loadModels();

}


/* =========================================
   FORM HELPERS
========================================= */

async function populateVehicleFormOptions() {

    populateBrandSelects();
    populateCategorySelects();

}

function resetVehicleForm() {

    document.getElementById("vehicleForm").reset();

    document.getElementById("vehicleId").value = "";

    document.getElementById("vehicleModel").innerHTML =
        `<option value="">Select Model</option>`;

}


/* =========================================
   SEARCH
========================================= */

function filterBrands() {

    const search =
        document.getElementById("brandSearch")
            .value
            .toLowerCase()
            .trim();

    const filtered =
        brands.filter(brand => {

            const brandName =
                String(brand.brandName || "")
                    .toLowerCase();

            const country =
                String(brand.country || "")
                    .toLowerCase();

            return brandName.includes(search) ||
                   country.includes(search);

        });

    renderBrands(filtered);

}

function filterCategories() {

    const search =
        document.getElementById("categorySearch")
            .value
            .toLowerCase()
            .trim();

    const filtered =
        categories.filter(category => {

            const categoryName =
                String(formatEnum(category.category) || "")
                    .toLowerCase();

            const description =
                String(category.description || "")
                    .toLowerCase();

            return categoryName.includes(search) ||
                   description.includes(search);

        });

    renderCategories(filtered);

}


function filterModels() {

    const search =
        document.getElementById("modelSearch")
            .value
            .toLowerCase()
            .trim();

    const filtered =
        models.filter(model => {

            const modelName =
                String(model.modelName || "")
                    .toLowerCase();

            const brand =
                brands.find(
                    b => b.brandId === model.brandId
                );

            const brandName =
                brand
                    ? String(brand.brandName || "").toLowerCase()
                    : "";

            const fuelType =
                String(model.fuelType || "")
                    .toLowerCase();

            const transmission =
                String(model.transmissionType || "")
                    .toLowerCase();

            return modelName.includes(search) ||
                   brandName.includes(search) ||
                   fuelType.includes(search) ||
                   transmission.includes(search);

        });

    renderModels(filtered);

}


/* =========================================
   UI HELPERS
========================================= */

function statusBadge(status) {

    const text =
        formatEnum(status);

    const className =
        "status-" + status.toLowerCase();

    return `
        <span class="status-badge ${className}">
            ${text}
        </span>
    `;

}


function formatEnum(value) {

    if (!value) return "";

    return value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, c => c.toUpperCase());

}


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


function showToast(message, type = "success") {

    const toastElement =
        document.getElementById("appToast");

    const messageElement =
        document.getElementById("toastMessage");

    messageElement.textContent = message;

    toastElement.classList.remove(
        "text-bg-success",
        "text-bg-danger"
    );

    if (type === "error") {
        toastElement.classList.add("text-bg-danger");
    } else {
        toastElement.classList.add("text-bg-success");
    }

    new bootstrap.Toast(toastElement, {
        delay: 3000
    }).show();

}


/* =========================================
   SIDEBAR
========================================= */

function toggleSidebar() {

    const sidebar =
        document.querySelector(".sidebar");

    sidebar.classList.toggle("show");

}


function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href = "../index.html";

}