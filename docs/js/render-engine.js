(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const simulation = window.WP_DEMO_SIMULATION;
  const workflowEngine = window.WP_DEMO_WORKFLOW;
  const evidenceEngine = window.WP_DEMO_EVIDENCE;
  const exportEngine = window.WP_DEMO_EXPORT;

  if (!app || !simulation || !workflowEngine || !evidenceEngine || !exportEngine) {
    console.error("WattsProtect™ render engine dependencies are unavailable.");
    return;
  }

  const {
    state,
    getPageId,
    formatLabel,
    formatNumber,
    formatDateTime,
    safeText
  } = app;

  const renderEngine = {
    version: "1.0.0",
    mode: "page_binding_and_rendering",

    selectors: {
      pageMount: "[data-wp-render='page-mount']",
      simulationControls: "[data-wp-render='simulation-controls']",
      exportControls: "[data-wp-render='export-controls']",
      runtimeSummary: "[data-wp-render='runtime-summary']",
      pageFooterRuntime: "[data-wp-render='footer-runtime']"
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
            : "Unavailable"
      };
    },

    renderSimulationControls() {
      const mount = document.querySelector(this.selectors.simulationControls);
      if (!mount) return;

      const phase = simulation.describePhase(state.activeScenario.phase);
      const phases = [
        "baseline",
        "environmental_shift",
        "review_pending",
        "escalated_review",
        "evidence_hold",
        "export_ready"
      ];

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Simulation Control</div>
          <h3 class="card-title">Governed demonstrator phase control</h3>
          <p class="card-text">
            Current phase: <strong>${safeText(phase.label)}</strong>. ${safeText(phase.description)}
          </p>
          <div class="hero-actions">
            ${phases
              .map(
                (phaseKey) => `
                <button
                  type="button"
                  class="button ${phaseKey === state.activeScenario.phase ? "" : "button--ghost"}"
                  data-wp-phase="${safeText(phaseKey)}"
                >
                  ${safeText(simulation.describePhase(phaseKey).label)}
                </button>
              `
              )
              .join("")}
            <button type="button" class="button button--ghost" data-wp-phase-advance="true">
              Advance Phase
            </button>
            <button type="button" class="button button--ghost" data-wp-phase-reset="true">
              Reset State
            </button>
          </div>
        </section>
      `;

      mount.querySelectorAll("[data-wp-phase]").forEach((button) => {
        button.addEventListener("click", () => {
          const phaseKey = button.getAttribute("data-wp-phase");
          simulation.setPhase(phaseKey);
          this.refresh();
        });
      });

      const advanceButton = mount.querySelector("[data-wp-phase-advance='true']");
      if (advanceButton) {
        advanceButton.addEventListener("click", () => {
          simulation.advance();
          this.refresh();
        });
      }

      const resetButton = mount.querySelector("[data-wp-phase-reset='true']");
      if (resetButton) {
        resetButton.addEventListener("click", () => {
          simulation.resetState();
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
            "Workflow",
            summary.workflowId,
            summary.closureBlocked ? "Closure blocked pending evidence completion" : "Closure gate released"
          )}
          ${this.createMetricCard(
            "Evidence Chain",
            summary.chainStatus,
            "Runtime generated at " + formatDateTime(summary.generatedAt)
          )}
        </section>
      `;
    },

    renderFooterRuntime() {
      const mount = document.querySelector(this.selectors.pageFooterRuntime);
      if (!mount) return;

      const summary = this.getRuntimeSummary();

      mount.innerHTML = `
        Runtime Phase: ${safeText(summary.phaseLabel)} •
        Instrument: ${safeText(summary.instrumentId)} •
        Workflow: ${safeText(summary.workflowId)} •
        Evidence: ${safeText(summary.chainStatus)}
      `;
    },

    renderHomeEnhancements() {
      const mount = document.querySelector(this.selectors.pageMount);
      if (!mount) return;

      const environment = state.environmentalWindow;
      const activeInstrument =
        state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;

      mount.innerHTML = `
        <section class="grid grid--two">
          <article class="content-card">
            <div class="card-kicker">Runtime Scenario Snapshot</div>
            <h3 class="card-title">Current governed context</h3>
            ${this.createCheckList([
              `Temperature: ${formatNumber(environment.signals.temperatureF.current)}°F current • +${formatNumber(environment.signals.temperatureF.baselineDelta)}°F baseline delta`,
              `Humidity: ${formatNumber(environment.signals.humidityRh.current, 0)}% RH current • +${formatNumber(environment.signals.humidityRh.baselineDelta, 0)} baseline delta`,
              `Context Classification: ${formatLabel(environment.classification)}`,
              `Scenario Phase: ${formatLabel(state.activeScenario.phase)}`
            ])}
          </article>

          <article class="content-card">
            <div class="card-kicker">Current Focal Instrument</div>
            <h3 class="card-title">Primary instrument review posture</h3>
            ${activeInstrument ? this.createBoundaryList([
              `Instrument: ${activeInstrument.instrumentId}`,
              `Predicted State: ${formatLabel(activeInstrument.predictedState)}`,
              `Threshold Class: ${formatLabel(activeInstrument.thresholdProximityClass)}`,
              `Workflow State: ${formatLabel(activeInstrument.workflowState)}`,
              `Evidence State: ${formatLabel(activeInstrument.evidenceState)}`
            ]) : ""}
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
          <div class="card-kicker">Governed Workflow Timeline</div>
          <h3 class="card-title">Runtime workflow progression</h3>
          <div class="timeline-grid">
            ${workflow.timeline
              .map((item, index) =>
                this.createTimelineStep(
                  String(index + 1).padStart(2, "0"),
                  item.label + " • " + item.stateLabel,
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
                  item.label + " • " + item.stateLabel,
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

      const instrument =
        state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;
      const pattern = state.historicalPattern;

      if (!instrument) return;

      mount.innerHTML = `
        <section class="grid grid--two">
          <article class="content-card">
            <div class="card-kicker">Historical Pattern Runtime</div>
            <h3 class="card-title">Drift and contextual interpretation</h3>
            ${this.createCheckList([
              `Last Calibration: ${formatDateTime(instrument.lastCalibrationAt)}`,
              `Last Administrative Outcome: ${formatLabel(pattern.lastCalibrationOutcome)}`,
              `Drift Pattern Class: ${formatLabel(pattern.driftPatternClass)}`,
              `Contextual Strengthening: ${pattern.contextualStrengthening ? "True" : "False"}`
            ])}
          </article>

          <article class="content-card">
            <div class="card-kicker">Instrument Summary Runtime</div>
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
                  item.label + " • " + item.statusLabel,
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
