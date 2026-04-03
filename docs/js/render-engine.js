(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const simulation = window.WP_DEMO_SIMULATION;
  const workflowEngine = window.WP_DEMO_WORKFLOW;
  const evidenceEngine = window.WP_DEMO_EVIDENCE;
  const exportEngine = window.WP_DEMO_EXPORT;
  const liveEnvironment = window.WP_DEMO_LIVE_ENV;
  const state = window.WP_DEMO_STATE;

  if (
    !app ||
    !simulation ||
    !workflowEngine ||
    !evidenceEngine ||
    !exportEngine ||
    !liveEnvironment ||
    !state
  ) {
    console.error("WattsProtect™ render engine dependencies are unavailable.");
    return;
  }

  const {
    getPageId,
    formatLabel,
    formatNumber,
    formatSignedNumber,
    formatDateTime,
    safeText
  } = app;

  const renderEngine = {
    version: "2.0.0",
    mode: "page_binding_and_rendering",

    selectors: {
      pageMount: "[data-wp-render='page-mount']",
      simulationControls: "[data-wp-render='simulation-controls']",
      exportControls: "[data-wp-render='export-controls']",
      runtimeSummary: "[data-wp-render='runtime-summary']",
      footerRuntime: "[data-wp-render='footer-runtime']"
    },

    createMetricCard(label, value, subvalue) {
      return `
        <article class="metric-card metric-card--strong">
          <div class="metric-label">${safeText(label)}</div>
          <div class="metric-value">${safeText(value)}</div>
          <div class="metric-subvalue">${safeText(subvalue)}</div>
        </article>
      `;
    },

    createTimelineStep(index, title, text) {
      return `
        <div class="timeline-step">
          <div class="timeline-index">${safeText(index)}</div>
          <div class="timeline-body">
            <div class="timeline-title">${safeText(title)}</div>
            <div class="timeline-text">${safeText(text)}</div>
          </div>
        </div>
      `;
    },

    createFeatureCard(index, title, text, listItems = [], link = null) {
      const listHtml = listItems.length
        ? `
          <ul class="check-list">
            ${listItems.map((item) => `<li>${safeText(item)}</li>`).join("")}
          </ul>
        `
        : "";

      const linkHtml = link
        ? `<a class="text-link" href="${safeText(link.href)}">${safeText(link.label)}</a>`
        : "";

      return `
        <article class="feature-card">
          <div class="feature-index">${safeText(index)}</div>
          <div class="feature-title">${safeText(title)}</div>
          <p class="feature-text">${safeText(text)}</p>
          ${listHtml}
          ${linkHtml}
        </article>
      `;
    },

    createBoundaryList(items) {
      return `
        <ul class="boundary-list">
          ${items.map((item) => `<li>${safeText(item)}</li>`).join("")}
        </ul>
      `;
    },

    createCheckList(items) {
      return `
        <ul class="check-list">
          ${items.map((item) => `<li>${safeText(item)}</li>`).join("")}
        </ul>
      `;
    },

    getRuntimeSummary() {
      const summary = simulation.summarizeCurrentState();
      const workflow = workflowEngine.buildWorkflowStatus();
      const evidence = evidenceEngine.buildEvidenceChain();

      return {
        generatedAt: summary.generatedAt,
        phaseLabel: summary.phaseLabel,
        phaseDescription: summary.phaseDescription,
        instrumentId: summary.instrument ? summary.instrument.instrumentId : "Unavailable",
        workflowId: workflow ? workflow.workflowId : "Unavailable",
        closureBlocked: workflow ? workflow.closureBlocked : true,
        chainStatus:
          evidence && evidence.chainStatus
            ? formatLabel(evidence.chainStatus)
            : "Unavailable",
        liveLocation: summary.liveEnvironment
          ? summary.liveEnvironment.location
          : "Unavailable",
        liveStatus: summary.liveEnvironment
          ? summary.liveEnvironment.status
          : "Unavailable",
        liveUpdatedAt: summary.liveEnvironment
          ? summary.liveEnvironment.updatedAt
          : null,
        liveTemperature: summary.liveEnvironment
          ? summary.liveEnvironment.temperatureCurrent
          : "Unavailable",
        liveHumidity: summary.liveEnvironment
          ? summary.liveEnvironment.humidityCurrent
          : "Unavailable",
        livePressure: summary.liveEnvironment
          ? summary.liveEnvironment.pressureCurrent
          : "Unavailable"
      };
    },

    renderRuntimeSummary() {
      const mount = document.querySelector(this.selectors.runtimeSummary);
      if (!mount) return;

      const summary = this.getRuntimeSummary();

      mount.innerHTML = `
        <section class="grid grid--three">
          ${this.createMetricCard(
            "Active Phase",
            summary.phaseLabel,
            summary.phaseDescription
          )}
          ${this.createMetricCard(
            "Live Context",
            summary.liveTemperature,
            `${summary.liveHumidity} • ${summary.livePressure}`
          )}
          ${this.createMetricCard(
            "Evidence Chain",
            summary.chainStatus,
            summary.closureBlocked
              ? "Closure blocked pending evidence completion"
              : "Closure gate released"
          )}
        </section>
      `;
    },

    renderSimulationControls() {
      const mount = document.querySelector(this.selectors.simulationControls);
      if (!mount) return;

      const currentLocation = state.liveEnvironment.activeLocation.label;
      const lastUpdated = state.liveEnvironment.lastUpdatedAt
        ? formatDateTime(state.liveEnvironment.lastUpdatedAt)
        : "Unavailable";

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Live Environment Control</div>
          <h3 class="card-title">Refresh live contextual input</h3>
          <p class="card-text">
            This demonstrator ingests live outside temperature, humidity, and pressure as bounded contextual input.
          </p>

          <div class="hero-actions">
            <input
              type="text"
              class="wp-text-input"
              data-wp-live-location-input="true"
              value="${safeText(currentLocation)}"
              placeholder="Enter city, state"
            />
            <button type="button" class="button" data-wp-live-refresh="true">
              Refresh Live Weather
            </button>
          </div>

          <div class="hero-actions">
            <button type="button" class="button button--ghost" data-wp-phase="baseline">Baseline</button>
            <button type="button" class="button button--ghost" data-wp-phase="environmental_shift">Environmental Shift</button>
            <button type="button" class="button button--ghost" data-wp-phase="review_pending">Review Pending</button>
            <button type="button" class="button button--ghost" data-wp-phase="escalated_review">Escalated Review</button>
            <button type="button" class="button button--ghost" data-wp-phase="evidence_hold">Evidence Hold</button>
            <button type="button" class="button button--ghost" data-wp-phase="export_ready">Export Ready</button>
          </div>

          <p class="card-text">
            Live status: <strong>${safeText(formatLabel(state.liveEnvironment.status))}</strong><br />
            Last updated: <strong>${safeText(lastUpdated)}</strong>
          </p>
        </section>
      `;

      const input = mount.querySelector("[data-wp-live-location-input='true']");
      const refreshButton = mount.querySelector("[data-wp-live-refresh='true']");

      if (refreshButton && input) {
        refreshButton.addEventListener("click", async () => {
          refreshButton.disabled = true;
          refreshButton.textContent = "Refreshing...";
          await liveEnvironment.refresh(input.value.trim());
          refreshButton.disabled = false;
          refreshButton.textContent = "Refresh Live Weather";
          this.refresh();
        });
      }

      mount.querySelectorAll("[data-wp-phase]").forEach((button) => {
        button.addEventListener("click", () => {
          const phase = button.getAttribute("data-wp-phase");
          simulation.setPhase(phase);
          this.refresh();
        });
      });
    },

    renderExportControls() {
      const mount = document.querySelector(this.selectors.exportControls);
      if (!mount) return;

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Bounded Export Control</div>
          <h3 class="card-title">Review-only package generation</h3>
          <p class="card-text">
            Export packages remain bounded review artifacts and do not imply implementation authorization,
            production maturity, or validated operational truth.
          </p>
          <div class="hero-actions">
            <button type="button" class="button" data-wp-export="audit_review_package">
              Download Audit Review Package
            </button>
            <button type="button" class="button button--ghost" data-wp-export="management_review_summary">
              Download Management Summary
            </button>
            <button type="button" class="button button--ghost" data-wp-export="validation_support_package">
              Download Validation Support Package
            </button>
            <button type="button" class="button button--ghost" data-wp-export="single_event_review_package">
              Download Single Event Package
            </button>
          </div>
          <pre class="wp-json-preview" data-wp-export-preview="true"></pre>
        </section>
      `;

      const preview = mount.querySelector("[data-wp-export-preview='true']");

      const setPreview = (packageClass) => {
        if (!preview) return;
        preview.textContent = exportEngine.serializePretty(packageClass);
      };

      setPreview("audit_review_package");

      mount.querySelectorAll("[data-wp-export]").forEach((button) => {
        button.addEventListener("click", () => {
          const packageClass = button.getAttribute("data-wp-export");
          const filename = `wattsprotect_${packageClass}.json`;
          setPreview(packageClass);
          exportEngine.downloadJson(filename, packageClass);
        });
      });
    },

    renderFooterRuntime() {
      const mount = document.querySelector(this.selectors.footerRuntime);
      if (!mount) return;

      const summary = this.getRuntimeSummary();

      mount.innerHTML = `
        Runtime Phase: ${safeText(summary.phaseLabel)} •
        Live Context: ${safeText(summary.liveTemperature)} • ${safeText(summary.liveHumidity)} •
        Location: ${safeText(summary.liveLocation)} •
        Updated: ${safeText(summary.liveUpdatedAt ? formatDateTime(summary.liveUpdatedAt) : "Unavailable")}
      `;
    },

    renderHomeEnhancements() {
      const mount = document.querySelector(this.selectors.pageMount);
      if (!mount) return;

      mount.innerHTML = `
        <section class="grid grid--two">
          <article class="content-card">
            <div class="card-kicker">Live Context Snapshot</div>
            <h3 class="card-title">Current bounded environmental input</h3>
            ${this.createCheckList([
              `Location: ${state.liveEnvironment.activeLocation.label}`,
              `Temperature: ${formatNumber(state.environmentalWindow.signals.temperatureF.current)}°F (${formatSignedNumber(state.environmentalWindow.signals.temperatureF.baselineDelta, 1, "°F")} vs bounded baseline)`,
              `Humidity: ${formatNumber(state.environmentalWindow.signals.humidityRh.current, 0)}% RH (${formatSignedNumber(state.environmentalWindow.signals.humidityRh.baselineDelta, 0, "")} vs bounded baseline)`,
              `Pressure: ${formatNumber(state.environmentalWindow.signals.pressureHpa.current)} hPa (${formatSignedNumber(state.environmentalWindow.signals.pressureHpa.baselineDelta, 1, " hPa")} vs bounded baseline)`,
              `Classification: ${formatLabel(state.environmentalWindow.classification)}`
            ])}
          </article>

          <article class="content-card">
            <div class="card-kicker">Live Context Boundary</div>
            <h3 class="card-title">What this live layer means</h3>
            ${this.createBoundaryList([
              "Outside weather is ingested as bounded contextual input.",
              "Live environmental input is not represented as calibration truth.",
              "Instrument logic remains bounded demonstrator logic.",
              "Governed workflow and evidence obligations remain unchanged."
            ])}
          </article>
        </section>
      `;
    },

    renderDashboardEnhancements() {
      const mount = document.querySelector(this.selectors.pageMount);
      if (!mount) return;

      const workflow = workflowEngine.serialize();
      const evidence = evidenceEngine.serialize();

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Live Environmental Window</div>
          <h3 class="card-title">Current live contextual interpretation</h3>
          <div class="timeline-grid">
            ${this.createTimelineStep(
              "T",
              "Temperature",
              `${formatNumber(state.environmentalWindow.signals.temperatureF.current)}°F (${formatSignedNumber(state.environmentalWindow.signals.temperatureF.baselineDelta, 1, "°F")} vs baseline)`
            )}
            ${this.createTimelineStep(
              "H",
              "Humidity",
              `${formatNumber(state.environmentalWindow.signals.humidityRh.current, 0)}% RH (${formatSignedNumber(state.environmentalWindow.signals.humidityRh.baselineDelta, 0, "")} vs baseline)`
            )}
            ${this.createTimelineStep(
              "P",
              "Pressure",
              `${formatNumber(state.environmentalWindow.signals.pressureHpa.current)} hPa (${formatSignedNumber(state.environmentalWindow.signals.pressureHpa.baselineDelta, 1, " hPa")} vs baseline)`
            )}
            ${this.createTimelineStep(
              "C",
              "Classification",
              `${formatLabel(state.environmentalWindow.classification)} • ${state.environmentalWindow.location}`
            )}
          </div>
        </section>

        <section class="content-card content-card--full">
          <div class="card-kicker">Governed Workflow Timeline</div>
          <h3 class="card-title">Runtime workflow progression</h3>
          <div class="timeline-grid">
            ${workflow.timeline
              .map((item, index) =>
                this.createTimelineStep(
                  String(index + 1).padStart(2, "0"),
                  `${item.label} • ${item.stateLabel}`,
                  item.detail
                )
              )
              .join("")}
          </div>
        </section>

        <section class="content-card content-card--full">
          <div class="card-kicker">Evidence Completeness</div>
          <h3 class="card-title">Current chain preservation state</h3>
          <div class="timeline-grid">
            ${evidence.timeline
              .map((item, index) =>
                this.createTimelineStep(
                  `E${index + 1}`,
                  `${item.label} • ${item.stateLabel}`,
                  item.detail
                )
              )
              .join("")}
          </div>
        </section>
      `;
    },

    renderInstrumentEnhancements() {
      const mount = document.querySelector(this.selectors.pageMount);
      if (!mount) return;

      const instrument = state.instruments.find(
        (item) => item.instrumentId === "WP-TMP-104"
      );

      if (!instrument) return;

      mount.innerHTML = `
        <section class="grid grid--two">
          <article class="content-card">
            <div class="card-kicker">Live Risk Runtime</div>
            <h3 class="card-title">Current bounded risk scoring</h3>
            ${this.createCheckList([
              `Risk Score: ${formatNumber(instrument.driftModel.currentRiskScore)}`,
              `Risk Class: ${formatLabel(instrument.driftModel.currentRiskClass)}`,
              `Temperature Weight: ${formatNumber(instrument.driftModel.environmentalWeighting.temperature, 2)}`,
              `Humidity Weight: ${formatNumber(instrument.driftModel.environmentalWeighting.humidity, 2)}`,
              `Pressure Weight: ${formatNumber(instrument.driftModel.environmentalWeighting.pressure, 2)}`
            ])}
          </article>

          <article class="content-card">
            <div class="card-kicker">Live Context Binding</div>
            <h3 class="card-title">Current instrument chain meaning</h3>
            ${this.createBoundaryList([
              `Observed State: ${formatLabel(instrument.observedState)}`,
              `Predicted State: ${formatLabel(instrument.predictedState)}`,
              `Threshold Proximity: ${formatLabel(instrument.thresholdProximityClass)}`,
              `Confidence Class: ${formatLabel(instrument.confidenceClass)}`,
              `Workflow State: ${formatLabel(instrument.workflowState)}`,
              `Evidence State: ${formatLabel(instrument.evidenceState)}`
            ])}
          </article>
        </section>
      `;
    },

    renderWorkflowEnhancements() {
      const mount = document.querySelector(this.selectors.pageMount);
      if (!mount) return;

      const workflow = workflowEngine.serialize();

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Workflow Checkpoints Runtime</div>
          <h3 class="card-title">Required governed completion controls</h3>
          <div class="timeline-grid">
            ${workflow.checkpoints
              .map((item, index) =>
                this.createTimelineStep(
                  `C${index + 1}`,
                  `${item.label} • ${item.statusLabel}`,
                  item.description
                )
              )
              .join("")}
          </div>
        </section>

        <section class="content-card content-card--full">
          <div class="card-kicker">Available Actions Runtime</div>
          <h3 class="card-title">Role-bound workflow actions</h3>
          <div class="feature-grid">
            ${workflow.actions
              .map((item, index) =>
                this.createFeatureCard(
                  `A${index + 1}`,
                  item.label,
                  item.description,
                  [
                    `Allowed: ${item.allowed ? "Yes" : "No"}`,
                    `Action ID: ${item.actionId}`
                  ]
                )
              )
              .join("")}
          </div>
        </section>
      `;
    },

    renderEvidenceEnhancements() {
      const mount = document.querySelector(this.selectors.pageMount);
      if (!mount) return;

      const evidence = evidenceEngine.serialize();
      const narrative = evidence.narrative || null;
      const chain = evidence.chain || null;

      if (!chain) return;

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Structured Evidence Chain Runtime</div>
          <h3 class="card-title">Condition, decision, actor, action, result</h3>
          <div class="feature-grid">
            ${this.createFeatureCard("C", "Condition", chain.condition.conditionText, [
              `Instrument: ${chain.instrumentId}`,
              `Predicted State: ${chain.condition.instrumentPredictedState}`,
              `Threshold Class: ${chain.condition.thresholdClass}`
            ])}
            ${this.createFeatureCard("D", "Decision", chain.decision.decisionText, [
              `Workflow: ${chain.workflowId}`,
              `Workflow State: ${chain.decision.workflowState}`,
              `Closure Blocked: ${chain.decision.closureBlocked ? "Yes" : "No"}`
            ])}
            ${this.createFeatureCard("A", "Actor", chain.actor.actorText, [
              `Assigned Role: ${chain.actor.assignedRole}`,
              `Attributable: ${chain.actor.attributable ? "Yes" : "No"}`
            ])}
            ${this.createFeatureCard("R", "Action / Result", chain.action.actionText, [
              `Result: ${chain.result.resultText}`,
              `Chain Status: ${formatLabel(chain.chainStatus)}`,
              `Export Class: ${formatLabel(chain.exportClass)}`
            ])}
          </div>
        </section>

        ${
          narrative
            ? `
          <section class="content-card content-card--full">
            <div class="card-kicker">Audit Narrative Runtime</div>
            <h3 class="card-title">${safeText(narrative.title)}</h3>
            <p class="card-text">${safeText(narrative.narrative)}</p>
            ${this.createBoundaryList([
              `Environmental Summary: ${narrative.environmentalSummary}`,
              `Workflow Summary: ${narrative.workflowSummary}`,
              `Evidence Summary: ${narrative.evidenceSummary}`
            ])}
          </section>
        `
            : ""
        }
      `;
    },

    renderPageSpecificEnhancements() {
      switch (getPageId()) {
        case "home":
          this.renderHomeEnhancements();
          break;
        case "dashboard":
          this.renderDashboardEnhancements();
          break;
        case "instrument":
          this.renderInstrumentEnhancements();
          break;
        case "workflow":
          this.renderWorkflowEnhancements();
          break;
        case "evidence":
          this.renderEvidenceEnhancements();
          break;
        default:
          break;
      }
    },

    refresh() {
      this.renderRuntimeSummary();
      this.renderSimulationControls();
      this.renderExportControls();
      this.renderPageSpecificEnhancements();
      this.renderFooterRuntime();
    },

    init() {
      this.refresh();
    }
  };

  window.WP_DEMO_RENDER = renderEngine;

  document.addEventListener("DOMContentLoaded", () => {
    renderEngine.init();
  });
})();
