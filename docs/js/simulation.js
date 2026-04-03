(function () {
  "use strict";

  const app = window.WP_DEMO_APP;

  if (!app) {
    console.error("WattsProtect™ Demonstrator app layer is unavailable.");
    return;
  }

  const {
    state,
    formatLabel,
    formatNumber,
    formatDateTime
  } = app;

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const createTimestamp = () => new Date().toISOString();

  const scenarioEngine = {
    version: "1.0.0",
    mode: "governed_simulation",
    activeTick: 0,
    startedAt: createTimestamp(),
    lastUpdatedAt: createTimestamp(),

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

    thresholds: {
      temperatureDeltaReview: 3.5,
      humidityDeltaReview: 8,
      cumulativeConcernEscalation: 16,
      cumulativeConcernThresholdProximate: 12
    },

    phaseMap: {
      baseline: {
        key: "baseline",
        label: "Baseline",
        description:
          "Instrument and contextual posture remain inside ordinary monitored bounds."
      },
      environmental_shift: {
        key: "environmental_shift",
        label: "Environmental Shift",
        description:
          "Context moves above recent baseline, increasing review significance."
      },
      review_pending: {
        key: "review_pending",
        label: "Review Pending",
        description:
          "Predictive review alert is active and governed workflow has begun."
      },
      escalated_review: {
        key: "escalated_review",
        label: "Escalated Review",
        description:
          "Supervisor path is active due to unresolved or heightened concern."
      },
      evidence_hold: {
        key: "evidence_hold",
        label: "Evidence Hold",
        description:
          "Closure remains blocked pending full preservation of required event meaning."
      },
      export_ready: {
        key: "export_ready",
        label: "Export Ready",
        description:
          "Evidence chain is complete and audit package is ready for bounded export."
      }
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

    getAlertById(alertId) {
      return state.alerts.find((item) => item.alertId === alertId) || null;
    },

    getPrimaryEvidence() {
      return state.evidence;
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

      this.activeTick = 0;
      this.lastUpdatedAt = createTimestamp();

      this.annotateRuntimeState();
      return this.snapshot();
    },

    snapshot() {
      return {
        generatedAt: createTimestamp(),
        engineVersion: this.version,
        mode: this.mode,
        activeTick: this.activeTick,
        phase: state.activeScenario.phase,
        phaseLabel: this.describePhase(state.activeScenario.phase).label,
        state: clone({
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

    describePhase(phaseKey) {
      return this.phaseMap[phaseKey] || {
        key: phaseKey,
        label: formatLabel(phaseKey),
        description: "Phase description unavailable."
      };
    },

    annotateRuntimeState() {
      const activeInstrument = this.getActiveInstrument();
      const supportingHumidityInstrument = this.getSupportingHumidityInstrument();
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();

      if (!activeInstrument || !workflow || !evidence) {
        return;
      }

      const tempDelta = state.environmentalWindow.signals.temperatureF.baselineDelta;
      const humidityDelta = state.environmentalWindow.signals.humidityRh.baselineDelta;
      const cumulativeConcern = tempDelta + humidityDelta;

      state.activeScenario.runtime = {
        engineVersion: this.version,
        lastUpdatedAt: this.lastUpdatedAt,
        cumulativeConcernScore: cumulativeConcern,
        thresholdReviewCrossed:
          tempDelta >= this.thresholds.temperatureDeltaReview ||
          humidityDelta >= this.thresholds.humidityDeltaReview,
        thresholdProximateMaintained:
          cumulativeConcern >= this.thresholds.cumulativeConcernThresholdProximate
      };

      activeInstrument.runtime = {
        lastUpdatedAt: this.lastUpdatedAt,
        cumulativeConcernScore: cumulativeConcern,
        temperatureDelta: tempDelta,
        humidityDelta: humidityDelta,
        displayObservedState: formatLabel(activeInstrument.observedState),
        displayPredictedState: formatLabel(activeInstrument.predictedState),
        displayThresholdClass: formatLabel(activeInstrument.thresholdProximityClass),
        displayConfidenceClass: formatLabel(activeInstrument.confidenceClass),
        displayWorkflowState: formatLabel(activeInstrument.workflowState),
        displayEvidenceState: formatLabel(activeInstrument.evidenceState),
        displayLastCalibrationAt: formatDateTime(activeInstrument.lastCalibrationAt)
      };

      if (supportingHumidityInstrument) {
        supportingHumidityInstrument.runtime = {
          lastUpdatedAt: this.lastUpdatedAt,
          linkedScenario: state.activeScenario.scenarioId,
          displayObservedState: formatLabel(supportingHumidityInstrument.observedState),
          displayPredictedState: formatLabel(supportingHumidityInstrument.predictedState)
        };
      }

      workflow.runtime = {
        lastUpdatedAt: this.lastUpdatedAt,
        displayState: formatLabel(workflow.state),
        closureStatus: workflow.closureBlocked ? "Blocked Pending Evidence" : "Closure Eligible",
        escalationDisplay: workflow.escalationAvailable ? "Available" : "Not Available",
        overrideDisplay: workflow.overrideAvailable ? "Available" : "Not Available"
      };

      evidence.runtime = {
        lastUpdatedAt: this.lastUpdatedAt,
        displayChainStatus: formatLabel(evidence.chainStatus),
        exportReady:
          state.activeScenario.phase === "export_ready" &&
          workflow.closureBlocked === false
      };
    },

    deriveConcernClass() {
      const tempDelta = state.environmentalWindow.signals.temperatureF.baselineDelta;
      const humidityDelta = state.environmentalWindow.signals.humidityRh.baselineDelta;
      const cumulative = tempDelta + humidityDelta;

      if (cumulative >= this.thresholds.cumulativeConcernEscalation) {
        return "significant_concern";
      }

      if (cumulative >= this.thresholds.cumulativeConcernThresholdProximate) {
        return "elevated_environmental_concern";
      }

      return "reviewable_environmental_shift";
    },

    applyBaselinePhase() {
      const activeInstrument = this.getActiveInstrument();
      const humidityInstrument = this.getSupportingHumidityInstrument();
      const workflow = this.getPrimaryWorkflow();
      const reviewAlert = this.getAlertById("ALT-WP-104-REV-01");
      const evidenceHoldAlert = this.getAlertById("ALT-WP-104-EVD-01");
      const escalationAlert = this.getAlertById("ALT-WP-104-ESC-01");

      state.activeScenario.phase = "baseline";
      state.activeScenario.status = "active";

      state.environmentalWindow.classification = "reviewable_environmental_shift";
      state.environmentalWindow.signals.temperatureF.current = 73.2;
      state.environmentalWindow.signals.temperatureF.baselineDelta = 1.4;
      state.environmentalWindow.signals.temperatureF.state = "stable";
      state.environmentalWindow.signals.temperatureF.summary =
        "Temperature is slightly above prior baseline but remains below active review threshold.";

      state.environmentalWindow.signals.humidityRh.current = 58;
      state.environmentalWindow.signals.humidityRh.baselineDelta = 4;
      state.environmentalWindow.signals.humidityRh.state = "stable";
      state.environmentalWindow.signals.humidityRh.summary =
        "Humidity is elevated mildly but does not yet strengthen event posture into governed review.";

      state.environmentalWindow.interpretation =
        "Context remains observable but does not yet require a governed review path.";

      if (activeInstrument) {
        activeInstrument.predictedState = "stable";
        activeInstrument.thresholdProximityClass = "normal";
        activeInstrument.confidenceClass = "normal";
        activeInstrument.workflowState = "none_open";
        activeInstrument.evidenceState = "not_required";
        activeInstrument.summary =
          "Primary instrument remains inside stable posture under current contextual conditions.";
      }

      if (humidityInstrument) {
        humidityInstrument.observedState = "stable";
        humidityInstrument.predictedState = "stable";
        humidityInstrument.thresholdProximityClass = "normal";
        humidityInstrument.summary =
          "Supporting humidity instrument remains inside monitored baseline range.";
      }

      if (workflow) {
        workflow.state = "review_pending";
        workflow.closureBlocked = true;
        workflow.summary =
          "Workflow artifact preserved for demonstrator continuity but not yet active as a triggered governed event in baseline posture.";
      }

      if (reviewAlert) {
        reviewAlert.status = "available";
        reviewAlert.summary =
          "Predictive review alert logic is available but not yet triggered in baseline posture.";
      }

      if (evidenceHoldAlert) {
        evidenceHoldAlert.status = "available";
      }

      if (escalationAlert) {
        escalationAlert.status = "available";
      }

      state.metrics.openWorkflowEvents = 1;
      state.metrics.escalatedEvents = 0;
      state.metrics.evidenceIncompleteEvents = 0;

      state.evidence.chainStatus = "preserved_reviewable";
      state.evidence.condition =
        "No threshold-proximate event condition is active in baseline posture.";
      state.evidence.decision =
        "No governed review decision has yet been forced by contextual state.";
      state.evidence.actor =
        "No attributable action required beyond passive monitoring posture.";
      state.evidence.action =
        "Monitoring continues without transition into active review workflow.";
      state.evidence.result =
        "System remains in bounded observation mode with no evidence-completion hold active.";

      this.lastUpdatedAt = createTimestamp();
      this.annotateRuntimeState();

      return this.snapshot();
    },

    applyEnvironmentalShiftPhase() {
      const activeInstrument = this.getActiveInstrument();
      const humidityInstrument = this.getSupportingHumidityInstrument();
      const reviewAlert = this.getAlertById("ALT-WP-104-REV-01");

      state.activeScenario.phase = "environmental_shift";

      state.environmentalWindow.signals.temperatureF.current = 75.4;
      state.environmentalWindow.signals.temperatureF.baselineDelta = 3.2;
      state.environmentalWindow.signals.temperatureF.state = "elevated";
      state.environmentalWindow.signals.temperatureF.summary =
        "Temperature has moved above recent baseline and is approaching active review significance.";

      state.environmentalWindow.signals.humidityRh.current = 64;
      state.environmentalWindow.signals.humidityRh.baselineDelta = 8;
      state.environmentalWindow.signals.humidityRh.state = "elevated";
      state.environmentalWindow.signals.humidityRh.summary =
        "Humidity has crossed the demonstrator review threshold and is strengthening event concern.";

      state.environmentalWindow.classification = this.deriveConcernClass();
      state.environmentalWindow.interpretation =
        "Environmental context is now materially relevant and contributes to forward-looking review significance.";

      if (activeInstrument) {
        activeInstrument.predictedState = "threshold_proximate";
        activeInstrument.thresholdProximityClass = "review_worthy";
        activeInstrument.confidenceClass = "reviewable";
        activeInstrument.workflowState = "review_pending";
        activeInstrument.evidenceState = "incomplete";
        activeInstrument.summary =
          "Instrument posture has moved from stable to threshold-proximate under strengthened contextual conditions.";
      }

      if (humidityInstrument) {
        humidityInstrument.observedState = "elevated";
        humidityInstrument.predictedState = "elevated_contextual";
        humidityInstrument.thresholdProximityClass = "contextual";
        humidityInstrument.summary =
          "Supporting humidity signal is now materially relevant to the active review event.";
      }

      if (reviewAlert) {
        reviewAlert.status = "open";
        reviewAlert.summary =
          "Predictive review alert triggered as contextual concern and historical pattern now support governed review.";
      }

      state.metrics.openWorkflowEvents = 2;
      state.metrics.evidenceIncompleteEvents = 1;

      state.evidence.condition =
        "Environmental context has crossed review-relevant thresholds and the active instrument has moved into threshold-proximate posture.";
      state.evidence.decision =
        "A governed review path has become necessary due to contextual strengthening.";
      state.evidence.actor =
        "Technician / Metrology role remains the initial attributable responder.";
      state.evidence.action =
        "Event transitions from passive observation to governed review posture.";
      state.evidence.result =
        "The event remains open and requires evidence continuity through workflow progression.";

      this.lastUpdatedAt = createTimestamp();
      this.annotateRuntimeState();

      return this.snapshot();
    },

    applyReviewPendingPhase() {
      const activeInstrument = this.getActiveInstrument();
      const workflow = this.getPrimaryWorkflow();
      const reviewAlert = this.getAlertById("ALT-WP-104-REV-01");
      const evidenceHoldAlert = this.getAlertById("ALT-WP-104-EVD-01");

      state.activeScenario.phase = "review_pending";

      state.environmentalWindow.signals.temperatureF.current = 76.8;
      state.environmentalWindow.signals.temperatureF.baselineDelta = 4.2;
      state.environmentalWindow.signals.temperatureF.state = "elevated";

      state.environmentalWindow.signals.humidityRh.current = 67;
      state.environmentalWindow.signals.humidityRh.baselineDelta = 11;
      state.environmentalWindow.signals.humidityRh.state = "elevated";

      state.environmentalWindow.classification = "elevated_environmental_concern";
      state.environmentalWindow.interpretation =
        "Environmental movement is not treated as calibration truth. It is treated as contextual strengthening that increases review significance for the monitored event.";

      if (activeInstrument) {
        activeInstrument.predictedState = "threshold_proximate";
        activeInstrument.thresholdProximityClass = "review_worthy";
        activeInstrument.confidenceClass = "reviewable";
        activeInstrument.workflowState = "review_pending";
        activeInstrument.evidenceState = "incomplete";
      }

      if (workflow) {
        workflow.state = "review_pending";
        workflow.closureBlocked = true;
        workflow.summary =
          "Primary governed workflow event is active and awaiting attributable technician response.";
      }

      if (reviewAlert) {
        reviewAlert.status = "open";
      }

      if (evidenceHoldAlert) {
        evidenceHoldAlert.status = "open";
      }

      state.metrics.openWorkflowEvents = 3;
      state.metrics.escalatedEvents = 1;
      state.metrics.evidenceIncompleteEvents = 1;

      state.evidence.chainStatus = "preserved_reviewable";
      state.evidence.condition =
        "Elevated humidity and sustained temperature divergence strengthened contextual concern while the instrument moved into threshold-proximate posture.";
      state.evidence.decision =
        "A governed review event was opened rather than allowing the condition to remain passive awareness.";
      state.evidence.actor =
        "Technician / Metrology role assigned as initial attributable responder.";
      state.evidence.action =
        "Review path opened under workflow control with escalation, override, and evidence gates preserved.";
      state.evidence.result =
        "Event remains reviewable and export-ready because the chain preserves condition, decision, actor, action, and result.";

      this.lastUpdatedAt = createTimestamp();
      this.annotateRuntimeState();

      return this.snapshot();
    },

    applyEscalatedReviewPhase() {
      const workflow = this.getPrimaryWorkflow();
      const escalationAlert = this.getAlertById("ALT-WP-104-ESC-01");

      state.activeScenario.phase = "escalated_review";

      state.environmentalWindow.signals.temperatureF.current = 77.4;
      state.environmentalWindow.signals.temperatureF.baselineDelta = 4.8;
      state.environmentalWindow.signals.humidityRh.current = 69;
      state.environmentalWindow.signals.humidityRh.baselineDelta = 13;
      state.environmentalWindow.classification = "significant_concern";
      state.environmentalWindow.interpretation =
        "Contextual concern has intensified and now justifies supervisory visibility within the governed event path.";

      if (workflow) {
        workflow.state = "escalated_review";
        workflow.assignedRole = "Supervisor Review";
        workflow.closureBlocked = true;
        workflow.summary =
          "Supervisor review path is now active due to heightened concern and unresolved event status.";
      }

      if (escalationAlert) {
        escalationAlert.status = "open";
        escalationAlert.summary =
          "Supervisor escalation has been activated to preserve controlled review under intensified contextual concern.";
      }

      state.metrics.escalatedEvents = 1;
      state.metrics.openWorkflowEvents = 3;
      state.metrics.evidenceIncompleteEvents = 1;

      state.evidence.decision =
        "Supervisor escalation activated because technician review alone is no longer sufficient to resolve the event confidently.";
      state.evidence.actor =
        "Supervisor Review role now participates in the attributable event chain.";
      state.evidence.action =
        "Escalation path preserved and activated under governed workflow control.";
      state.evidence.result =
        "Event remains under review and cannot close until preserved evidence supports a defensible result.";

      this.lastUpdatedAt = createTimestamp();
      this.annotateRuntimeState();

      return this.snapshot();
    },

    applyEvidenceHoldPhase() {
      const workflow = this.getPrimaryWorkflow();
      const evidenceHoldAlert = this.getAlertById("ALT-WP-104-EVD-01");

      state.activeScenario.phase = "evidence_hold";

      if (workflow) {
        workflow.state = "evidence_hold";
        workflow.closureBlocked = true;
        workflow.summary =
          "Event remains in hold posture because full evidence completion has not yet been preserved.";
      }

      if (evidenceHoldAlert) {
        evidenceHoldAlert.status = "open";
        evidenceHoldAlert.summary =
          "Closure remains blocked because one or more required evidence elements remain incomplete.";
      }

      state.metrics.evidenceIncompleteEvents = 1;

      state.evidence.chainStatus = "preserved_reviewable";
      state.evidence.decision =
        "The event may not close because evidence completeness remains an explicit control requirement.";
      state.evidence.action =
        "Workflow remains on hold pending final preservation of condition, decision, actor, action, and result.";
      state.evidence.result =
        "The record remains open, reviewable, and incomplete until closure requirements are satisfied.";

      this.lastUpdatedAt = createTimestamp();
      this.annotateRuntimeState();

      return this.snapshot();
    },

    applyExportReadyPhase() {
      const activeInstrument = this.getActiveInstrument();
      const workflow = this.getPrimaryWorkflow();
      const evidenceHoldAlert = this.getAlertById("ALT-WP-104-EVD-01");

      state.activeScenario.phase = "export_ready";

      if (activeInstrument) {
        activeInstrument.evidenceState = "available_for_linkage";
        activeInstrument.workflowState = "review_pending";
      }

      if (workflow) {
        workflow.state = "export_ready";
        workflow.closureBlocked = false;
        workflow.summary =
          "Evidence chain is complete and bounded audit export is now available.";
      }

      if (evidenceHoldAlert) {
        evidenceHoldAlert.status = "resolved";
        evidenceHoldAlert.summary =
          "Evidence completion requirement has been satisfied and closure gate has been released for bounded export.";
      }

      state.metrics.evidenceIncompleteEvents = 0;

      state.evidence.chainStatus = "preserved_reviewable";
      state.evidence.decision =
        "Governed review path has completed with sufficient preserved evidence to support bounded export.";
      state.evidence.action =
        "Evidence object sealed and linked to the audit object for review-only export.";
      state.evidence.result =
        "Event meaning now survives as a coherent, reviewable, exportable institutional record.";

      this.lastUpdatedAt = createTimestamp();
      this.annotateRuntimeState();

      return this.snapshot();
    },

    advance() {
      this.activeTick += 1;

      const currentPhase = state.activeScenario.phase;
      const orderedPhases = [
        "baseline",
        "environmental_shift",
        "review_pending",
        "escalated_review",
        "evidence_hold",
        "export_ready"
      ];

      const currentIndex = orderedPhases.indexOf(currentPhase);
      const nextIndex = currentIndex === -1
        ? 0
        : clamp(currentIndex + 1, 0, orderedPhases.length - 1);

      return this.setPhase(orderedPhases[nextIndex]);
    },

    setPhase(phaseKey) {
      switch (phaseKey) {
        case "baseline":
          return this.applyBaselinePhase();
        case "environmental_shift":
          return this.applyEnvironmentalShiftPhase();
        case "review_pending":
          return this.applyReviewPendingPhase();
        case "escalated_review":
          return this.applyEscalatedReviewPhase();
        case "evidence_hold":
          return this.applyEvidenceHoldPhase();
        case "export_ready":
          return this.applyExportReadyPhase();
        default:
          return this.applyReviewPendingPhase();
      }
    },

    summarizeCurrentState() {
      const activeInstrument = this.getActiveInstrument();
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();
      const phase = this.describePhase(state.activeScenario.phase);

      return {
        generatedAt: createTimestamp(),
        phaseKey: phase.key,
        phaseLabel: phase.label,
        phaseDescription: phase.description,
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
        environmentalWindow: {
          temperatureCurrent: `${formatNumber(state.environmentalWindow.signals.temperatureF.current)}°F`,
          temperatureDelta: `+${formatNumber(state.environmentalWindow.signals.temperatureF.baselineDelta)}°F`,
          humidityCurrent: `${formatNumber(state.environmentalWindow.signals.humidityRh.current, 0)}% RH`,
          humidityDelta: `+${formatNumber(state.environmentalWindow.signals.humidityRh.baselineDelta, 0)}`
        }
      };
    }
  };

  scenarioEngine.annotateRuntimeState();

  window.WP_DEMO_SIMULATION = scenarioEngine;
})();
