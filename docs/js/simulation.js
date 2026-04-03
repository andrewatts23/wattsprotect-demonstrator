(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const state = window.WP_DEMO_STATE;

  if (!app || !state) {
    console.error("WattsProtect™ simulation dependencies are unavailable.");
    return;
  }

  const { formatLabel, formatNumber } = app;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const createTimestamp = () => new Date().toISOString();

  const scenarioEngine = {
    version: "2.0.0",
    mode: "live_context_aware_simulation",

    baseSnapshot: {
      activeScenario: clone(state.activeScenario),
      metrics: clone(state.metrics),
      instruments: clone(state.instruments),
      environmentalWindow: clone(state.environmentalWindow),
      historicalPattern: clone(state.historicalPattern),
      alerts: clone(state.alerts),
      workflows: clone(state.workflows),
      evidence: clone(state.evidence)
    },

    getActiveInstrument() {
      return state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;
    },

    getSupportingHumidityInstrument() {
      return state.instruments.find((item) => item.instrumentId === "WP-HUM-318") || null;
    },

    getPrimaryWorkflow() {
      return state.workflows.find((item) => item.workflowId === "WF-104-REV-01") || null;
    },

    getEvidenceObject() {
      return state.evidence || null;
    },

    getAlertById(alertId) {
      return state.alerts.find((item) => item.alertId === alertId) || null;
    },

    resetState() {
      state.activeScenario = clone(this.baseSnapshot.activeScenario);
      state.metrics = clone(this.baseSnapshot.metrics);
      state.instruments = clone(this.baseSnapshot.instruments);
      state.environmentalWindow = clone(this.baseSnapshot.environmentalWindow);
      state.historicalPattern = clone(this.baseSnapshot.historicalPattern);
      state.alerts = clone(this.baseSnapshot.alerts);
      state.workflows = clone(this.baseSnapshot.workflows);
      state.evidence = clone(this.baseSnapshot.evidence);

      this.annotateRuntimeState();

      return this.snapshot();
    },

    calculateRiskScore(instrument) {
      const env = state.environmentalWindow.signals;
      const temperatureDelta = Math.max(0, env.temperatureF.baselineDelta);
      const humidityDelta = Math.max(0, env.humidityRh.baselineDelta);
      const pressureDelta = Math.abs(env.pressureHpa.baselineDelta);

      const weighting = instrument.driftModel.environmentalWeighting;

      const weightedTemperature = temperatureDelta * weighting.temperature;
      const weightedHumidity = humidityDelta * weighting.humidity;
      const weightedPressure = pressureDelta * weighting.pressure;

      const rawScore =
        instrument.driftModel.baselineScore +
        weightedTemperature +
        weightedHumidity +
        weightedPressure;

      return Number(rawScore.toFixed(1));
    },

    classifyInstrumentRisk(score) {
      const thresholds = state.thresholds.environment;

      if (score >= thresholds.cumulativeConcernEscalation) {
        return {
          phase: "escalated_review",
          predictedState: "threshold_proximate",
          thresholdClass: "review_worthy",
          confidenceClass: "high"
        };
      }

      if (score >= thresholds.cumulativeConcernThresholdProximate) {
        return {
          phase: "review_pending",
          predictedState: "threshold_proximate",
          thresholdClass: "review_worthy",
          confidenceClass: "reviewable"
        };
      }

      if (score > 6) {
        return {
          phase: "environmental_shift",
          predictedState: "stable",
          thresholdClass: "reviewable",
          confidenceClass: "reviewable"
        };
      }

      return {
        phase: "baseline",
        predictedState: "stable",
        thresholdClass: "normal",
        confidenceClass: "normal"
      };
    },

    syncWithLiveEnvironment() {
      const activeInstrument = this.getActiveInstrument();
      const humidityInstrument = this.getSupportingHumidityInstrument();
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getEvidenceObject();
      const reviewAlert = this.getAlertById("ALT-WP-104-REV-01");
      const evidenceHoldAlert = this.getAlertById("ALT-WP-104-EVD-01");
      const escalationAlert = this.getAlertById("ALT-WP-104-ESC-01");

      if (!activeInstrument || !workflow || !evidence) {
        return this.snapshot();
      }

      const activeScore = this.calculateRiskScore(activeInstrument);
      const activeRisk = this.classifyInstrumentRisk(activeScore);

      activeInstrument.driftModel.currentRiskScore = activeScore;
      activeInstrument.driftModel.currentRiskClass = activeRisk.thresholdClass;
      activeInstrument.predictedState = activeRisk.predictedState;
      activeInstrument.thresholdProximityClass = activeRisk.thresholdClass;
      activeInstrument.confidenceClass = activeRisk.confidenceClass;
      activeInstrument.workflowState =
        workflow.state === "export_ready"
          ? "review_pending"
          : workflow.state === "evidence_hold"
            ? "review_pending"
            : activeRisk.phase === "baseline"
              ? "none_open"
              : "review_pending";
      activeInstrument.evidenceState = workflow.closureBlocked
        ? "incomplete"
        : "available_for_linkage";

      activeInstrument.summary =
        "Primary monitored instrument in the active scenario. Live contextual movement is re-scored continuously in bounded form to determine review significance.";

      if (humidityInstrument) {
        humidityInstrument.observedState =
          state.environmentalWindow.signals.humidityRh.baselineDelta > 0
            ? "elevated"
            : "stable";
        humidityInstrument.predictedState =
          state.environmentalWindow.signals.humidityRh.baselineDelta > 0
            ? "elevated_contextual"
            : "stable";
        humidityInstrument.thresholdProximityClass =
          state.environmentalWindow.signals.humidityRh.baselineDelta > 0
            ? "contextual"
            : "normal";
        humidityInstrument.confidenceClass =
          state.environmentalWindow.signals.humidityRh.baselineDelta > 0
            ? "high"
            : "normal";
        humidityInstrument.driftModel.currentRiskScore = Number(
          Math.max(0, state.environmentalWindow.signals.humidityRh.baselineDelta).toFixed(1)
        );
        humidityInstrument.driftModel.currentRiskClass =
          humidityInstrument.thresholdProximityClass;
      }

      if (workflow.state !== "evidence_hold" && workflow.state !== "export_ready") {
        workflow.state = activeRisk.phase === "escalated_review"
          ? "escalated_review"
          : "review_pending";
        workflow.assignedRole = activeRisk.phase === "escalated_review"
          ? "Supervisor Review"
          : "Technician / Metrology";
        workflow.closureBlocked = true;
      }

      if (reviewAlert) {
        reviewAlert.status = activeRisk.phase === "baseline" ? "available" : "open";
        reviewAlert.summary =
          activeRisk.phase === "baseline"
            ? "Predictive review alert logic is available but not yet triggered by live contextual conditions."
            : "Threshold-proximate posture detected under live environmental strengthening.";
      }

      if (evidenceHoldAlert) {
        evidenceHoldAlert.status = workflow.closureBlocked ? "open" : "resolved";
      }

      if (escalationAlert) {
        escalationAlert.status =
          workflow.state === "escalated_review" ? "open" : "available";
      }

      state.activeScenario.phase =
        workflow.state === "evidence_hold" || workflow.state === "export_ready"
          ? workflow.state
          : activeRisk.phase;

      state.metrics.openWorkflowEvents =
        activeRisk.phase === "baseline" && !workflow.closureBlocked ? 0 : 3;
      state.metrics.escalatedEvents = workflow.state === "escalated_review" ? 1 : 0;
      state.metrics.evidenceIncompleteEvents = workflow.closureBlocked ? 1 : 0;

      state.historicalPattern.contextualStrengthening =
        activeRisk.phase !== "baseline";

      evidence.condition =
        `Live outside context for ${state.liveEnvironment.activeLocation.label} indicates temperature ${formatNumber(state.environmentalWindow.signals.temperatureF.current)}°F and humidity ${formatNumber(state.environmentalWindow.signals.humidityRh.current, 0)}% RH, strengthening bounded review significance for ${activeInstrument.instrumentId}.`;

      evidence.decision =
        workflow.state === "export_ready"
          ? "The evidence chain has been completed and bounded export posture has been achieved."
          : workflow.state === "evidence_hold"
            ? "The event remains on hold because evidence completion is still required before closure."
            : workflow.state === "escalated_review"
              ? "A governed review event has escalated to supervisory posture under strengthened live contextual concern."
              : "A governed review event remains active because live contextual movement keeps the instrument inside review-worthy posture.";

      evidence.actor =
        `${workflow.assignedRole} role is currently the attributable responder inside the governed event chain.`;

      evidence.action =
        workflow.state === "export_ready"
          ? "Evidence object has been sealed and linked to audit export path."
          : workflow.state === "evidence_hold"
            ? "Workflow remains on evidence hold pending completion of preserved event meaning."
            : "Workflow remains under governed control with escalation, override, and evidence obligations preserved.";

      evidence.result =
        workflow.closureBlocked
          ? "Event remains reviewable and not yet closure-eligible because the evidence chain is still open."
          : "Event is export-ready under bounded review posture because the evidence chain is sufficiently complete.";

      this.annotateRuntimeState();

      return this.snapshot();
    },

    annotateRuntimeState() {
      const activeInstrument = this.getActiveInstrument();
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getEvidenceObject();

      state.liveEnvironment.lastUiRefreshAt = createTimestamp();

      if (activeInstrument) {
        activeInstrument.runtime = {
          displayObservedState: formatLabel(activeInstrument.observedState),
          displayPredictedState: formatLabel(activeInstrument.predictedState),
          displayThresholdClass: formatLabel(activeInstrument.thresholdProximityClass),
          displayConfidenceClass: formatLabel(activeInstrument.confidenceClass),
          displayWorkflowState: formatLabel(activeInstrument.workflowState),
          displayEvidenceState: formatLabel(activeInstrument.evidenceState),
          displayLastCalibrationAt: app.formatDateTime(activeInstrument.lastCalibrationAt),
          displayRiskScore: formatNumber(activeInstrument.driftModel.currentRiskScore)
        };
      }

      if (workflow) {
        workflow.runtime = {
          displayState: formatLabel(workflow.state),
          closureStatus: workflow.closureBlocked ? "Blocked Pending Evidence" : "Closure Eligible",
          escalationDisplay: workflow.escalationAvailable ? "Available" : "Not Available",
          overrideDisplay: workflow.overrideAvailable ? "Available" : "Not Available"
        };
      }

      if (evidence) {
        evidence.runtime = {
          displayChainStatus: formatLabel(evidence.chainStatus),
          exportReady: !workflow.closureBlocked
        };
      }
    },

    setPhase(phaseKey) {
      const workflow = this.getPrimaryWorkflow();

      if (!workflow) {
        return this.snapshot();
      }

      if (phaseKey === "baseline") {
        workflow.state = "review_pending";
        workflow.assignedRole = "Technician / Metrology";
        workflow.closureBlocked = true;
      } else if (phaseKey === "environmental_shift") {
        workflow.state = "review_pending";
        workflow.assignedRole = "Technician / Metrology";
        workflow.closureBlocked = true;
      } else if (phaseKey === "review_pending") {
        workflow.state = "review_pending";
        workflow.assignedRole = "Technician / Metrology";
        workflow.closureBlocked = true;
      } else if (phaseKey === "escalated_review") {
        workflow.state = "escalated_review";
        workflow.assignedRole = "Supervisor Review";
        workflow.closureBlocked = true;
      } else if (phaseKey === "evidence_hold") {
        workflow.state = "evidence_hold";
        workflow.closureBlocked = true;
      } else if (phaseKey === "export_ready") {
        workflow.state = "export_ready";
        workflow.closureBlocked = false;
      }

      state.activeScenario.phase = phaseKey;
      this.syncWithLiveEnvironment();

      return this.snapshot();
    },

    advance() {
      const order = [
        "baseline",
        "environmental_shift",
        "review_pending",
        "escalated_review",
        "evidence_hold",
        "export_ready"
      ];

      const current = state.activeScenario.phase;
      const index = order.indexOf(current);
      const nextPhase = index === -1
        ? "baseline"
        : order[Math.min(index + 1, order.length - 1)];

      return this.setPhase(nextPhase);
    },

    snapshot() {
      return {
        generatedAt: createTimestamp(),
        engineVersion: this.version,
        mode: this.mode,
        phase: state.activeScenario.phase,
        state: clone({
          liveEnvironment: state.liveEnvironment,
          activeScenario: state.activeScenario,
          metrics: state.metrics,
          instruments: state.instruments,
          environmentalWindow: state.environmentalWindow,
          historicalPattern: state.historicalPattern,
          alerts: state.alerts,
          workflows: state.workflows,
          evidence: state.evidence
        })
      };
    },

    summarizeCurrentState() {
      const activeInstrument = this.getActiveInstrument();
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getEvidenceObject();

      return {
        generatedAt: createTimestamp(),
        phaseLabel: formatLabel(state.activeScenario.phase),
        phaseDescription: state.activeScenario.summary,
        instrument: activeInstrument
          ? {
              instrumentId: activeInstrument.instrumentId,
              predictedState: formatLabel(activeInstrument.predictedState),
              thresholdClass: formatLabel(activeInstrument.thresholdProximityClass),
              workflowState: formatLabel(activeInstrument.workflowState),
              evidenceState: formatLabel(activeInstrument.evidenceState)
            }
          : null,
        workflow: workflow
          ? {
              workflowId: workflow.workflowId,
              state: formatLabel(workflow.state),
              assignedRole: workflow.assignedRole,
              closureBlocked: workflow.closureBlocked
            }
          : null,
        evidence: evidence
          ? {
              evidenceObjectId: evidence.evidenceObjectId,
              chainStatus: formatLabel(evidence.chainStatus),
              exportClass: formatLabel(evidence.exportClass)
            }
          : null,
        liveEnvironment: {
          provider: state.liveEnvironment.provider,
          location: state.liveEnvironment.activeLocation.label,
          status: formatLabel(state.liveEnvironment.status),
          updatedAt: state.liveEnvironment.lastUpdatedAt,
          temperatureCurrent: `${formatNumber(state.environmentalWindow.signals.temperatureF.current)}°F`,
          humidityCurrent: `${formatNumber(state.environmentalWindow.signals.humidityRh.current, 0)}% RH`,
          pressureCurrent: `${formatNumber(state.environmentalWindow.signals.pressureHpa.current)} hPa`
        }
      };
    }
  };

  window.WP_DEMO_SIMULATION = scenarioEngine;
})();
