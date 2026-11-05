
const API_BASE = "https://urbanclap-dashboard.onrender.com/api";

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const message = document.getElementById("registerMessage");

    const first_name = document.getElementById("first_name").value.trim();
    const last_name = document.getElementById("last_name").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const service_category = document.getElementById("service_category").value.trim();
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirm_password").value;

    if (password !== confirm_password) {
        message.style.color = "red";
        message.textContent = "Passwords do not match!";
        return;
    }

    if (password.length < 8) {
        message.style.color = "red";
        message.textContent = "Password must contain at least 8 characters.";
        return;
    }

    const submitButton = registerForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Creating Account...";

    try {
        const response = await fetch(`${API_BASE}/accounts/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                first_name,
                last_name,
                username,
                email,
                phone,
                service_category,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errors = Object.entries(data)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
                .join("\n");

            throw new Error(errors || "Registration failed.");
        }

        message.style.color = "green";
        message.textContent = "Account created successfully! Redirecting to login...";

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1800);

    } catch (error) {
        message.style.color = "red";
        message.style.whiteSpace = "pre-line";
        message.textContent = error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
    }
});
