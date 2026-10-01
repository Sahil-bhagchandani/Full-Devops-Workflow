const API_BASE_URL = "/api";

const jobForm = document.getElementById("job-form");
const jobTypeInput = document.getElementById("job-type");
const customerIdInput = document.getElementById("customer-id");

const createJobButton =
    document.getElementById("create-job-button");

const refreshButton =
    document.getElementById("refresh-button");

const jobsContainer =
    document.getElementById("jobs-container");

const loading =
    document.getElementById("loading");

const formMessage =
    document.getElementById("form-message");


function showMessage(message, type) {
    formMessage.textContent = message;

    formMessage.className = `message ${type}`;
}


function hideMessage() {
    formMessage.className = "message hidden";
}


function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    return new Date(dateString).toLocaleString();
}


function renderJobs(jobs) {

    if (!jobs || jobs.length === 0) {

        jobsContainer.innerHTML = `
            <div class="empty-state">
                No jobs found.
            </div>
        `;

        return;
    }

    const rows = jobs.map((job) => {

        const payload =
            job.payload
                ? JSON.stringify(job.payload, null, 2)
                : "{}";

        return `
            <tr>

                <td>${job.id}</td>

                <td>${escapeHtml(job.type)}</td>

                <td>
                    <span class="status ${escapeHtml(job.status)}">
                        ${escapeHtml(job.status)}
                    </span>
                </td>

                <td>
                    <div class="payload">
                        ${escapeHtml(payload)}
                    </div>
                </td>

                <td>
                    ${formatDate(job.created_at)}
                </td>

                <td>
                    ${formatDate(job.updated_at)}
                </td>

            </tr>
        `;
    }).join("");

    jobsContainer.innerHTML = `
        <div class="jobs-table-wrapper">

            <table class="jobs-table">

                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Payload</th>
                        <th>Created</th>
                        <th>Updated</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function loadJobs() {

    loading.classList.remove("hidden");

    try {

        const response =
            await fetch(`${API_BASE_URL}/jobs`);

        if (!response.ok) {
            throw new Error("Failed to fetch jobs");
        }

        const jobs = await response.json();

        renderJobs(jobs);

    } catch (error) {

        console.error("Failed to load jobs:", error);

        jobsContainer.innerHTML = `
            <div class="message error">
                Failed to load jobs.
            </div>
        `;

    } finally {

        loading.classList.add("hidden");
    }
}


async function createJob(event) {

    event.preventDefault();

    hideMessage();

    const type = jobTypeInput.value.trim();
    const customerId = customerIdInput.value.trim();

    if (!type || !customerId) {
        showMessage(
            "Job type and customer ID are required.",
            "error"
        );

        return;
    }

    createJobButton.disabled = true;
    createJobButton.textContent = "Creating...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/jobs`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    type,
                    payload: {
                        customerId: Number(customerId)
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to create job"
            );
        }

        showMessage(
            `Job ${data.id} created successfully.`,
            "success"
        );

        jobForm.reset();

        await loadJobs();

    } catch (error) {

        console.error("Failed to create job:", error);

        showMessage(
            error.message || "Failed to create job.",
            "error"
        );

    } finally {

        createJobButton.disabled = false;
        createJobButton.textContent = "Create Job";
    }
}


jobForm.addEventListener("submit", createJob);

refreshButton.addEventListener("click", loadJobs);


// Initial load
loadJobs();


// Refresh the job list every 5 seconds
setInterval(loadJobs, 5000);