// API Base URL
const API_BASE = "http://localhost:3001/api/v1";

// Global state
let allMovies = [];
let likedMovies = [];
let currentMoviePage = 1;

// ============ UTILITY FUNCTIONS ============

function showAlert(elementId, message, type = "error") {
  const alertEl = document.getElementById(elementId);
  alertEl.className = `alert alert-${type}`;
  alertEl.innerHTML = `<span style="font-weight: 600;">⚠️</span> <span>${message}</span>`;
  alertEl.style.display = "flex";
  setTimeout(() => (alertEl.style.display = "none"), 5000);
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, error: error.message };
  }
}

function formatRecommendationCard(rec, scoreLabel) {
  const imdbScore = rec.imdb_score || rec.IMDB_Score || 0;
  const score =
    rec.pred_rating ||
    rec.similarity_score ||
    rec.onboarding_score ||
    imdbScore;

  return `
    <div class="recommendation-card">
      <div class="rec-title">${rec.title || rec.Title}</div>
      <div class="rec-meta">
        <div><strong>Genre:</strong> ${rec.genre || rec.Genre || "N/A"}</div>
        <div><strong>IMDB:</strong> ${imdbScore}</div>
        <div><strong>Year:</strong> ${rec.year || rec.Year || "N/A"}</div>
        <div><strong>Language:</strong> ${rec.language || rec.Language || "N/A"}</div>
      </div>
      <div class="rec-score">${scoreLabel}: ${score.toFixed(2)}</div>
    </div>
  `;
}

// ============ HEALTH CHECK ============

async function checkHealth() {
  const result = await fetchAPI("/health");
  const healthEl = document.getElementById("healthStatus");

  if (result.success) {
    const nodeStatus = result.data.data?.node_server;
    const pythonStatus = result.data.data?.python_inference_server;

    if (nodeStatus === "healthy" && pythonStatus === "healthy") {
      healthEl.className = "health-status healthy";
      healthEl.innerHTML =
        '<span class="status-dot"></span> <span>✅ All Systems Healthy</span>';
    } else {
      healthEl.className = "health-status unhealthy";
      healthEl.innerHTML = `<span class="status-dot"></span> <span>⚠️ Python Service Issue</span>`;
    }
  } else {
    healthEl.className = "health-status unhealthy";
    healthEl.innerHTML = `<span class="status-dot"></span> <span>❌ Connection Failed</span>`;
  }
}

// ============ TAB 1: CONTENT-BASED FILTERING ============

let cbfMovieCache = [];

async function searchMoviesCBF() {
  const query = document.getElementById("cbfSearchInput").value.toLowerCase();

  if (!query) {
    document.getElementById("cbfMoviesList").style.display = "none";
    return;
  }

  // If cache is empty, load all movies
  if (cbfMovieCache.length === 0) {
    const result = await fetchAPI("/movies?limit=1000");
    if (result.success) {
      cbfMovieCache = result.data.data?.movies || [];
    } else {
      showAlert("cbfError", "Failed to load movies");
      return;
    }
  }

  const filtered = cbfMovieCache.filter((m) =>
    (m.title || m.Title || "").toLowerCase().includes(query),
  );

  const grid = document.getElementById("cbfMoviesGrid");
  grid.innerHTML = filtered
    .slice(0, 10)
    .map((m) => {
      const title = m.title || m.Title;
      return `
        <div class="movie-item" onclick="selectCBFMovie('${title}')">
          <div class="movie-title">${title}</div>
          <div class="movie-info">
            <div><strong>Genre:</strong> ${m.genre || m.Genre || "N/A"}</div>
            <div class="movie-rating">★ ${m.imdb_score || m.IMDB_Score || 0}</div>
          </div>
        </div>
      `;
    })
    .join("");

  document.getElementById("cbfMoviesList").style.display = "block";
}

function selectCBFMovie(title) {
  document.getElementById("cbfSearchInput").value = title;
  document.getElementById("cbfMoviesList").style.display = "none";
}

async function getContentBasedRecommendations() {
  const title = document.getElementById("cbfSearchInput").value.trim();
  const topN = parseInt(document.getElementById("cbfTopN").value) || 10;

  if (!title) {
    showAlert("cbfError", "Please enter or select a movie title");
    return;
  }

  document.getElementById("cbfLoading").style.display = "block";
  document.getElementById("cbfResults").style.display = "none";
  document.getElementById("cbfError").style.display = "none";

  const result = await fetchAPI(
    `/recommendations/content-based?title=${encodeURIComponent(title)}&top_n=${topN}`,
  );

  document.getElementById("cbfLoading").style.display = "none";

  if (result.success) {
    const recs = result.data.data?.recommendations || [];
    const html = recs
      .map((r) => formatRecommendationCard(r, "Similarity"))
      .join("");

    document.getElementById("cbfRecommendations").innerHTML = html;
    document.getElementById("cbfResults").style.display = "block";
  } else {
    showAlert("cbfError", result.error);
  }
}

// ============ TAB 2: NCF COLLABORATIVE FILTERING ============

async function loadUsersForNCF() {
  const result = await fetchAPI("/users");

  if (result.success) {
    const users = result.data.data?.users || [];
    const select = document.getElementById("ncfUserSelect");
    select.innerHTML = users
      .map((u) => `<option value="${u}">${u}</option>`)
      .join("");

    if (users.length === 0) {
      showAlert("ncfError", "No users found in the system");
    }
  } else {
    showAlert("ncfError", "Failed to load users");
  }
}

async function getNCFRecommendations() {
  const username = document.getElementById("ncfUserSelect").value;
  const topN = parseInt(document.getElementById("ncfTopN").value) || 10;
  const excludeSeen = document.getElementById("ncfExcludeSeen").checked;

  if (!username) {
    showAlert("ncfError", "Please select a user");
    return;
  }

  document.getElementById("ncfLoading").style.display = "block";
  document.getElementById("ncfResults").style.display = "none";
  document.getElementById("ncfError").style.display = "none";

  const result = await fetchAPI(
    `/recommendations/ncf?username=${encodeURIComponent(username)}&top_n=${topN}&exclude_seen=${excludeSeen}`,
  );

  document.getElementById("ncfLoading").style.display = "none";

  if (result.success) {
    const recs = result.data.data?.recommendations || [];
    const html = recs
      .map((r) => formatRecommendationCard(r, "Predicted Rating"))
      .join("");

    document.getElementById("ncfRecommendations").innerHTML = html;
    document.getElementById("ncfResults").style.display = "block";
  } else {
    showAlert("ncfError", result.error);
  }
}

// ============ TAB 3: HYBRID ONBOARDING ============

async function loadMoviesForHybrid() {
  const result = await fetchAPI("/movies?limit=1000");

  if (result.success) {
    allMovies = result.data.data?.movies || [];
    displayHybridMovies(allMovies);
  } else {
    showAlert("hybridError", "Failed to load movies");
  }
}

function searchMoviesHybrid() {
  const query = document
    .getElementById("hybridSearchInput")
    .value.toLowerCase();
  const filtered = allMovies.filter((m) =>
    (m.title || m.Title || "").toLowerCase().includes(query),
  );
  displayHybridMovies(filtered);
}

function displayHybridMovies(movies) {
  const grid = document.getElementById("hybridMoviesGrid");
  grid.innerHTML = movies
    .slice(0, 50)
    .map((m) => {
      const title = m.title || m.Title;
      const isSelected = likedMovies.includes(title);
      return `
        <div class="movie-item" style="${isSelected ? "border-color: var(--primary); box-shadow: 0 0 10px rgba(229, 9, 20, 0.3);" : ""}" 
             onclick="toggleHybridMovie('${title.replace(/'/g, "\\'")}')">
          <div class="movie-title">${title}</div>
          <div class="movie-info">
            <div><strong>Genre:</strong> ${m.genre || m.Genre || "N/A"}</div>
            <div class="movie-rating">★ ${m.imdb_score || m.IMDB_Score || 0}</div>
          </div>
          ${isSelected ? '<div style="color: var(--primary); font-weight: 700; margin-top: 8px;">✓ LIKED</div>' : ""}
        </div>
      `;
    })
    .join("");

  document.getElementById("hybridMoviesList").style.display = "block";
}

function toggleHybridMovie(title) {
  if (likedMovies.includes(title)) {
    likedMovies = likedMovies.filter((m) => m !== title);
  } else {
    likedMovies.push(title);
  }
  updateHybridSelectedDisplay();
}

function updateHybridSelectedDisplay() {
  const container = document.getElementById("hybridSelectedMovies");

  if (likedMovies.length === 0) {
    container.innerHTML =
      '<span style="color: var(--text-muted);">No movies selected</span>';
  } else {
    container.innerHTML = likedMovies
      .map(
        (m) =>
          `<span style="background: var(--primary); padding: 5px 10px; border-radius: 5px; display: flex; align-items: center; gap: 8px;">
            ${m}
            <button style="background: none; border: none; color: white; cursor: pointer; font-weight: bold;" onclick="toggleHybridMovie('${m.replace(/'/g, "\\'")}')">✕</button>
          </span>`,
      )
      .join("");
  }
}

async function getHybridRecommendations() {
  const topN = parseInt(document.getElementById("hybridTopN").value) || 10;

  if (likedMovies.length === 0) {
    showAlert("hybridError", "Please select at least one movie");
    return;
  }

  document.getElementById("hybridLoading").style.display = "block";
  document.getElementById("hybridResults").style.display = "none";
  document.getElementById("hybridError").style.display = "none";

  const result = await fetchAPI("/recommendations/hybrid-onboarding", {
    method: "POST",
    body: JSON.stringify({
      liked_titles: likedMovies,
      top_n: topN,
    }),
  });

  document.getElementById("hybridLoading").style.display = "none";

  if (result.success) {
    const recs = result.data.data?.recommendations || [];
    const html = recs
      .map((r) => formatRecommendationCard(r, "Onboarding Score"))
      .join("");

    document.getElementById("hybridRecommendations").innerHTML = html;
    document.getElementById("hybridResults").style.display = "block";
  } else {
    showAlert("hybridError", result.error);
  }
}

// ============ TAB 4: BROWSE MOVIES ============

async function loadMovies(page = 1) {
  const limit =
    parseInt(document.getElementById("movieLimitSelect").value) || 20;
  const search = document.getElementById("movieSearchInput").value || "";

  document.getElementById("moviesLoading").style.display = "block";
  document.getElementById("moviesResults").style.display = "none";
  document.getElementById("moviesError").style.display = "none";

  let endpoint = `/movies?page=${page}&limit=${limit}`;
  if (search) {
    endpoint += `&search=${encodeURIComponent(search)}`;
  }

  const result = await fetchAPI(endpoint);

  document.getElementById("moviesLoading").style.display = "none";

  if (result.success) {
    const movies = result.data.data?.movies || [];
    const total = result.data.data?.total || movies.length;

    const grid = document.getElementById("moviesGrid");
    grid.innerHTML = movies
      .map((m) => {
        const title = m.title || m.Title;
        return `
          <div class="movie-item" onclick="selectCBFMovie('${title}')">
            <div class="movie-title">${title}</div>
            <div class="movie-info">
              <div><strong>Genre:</strong> ${m.genre || m.Genre || "N/A"}</div>
              <div class="movie-rating">★ ${m.imdb_score || m.IMDB_Score || 0}</div>
              <div><strong>Year:</strong> ${m.year || m.Year || "N/A"}</div>
            </div>
            <button class="btn btn-primary btn-small" style="margin-top: 10px; width: 100%;" 
                    onclick="event.stopPropagation(); selectCBFMovie('${title}')">
              Get Similar
            </button>
          </div>
        `;
      })
      .join("");

    document.getElementById("moviesResults").style.display = "block";
    currentMoviePage = page;
  } else {
    showAlert("moviesError", result.error);
  }
}

// ============ TAB 5: BROWSE USERS ============

async function loadUsers() {
  document.getElementById("usersLoading").style.display = "block";
  document.getElementById("usersResults").style.display = "none";
  document.getElementById("usersError").style.display = "none";

  const result = await fetchAPI("/users");

  document.getElementById("usersLoading").style.display = "none";

  if (result.success) {
    const users = result.data.data?.users || [];

    const grid = document.getElementById("usersGrid");
    grid.innerHTML = users
      .map((u) => {
        return `
          <div class="movie-item" style="cursor: pointer;" onclick="selectUserNCF('${u}')">
            <div class="movie-title" style="color: var(--primary);">👤 ${u}</div>
            <div style="color: var(--text-muted); margin-top: 10px;">Click to get recommendations</div>
            <button class="btn btn-primary btn-small" style="margin-top: 10px; width: 100%;" 
                    onclick="event.stopPropagation(); selectUserNCF('${u}')">
              View Recommendations
            </button>
          </div>
        `;
      })
      .join("");

    document.getElementById("usersResults").style.display = "block";
  } else {
    showAlert("usersError", result.error);
  }
}

function selectUserNCF(username) {
  document.getElementById("ncfUserSelect").value = username;
  switchTab("ncf");
  getNCFRecommendations();
}

// ============ INITIALIZATION ============

document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  setInterval(checkHealth, 30000); // Check health every 30 seconds
});
