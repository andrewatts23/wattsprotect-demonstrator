(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const state = window.WP_DEMO_STATE;

  if (!app || !state) {
    console.error("WattsProtect™ live environment dependencies are unavailable.");
    return;
  }

  const { formatNumber, formatSignedNumber } = app;

  const ZIP_API_BASE = "https://api.zippopotam.us";
  const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
  const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

  const DEFAULT_COUNTRY = "us";

  const createTimestamp = () => new Date().toISOString();
  const toFahrenheit = (celsius) => (celsius * 9) / 5 + 32;

  const normalizeLocationInput = (value) => String(value || "").trim();

  const isZipLikeInput = (value) => {
    const normalized = normalizeLocationInput(value);
    return /^[A-Za-z0-9][A-Za-z0-9\s-]{2,10}$/.test(normalized) &&
      /[0-9]/.test(normalized) &&
      !normalized.includes(",");
  };

  const buildPressureState = (delta) => {
    if (Math.abs(delta) >= 6) {
      return "elevated";
    }
    return "stable";
  };

  const buildEnvironmentalClassification = (tempDelta, humidityDelta) => {
    const thresholds = state.thresholds.environment;
    const cumulative = Math.abs(tempDelta) + Math.abs(humidityDelta);

    if (
      tempDelta >= thresholds.temperatureDeltaEscalationF ||
      humidityDelta >= thresholds.humidityDeltaEscalation ||
      cumulative >= thresholds.cumulativeConcernEscalation
    ) {
      return "significant_concern";
    }

    if (
      tempDelta >= thresholds.temperatureDeltaReviewF ||
      humidityDelta >= thresholds.humidityDeltaReview ||
      cumulative >= thresholds.cumulativeConcernThresholdProximate
    ) {
      return "elevated_environmental_concern";
    }

    if (tempDelta > 0 || humidityDelta > 0) {
      return "reviewable_environmental_shift";
    }

    return "stable_relative_band";
  };

  const liveEnvironment = {
    version: "1.3.0",
    mode: "zip_or_place_live_environment_ingestion",

    async lookupByPostalCode(postalCode, countryCode = DEFAULT_COUNTRY) {
      const normalizedPostalCode = normalizeLocationInput(postalCode);
      const normalizedCountry = String(countryCode || DEFAULT_COUNTRY).toLowerCase();

      const response = await fetch(
        `${ZIP_API_BASE}/${encodeURIComponent(normalizedCountry)}/${encodeURIComponent(normalizedPostalCode)}`
      );

      if (!response.ok) {
        throw new Error("No ZIP/postal code match found.");
      }

      const data = await response.json();

      if (!data.places || !data.places.length) {
        throw new Error("ZIP/postal code lookup returned no coordinates.");
      }

      const place = data.places[0];

      return {
        label: [
          place["place name"],
          place.state,
          data.country
        ].filter(Boolean).join(", "),
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        timezone: state.liveEnvironment.defaultLocation.timezone
      };
    },

    async geocodePlace(query) {
      const normalizedQuery = normalizeLocationInput(query);

      if (!normalizedQuery) {
        throw new Error("No location input provided.");
      }

      const url =
        `${GEOCODE_URL}?name=${encodeURIComponent(normalizedQuery)}&count=1&language=en&format=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to resolve location.");
      }

      const data = await response.json();

      if (!data.results || !data.results.length) {
        throw new Error("No location match found.");
      }

      const first = data.results[0];

      return {
        label: [first.name, first.admin1, first.country].filter(Boolean).join(", "),
        latitude: first.latitude,
        longitude: first.longitude,
        timezone: first.timezone || state.liveEnvironment.defaultLocation.timezone
      };
    },

    async resolveLocation(inputValue) {
      const normalized = normalizeLocationInput(inputValue);

      if (!normalized) {
        return {
          label: state.liveEnvironment.defaultLocation.label,
          latitude: state.liveEnvironment.defaultLocation.latitude,
          longitude: state.liveEnvironment.defaultLocation.longitude,
          timezone: state.liveEnvironment.defaultLocation.timezone
        };
      }

      if (isZipLikeInput(normalized)) {
        try {
          return await this.lookupByPostalCode(normalized, DEFAULT_COUNTRY);
        } catch (zipError) {
          return await this.geocodePlace(normalized);
        }
      }

      return await this.geocodePlace(normalized);
    },

    async fetchCurrentWeather(latitude, longitude, timezone) {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: "temperature_2m,relative_humidity_2m,surface_pressure",
        temperature_unit: "celsius",
        timezone: timezone || "auto"
      });

      const response = await fetch(`${WEATHER_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Unable to retrieve live weather.");
      }

      const data = await response.json();

      if (!data.current) {
        throw new Error("Weather payload was incomplete.");
      }

      return data;
    },

    applyLiveWeather(payload) {
      const { location, weather } = payload;
      const current = weather.current;

      const temperatureF = Number(toFahrenheit(current.temperature_2m).toFixed(1));
      const humidityRh = Math.round(current.relative_humidity_2m);
      const pressureHpa = Number(current.surface_pressure.toFixed(1));

      const baseline = state.environmentalWindow.baseline;

      const tempDelta = Number((temperatureF - baseline.temperatureF).toFixed(1));
      const humidityDelta = Math.round(humidityRh - baseline.humidityRh);
      const pressureDelta = Number((pressureHpa - baseline.pressureHpa).toFixed(1));

      state.liveEnvironment.status = "ready";
      state.liveEnvironment.lastError = null;
      state.liveEnvironment.lastUpdatedAt = createTimestamp();
      state.liveEnvironment.activeLocation = {
        label: location.label,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone
      };

      state.environmentalWindow.location = location.label;
      state.environmentalWindow.startAt = createTimestamp();
      state.environmentalWindow.endAt = createTimestamp();
      state.environmentalWindow.source.lastFetchAt = createTimestamp();
      state.environmentalWindow.source.fetchStatus = "ready";

      state.environmentalWindow.signals.temperatureF.current = temperatureF;
      state.environmentalWindow.signals.temperatureF.baselineDelta = tempDelta;
      state.environmentalWindow.signals.temperatureF.state = tempDelta > 0 ? "elevated" : "stable";
      state.environmentalWindow.signals.temperatureF.summary =
        `Live outside temperature ${formatNumber(temperatureF)}°F (${formatSignedNumber(tempDelta, 1, "°F")} versus bounded baseline).`;

      state.environmentalWindow.signals.humidityRh.current = humidityRh;
      state.environmentalWindow.signals.humidityRh.baselineDelta = humidityDelta;
      state.environmentalWindow.signals.humidityRh.state = humidityDelta > 0 ? "elevated" : "stable";
      state.environmentalWindow.signals.humidityRh.summary =
        `Live outside humidity ${formatNumber(humidityRh, 0)}% RH (${formatSignedNumber(humidityDelta, 0, "")} versus bounded baseline).`;

      state.environmentalWindow.signals.pressureHpa.current = pressureHpa;
      state.environmentalWindow.signals.pressureHpa.baselineDelta = pressureDelta;
      state.environmentalWindow.signals.pressureHpa.state = buildPressureState(pressureDelta);
      state.environmentalWindow.signals.pressureHpa.summary =
        `Live outside pressure ${formatNumber(pressureHpa)} hPa (${formatSignedNumber(pressureDelta, 1, " hPa")} versus bounded baseline).`;

      state.environmentalWindow.classification = buildEnvironmentalClassification(
        tempDelta,
        humidityDelta
      );

      state.environmentalWindow.interpretation =
        "Live environmental movement is not treated as calibration truth. It is treated as contextual strengthening that increases review significance for the monitored event.";
    },

    async refresh(locationInput) {
      const normalizedInput = normalizeLocationInput(locationInput);

      state.liveEnvironment.status = "loading";
      state.liveEnvironment.lastError = null;
      state.environmentalWindow.source.fetchStatus = "loading";

      try {
        const location = await this.resolveLocation(normalizedInput);
        const weather = await this.fetchCurrentWeather(
          location.latitude,
          location.longitude,
          location.timezone
        );

        this.applyLiveWeather({ location, weather });

        if (
          window.WP_DEMO_SIMULATION &&
          typeof window.WP_DEMO_SIMULATION.syncWithLiveEnvironment === "function"
        ) {
          window.WP_DEMO_SIMULATION.syncWithLiveEnvironment();
        }

        if (
          window.WP_DEMO_RENDER &&
          typeof window.WP_DEMO_RENDER.refresh === "function"
        ) {
          window.WP_DEMO_RENDER.refresh();
        }

        return {
          ok: true,
          updatedAt: state.liveEnvironment.lastUpdatedAt,
          location: state.liveEnvironment.activeLocation.label
        };
      } catch (error) {
        state.liveEnvironment.status = "error";
        state.liveEnvironment.lastError = error.message || "Unknown live weather error.";
        state.environmentalWindow.source.fetchStatus = "error";

        if (
          window.WP_DEMO_RENDER &&
          typeof window.WP_DEMO_RENDER.refresh === "function"
        ) {
          window.WP_DEMO_RENDER.refresh();
        }

        return {
          ok: false,
          error: state.liveEnvironment.lastError
        };
      }
    },

    startAutoRefresh() {
      if (!state.liveEnvironment.enabled) {
        return;
      }

      if (this._intervalId) {
        clearInterval(this._intervalId);
      }

      this._intervalId = setInterval(() => {
        this.refresh(state.liveEnvironment.activeLocation.label);
      }, state.liveEnvironment.refreshIntervalMs);
    },

    stopAutoRefresh() {
      if (this._intervalId) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    }
  };

  window.WP_DEMO_LIVE_ENV = liveEnvironment;

  document.addEventListener("DOMContentLoaded", () => {
    if (state.liveEnvironment.enabled) {
      liveEnvironment.refresh();
      liveEnvironment.startAutoRefresh();
    }
  });
})();
