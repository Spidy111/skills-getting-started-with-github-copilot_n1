document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      // Clear loading message and existing options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      // Populate activities list and select options
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participant avatars (initials)
        const participants = details.participants || [];
        const avatarsHtml = participants.slice(0,4).map((p, i) => {
          const initial = (p.split('@')[0] || 'S').slice(0,2).toUpperCase();
          const cls = i % 2 === 0 ? 'avatar' : 'avatar alt';
          return `<div class="${cls}" title="${p}">${initial}</div>`;
        }).join('');

        const percent = Math.min(100, Math.round((participants.length / details.max_participants) * 100));

        activityCard.innerHTML = `
          <h4>${name} <span class="badge">${spotsLeft>0? 'Open' : 'Full'}</span></h4>
          <p>${details.description}</p>
          <p class="meta"><strong>Schedule:</strong> ${details.schedule}</p>
          <div class="participants" aria-hidden="false">
            ${avatarsHtml}
            <div class="meta">${participants.length} joined</div>
          </div>
          <div class="progress" aria-hidden="true"><i style="width:${percent}%"></i></div>
          <div class="card-actions">
            <button class="btn btn-primary" data-activity="${encodeURIComponent(name)}" ${spotsLeft<=0?"disabled":""}>Join the Club</button>
            <button class="btn btn-ghost" data-activity-info>More</button>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach click handlers for the newly created sign-up buttons
      document.querySelectorAll(".btn-primary[data-activity]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const activityName = decodeURIComponent(btn.getAttribute("data-activity"));
          activitySelect.value = activityName;
          document.getElementById("email").focus();
          // Scroll signup into view on small screens
          document.getElementById("signup-container").scrollIntoView({ behavior: "smooth" });
        });
      });

      // Simple view action for card-info buttons (toggle details)
      document.querySelectorAll("[data-activity-info]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const card = btn.closest('.activity-card');
          card.classList.toggle('expanded');
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Filter activities locally using search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.activity-card').forEach(card => {
        const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        if (title.includes(q) || desc.includes(q)) card.style.display = '';
        else card.style.display = 'none';
      });
    });
  }

  // Initialize app
  fetchActivities();
});
