/* =========================================================
   CUSTOMER PROFILE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    checkRoleAccess(["CUSTOMER"]);

    initializeProfilePage();

});


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentProfile = null;
let originalFormData = null;
let isEditMode = false;


/* =========================================================
   ELEMENTS
========================================================= */

const profileLoading =
    document.getElementById("profileLoading");

const profileContent =
    document.getElementById("profileContent");

const profileError =
    document.getElementById("profileError");

const profileErrorText =
    document.getElementById("profileErrorText");

const retryBtn =
    document.getElementById("retryBtn");

const editProfileBtn =
    document.getElementById("editProfileBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const profileForm =
    document.getElementById("profileForm");

const profileFormActions =
    document.getElementById("profileFormActions");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const dashboardSidebar =
    document.getElementById("customerSidebar");


/* =========================================================
   FORM ELEMENTS
========================================================= */

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const firstNameInput =
    document.getElementById("firstName");

const lastNameInput =
    document.getElementById("lastName");

const phoneInput =
    document.getElementById("phone");

const nicInput =
    document.getElementById("nic");

const addressInput =
    document.getElementById("address");

const drivingLicenseInput =
    document.getElementById("drivingLicenseNumber");


/* =========================================================
   INITIALIZE
========================================================= */

function initializeProfilePage() {

    setupSidebar();

    setupEvents();

    loadProfile();

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    if (retryBtn) {
        retryBtn.addEventListener("click", loadProfile);
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener(
            "click",
            enableEditMode
        );
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener(
            "click",
            cancelEditMode
        );
    }

    if (profileForm) {
        profileForm.addEventListener(
            "submit",
            handleProfileSubmit
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            handleLogout
        );
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener(
            "click",
            openSidebar
        );
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    showLoading();

    try {

        const token =
            localStorage.getItem("accessToken");

        if (!token) {
            window.location.href = "../../index.html";
            return;
        }


        const response = await fetch(
            `${API_BASE_URL}/v1/customer/me/profile`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("accessToken");

            window.location.href =
                "../../index.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data)
            );
        }


        const profile =
            data.body;


        if (!profile) {
            throw new Error(
                "Customer profile data was not found."
            );
        }


        currentProfile = profile;

        populateProfile(profile);

        hideLoading();

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showProfileError(
            error.message ||
            "Unable to load customer profile."
        );

    }

}


/* =========================================================
   POPULATE PROFILE
========================================================= */

function populateProfile(profile) {

    const firstName =
        profile.firstName || "";

    const lastName =
        profile.lastName || "";

    const fullName =
        `${firstName} ${lastName}`.trim();


    /* -----------------------------------------------------
       Form
    ----------------------------------------------------- */

    usernameInput.value =
        profile.username || "";

    emailInput.value =
        profile.email || "";

    firstNameInput.value =
        profile.firstName || "";

    lastNameInput.value =
        profile.lastName || "";

    phoneInput.value =
        profile.phone || "";

    nicInput.value =
        profile.nic || "";

    addressInput.value =
        profile.address || "";

    drivingLicenseInput.value =
        profile.drivingLicenseNumber || "";


    /* -----------------------------------------------------
       Hero
    ----------------------------------------------------- */

    document.getElementById(
        "profileFullName"
    ).textContent =
        fullName || "Customer";


    document.getElementById(
        "profileUsername"
    ).textContent =
        profile.username
            ? `@${profile.username}`
            : "@customer";


    document.getElementById(
        "profileEmail"
    ).textContent =
        profile.email || "-";


    document.getElementById(
        "profilePhone"
    ).textContent =
        profile.phone || "-";


    /* -----------------------------------------------------
       Avatar
    ----------------------------------------------------- */

    const avatarLetter =
        getAvatarLetter(
            profile.firstName,
            profile.lastName,
            profile.username
        );


    document.getElementById(
        "profileAvatar"
    ).textContent =
        avatarLetter;


    document.getElementById(
        "topbarAvatar"
    ).textContent =
        avatarLetter;


    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        avatarLetter;


    document.getElementById(
        "topbarUsername"
    ).textContent =
        profile.username || "Customer";


    document.getElementById(
        "sidebarUsername"
    ).textContent =
        profile.username || "Customer";


    /* -----------------------------------------------------
       Status
    ----------------------------------------------------- */

    const status =
        String(profile.status || "UNKNOWN")
            .toUpperCase();


    const statusElement =
        document.getElementById(
            "accountStatus"
        );


    statusElement.textContent =
        formatStatus(status);


    statusElement.className =
        "account-status";


    if (status === "ACTIVE") {

        statusElement.classList.add(
            "status-active"
        );

    } else {

        statusElement.classList.add(
            "status-inactive"
        );

    }


    /* -----------------------------------------------------
       Quick Info
    ----------------------------------------------------- */

    document.getElementById(
        "customerId"
    ).textContent =
        profile.customerId ?? "-";


    document.getElementById(
        "userId"
    ).textContent =
        profile.userId ?? "-";


    document.getElementById(
        "nicPreview"
    ).textContent =
        profile.nic || "-";


    document.getElementById(
        "licensePreview"
    ).textContent =
        profile.drivingLicenseNumber || "-";


    /* -----------------------------------------------------
       Original values
    ----------------------------------------------------- */

    saveOriginalFormData();

}


/* =========================================================
   EDIT MODE
========================================================= */

function enableEditMode() {

    isEditMode = true;

    profileCard().classList.add(
        "edit-mode"
    );


    const editableFields = [
        emailInput,
        firstNameInput,
        lastNameInput,
        phoneInput,
        nicInput,
        addressInput,
        drivingLicenseInput
    ];


    editableFields.forEach(
        field => field.disabled = false
    );


    /*
       Username is intentionally kept disabled.

       Backend supports username update, but changing the
       username invalidates the current JWT subject.
       Therefore username is shown but not edited from this UI.
    */


    profileFormActions.classList.remove(
        "d-none"
    );


    editProfileBtn.classList.add(
        "d-none"
    );


    firstEditableFieldFocus();

}


/* =========================================================
   CANCEL EDIT
========================================================= */

function cancelEditMode() {

    isEditMode = false;

    restoreOriginalFormData();

    disableEditMode();

}


/* =========================================================
   DISABLE EDIT MODE
========================================================= */

function disableEditMode() {

    profileCard().classList.remove(
        "edit-mode"
    );


    const fields = [
        usernameInput,
        emailInput,
        firstNameInput,
        lastNameInput,
        phoneInput,
        nicInput,
        addressInput,
        drivingLicenseInput
    ];


    fields.forEach(
        field => field.disabled = true
    );


    profileFormActions.classList.add(
        "d-none"
    );


    editProfileBtn.classList.remove(
        "d-none"
    );

}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function handleProfileSubmit(event) {

    event.preventDefault();


    if (!isEditMode) {
        return;
    }


    const token =
        localStorage.getItem("accessToken");


    if (!token) {

        window.location.href =
            "../../index.html";

        return;
    }


    const userData = {

        username:
            usernameInput.value.trim(),

        email:
            emailInput.value.trim(),

        firstName:
            firstNameInput.value.trim(),

        lastName:
            lastNameInput.value.trim(),

        phone:
            phoneInput.value.trim()

    };


    const customerData = {

        nic:
            nicInput.value.trim(),

        address:
            addressInput.value.trim(),

        drivingLicenseNumber:
            drivingLicenseInput.value.trim()

    };


    /* -----------------------------------------------------
       Client validation
    ----------------------------------------------------- */

    const validationError =
        validateProfileData(
            userData,
            customerData
        );


    if (validationError) {

        showToast(
            "Validation Error",
            validationError,
            true
        );

        return;
    }


    setSavingState(true);


    try {

        /*
         * IMPORTANT:
         *
         * Customer data is updated FIRST.
         * Then User data is updated.
         *
         * This avoids changing the username before the
         * customer endpoint is processed.
         */

        await updateCustomerProfile(
            customerData,
            token
        );


        await updateUserProfile(
            userData,
            token
        );


        /*
         * Username is read-only in this UI, therefore
         * current JWT remains valid.
         */


        await loadProfile();


        disableEditMode();


        showToast(
            "Profile Updated",
            "Your profile has been updated successfully."
        );


    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        showToast(
            "Update Failed",
            error.message ||
            "Unable to update your profile.",
            true
        );

    } finally {

        setSavingState(false);

    }

}


/* =========================================================
   UPDATE CUSTOMER
========================================================= */

async function updateCustomerProfile(
    customerData,
    token
) {

    const response =
        await fetch(
            `${API_BASE_URL}/v1/customer/update`,
            {
                method: "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(customerData)
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            getErrorMessage(data)
        );

    }


    return data;

}


/* =========================================================
   UPDATE USER
========================================================= */

async function updateUserProfile(
    userData,
    token
) {

    const response =
        await fetch(
            `${API_BASE_URL}/v1/user/profile`,
            {
                method: "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(userData)
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            getErrorMessage(data)
        );

    }


    /*
     * Keep localStorage username synchronized.
     */

    if (userData.username) {

        localStorage.setItem(
            "username",
            userData.username
        );

    }


    return data;

}


/* =========================================================
   VALIDATION
========================================================= */

function validateProfileData(
    userData,
    customerData
) {

    if (!userData.username) {
        return "Username is required.";
    }

    if (!userData.email) {
        return "Email address is required.";
    }

    if (!isValidEmail(userData.email)) {
        return "Please enter a valid email address.";
    }

    if (!userData.firstName) {
        return "First name is required.";
    }

    if (!userData.lastName) {
        return "Last name is required.";
    }

    if (!userData.phone) {
        return "Phone number is required.";
    }

    if (!customerData.nic) {
        return "NIC number is required.";
    }

    if (!customerData.address) {
        return "Address is required.";
    }

    if (!customerData.drivingLicenseNumber) {
        return "Driving license number is required.";
    }

    if (
        customerData.drivingLicenseNumber.length < 5
    ) {
        return "Driving license number must contain at least 5 characters.";
    }

    return null;

}


/* =========================================================
   SAVE ORIGINAL FORM DATA
========================================================= */

function saveOriginalFormData() {

    originalFormData = {

        username:
            usernameInput.value,

        email:
            emailInput.value,

        firstName:
            firstNameInput.value,

        lastName:
            lastNameInput.value,

        phone:
            phoneInput.value,

        nic:
            nicInput.value,

        address:
            addressInput.value,

        drivingLicenseNumber:
            drivingLicenseInput.value

    };

}


/* =========================================================
   RESTORE ORIGINAL FORM DATA
========================================================= */

function restoreOriginalFormData() {

    if (!originalFormData) {
        return;
    }


    usernameInput.value =
        originalFormData.username;

    emailInput.value =
        originalFormData.email;

    firstNameInput.value =
        originalFormData.firstName;

    lastNameInput.value =
        originalFormData.lastName;

    phoneInput.value =
        originalFormData.phone;

    nicInput.value =
        originalFormData.nic;

    addressInput.value =
        originalFormData.address;

    drivingLicenseInput.value =
        originalFormData.drivingLicenseNumber;

}


/* =========================================================
   SAVING STATE
========================================================= */

function setSavingState(isSaving) {

    if (!saveProfileBtn) {
        return;
    }


    saveProfileBtn.disabled =
        isSaving;


    if (isSaving) {

        saveProfileBtn.innerHTML = `
            <span
                class="spinner-border spinner-border-sm"
                role="status">
            </span>
            Saving...
        `;

    } else {

        saveProfileBtn.innerHTML = `
            <i class="bi bi-check2-circle"></i>
            Save Changes
        `;

    }

}


/* =========================================================
   LOADING UI
========================================================= */

function showLoading() {

    profileLoading.classList.remove(
        "d-none"
    );

    profileContent.classList.add(
        "d-none"
    );

    profileError.classList.add(
        "d-none"
    );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    profileLoading.classList.add(
        "d-none"
    );

    profileError.classList.add(
        "d-none"
    );

    profileContent.classList.remove(
        "d-none"
    );

}


/* =========================================================
   ERROR UI
========================================================= */

function showProfileError(message) {

    profileLoading.classList.add(
        "d-none"
    );

    profileContent.classList.add(
        "d-none"
    );

    profileError.classList.remove(
        "d-none"
    );

    profileErrorText.textContent =
        message;

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(data) {

    if (!data) {
        return "An unexpected error occurred.";
    }

    if (typeof data === "string") {
        return data;
    }

    if (data.message) {
        return data.message;
    }

    if (data.body?.message) {
        return data.body.message;
    }

    if (
        data.body &&
        typeof data.body === "string"
    ) {
        return data.body;
    }

    if (data.errors) {

        return Object.values(
            data.errors
        ).join(", ");

    }

    return "An unexpected error occurred.";

}


/* =========================================================
   STATUS
========================================================= */

function formatStatus(status) {

    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

}


/* =========================================================
   AVATAR LETTER
========================================================= */

function getAvatarLetter(
    firstName,
    lastName,
    username
) {

    if (firstName) {

        return firstName
            .trim()
            .charAt(0)
            .toUpperCase();

    }

    if (lastName) {

        return lastName
            .trim()
            .charAt(0)
            .toUpperCase();

    }

    if (username) {

        return username
            .trim()
            .charAt(0)
            .toUpperCase();

    }

    return "C";

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   PROFILE CARD
========================================================= */

function profileCard() {

    return document.querySelector(
        ".profile-card"
    );

}


/* =========================================================
   FOCUS
========================================================= */

function firstEditableFieldFocus() {

    setTimeout(() => {

        if (emailInput) {
            emailInput.focus();
        }

    }, 100);

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    isError = false
) {

    const toast =
        document.getElementById(
            "profileToast"
        );

    const toastTitle =
        document.getElementById(
            "toastTitle"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );

    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;


    toast.classList.remove(
        "error"
    );


    if (isError) {

        toast.classList.add(
            "error"
        );

        toastIcon.innerHTML =
            `<i class="bi bi-x-lg"></i>`;

    } else {

        toastIcon.innerHTML =
            `<i class="bi bi-check-lg"></i>`;

    }


    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 4000);

}


/* =========================================================
   LOGOUT
========================================================= */

function handleLogout() {

    localStorage.removeItem(
        "accessToken"
    );

    localStorage.removeItem(
        "username"
    );

    localStorage.removeItem(
        "userId"
    );

    localStorage.removeItem(
        "role"
    );


    window.location.href =
        "../../index.html";

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    if (!dashboardSidebar) return;

    // Overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    // Click any sidebar menu
    const sidebarLinks =
        dashboardSidebar.querySelectorAll(".sidebar-link");

    sidebarLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 992) {
                closeSidebar();
            }

        });

    });

    // Click outside sidebar
    document.addEventListener("click", function (event) {

        if (window.innerWidth > 992) return;

        const clickedInsideSidebar =
            dashboardSidebar.contains(event.target);

        const clickedMenuButton =
            mobileMenuBtn &&
            mobileMenuBtn.contains(event.target);

        if (
            !clickedInsideSidebar &&
            !clickedMenuButton &&
            dashboardSidebar.classList.contains("show")
        ) {
            closeSidebar();
        }

    });

}

function openSidebar() {

    if (!dashboardSidebar) return;

    dashboardSidebar.classList.add("show");

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("show");
    }

}

function closeSidebar() {

    if (!dashboardSidebar) return;

    dashboardSidebar.classList.remove("show");

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("show");
    }

}


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function () {

        if (window.innerWidth > 768) {
            closeSidebar();
        }

    }
);