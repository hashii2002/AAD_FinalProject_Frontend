/* =========================================================
   REVIEW MANAGEMENT
========================================================= */

let reviews = [];


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    loadLoggedInUser();

    loadReviewUser();

    await loadReviews();

    const searchInput = document.getElementById("reviewSearch");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderReviews(searchInput.value);
        });
    }

});

/* =========================================================
   LOAD LOGGED-IN USER
========================================================= */

function loadLoggedInUser() {

    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!username) {
        return;
    }

    // Get first letter of username
    const firstLetter = username.trim().charAt(0).toUpperCase();

    // Sidebar
    const sidebarUsername = document.getElementById("sidebarUsername");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const sidebarRole = document.getElementById("sidebarRole");

    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = firstLetter;
    }

    if (sidebarRole) {
        sidebarRole.textContent = formatRole(role);
    }


    // Header
    const headerUsername = document.getElementById("headerUsername");
    const headerRole = document.getElementById("headerRole");
    const headerAvatar = document.getElementById("headerUserAvatar");

    if (headerUsername) {
        headerUsername.textContent = username;
    }

    if (headerRole) {
        headerRole.textContent = formatRole(role);
    }

    if (headerAvatar) {
        headerAvatar.textContent = firstLetter;
    }
}


/* =========================================================
   FORMAT ROLE
========================================================= */

function formatRole(role) {

    if (!role) {
        return "";
    }

    switch (role.toUpperCase()) {

        case "ADMIN":
            return "Administrator";

        case "FLEET_MANAGER":
            return "Fleet Manager";

        case "CUSTOMER":
            return "Customer";

        case "DRIVER":
            return "Driver";

        default:
            return role;
    }
}


/* =========================================================
   LOAD USER
========================================================= */

function loadReviewUser() {

    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    const usernameElement =
        document.getElementById("headerUsername");

    const roleElement =
        document.getElementById("headerRole");

    if (usernameElement) {
        usernameElement.textContent =
            username || "Admin";
    }

    if (roleElement) {

        if (role === "ADMIN") {
            roleElement.textContent = "Administrator";
        } else if (role === "FLEET_MANAGER") {
            roleElement.textContent = "Fleet Manager";
        } else {
            roleElement.textContent = role || "User";
        }
    }
}


/* =========================================================
   LOAD REVIEWS
========================================================= */

async function loadReviews() {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    try {

        showReviewLoading();

        const response = await fetch(
            `${API_BASE_URL}/v1/review/all`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401 || response.status === 403) {

            console.error(
                "Review API access denied:",
                response.status
            );

            showReviewEmpty();

            return;
        }

        if (!response.ok) {
            throw new Error(
                `Failed to load reviews: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Review API Response:", data);

        reviews = Array.isArray(data.body)
            ? data.body
            : [];

        updateReviewSummary();

        renderReviews();

    } catch (error) {

        console.error(
            "Error loading reviews:",
            error
        );

        reviews = [];

        updateReviewSummary();

        showReviewEmpty();
    }
}


/* =========================================================
   SUMMARY
========================================================= */

function updateReviewSummary() {

    const total = reviews.length;

    const totalElement =
        document.getElementById("totalReviews");

    const averageElement =
        document.getElementById("averageRating");

    const fiveStarElement =
        document.getElementById("fiveStarReviews");

    const commentElement =
        document.getElementById("commentReviews");


    if (totalElement) {
        totalElement.textContent = total;
    }


    if (total === 0) {

        if (averageElement) {
            averageElement.textContent = "0.0";
        }

        if (fiveStarElement) {
            fiveStarElement.textContent = "0";
        }

        if (commentElement) {
            commentElement.textContent = "0";
        }

        return;
    }


    const totalRating = reviews.reduce(
        (sum, review) =>
            sum + Number(review.rating || 0),
        0
    );

    const average =
        totalRating / total;


    const fiveStarCount =
        reviews.filter(
            review => Number(review.rating) === 5
        ).length;


    const commentCount =
        reviews.filter(
            review =>
                review.comment &&
                review.comment.trim() !== ""
        ).length;


    if (averageElement) {
        averageElement.textContent =
            average.toFixed(1);
    }

    if (fiveStarElement) {
        fiveStarElement.textContent =
            fiveStarCount;
    }

    if (commentElement) {
        commentElement.textContent =
            commentCount;
    }
}

/* =========================================================
   RENDER REVIEWS (Filtered by Rental ID & Customer ID)
========================================================= */

function renderReviews(searchText = "") {

    const grid = document.getElementById("reviewGrid");
    const loading = document.getElementById("reviewLoading");
    const empty = document.getElementById("reviewEmpty");

    if (!grid) return;
    const search = searchText.trim().toLowerCase();

    const filteredReviews = reviews.filter(review => {

        if (!search) return true;

        const rentalId = String(review.rentalId || "").trim();
        const customerId = String(review.customerId || "").trim();

        const rentalRaw = rentalId.toLowerCase();
        const rentalWithHash = `#${rentalRaw}`;
        const rentalFullPattern = `rental #${rentalRaw}`;
        const rentalSimplePattern = `rental ${rentalRaw}`;

        const customerRaw = customerId.toLowerCase();
        const customerWithHash = `#${customerRaw}`;
        const customerFullPattern = `customer #${customerRaw}`;
        const customerSimplePattern = `customer ${customerRaw}`;

        return (
            rentalRaw.includes(search) ||
            rentalWithHash.includes(search) ||
            rentalFullPattern.includes(search) ||
            rentalSimplePattern.includes(search) ||
            customerRaw.includes(search) ||
            customerWithHash.includes(search) ||
            customerFullPattern.includes(search) ||
            customerSimplePattern.includes(search)
        );
    });

    if (loading) {
        loading.classList.add("d-none");
    }

    if (filteredReviews.length === 0) {
        grid.innerHTML = "";
        grid.classList.add("d-none");
        if (empty) {
            empty.classList.remove("d-none");
        }
        return;
    }

    if (empty) {
        empty.classList.add("d-none");
    }

    grid.classList.remove("d-none");

    grid.innerHTML = filteredReviews
        .map(review => createReviewCard(review))
        .join("");
}


/* =========================================================
   REVIEW CARD
========================================================= */

function createReviewCard(review) {

    const rating =
        Number(review.rating || 0);

    const customerId =
        review.customerId || "N/A";

    const rentalId =
        review.rentalId || "N/A";

    const reviewId =
        review.reviewId || "N/A";

    const comment =
        review.comment &&
        review.comment.trim() !== ""
            ? escapeHtml(review.comment)
            : "No comment provided by the customer.";


    const customerInitial =
        String(customerId)
            .charAt(0)
            .toUpperCase();


    const stars =
        createStars(rating);


    const hasComment =
        review.comment &&
        review.comment.trim() !== "";


    return `

        <div class="customer-review-card">

            <div class="review-card-top">

                <div class="customer-info">

                    <div class="customer-avatar">
                        ${customerInitial}
                    </div>

                    <div class="customer-details">

                        <h4>
                            Customer #${escapeHtml(String(customerId))}
                        </h4>

                        <span>
                            Review #${escapeHtml(String(reviewId))}
                        </span>

                    </div>

                </div>


                <div class="review-rating">

                    ${stars}

                    <strong>
                        ${rating.toFixed(1)}
                    </strong>

                </div>

            </div>


            <div class="
                review-comment
                ${hasComment ? "" : "no-comment"}
            ">

                <p>
                    ${comment}
                </p>

            </div>


            <div class="review-card-footer">

                <span class="rental-reference">

                    <i class="bi bi-car-front-fill"></i>

                    Rental #${escapeHtml(String(rentalId))}

                </span>


                <span class="review-id">

                    Customer ID:
                    ${escapeHtml(String(customerId))}

                </span>

            </div>

        </div>

    `;
}


/* =========================================================
   STAR RATING
========================================================= */

function createStars(rating) {

    let stars = "";

    for (let i = 1; i <= 5; i++) {

        if (i <= rating) {

            stars +=
                `<i class="bi bi-star-fill"></i>`;

        } else {

            stars +=
                `<i class="bi bi-star"></i>`;
        }
    }

    return stars;
}


/* =========================================================
   LOADING
========================================================= */

function showReviewLoading() {

    const loading =
        document.getElementById("reviewLoading");

    const grid =
        document.getElementById("reviewGrid");

    const empty =
        document.getElementById("reviewEmpty");


    if (loading) {
        loading.classList.remove("d-none");
    }

    if (grid) {
        grid.classList.add("d-none");
    }

    if (empty) {
        empty.classList.add("d-none");
    }
}


/* =========================================================
   EMPTY
========================================================= */

function showReviewEmpty() {

    const loading =
        document.getElementById("reviewLoading");

    const grid =
        document.getElementById("reviewGrid");

    const empty =
        document.getElementById("reviewEmpty");


    if (loading) {
        loading.classList.add("d-none");
    }

    if (grid) {
        grid.classList.add("d-none");
    }

    if (empty) {
        empty.classList.remove("d-none");
    }
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("sidebar-open");
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href = "../index.html";
} 