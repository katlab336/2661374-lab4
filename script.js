const inputEl = document.getElementById("country-input");
const searchBtn = document.getElementById("search-btn");
const spinnerEl = document.getElementById("loading-spinner");
const countryInfoEl = document.getElementById("country-info");
const bordersEl = document.getElementById("bordering-countries");
const errorEl = document.getElementById("error-message");

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function setError(message) {
  errorEl.textContent = message;
  show(errorEl);
}

function clearError() {
  errorEl.textContent = "";
  hide(errorEl);
}

function clearResults() {
  countryInfoEl.innerHTML = "";
  bordersEl.innerHTML = "";
  hide(countryInfoEl);
  hide(bordersEl);
}

function normalizeCountryName(name) {
  return (name || "").trim();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    // REST Countries returns 404 for not found
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

async function searchCountry(countryName) {
  const cleaned = normalizeCountryName(countryName);

  clearError();
  clearResults();

  if (!cleaned) {
    setError("Please enter a country name.");
    return;
  }

  try {
    // Show loading spinner
    show(spinnerEl);

    // Fetch country data (by name)
     const data = await fetchJson(`https://restcountries.com/v3.1/name/${encodeURIComponent(cleaned)}?fullText=true`);

    // Choose the best match (first item)
    const country = data[0];

    // Update country info DOM
    const capital = Array.isArray(country.capital) && country.capital.length > 0 ? country.capital[0] : "N/A";
    const population = typeof country.population === "number" ? country.population.toLocaleString() : "N/A";
    const region = country.region || "N/A";
    const flagUrl = country.flags?.svg || country.flags?.png || "";

    countryInfoEl.innerHTML = `
      <h2>${country.name?.common ?? "Unknown Country"}</h2>
      <p><strong>Capital:</strong> ${capital}</p>
      <p><strong>Population:</strong> ${population}</p>
      <p><strong>Region:</strong> ${region}</p>
      ${flagUrl ? `<img class="country-flag" src="${flagUrl}" alt="${country.name?.common ?? "Country"} flag">` : ""}
    `;
    show(countryInfoEl);

    // Fetch bordering countries (if any)
    const borders = Array.isArray(country.borders) ? country.borders : [];

    if (borders.length === 0) {
      bordersEl.innerHTML = `<p><strong>Bordering countries:</strong> None (this country has no land borders).</p>`;
      show(bordersEl);
      return;
    }

    // Fetch each neighbor by code (alpha)
    // (You can also fetch them in one call by joining codes, but this is simplest + clear)
    const neighborPromises = borders.map(code =>
      fetchJson(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`)
    );

    const neighborResults = await Promise.all(neighborPromises);
    const neighbors = neighborResults.map(arr => arr[0]).filter(Boolean);

    // Update bordering countries section
    bordersEl.innerHTML = `
      <h3>Bordering Countries</h3>
      ${neighbors
        .map(n => {
          const nName = n.name?.common ?? "Unknown";
          const nFlag = n.flags?.png || n.flags?.svg || "";
          return `
            <div class="border-card">
              ${nFlag ? `<img src="${nFlag}" alt="${nName} flag">` : ""}
              <div>${nName}</div>
            </div>
          `;
        })
        .join("")}
    `;
    show(bordersEl);

  } catch (error) {
    // User-friendly messages
    if (String(error.message).includes("404")) {
      setError("Country not found. Try a different name (e.g., 'South Africa', 'Germany').");
    } else {
      setError("Something went wrong while fetching data. Please check your connection and try again.");
    }
    console.error(error);
  } finally {
    // Hide loading spinner
    hide(spinnerEl);
  }
}

// Search trigger: Click button
searchBtn.addEventListener("click", () => {
  searchCountry(inputEl.value);
});

// Search trigger: Press Enter
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchCountry(inputEl.value);
  }
});
