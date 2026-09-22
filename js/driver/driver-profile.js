/* =========================================================
   DRIVER PROFILE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    checkRoleAccess(["DRIVER"]);

    setupSidebar();

    loadDriverProfile();

    setupEvents();

});


/* =========================================================
   ELEMENTS
========================================================= */

const profileLoading =
    document.getElementById("profileLoading");

const profileError =
    document.getElementById("profileError");

const profileErrorText =
    document.getElementById("profileErrorText");

const profileContent =
    document.getElementById("profileContent");

const retryBtn =
    document.getElementById("retryBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const driverSidebar =
    document.getElementById("driverSidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupEvents() {

    if (retryBtn) {

        retryBtn.addEventListener(
            "click",
            loadDriverProfile
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
   SIDEBAR
========================================================= */

function setupSidebar() {

    document
        .querySelectorAll(".sidebar-nav .nav-item")
        .forEach(function (item) {

            item.addEventListener(
                "click",
                function () {

                    closeSidebar();

                }
            );

        });

}


function openSidebar() {

    if (!driverSidebar || !sidebarOverlay) {
        return;
    }

    driverSidebar.classList.add("open");

    sidebarOverlay.classList.add("active");

    document.body.style.overflow = "hidden";

}


function closeSidebar() {

    if (!driverSidebar || !sidebarOverlay) {
        return;
    }

    driverSidebar.classList.remove("open");

    sidebarOverlay.classList.remove("active");

    document.body.style.overflow = "";

}


/* =========================================================
   LOAD DRIVER PROFILE
========================================================= */

async function loadDriverProfile() {

    showLoading();

    const token =
        localStorage.getItem("accessToken");


    if (!token) {

        window.location.href = "../../index.html";

        return;

    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/driver/me`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );


        if (response.status === 401) {

            localStorage.clear();

            window.location.href = "../../index.html";

            return;

        }


        if (response.status === 403) {

            throw new Error(
                "You do not have permission to view this profile."
            );

        }


        if (!response.ok) {

            throw new Error(
                `Failed to load profile. Status: ${response.status}`
            );

        }


        const data = await response.json();


        console.log("Driver profile response:", data);


        const profile = extractProfile(data);


        if (!profile) {

            throw new Error(
                "Driver profile data was not found."
            );

        }


        renderProfile(profile);

        showProfile();


    } catch (error) {

        console.error(
            "Driver profile loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load your profile."
        );

    }

}


/* =========================================================
   EXTRACT PROFILE
========================================================= */

function extractProfile(data) {

    /*
       CommonResponse structure:

       {
          status: 0,
          body: {
              driverId: ...,
              userId: ...,
              username: ...,
              ...
          },
          message: "..."
       }
    */

    if (data && data.body) {

        return data.body;

    }

    return null;

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile(profile) {

    const firstName =
        profile.firstName || "";

    const lastName =
        profile.lastName || "";


    const fullName =
        `${firstName} ${lastName}`.trim() ||
        "Driver";


    /* -----------------------------------------------------
       Header
    ----------------------------------------------------- */

    setText(
        "headerUsername",
        profile.username || "Driver"
    );


    setText(
        "sidebarUsername",
        profile.username || "Driver"
    );


    /* -----------------------------------------------------
       Hero
    ----------------------------------------------------- */

    setText(
        "profileFullName",
        fullName
    );


    setText(
        "profileUsername",
        profile.username || "-"
    );


    setText(
        "profileDriverId",
        profile.driverId ?? "-"
    );


    /* -----------------------------------------------------
       Personal Information
    ----------------------------------------------------- */

    setText(
        "fullName",
        fullName
    );


    setText(
        "username",
        profile.username || "-"
    );


    setText(
        "email",
        profile.email || "-"
    );


    setText(
        "phone",
        profile.phone || "-"
    );


    /* -----------------------------------------------------
       Driver Information
    ----------------------------------------------------- */

    setText(
        "driverId",
        profile.driverId ?? "-"
    );


    setText(
        "licenseNo",
        profile.licenseNo || "-"
    );


    /* -----------------------------------------------------
       Status
    ----------------------------------------------------- */

    const driverStatus =
        profile.driverStatus || "UNKNOWN";

    const userStatus =
        profile.userStatus || "UNKNOWN";


    const driverStatusBadge =
        document.getElementById(
            "driverStatusBadge"
        );


    if (driverStatusBadge) {

        driverStatusBadge.textContent =
            formatStatus(driverStatus);

    }


    const driverStatusElement =
        document.getElementById(
            "driverStatus"
        );


    if (driverStatusElement) {

        driverStatusElement.textContent =
            formatStatus(driverStatus);

        driverStatusElement.className =
            "inline-status " +
            getDriverStatusClass(driverStatus);

    }


    const userStatusElement =
        document.getElementById(
            "userStatus"
        );


    if (userStatusElement) {

        userStatusElement.textContent =
            formatStatus(userStatus);

        userStatusElement.className =
            "inline-status " +
            getUserStatusClass(userStatus);

    }

}


/* =========================================================
   DRIVER STATUS CLASS
========================================================= */

function getDriverStatusClass(status) {

    const normalized =
        String(status)
            .trim()
            .toUpperCase();


    switch (normalized) {

        case "AVAILABLE":
            return "status-available";

        case "ON_TRIP":
            return "status-on-trip";

        case "INACTIVE":
            return "status-inactive";

        case "OFF_DUTY":
            return "status-off-duty";

        default:
            return "";

    }

}


/* =========================================================
   USER STATUS CLASS
========================================================= */

function getUserStatusClass(status) {

    const normalized =
        String(status)
            .trim()
            .toUpperCase();


    switch (normalized) {

        case "ACTIVE":
            return "status-active";

        case "INACTIVE":
        case "DISABLED":
            return "status-inactive-user";

        default:
            return "";

    }

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    if (!status) {
        return "-";
    }


    return String(status)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "-";

    }

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    if (profileLoading) {

        profileLoading.classList.remove(
            "d-none"
        );

    }


    if (profileError) {

        profileError.classList.add(
            "d-none"
        );

    }


    if (profileContent) {

        profileContent.classList.add(
            "d-none"
        );

    }

}


/* =========================================================
   PROFILE STATE
========================================================= */

function showProfile() {

    if (profileLoading) {

        profileLoading.classList.add(
            "d-none"
        );

    }


    if (profileError) {

        profileError.classList.add(
            "d-none"
        );

    }


    if (profileContent) {

        profileContent.classList.remove(
            "d-none"
        );

    }

}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(message) {

    if (profileLoading) {

        profileLoading.classList.add(
            "d-none"
        );

    }


    if (profileContent) {

        profileContent.classList.add(
            "d-none"
        );

    }


    if (profileError) {

        profileError.classList.remove(
            "d-none"
        );

    }


    if (profileErrorText) {

        profileErrorText.textContent =
            message ||
            "Unable to load your profile.";

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function handleLogout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href =
        "../../index.html";

}