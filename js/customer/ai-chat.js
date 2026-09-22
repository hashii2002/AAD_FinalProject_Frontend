/* =========================================================
   DRIVEGO AI ASSISTANT
   CUSTOMER
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ROLE ACCESS
    ===================================================== */

    if (typeof checkRoleAccess === "function") {

        checkRoleAccess(["CUSTOMER"]);

    }


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const chatForm =
        document.getElementById("chatForm");

    const messageInput =
        document.getElementById("messageInput");

    const sendBtn =
        document.getElementById("sendBtn");

    const chatMessages =
        document.getElementById("chatMessages");

    const typingIndicator =
        document.getElementById("typingIndicator");

    const clearChatBtn =
        document.getElementById("clearChatBtn");

    const characterCount =
        document.getElementById("characterCount");


    /* =====================================================
       USER INFORMATION
    ===================================================== */

    loadCustomerInformation();


    /* =====================================================
       EVENTS
    ===================================================== */

    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            handleChatSubmit
        );

    }


    if (messageInput) {

        messageInput.addEventListener(
            "input",
            handleInputChange
        );


        messageInput.addEventListener(
            "keydown",
            handleInputKeydown
        );

    }


    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            clearChat
        );

    }


    /* =====================================================
       QUICK QUESTIONS
    ===================================================== */

    document
        .querySelectorAll(".quick-question")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const question =
                        this.dataset.question;

                    if (!question) {
                        return;
                    }

                    messageInput.value =
                        question;

                    handleInputChange();

                    messageInput.focus();

                    handleChatSubmit(
                        new Event("submit")
                    );

                }
            );

        });


    /* =====================================================
       INITIAL INPUT
    ===================================================== */

    updateCharacterCount();

});


/* =========================================================
   LOAD CUSTOMER INFORMATION
========================================================= */

function loadCustomerInformation() {

    const username =
        localStorage.getItem("username") ||
        "Customer";


    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const headerUsername =
        document.getElementById("headerUsername");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const headerAvatar =
        document.getElementById("headerAvatar");


    if (sidebarUsername) {

        sidebarUsername.textContent =
            username;

    }


    if (headerUsername) {

        headerUsername.textContent =
            username;

    }


    const initial =
        username
            .trim()
            .charAt(0)
            .toUpperCase() || "C";


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initial;

    }


    if (headerAvatar) {

        headerAvatar.textContent =
            initial;

    }

}


/* =========================================================
   HANDLE CHAT SUBMIT
========================================================= */

async function handleChatSubmit(event) {

    if (event) {

        event.preventDefault();

    }


    const message = messageInput.value.trim();

    if (!message) {

        showInputError(
            "Please enter a question."
        );

        return;

    }


    if (message.length > 1000) {

        showInputError(
            "Your question cannot exceed 1000 characters."
        );

        return;

    }

    addUserMessage(message);

    messageInput.value = "";

    updateCharacterCount();

    setChatLoading(true);

    showTypingIndicator();

    try {

        const token =
            localStorage.getItem("accessToken");


        if (!token) {

            throw new Error(
                "Your session has expired. Please login again."
            );

        }


        const response =
            await fetch(
                `${API_BASE_URL}/v1/ai/chat`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );


        /* =================================================
           RESPONSE
        ================================================= */

        const data =
            await response.json()
                .catch(() => null);


        /* =================================================
           UNAUTHORIZED
        ================================================= */

        if (response.status === 401) {

            hideTypingIndicator();

            setChatLoading(false);

            addAssistantMessage(
                "Your session has expired. Please login again to continue using the AI Assistant.",
                true
            );

            setTimeout(() => {

                if (typeof redirectByRole === "function") {

                    redirectByRole("CUSTOMER");

                } else {

                    window.location.href =
                        "../index.html";

                }

            }, 1800);

            return;

        }


        /* =================================================
           FORBIDDEN
        ================================================= */

        if (response.status === 403) {

            throw new Error(
                "You do not have permission to use the AI Assistant."
            );

        }


        /* =================================================
           OTHER HTTP ERRORS
        ================================================= */

        if (!response.ok) {

            const errorMessage =
                data?.message ||
                data?.body ||
                "Unable to get a response from the AI Assistant.";

            throw new Error(errorMessage);

        }


        /* =================================================
           COMMON RESPONSE
        ================================================= */

        const aiResponse =
            data?.body;


        if (!aiResponse) {

            throw new Error(
                "The AI Assistant returned an empty response."
            );

        }


        /* =================================================
           HIDE TYPING
        ================================================= */

        hideTypingIndicator();

        await delay(250);


        /* =================================================
           SHOW AI RESPONSE
        ================================================= */

        addAssistantMessage(
            String(aiResponse)
        );


    } catch (error) {

        console.error(
            "AI Assistant Error:",
            error
        );


        hideTypingIndicator();


        addAssistantMessage(
            error.message ||
            "Something went wrong while contacting the AI Assistant. Please try again.",
            true
        );

    } finally {

        setChatLoading(false);

        messageInput.focus();

    }

}


/* =========================================================
   ADD USER MESSAGE
========================================================= */

function addUserMessage(message) {

    const row =
        document.createElement("div");

    row.className =
        "message-row user-row";


    /* Avatar */

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar user-avatar";

    avatar.innerHTML =
        '<i class="bi bi-person-fill"></i>';


    /* Content */

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    /* Name */

    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        "You";


    /* Bubble */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble user-bubble";

    bubble.textContent =
        message;


    content.appendChild(name);

    content.appendChild(bubble);

    row.appendChild(avatar);

    row.appendChild(content);


    chatMessages.appendChild(row);


    scrollChatToBottom();

}


/* =========================================================
   ADD ASSISTANT MESSAGE
========================================================= */

function addAssistantMessage(
    message,
    isError = false
) {

    const row =
        document.createElement("div");

    row.className =
        "message-row assistant-row";


    /* Avatar */

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar assistant-avatar";

    avatar.innerHTML =
        '<i class="bi bi-stars"></i>';


    /* Content */

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    /* Name */

    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        "DriveGo Assistant";


    /* Bubble */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble assistant-bubble";


    if (isError) {

        bubble.style.color =
            "#b91c1c";

        bubble.style.background =
            "#fef2f2";

        bubble.style.borderColor =
            "#fecaca";

    }

    bubble.innerHTML = formatAssistantMessage(message);


    content.appendChild(name);

    content.appendChild(bubble);

    row.appendChild(avatar);

    row.appendChild(content);


    chatMessages.appendChild(row);


    scrollChatToBottom();

}


/* =========================================================
   FORMAT AI MESSAGE
========================================================= */

function formatAssistantMessage(message) {

    const safeText =
        escapeHtml(message);


    const lines =
        safeText.split(/\r?\n/);


    let html = "";

    let listOpen = false;


    lines.forEach(line => {

        const trimmed =
            line.trim();


        if (!trimmed) {

            if (listOpen) {

                html += "</ul>";

                listOpen = false;

            }

            return;

        }


        /* Bullet */

        if (
            trimmed.startsWith("•") ||
            trimmed.startsWith("-")
        ) {

            if (!listOpen) {

                html += "<ul>";

                listOpen = true;

            }


            const bulletText =
                trimmed
                    .replace(/^•\s*/, "")
                    .replace(/^-\s*/, "");


            html +=
                `<li>${bulletText}</li>`;

            return;

        }


        if (listOpen) {

            html += "</ul>";

            listOpen = false;

        }


        html +=
            `<p>${trimmed}</p>`;

    });


    if (listOpen) {

        html += "</ul>";

    }


    return html;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   SHOW TYPING INDICATOR
========================================================= */

function showTypingIndicator() {

    if (!typingIndicator) {
        return;
    }


    typingIndicator.classList.remove(
        "d-none"
    );


    scrollChatToBottom();

}


/* =========================================================
   HIDE TYPING INDICATOR
========================================================= */

function hideTypingIndicator() {

    if (!typingIndicator) {
        return;
    }


    typingIndicator.classList.add(
        "d-none"
    );

}


/* =========================================================
   CHAT LOADING STATE
========================================================= */

function setChatLoading(isLoading) {

    sendBtn.disabled =
        isLoading;

    messageInput.disabled =
        isLoading;


    if (isLoading) {

        sendBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm"></span>';

    } else {

        sendBtn.innerHTML =
            '<i class="bi bi-send-fill"></i>';

    }

}


/* =========================================================
   INPUT CHANGE
========================================================= */

function handleInputChange() {

    updateCharacterCount();

}


/* =========================================================
   CHARACTER COUNT
========================================================= */

function updateCharacterCount() {

    if (!messageInput || !characterCount) {
        return;
    }


    const length =
        messageInput.value.length;


    characterCount.textContent =
        `${length} / 1000`;


    if (length >= 900) {

        characterCount.style.color =
            "#f59e0b";

    } else {

        characterCount.style.color =
            "#a1a9b8";

    }


    if (length >= 1000) {

        characterCount.style.color =
            "#ef4444";

    }

}


/* =========================================================
   ENTER / SHIFT + ENTER
========================================================= */

function handleInputKeydown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        if (!sendBtn.disabled) {

            handleChatSubmit(
                new Event("submit")
            );

        }

    }

}


/* =========================================================
   CLEAR CHAT
========================================================= */

function clearChat() {

    const confirmed =
        window.confirm(
            "Clear the current conversation?"
        );


    if (!confirmed) {
        return;
    }


    chatMessages.innerHTML = "";


    /* Restore welcome message */

    addAssistantMessage(
        `Hello! 👋 I'm your DriveGo AI Assistant.

I can help you with:

• Vehicle availability
• Brands and models
• Vehicle specifications
• Rental categories
• Daily and monthly rental rates

What would you like to know?`
    );

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChatToBottom() {

    if (!chatMessages) {
        return;
    }


    requestAnimationFrame(() => {

        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    });

}


/* =========================================================
   INPUT ERROR
========================================================= */

function showInputError(message) {

    if (!messageInput) {
        return;
    }


    messageInput.focus();


    messageInput.style.borderColor =
        "#ef4444";


    setTimeout(() => {

        messageInput.style.borderColor =
            "";

    }, 1000);


    addAssistantMessage(
        message,
        true
    );

}


/* =========================================================
   DELAY HELPER
========================================================= */

function delay(milliseconds) {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            milliseconds
        );

    });

}


/* =========================================================
   MOBILE SIDEBAR FALLBACK
========================================================= */

function openCustomerSidebar() {

    const sidebar =
        document.getElementById(
            "customerSidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.add("show");

    }


    if (overlay) {

        overlay.classList.add("show");

    }

}


function closeCustomerSidebar() {

    const sidebar =
        document.getElementById(
            "customerSidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove("show");

    }


    if (overlay) {

        overlay.classList.remove("show");

    }

}

if (typeof window.toggleSidebar !== "function") {

    window.toggleSidebar =
        function () {

            const sidebar =
                document.getElementById(
                    "customerSidebar"
                );

            if (
                sidebar &&
                sidebar.classList.contains("show")
            ) {

                closeCustomerSidebar();

            } else {

                openCustomerSidebar();

            }

        };

}


if (typeof window.closeSidebar !== "function") {

    window.closeSidebar =
        function () {

            closeCustomerSidebar();

        };

}