/* =========================================================
   FLEET MANAGER DASHBOARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");

    if (role !== "FLEET_MANAGER") {
        return;
    }


    /* =====================================================
       USERNAME
    ===================================================== */

    const headerUsername =
        document.getElementById("headerUsername");

    const welcomeUsername =
        document.getElementById("welcomeUsername");


    if (username) {

        if (headerUsername) {
            headerUsername.textContent = username;
        }

        if (welcomeUsername) {
            welcomeUsername.textContent = username;
        }

    }


    loadFleetDashboard();

});


/* =========================================================
   LOAD DASHBOARD DATA
========================================================= */

async function loadFleetDashboard() {

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        return;
    }


    const headers = {

        "Authorization": `Bearer ${token}`,

        "Content-Type": "application/json"

    };


    try {

        const [
            vehiclesResponse,
            rentalsResponse,
            customersResponse,
            maintenanceResponse
        ] = await Promise.all([

            fetch(
                `${API_BASE_URL}/v1/vehicle/all`,
                { headers }
            ),

            fetch(
                `${API_BASE_URL}/v1/rental/all`,
                { headers }
            ),

            fetch(
                `${API_BASE_URL}/v1/customer/all`,
                { headers }
            ),

            fetch(
                `${API_BASE_URL}/v1/maintenance/all`,
                { headers }
            )

        ]);


        const vehiclesData =
            await vehiclesResponse.json();

        const rentalsData =
            await rentalsResponse.json();

        const customersData =
            await customersResponse.json();

        const maintenanceData =
            await maintenanceResponse.json();


        /* =================================================
           VEHICLES
        ================================================= */

        if (vehiclesResponse.ok) {

            const vehicles =
                vehiclesData.body || [];

            const element =
                document.getElementById("totalVehicles");

            if (element) {
                element.textContent =
                    vehicles.length;
            }

        }


        /* =================================================
           RENTALS
        ================================================= */

        if (rentalsResponse.ok) {

            const rentals =
                rentalsData.body || [];

            const activeRentals =
                rentals.filter(function (rental) {

                    return rental.status === "ONGOING" ||
                           rental.status === "CONFIRMED";

                });


            const element =
                document.getElementById("activeRentals");

            if (element) {

                element.textContent =
                    activeRentals.length;

            }

        }


        /* =================================================
           CUSTOMERS
        ================================================= */

        if (customersResponse.ok) {

            const customers =
                customersData.body || [];

            const element =
                document.getElementById("totalCustomers");

            if (element) {

                element.textContent =
                    customers.length;

            }

        }


        /* =================================================
           MAINTENANCE
        ================================================= */

        if (maintenanceResponse.ok) {

            const maintenance =
                maintenanceData.body || [];

            const element =
                document.getElementById("maintenanceCount");

            if (element) {

                element.textContent =
                    maintenance.length;

            }

        }


    } catch (error) {

        console.error(
            "Fleet Dashboard Error:",
            error
        );

    }

}