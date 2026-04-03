(function () {
  "use strict";

  const state = window.WP_DEMO_STATE;

  if (!state) {
    console.error("WattsProtect™ Demonstrator state is unavailable.");
    return;
  }

  const STATUS_LABELS = {
    active: "Active",
    stable: "Stable",
    threshold_proximate: "Threshold-Proximate",
    review_worthy: "Review-Worthy",
    reviewable: "Reviewable",
    none_open: "None Open",
    not_required: "Not Required",
    elevated: "Elevated",
    elevated_contextual: "Elevated / Contextual",
    contextual: "Contextual",
    high: "High",
    supporting_signal_only: "Supporting Signal Only",
    incomplete: "Incomplete",
    available_for_linkage: "Available for Linkage",
    preserved_reviewable: "Preserved / Reviewable",
    review_pending: "Review Pending",
    control_hold: "Control Hold",
    escalation_available: "Escalation Available",
    acceptable_administrative_outcome: "Acceptable Administrative Outcome",
    minor_directional_drift: "Minor Directional Drift",
    elevated_environmental_concern: "Elevated Environmental Concern",
    reviewable_environmental_shift: "Reviewable Environmental Shift",
    significant_concern: "Significant Concern",
    stable_relative_band: "Stable Relative Band",
    audit_review_package: "Audit Review Package",
    escalated_review: "Escalated Review",
    evidence_hold: "Evidence Hold",
    export_ready: "Export Ready",
    complete: "Complete",
    blocked: "Blocked",
    released: "Released",
    resolved: "Resolved",
    open: "Open",
    available: "Available",
    governed_workflow_action: "Governed Workflow Action",
    idle: "Idle",
    loading: "Loading",
    ready: "Ready",
    error: "Error",
    live_api_ingestion: "Live API Ingestion",
    live_context_with_bounded_instrument_logic:
      "Live Context with Bounded Instrument Logic"
  };

  const PAGE_IDS = new Set([
    "home",
    "dashboard",
    "instrument",
    "workflow",
    "evidence"
  ]);

  const getPageId = () => {
    const pageId = document.body.getAttribute("data-page");
    return PAGE_IDS.has(pageId) ? pageId : "unknown";
  };

  const formatLabel = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Unavailable";
    }

    if (typeof value !== "string") {
      return String(value);
    }

    if (STATUS_LABELS[value]) {
      return STATUS_LABELS[value];
    }

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatNumber = (value, decimals = 1) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "Unavailable";
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(decimals);
  };

  const formatSignedNumber = (value, decimals = 1, suffix = "") => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "Unavailable";
    }

    const normalized = Number.isInteger(value) ? String(value) : value.toFixed(decimals);
    const sign = value > 0 ? "+" : "";
    return `${sign}${normalized}${suffix}`;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "Unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const findInstrument = (instrumentId) =>
    state.instruments.find((item) => item.instrumentId === instrumentId) || null;

  const findWorkflow = (workflowId) =>
    state.workflows.find((item) => item.workflowId === workflowId) || null;

  const findAlert = (alertId) =>
    state.alerts.find((item) => item.alertId === alertId) || null;

  const findUserByRole = (role) =>
    state.users.find((item) => item.role === role) || null;

  const getActiveInstrument = () => findInstrument("WP-TMP-104");
  const getActiveWorkflow = () => findWorkflow("WF-104-REV-01");
  const getActiveAlert = () => findAlert("ALT-WP-104-REV-01");
  const getActiveActor = () => {
    const workflow = getActiveWorkflow();
    return workflow ? findUserByRole(workflow.assignedRole) : null;
  };

  const safeText = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (!node) return;
    node.textContent = value;
  };

  const setHtml = (selector, html) => {
    const node = document.querySelector(selector);
    if (!node) return;
    node.innerHTML = html;
  };

  const renderList = (items, type = "ul") => {
    const listTag = type === "ol" ? "ol" : "ul";
    const listItems = items.map((item) => `<li>${safeText(item)}</li>`).join("");
    return `<${listTag}>${listItems}</${listTag}>`;
  };

  const serializeScenarioSnapshot = () => ({
    repository: state.repository,
    liveEnvironment: state.liveEnvironment,
    activeScenario: state.activeScenario,
    metrics: state.metrics,
    activeInstrument: getActiveInstrument(),
    activeWorkflow: getActiveWorkflow(),
    activeAlert: getActiveAlert(),
    activeActor: getActiveActor(),
    environmentalWindow: state.environmentalWindow,
    historicalPattern: state.historicalPattern,
    evidence: state.evidence
  });

  const attachRepositoryMetadata = () => {
    document.documentElement.setAttribute("data-wp-demo", "ready");
    document.documentElement.setAttribute(
      "data-wp-system",
      state.repository.systemName
    );
    document.documentElement.setAttribute(
      "data-wp-posture",
      state.repository.posture
    );
    document.documentElement.setAttribute(
      "data-wp-page",
      getPageId()
    );
  };

  const exposeApi = () => {
    window.WP_DEMO_APP = {
      state,
      getPageId,
      formatLabel,
      formatNumber,
      formatSignedNumber,
      formatDateTime,
      safeText,
      setText,
      setHtml,
      renderList,
      findInstrument,
      findWorkflow,
      findAlert,
      findUserByRole,
      getActiveInstrument,
      getActiveWorkflow,
      getActiveAlert,
      getActiveActor,
      serializeScenarioSnapshot
    };
  };

  attachRepositoryMetadata();
  exposeApi();
})();
