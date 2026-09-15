const registerForm = document.getElementById("registerForm");

const registerButton = document.getElementById("registerButton");
const registerText = document.getElementById("registerText");
const registerSpinner = document.getElementById("registerSpinner");

const registerError = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");


// Password visibility
togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.innerHTML =
            '<i class="bi bi-eye-slash"></i>';

    } else {

        passwordInput.type = "password";

        togglePassword.innerHTML =
            '<i class="bi bi-eye"></i>';
    }
});


// Register
registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Clear previous messages
    registerError.classList.add("d-none");
    registerSuccess.classList.add("d-none");

    // Get values
    const username =
        document.getElementById("username").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const firstName =
        document.getElementById("firstName").value.trim();

    const lastName =
        document.getElementById("lastName").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const nic =
        document.getElementById("nic").value.trim();

    const address =
        document.getElementById("address").value.trim();

    const drivingLicenseNumber =
        document.getElementById("drivingLicenseNumber").value.trim();

    const password =
        document.getElementById("password").value;


    // Basic validation
    if (
        !username ||
        !email ||
        !firstName ||
        !lastName ||
        !phone ||
        !nic ||
        !address ||
        !drivingLicenseNumber ||
        !password
    ) {

        showError("Please fill in all required fields.");

        return;
    }


    if (username.length < 3 || username.length > 50) {

        showError(
            "Username must be between 3 and 50 characters."
        );

        return;
    }


    // Loading state
    registerButton.disabled = true;

    registerText.textContent = "Creating Account...";

    registerSpinner.classList.remove("d-none");


    try {

        const response = await fetch(
            `${API_BASE_URL}/v1/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    username: username,

                    email: email,

                    password: password,

                    firstName: firstName,

                    lastName: lastName,

                    phone: phone,

                    nic: nic,

                    address: address,

                    drivingLicenseNumber:
                        drivingLicenseNumber

                })
            }
        );


        const data = await response.json();


        // Backend error
        if (!response.ok) {

            throw new Error(
                data.message ||
                "Registration failed. Please try again."
            );
        }


        // Success
        registerSuccess.textContent =
            data.message ||
            "Account created successfully!";

        registerSuccess.classList.remove("d-none");


        // Clear form
        registerForm.reset();


        // Redirect to login after 2 seconds
        setTimeout(function () {

            window.location.href = "../index.html";

        }, 2000);


    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        showError(error.message);


    } finally {

        registerButton.disabled = false;

        registerText.textContent =
            "Create Account";

        registerSpinner.classList.add("d-none");
    }

});


// Show error
function showError(message) {

    registerError.textContent = message;

    registerError.classList.remove("d-none");
}