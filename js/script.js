
const API_BASE = "http://127.0.0.1:8000/api";

const getToken = () => localStorage.getItem("access_token");

async function apiRequest(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (getToken()) {
        headers.Authorization = `Bearer ${getToken()}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }

        throw new Error(
            data.detail || JSON.stringify(data) || "Something went wrong"
        );
    }

    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(value) {
    if (!value) return "-";

    const [hours, minutes] = value.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function statusClass(status) {
    const classes = {
        PENDING: "pending",
        IN_PROGRESS: "progress",
        COMPLETED: "completed",
        CANCELLED: "cancelled"
    };

    return classes[status] || "pending";
}

function statusLabel(status) {
    const labels = {
        PENDING: "Pending",
        IN_PROGRESS: "In Progress",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled"
    };

    return labels[status] || status;
}

function getInitials(name) {
    return String(name || "SP")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

// ---------------- LOGIN ----------------

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const button = loginForm.querySelector("button[type='submit']");

        button.disabled = true;
        button.textContent = "Logging in...";

        try {
            const data = await apiRequest("/accounts/login/", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);

            window.location.href = "dashboard.html";

        } catch (error) {
            alert(error.message);
            button.disabled = false;
            button.textContent = "Login";
        }
    });
}

// ---------------- AUTH CHECK ----------------

function requireLogin() {
    if (!getToken()) {
        window.location.href = "index.html";
        return false;
    }
    return true;
}

// ---------------- LOGOUT ----------------

document.querySelectorAll(".logout").forEach(link => {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "index.html";
    });
});

// ---------------- PROVIDER DETAILS ----------------

function updateProviderName(profile) {
    const name = [
        profile.first_name,
        profile.last_name
    ].filter(Boolean).join(" ") || profile.username || "Service Provider";

    document.querySelectorAll(".provider-info strong").forEach(el => {
        el.textContent = name;
    });

    document.querySelectorAll(".provider-avatar, .profile-avatar").forEach(el => {
        el.textContent = getInitials(name);
    });

    const largeAvatar = document.querySelector(".large-avatar");
    if (largeAvatar) {
        largeAvatar.textContent = getInitials(name);
    }

    const profileHeading = document.querySelector(".profile-header h2");
    if (profileHeading) {
        profileHeading.textContent = name;
    }
}

// ---------------- DASHBOARD ----------------

async function loadDashboard() {
    if (!requireLogin()) return;

    try {
        const data = await apiRequest("/dashboard-stats/");

        const statValues = [
            data.total_bookings,
            data.pending_bookings,
            data.in_progress_bookings,
            data.completed_bookings
        ];

        document.querySelectorAll(".stats-grid .stat-card h2")
            .forEach((element, index) => {
                if (statValues[index] !== undefined) {
                    element.textContent = statValues[index];
                }
            });

        const tbody = document.querySelector("table tbody");

        if (tbody) {
            if (!data.recent_bookings.length) {
                tbody.innerHTML =
                    '<tr><td colspan="5">No bookings available.</td></tr>';
            } else {
                tbody.innerHTML = data.recent_bookings.map(booking => `
                    <tr>
                        <td>
                            <div class="customer">
                                <div class="customer-avatar">
                                    ${escapeHTML(getInitials(booking.customer_name))}
                                </div>
                                <div>
                                    <strong>${escapeHTML(booking.customer_name)}</strong>
                                    <small>${escapeHTML(booking.customer_phone)}</small>
                                </div>
                            </div>
                        </td>
                        <td>${escapeHTML(booking.service_name)}</td>
                        <td>${formatDate(booking.booking_date)}</td>
                        <td>${formatTime(booking.booking_time)}</td>
                        <td>
                            <span class="status ${statusClass(booking.status)}">
                                ${statusLabel(booking.status)}
                            </span>
                        </td>
                    </tr>
                `).join("");
            }
        }

        const profile = await apiRequest("/accounts/profile/");
        updateProviderName(profile);

    } catch (error) {
        alert("Dashboard error: " + error.message);
    }
}

// ---------------- BOOKINGS ----------------

async function loadBookings() {
    if (!requireLogin()) return;

    try {
        const [bookings, stats] = await Promise.all([
            apiRequest("/bookings/"),
            apiRequest("/dashboard-stats/")
        ]);

        const statValues = [
            stats.total_bookings,
            stats.pending_bookings,
            stats.in_progress_bookings,
            stats.completed_bookings
        ];

        document.querySelectorAll(".stats-grid .stat-card h2")
            .forEach((element, index) => {
                if (statValues[index] !== undefined) {
                    element.textContent = statValues[index];
                }
            });

        const tbody = document.querySelector("table tbody");

        if (!tbody) return;

        if (!bookings.length) {
            tbody.innerHTML =
                '<tr><td colspan="7">No bookings available.</td></tr>';
            return;
        }

        tbody.innerHTML = bookings.map(booking => {
            let action = "";

            if (booking.status === "PENDING") {
                action = `<button class="action-btn" onclick="updateBooking(this)">Accept</button>`;
            } else if (booking.status === "IN_PROGRESS") {
                action = `<button class="action-btn" onclick="updateBooking(this)">Complete</button>`;
            } else if (booking.status === "COMPLETED") {
                action = `<button class="action-btn disabled" disabled>Completed</button>`;
            } else {
                action = `<button class="action-btn disabled" disabled>Cancelled</button>`;
            }

            return `
                <tr data-booking-id="${booking.id}">
                    <td>
                        <div class="customer">
                            <div class="customer-avatar">
                                ${escapeHTML(getInitials(booking.customer_name))}
                            </div>
                            <div>
                                <strong>${escapeHTML(booking.customer_name)}</strong>
                                <small>${escapeHTML(booking.customer_phone)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHTML(booking.service_name)}</td>
                    <td>${formatDate(booking.booking_date)}</td>
                    <td>${formatTime(booking.booking_time)}</td>
                    <td>${escapeHTML(booking.address)}</td>
                    <td>
                        <span class="status ${statusClass(booking.status)}">
                            ${statusLabel(booking.status)}
                        </span>
                    </td>
                    <td>${action}</td>
                </tr>
            `;
        }).join("");

        const profile = await apiRequest("/accounts/profile/");
        updateProviderName(profile);

    } catch (error) {
        alert("Bookings error: " + error.message);
    }
}

// Update booking status in database
async function updateBooking(button) {
    const row = button.closest("tr");
    const bookingId = row?.dataset.bookingId;

    if (!bookingId) {
        alert("Booking ID not found.");
        return;
    }

    const statusElement = row.querySelector(".status");
    const currentStatus = statusElement.textContent.trim();

    let newStatus;

    if (currentStatus === "Pending") {
        newStatus = "IN_PROGRESS";
    } else if (currentStatus === "In Progress") {
        newStatus = "COMPLETED";
    } else {
        return;
    }

    button.disabled = true;

    try {
        await apiRequest(`/bookings/${bookingId}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
        });

        await loadBookings();
        alert("Booking status updated successfully!");

    } catch (error) {
        button.disabled = false;
        alert(error.message);
    }
}

// ---------------- PROFILE ----------------

async function loadProfile() {
    if (!requireLogin()) return;

    try {
        const profile = await apiRequest("/accounts/profile/");

        updateProviderName(profile);

        const fields = document.querySelectorAll(
            ".profile-grid .profile-field"
        );

        fields.forEach(field => {
            const label = field.querySelector("label")?.textContent
                .trim().toLowerCase();

            const input = field.querySelector("input, select");

            if (!input || !label) return;

            if (label.includes("full name")) {
                input.value = [
                    profile.first_name,
                    profile.last_name
                ].filter(Boolean).join(" ");
            } else if (label.includes("email")) {
                input.value = profile.email || "";
            } else if (label.includes("phone")) {
                input.value = profile.phone || "";
            } else if (label.includes("service category")) {
                input.value = profile.service_category || "";
            } else if (label.includes("experience")) {
                input.value = profile.experience || "";
            } else if (label.includes("location")) {
                input.value = profile.address || "";
            }
        });

        const about = document.querySelector(".about-provider textarea");
        if (about) {
            about.value = profile.about || "";
        }

    } catch (error) {
        alert("Profile error: " + error.message);
    }
}

async function saveProfile() {
    const fields = document.querySelectorAll(
        ".profile-grid .profile-field"
    );

    const payload = {};

    fields.forEach(field => {
        const label = field.querySelector("label")?.textContent
            .trim().toLowerCase();

        const input = field.querySelector("input, select");

        if (!input || !label) return;

        if (label.includes("full name")) {
            const parts = input.value.trim().split(/\s+/);
            payload.first_name = parts.shift() || "";
            payload.last_name = parts.join(" ");
        } else if (label.includes("email")) {
            payload.email = input.value.trim();
        } else if (label.includes("phone")) {
            payload.phone = input.value.trim();
        } else if (label.includes("service category")) {
            payload.service_category = input.value;
        } else if (label.includes("experience")) {
            payload.experience = input.value.trim();
        } else if (label.includes("location")) {
            payload.address = input.value.trim();
        }
    });

    const about = document.querySelector(".about-provider textarea");
    if (about) {
        payload.about = about.value.trim();
    }

    try {
        await apiRequest("/accounts/profile/", {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        alert("Profile updated successfully!");

    } catch (error) {
        alert("Could not update profile: " + error.message);
    }
}

// ---------------- PAGE INITIALIZATION ----------------

document.addEventListener("DOMContentLoaded", function () {
    const page = window.location.pathname.toLowerCase();

    if (page.endsWith("dashboard.html")) {
        loadDashboard();
    }

    if (page.endsWith("bookings.html")) {
        loadBookings();
    }

    if (page.endsWith("profile.html")) {
        loadProfile();
    }
});
