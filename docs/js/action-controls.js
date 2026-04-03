(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const simulation = window.WP_DEMO_SIMULATION;
  const workflowEngine = window.WP_DEMO_WORKFLOW;
  const evidenceEngine = window.WP_DEMO_EVIDENCE;
  const renderEngine = window.WP_DEMO_RENDER;

  if (!app || !simulation || !workflowEngine || !evidenceEngine) {
    console.error("WattsProtect™ action controls dependencies are unavailable.");
    return;
  }

  const { getPageId, safeText } = app;

  const actionControls = {
    version: "2.0.0",
    mode: "interactive_action_controls",

    selectors: {
      workflowMount: "[data-wp-render='workflow-actions']",
      evidenceMount: "[data-wp-render='evidence-actions']"
    },

    createButton(label, action, variant = "button--ghost") {
      return `
        <button
          type="button"
          class="button ${variant}"
          data-wp-action="${safeText(action)}"
        >
          ${safeText(label)}
        </button>
      `;
    },

    createResultCard(title, body) {
      return `
        <section class="content-card content-card--full">
          <div class="card-kicker">Action Result</div>
          <h3 class="card-title">${safeText(title)}</h3>
          <p class="card-text">${safeText(body)}</p>
        </section>
      `;
    },

    refreshUi() {
      if (renderEngine && typeof renderEngine.refresh === "function") {
        renderEngine.refresh();
      }
    },

    renderWorkflowActions() {
      const mount = document.querySelector(this.selectors.workflowMount);
      if (!mount) return;

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Interactive Workflow Controls</div>
          <h3 class="card-title">Governed action paths</h3>
          <p class="card-text">
            These controls drive the demonstrator through bounded workflow states without enlarging
            the claim boundary.
          </p>
          <div class="hero-actions">
            ${this.createButton("Record Technician Review", "technician_review", "button")}
            ${this.createButton("Escalate to Supervisor", "escalate_supervisor")}
            ${this.createButton("Request Override", "request_override")}
            ${this.createButton("Place Evidence Hold", "evidence_hold")}
            ${this.createButton("Release Closure Gate", "release_closure")}
          </div>
        </section>
        <div data-wp-action-result="workflow"></div>
      `;

      mount.querySelectorAll("[data-wp-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.getAttribute("data-wp-action");
          const resultMount = mount.querySelector("[data-wp-action-result='workflow']");
          let result = null;

          switch (action) {
            case "technician_review":
              result = workflowEngine.technicianReview();
              break;
            case "escalate_supervisor":
              result = workflowEngine.escalateToSupervisor();
              break;
            case "request_override":
              result = workflowEngine.requestOverride();
              break;
            case "evidence_hold":
              result = workflowEngine.placeEvidenceHold();
              break;
            case "release_closure":
              result = workflowEngine.releaseClosureGate();
              break;
            default:
              break;
          }

          if (resultMount && result) {
            resultMount.innerHTML = this.createResultCard(
              "Workflow action applied",
              `Action: ${result.action} • Workflow state updated and runtime summary refreshed.`
            );
          }

          this.refreshUi();
        });
      });
    },

    renderEvidenceActions() {
      const mount = document.querySelector(this.selectors.evidenceMount);
      if (!mount) return;

      mount.innerHTML = `
        <section class="content-card content-card--full">
          <div class="card-kicker">Interactive Evidence Controls</div>
          <h3 class="card-title">Seal and complete the evidence chain</h3>
          <p class="card-text">
            These controls finalize the demonstrator’s preserved event chain in bounded review form.
          </p>
          <div class="hero-actions">
            ${this.createButton("Seal Evidence Chain", "seal_evidence", "button")}
            ${this.createButton("Reset to Review Pending", "reset_review")}
            ${this.createButton("Advance Scenario Phase", "advance_phase")}
          </div>
        </section>
        <div data-wp-action-result="evidence"></div>
      `;

      mount.querySelectorAll("[data-wp-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.getAttribute("data-wp-action");
          const resultMount = mount.querySelector("[data-wp-action-result='evidence']");
          let result = null;

          switch (action) {
            case "seal_evidence":
              result = evidenceEngine.sealEvidenceChain();
              break;
            case "reset_review":
              result = simulation.setPhase("review_pending");
              break;
            case "advance_phase":
              result = simulation.advance();
              break;
            default:
              break;
          }

          if (resultMount) {
            resultMount.innerHTML = this.createResultCard(
              "Evidence action applied",
              "The evidence and runtime state have been updated under bounded demonstrator control."
            );
          }

          this.refreshUi();
        });
      });
    },

    init() {
      const page = getPageId();

      if (page === "workflow") {
        this.renderWorkflowActions();
      }

      if (page === "evidence") {
        this.renderEvidenceActions();
      }
    }
  };

  window.WP_DEMO_ACTIONS = actionControls;

  document.addEventListener("DOMContentLoaded", () => {
    actionControls.init();
  });
})();
