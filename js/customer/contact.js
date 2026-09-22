/* =========================================================
   DRIVEGO CUSTOMER CONTACT PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* -----------------------------------------------------
       ROLE ACCESS
    ----------------------------------------------------- */

    checkRoleAccess(["CUSTOMER"]);


    /* -----------------------------------------------------
       LOAD CUSTOMER INFO
    ----------------------------------------------------- */

    loadCustomerInfo();


    /* -----------------------------------------------------
       SIDEBAR
    ----------------------------------------------------- */

    setupSidebar();


    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    setupLogout();


    /* -----------------------------------------------------
       LOCATION LINK
    ----------------------------------------------------- */

    setupLocationLink();

});


/* =========================================================
   LOAD CUSTOMER INFO
========================================================= */

function loadCustomerInfo() {

    const username =
        localStorage.getItem("username") || "Customer";

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const topbarUsername =
        document.getElementById("topbarUsername");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const topbarAvatar =
        document.getElementById("topbarAvatar");


    if (sidebarUsername) {

        sidebarUsername.textContent = username;

    }


    if (topbarUsername) {

        topbarUsername.textContent = username;

    }


    const avatarLetter =
        username.charAt(0).toUpperCase();


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            avatarLetter;

    }


    if (topbarAvatar) {

        topbarAvatar.textContent =
            avatarLetter;

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById("customerSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const menuButton =
        document.getElementById("mobileMenuButton");


    if (!sidebar || !overlay || !menuButton) {

        return;

    }


    menuButton.addEventListener(
        "click",
        function () {

            sidebar.classList.add("open");

            overlay.classList.add("show");

            document.body.style.overflow =
                "hidden";

        }
    );


    overlay.addEventListener(
        "click",
        closeSidebar
    );


    /* Close sidebar when navigation link is clicked */

    const sidebarLinks =
        sidebar.querySelectorAll(".sidebar-link");


    sidebarLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                closeSidebar();

            }
        );

    });


    /* Close sidebar with Escape */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeSidebar();

            }

        }
    );


    function closeSidebar() {

        sidebar.classList.remove("open");

        overlay.classList.remove("show");

        document.body.style.overflow = "";

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutButton");


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        function () {

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {

                return;

            }


            /* Clear authentication data */

            localStorage.removeItem("accessToken");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            localStorage.removeItem("userId");


            /* Session data */

            sessionStorage.clear();


            /* Redirect to login */

            window.location.href =
                "../../index.html";

        }
    );

}


/* =========================================================
   LOCATION LINK
========================================================= */

function setupLocationLink() {

    const viewLocationButton =
        document.querySelector(
            '.contact-action[href="#location"]'
        );


    if (!viewLocationButton) {

        return;

    }


    viewLocationButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const locationSection =
                document.getElementById("location");


            if (!locationSection) {

                return;

            }


            locationSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}