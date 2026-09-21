/* =========================================================
   CUSTOMER - MY REVIEWS
========================================================= */

let myReviews = [];
let myRentals = [];

let selectedRating = 0;
let editingReviewId = null;
let deletingReviewId = null;

let reviewModal;
let deleteModal;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    checkRoleAccess(["CUSTOMER"]);

    reviewModal = new bootstrap.Modal(
        document.getElementById("reviewModal")
    );

    deleteModal = new bootstrap.Modal(
        document.getElementById("deleteModal")
    );

    loadCustomerUsername();

    setupEvents();

    loadReviewData();

});


/* =========================================================
   USERNAME
========================================================= */

function loadCustomerUsername() {

    const username =
        localStorage.getItem("username") || "Customer";

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const topbarUsername =
        document.getElementById("topbarUsername");

    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (topbarUsername) {
        topbarUsername.textContent = username;
    }
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    document
        .getElementById("refreshReviewsBtn")
        ?.addEventListener(
            "click",
            loadReviewData
        );


    document
        .getElementById("reviewSearch")
        ?.addEventListener(
            "input",
            filterReviews
        );


    document
        .getElementById("reviewForm")
        ?.addEventListener(
            "submit",
            handleReviewSubmit
        );


    document
        .getElementById("comment")
        ?.addEventListener(
            "input",
            updateCharacterCount
        );


    document
        .querySelectorAll(".rating-star")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const rating =
                        Number(
                            this.dataset.rating
                        );

                    setRating(rating);
                }
            );

        });


    document
        .getElementById("confirmDeleteBtn")
        ?.addEventListener(
            "click",
            confirmDeleteReview
        );

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadReviewData() {

    showReviewsLoading();

    try {

        const token =
            localStorage.getItem("accessToken");

        if (!token) {
            return;
        }


        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };


        /*
         * Load customer's reviews
         */

        const reviewsResponse =
            await fetch(
                `${API_BASE_URL}/v1/review/me`,
                {
                    method: "GET",
                    headers: headers
                }
            );


        /*
         * Load customer's rentals
         */

        const rentalsResponse =
            await fetch(
                `${API_BASE_URL}/v1/rental/me`,
                {
                    method: "GET",
                    headers: headers
                }
            );


        if (!reviewsResponse.ok) {

            throw new Error(
                await extractErrorMessage(
                    reviewsResponse,
                    "Unable to load reviews."
                )
            );

        }


        if (!rentalsResponse.ok) {

            throw new Error(
                await extractErrorMessage(
                    rentalsResponse,
                    "Unable to load rentals."
                )
            );

        }


        const reviewData =
            await reviewsResponse.json();

        const rentalData =
            await rentalsResponse.json();


        myReviews =
            extractResponseBody(reviewData);

        myRentals =
            extractResponseBody(rentalData);


        if (!Array.isArray(myReviews)) {
            myReviews = [];
        }

        if (!Array.isArray(myRentals)) {
            myRentals = [];
        }


        updateSummary();

        renderReviewableRentals();

        renderReviews(myReviews);

    } catch (error) {

        console.error(
            "Review page error:",
            error
        );

        showReviewsError(
            error.message ||
            "Unable to load review information."
        );

    }

}


/* =========================================================
   RESPONSE BODY
========================================================= */

function extractResponseBody(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.body)
    ) {
        return data.body;
    }

    if (
        data &&
        data.body &&
        Array.isArray(data.body.data)
    ) {
        return data.body.data;
    }

    return [];
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

async function extractErrorMessage(
    response,
    fallback
) {

    try {

        const data =
            await response.json();

        return (
            data?.message ||
            data?.body?.message ||
            fallback
        );

    } catch (error) {

        return fallback;

    }

}


/* =========================================================
   AUTH FETCH
========================================================= */

async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        localStorage.getItem("accessToken");

    if (!token) {

        throw new Error(
            "Your session has expired. Please login again."
        );

    }


    const headers = {
        "Authorization":
            `Bearer ${token}`,

        "Accept":
            "application/json",

        ...(options.headers || {})
    };


    return fetch(
        url,
        {
            ...options,
            headers: headers
        }
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const total =
        myReviews.length;


    let average = 0;

    if (total > 0) {

        const sum =
            myReviews.reduce(
                (total, review) =>
                    total +
                    Number(review.rating || 0),
                0
            );

        average =
            sum / total;
    }


    const fiveStar =
        myReviews.filter(
            review =>
                Number(review.rating) === 5
        ).length;


    const reviewedRentalIds =
        new Set(
            myReviews
                .map(review =>
                    Number(review.rentalId)
                )
                .filter(id => id > 0)
        );


    const awaiting =
        myRentals.filter(
            rental =>
                String(
                    rental.status || ""
                ).toUpperCase() ===
                "COMPLETED"
                &&
                !reviewedRentalIds.has(
                    Number(rental.rentalId)
                )
        ).length;


    document.getElementById(
        "totalReviews"
    ).textContent = total;


    document.getElementById(
        "averageRating"
    ).textContent =
        average.toFixed(1);


    document.getElementById(
        "fiveStarReviews"
    ).textContent = fiveStar;


    document.getElementById(
        "pendingReviews"
    ).textContent = awaiting;


    document.getElementById(
        "reviewCountLabel"
    ).textContent =
        `${total} ${total === 1 ? "review" : "reviews"}`;

}


/* =========================================================
   REVIEWABLE RENTALS
========================================================= */

function renderReviewableRentals() {

    const container =
        document.getElementById(
            "reviewableRentals"
        );


    const reviewedRentalIds =
        new Set(
            myReviews
                .map(review =>
                    Number(review.rentalId)
                )
                .filter(id => id > 0)
        );


    const reviewable =
        myRentals.filter(
            rental => {

                const status =
                    String(
                        rental.status || ""
                    ).toUpperCase();

                const rentalId =
                    Number(
                        rental.rentalId
                    );

                return (
                    status === "COMPLETED" &&
                    !reviewedRentalIds.has(
                        rentalId
                    )
                );
            }
        );


    document.getElementById(
        "reviewableCount"
    ).textContent =
        `${reviewable.length} ${
            reviewable.length === 1
                ? "rental"
                : "rentals"
        }`;


    if (reviewable.length === 0) {

        container.innerHTML = `
            <div class="review-empty">

                <div class="review-empty-icon">
                    <i class="bi bi-check2-circle"></i>
                </div>

                <h4>No Rentals Awaiting Review</h4>

                <p>
                    Your completed rentals will appear here
                    when they are ready for feedback.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        reviewable
            .map(
                rental =>
                    createReviewableCard(
                        rental
                    )
            )
            .join("");

}


/* =========================================================
   REVIEWABLE CARD
========================================================= */

function createReviewableCard(
    rental
) {

    const rentalId =
        rental.rentalId || "-";

    const vehicleId =
        rental.vehicleId || "-";

    const startDate =
        formatDate(
            rental.startDate
        );

    const endDate =
        formatDate(
            rental.endDate
        );


    return `
        <div class="reviewable-card">

            <div class="reviewable-top">

                <div class="reviewable-icon">
                    <i class="bi bi-car-front-fill"></i>
                </div>

                <span class="completed-badge">
                    Completed
                </span>

            </div>

            <h4>
                Rental #${escapeHtml(rentalId)}
            </h4>

            <div class="reviewable-meta">

                <span>
                    <i class="bi bi-car-front"></i>
                    Vehicle #${escapeHtml(vehicleId)}
                </span>

                <span>
                    <i class="bi bi-calendar3"></i>
                    ${escapeHtml(startDate)}
                    -
                    ${escapeHtml(endDate)}
                </span>

            </div>

            <button
                class="write-review-btn"
                onclick="openCreateReviewModal(${rentalId})">

                <i class="bi bi-star"></i>
                Write a Review

            </button>

        </div>
    `;
}


/* =========================================================
   REVIEWS
========================================================= */

function renderReviews(
    reviews = myReviews
) {

    const container =
        document.getElementById(
            "reviewsList"
        );


    if (!reviews.length) {

        container.innerHTML = `
            <div class="review-empty">

                <div class="review-empty-icon">
                    <i class="bi bi-chat-square-text"></i>
                </div>

                <h4>No Reviews Yet</h4>

                <p>
                    Complete a rental and share
                    your experience with us.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        reviews
            .map(
                review =>
                    createReviewCard(
                        review
                    )
            )
            .join("");

}


/* =========================================================
   REVIEW CARD
========================================================= */

function createReviewCard(
    review
) {

    const rating =
        Number(review.rating || 0);

    const stars =
        createStars(rating);


    const rentalId =
        review.rentalId || "-";


    const comment =
        review.comment ||
        "No comment provided.";


    return `
        <article class="review-card">

            <div class="review-card-header">

                <div class="review-rental-info">

                    <div class="review-rental-icon">
                        <i class="bi bi-car-front-fill"></i>
                    </div>

                    <div class="review-rental-details">

                        <span>
                            Rental
                        </span>

                        <strong>
                            #${escapeHtml(rentalId)}
                        </strong>

                    </div>

                </div>

                <div class="review-rating">
                    ${stars}
                </div>

            </div>


            <p class="review-comment">
                ${escapeHtml(comment)}
            </p>


            <div class="review-card-footer">

                <span class="review-date">
                    <i class="bi bi-calendar3"></i>
                    ${formatDate(
                        review.createdAt ||
                        review.updatedAt ||
                        null
                    )}
                </span>


                <div class="review-actions">

                    <button
                        class="review-action-btn edit"
                        title="Edit Review"
                        onclick="openEditReviewModal(
                            ${review.reviewId}
                        )">

                        <i class="bi bi-pencil"></i>

                    </button>


                    <button
                        class="review-action-btn delete"
                        title="Delete Review"
                        onclick="openDeleteModal(
                            ${review.reviewId}
                        )">

                        <i class="bi bi-trash3"></i>

                    </button>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   STARS
========================================================= */

function createStars(
    rating
) {

    let html = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (i <= rating) {

            html +=
                `<i class="bi bi-star-fill"></i>`;

        } else {

            html +=
                `<i class="bi bi-star-fill empty"></i>`;

        }

    }

    return html;
}


/* =========================================================
   CREATE REVIEW MODAL
========================================================= */

function openCreateReviewModal(
    rentalId
) {

    const rental =
        myRentals.find(
            item =>
                Number(item.rentalId) ===
                Number(rentalId)
        );


    if (!rental) {

        showToast(
            "Rental information not found.",
            "error"
        );

        return;
    }


    editingReviewId = null;

    selectedRating = 0;


    document.getElementById(
        "reviewModalTitle"
    ).textContent =
        "Write a Review";


    document.getElementById(
        "submitReviewText"
    ).textContent =
        "Submit Review";


    document.getElementById(
        "reviewId"
    ).value = "";


    document.getElementById(
        "rentalId"
    ).value =
        rental.rentalId;


    document.getElementById(
        "comment"
    ).value = "";


    resetRating();


    renderModalRentalInfo(
        rental
    );


    hideFormError();

    updateCharacterCount();


    reviewModal.show();

}


/* =========================================================
   EDIT REVIEW MODAL
========================================================= */

function openEditReviewModal(
    reviewId
) {

    const review =
        myReviews.find(
            item =>
                Number(item.reviewId) ===
                Number(reviewId)
        );


    if (!review) {

        showToast(
            "Review not found.",
            "error"
        );

        return;
    }


    editingReviewId =
        review.reviewId;


    selectedRating =
        Number(review.rating || 0);


    document.getElementById(
        "reviewModalTitle"
    ).textContent =
        "Edit Your Review";


    document.getElementById(
        "submitReviewText"
    ).textContent =
        "Update Review";


    document.getElementById(
        "reviewId"
    ).value =
        review.reviewId;


    document.getElementById(
        "rentalId"
    ).value =
        review.rentalId || "";


    document.getElementById(
        "comment"
    ).value =
        review.comment || "";


    setRating(
        selectedRating
    );


    const rental =
        myRentals.find(
            item =>
                Number(item.rentalId) ===
                Number(review.rentalId)
        );


    renderModalRentalInfo(
        rental || {
            rentalId:
                review.rentalId
        }
    );


    hideFormError();

    updateCharacterCount();


    reviewModal.show();

}


/* =========================================================
   MODAL RENTAL INFO
========================================================= */

function renderModalRentalInfo(
    rental
) {

    const container =
        document.getElementById(
            "modalRentalInfo"
        );


    const rentalId =
        rental.rentalId || "-";

    const vehicleId =
        rental.vehicleId || "-";


    container.innerHTML = `
        <div class="modal-rental-icon">
            <i class="bi bi-car-front-fill"></i>
        </div>

        <div>

            <strong>
                Rental #${escapeHtml(rentalId)}
            </strong>

            <span>
                ${
                    vehicleId !== "-"
                        ? `Vehicle #${escapeHtml(vehicleId)}`
                        : "Completed Rental"
                }
            </span>

        </div>
    `;

}


/* =========================================================
   RATING
========================================================= */

function setRating(
    rating
) {

    selectedRating =
        Number(rating);


    document.getElementById(
        "rating"
    ).value =
        selectedRating;


    document
        .querySelectorAll(".rating-star")
        .forEach(
            button => {

                const buttonRating =
                    Number(
                        button.dataset.rating
                    );


                if (
                    buttonRating <=
                    selectedRating
                ) {

                    button.classList.add(
                        "selected"
                    );

                } else {

                    button.classList.remove(
                        "selected"
                    );

                }

            }
        );


    const ratingText =
        document.getElementById(
            "ratingText"
        );


    const labels = {
        1: "Very Poor",
        2: "Poor",
        3: "Good",
        4: "Very Good",
        5: "Excellent"
    };


    ratingText.textContent =
        labels[selectedRating] ||
        "Select a rating";

}


/* =========================================================
   RESET RATING
========================================================= */

function resetRating() {

    selectedRating = 0;

    document.getElementById(
        "rating"
    ).value = "0";


    document
        .querySelectorAll(".rating-star")
        .forEach(
            button =>
                button.classList.remove(
                    "selected"
                )
        );


    document.getElementById(
        "ratingText"
    ).textContent =
        "Select a rating";
}


/* =========================================================
   CHARACTER COUNT
========================================================= */

function updateCharacterCount() {

    const comment =
        document.getElementById(
            "comment"
        );


    const counter =
        document.getElementById(
            "characterCount"
        );


    if (!comment || !counter) {
        return;
    }


    counter.textContent =
        comment.value.length;

}


/* =========================================================
   SUBMIT / UPDATE
========================================================= */

async function handleReviewSubmit(
    event
) {

    event.preventDefault();


    hideFormError();


    const rating =
        Number(
            document.getElementById(
                "rating"
            ).value
        );


    const rentalId =
        Number(
            document.getElementById(
                "rentalId"
            ).value
        );


    const comment =
        document.getElementById(
            "comment"
        ).value.trim();


    if (
        rating < 1 ||
        rating > 5
    ) {

        showFormError(
            "Please select a rating between 1 and 5."
        );

        return;
    }


    if (!rentalId) {

        showFormError(
            "Rental ID is required."
        );

        return;
    }


    if (!comment) {

        showFormError(
            "Please enter your review."
        );

        return;
    }


    if (comment.length > 500) {

        showFormError(
            "Review must not exceed 500 characters."
        );

        return;
    }


    const submitButton =
        document.getElementById(
            "submitReviewBtn"
        );


    submitButton.disabled = true;


    document.getElementById(
        "submitReviewText"
    ).textContent =
        editingReviewId
            ? "Updating..."
            : "Submitting...";


    try {

        let url;
        let method;


        if (editingReviewId) {

            url =
                `${API_BASE_URL}/v1/review/update`;

            method = "PUT";

        } else {

            url =
                `${API_BASE_URL}/v1/review/save`;

            method = "POST";

        }


        const reviewId = Number(
            document.getElementById("reviewId").value
        );

        const payload = {
            reviewId: editingReviewId ? reviewId : null,
            rating: rating,
            comment: comment,
            rentalId: rentalId
        };


        const response =
            await authenticatedFetch(
                url,
                {
                    method: method,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        if (!response.ok) {

            throw new Error(
                await extractErrorMessage(
                    response,
                    editingReviewId
                        ? "Unable to update review."
                        : "Unable to submit review."
                )
            );

        }


        reviewModal.hide();


        showToast(
            editingReviewId
                ? "Review updated successfully."
                : "Review submitted successfully.",
            "success"
        );


        await loadReviewData();

    } catch (error) {

        console.error(
            "Review submit error:",
            error
        );

        showFormError(
            error.message ||
            "Unable to process your review."
        );

    } finally {

        submitButton.disabled = false;

        document.getElementById(
            "submitReviewText"
        ).textContent =
            editingReviewId
                ? "Update Review"
                : "Submit Review";
    }

}


/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteModal(
    reviewId
) {

    deletingReviewId =
        reviewId;

    deleteModal.show();

}


/* =========================================================
   DELETE REVIEW
========================================================= */

async function confirmDeleteReview() {

    if (!deletingReviewId) {
        return;
    }


    const button =
        document.getElementById(
            "confirmDeleteBtn"
        );


    button.disabled = true;

    button.textContent =
        "Deleting...";


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/v1/review/${deletingReviewId}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                await extractErrorMessage(
                    response,
                    "Unable to delete review."
                )
            );

        }


        deleteModal.hide();


        showToast(
            "Review deleted successfully.",
            "success"
        );


        deletingReviewId = null;


        await loadReviewData();

    } catch (error) {

        console.error(
            "Delete review error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete review.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Delete Review";
    }

}


/* =========================================================
   SEARCH
========================================================= */

function filterReviews() {

    const search =
        document.getElementById(
            "reviewSearch"
        ).value
            .trim()
            .toLowerCase();


    if (!search) {

        renderReviews(
            myReviews
        );

        return;
    }


    const filtered =
        myReviews.filter(
            review => {

                const comment =
                    String(
                        review.comment || ""
                    ).toLowerCase();


                const rentalId =
                    String(
                        review.rentalId || ""
                    ).toLowerCase();


                return (
                    comment.includes(search) ||
                    rentalId.includes(search)
                );

            }
        );


    renderReviews(
        filtered
    );

}


/* =========================================================
   LOADING
========================================================= */

function showReviewsLoading() {

    document.getElementById(
        "reviewableRentals"
    ).innerHTML = `
        <div class="review-empty">

            <div class="review-empty-icon">

                <div
                    class="spinner-border spinner-border-sm">
                </div>

            </div>

            <h4>
                Loading Reviews
            </h4>

            <p>
                Getting your rental feedback...
            </p>

        </div>
    `;


    document.getElementById(
        "reviewsList"
    ).innerHTML = `
        <div class="review-empty">

            <div class="review-empty-icon">

                <div
                    class="spinner-border spinner-border-sm">
                </div>

            </div>

            <h4>
                Loading Reviews
            </h4>

            <p>
                Please wait...
            </p>

        </div>
    `;
}


/* =========================================================
   ERROR
========================================================= */

function showReviewsError(
    message
) {

    document.getElementById(
        "reviewableRentals"
    ).innerHTML = `
        <div class="review-empty">

            <div class="review-empty-icon">
                <i class="bi bi-exclamation-circle"></i>
            </div>

            <h4>
                Unable to Load Reviews
            </h4>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;


    document.getElementById(
        "reviewsList"
    ).innerHTML = `
        <div class="review-empty">

            <div class="review-empty-icon">
                <i class="bi bi-wifi-off"></i>
            </div>

            <h4>
                Something Went Wrong
            </h4>

            <p>
                Please refresh the page and try again.
            </p>

        </div>
    `;

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    const error =
        document.getElementById(
            "formError"
        );


    error.textContent =
        message;

    error.classList.add(
        "show"
    );

}


function hideFormError() {

    const error =
        document.getElementById(
            "formError"
        );


    error.textContent = "";

    error.classList.remove(
        "show"
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toastElement =
        document.getElementById(
            "reviewToast"
        );

    const messageElement =
        document.getElementById(
            "toastMessage"
        );

    const iconElement =
        document.getElementById(
            "toastIcon"
        );


    messageElement.textContent =
        message;


    if (type === "error") {

        iconElement.className =
            "bi bi-exclamation-circle-fill";

        iconElement.style.color =
            "#dc2626";

    } else {

        iconElement.className =
            "bi bi-check-circle-fill";

        iconElement.style.color =
            "#059669";
    }


    const toast =
        bootstrap.Toast.getOrCreateInstance(
            toastElement,
            {
                delay: 3000
            }
        );


    toast.show();

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "Date unavailable";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return String(value);
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(value ?? "")
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