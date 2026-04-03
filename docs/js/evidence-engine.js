(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const simulation = window.WP_DEMO_SIMULATION;
  const workflowEngine = window.WP_DEMO_WORKFLOW;

  if (!app || !simulation || !workflowEngine) {
    console.error("WattsProtect™ evidence engine dependencies are unavailable.");
    return;
  }

  const { state, formatLabel } = app;

  const createTimestamp = () => new Date().toISOString();

  const evidenceEngine = {
    version: "1.0.0",
    mode: "evidence_preservation_simulation",

    getEvidenceObject() {
      return state.evidence || null;
    },

    getPrimaryInstrument() {
      return state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;
    },

    getPrimaryWorkflow() {
      return state.workflows.find((item) => item.workflowId === "WF-104-REV-01") || null;
    },

    getEnvironmentalWindow() {
      return state.environmentalWindow || null;
    },

    getScenario() {
      return state.activeScenario || null;
    },

    buildConditionPayload() {
      const evidence = this.getEvidenceObject();
      const instrument = this.getPrimaryInstrument();
      const environment = this.getEnvironmentalWindow();

      if (!evidence || !instrument || !environment) {
        return null;
      }

      return {
        conditionText: evidence.condition,
        instrumentId: instrument.instrumentId,
        instrumentPredictedState: formatLabel(instrument.predictedState),
        thresholdClass: formatLabel(instrument.thresholdProximityClass),
        contextClassification: formatLabel(environment.classification),
        temperatureCurrent: environment.signals.temperatureF.current,
        temperatureDelta: environment.signals.temperatureF.baselineDelta,
        humidityCurrent: environment.signals.humidityRh.current,
        humidityDelta: environment.signals.humidityRh.baselineDelta
      };
    },

    buildDecisionPayload() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();

      if (!evidence || !workflow) {
        return null;
      }

      return {
        decisionText: evidence.decision,
        workflowId: workflow.workflowId,
        workflowState: formatLabel(workflow.state),
        closureBlocked: Boolean(workflow.closureBlocked),
        escalationAvailable: Boolean(workflow.escalationAvailable),
        overrideAvailable: Boolean(workflow.overrideAvailable)
      };
    },

    buildActorPayload() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();

      if (!evidence || !workflow) {
        return null;
      }

      return {
        actorText: evidence.actor,
        assignedRole: workflow.assignedRole,
        roleState: workflow.assignedRole,
        attributable: true
      };
    },

    buildActionPayload() {
      const evidence = this.getEvidenceObject();

      if (!evidence) {
        return null;
      }

      return {
        actionText: evidence.action,
        actionClass: "governed_workflow_action",
        evidenceLinked: true
      };
    },

    buildResultPayload() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();

      if (!evidence || !workflow) {
        return null;
      }

      return {
        resultText: evidence.result,
        chainStatus: formatLabel(evidence.chainStatus),
        closureEligible: !workflow.closureBlocked,
        exportClass: formatLabel(evidence.exportClass)
      };
    },

    buildEvidenceCompleteness() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();

      if (!evidence || !workflow) {
        return null;
      }

      const checks = {
        condition: Boolean(evidence.condition),
        decision: Boolean(evidence.decision),
        actor: Boolean(evidence.actor),
        action: Boolean(evidence.action),
        result: Boolean(evidence.result),
        closureGateReleased: !workflow.closureBlocked
      };

      const allCoreFieldsPresent =
        checks.condition &&
        checks.decision &&
        checks.actor &&
        checks.action &&
        checks.result;

      return {
        checks,
        allCoreFieldsPresent,
        exportReady: allCoreFieldsPresent && checks.closureGateReleased
      };
    },

    buildEvidenceChain() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();
      const scenario = this.getScenario();

      if (!evidence || !workflow || !instrument || !scenario) {
        return null;
      }

      return {
        evidenceObjectId: evidence.evidenceObjectId,
        auditObjectId: evidence.auditObjectId,
        scenarioId: scenario.scenarioId,
        workflowId: workflow.workflowId,
        instrumentId: instrument.instrumentId,
        chainStatus: evidence.chainStatus,
        exportClass: evidence.exportClass,
        generatedAt: createTimestamp(),
        condition: this.buildConditionPayload(),
        decision: this.buildDecisionPayload(),
        actor: this.buildActorPayload(),
        action: this.buildActionPayload(),
        result: this.buildResultPayload(),
        completeness: this.buildEvidenceCompleteness()
      };
    },

    sealEvidenceChain(payload = {}) {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();

      if (!evidence || !workflow || !instrument) {
        return null;
      }

      evidence.condition =
        payload.condition || evidence.condition;
      evidence.decision =
        payload.decision || evidence.decision;
      evidence.actor =
        payload.actor || evidence.actor;
      evidence.action =
        payload.action || evidence.action;
      evidence.result =
        payload.result || evidence.result;

      evidence.chainStatus = "preserved_reviewable";

      instrument.evidenceState = "available_for_linkage";

      const completeness = this.buildEvidenceCompleteness();

      if (completeness && completeness.allCoreFieldsPresent && workflow.closureBlocked) {
        workflowEngine.releaseClosureGate({
          decision:
            payload.decision ||
            "Evidence chain has been reviewed and accepted as sufficiently complete for bounded export.",
          actor:
            payload.actor ||
            "Final attributable reviewer confirmed inside the preserved event chain.",
          action:
            payload.action ||
            "Evidence object sealed and linked to audit export path.",
          result:
            payload.result ||
            "Event is closure-eligible and export-ready under bounded review posture."
        });
      }

      simulation.annotateRuntimeState();

      return {
        action: "evidence_chain_sealed",
        evidenceChain: this.buildEvidenceChain(),
        generatedAt: createTimestamp()
      };
    },

    buildAuditNarrative() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();
      const environment = this.getEnvironmentalWindow();

      if (!evidence || !workflow || !instrument || !environment) {
        return null;
      }

      return {
        title: "WattsProtect™ Audit Review Narrative",
        narrative:
          instrument.instrumentId +
          " entered governed review after elevated humidity and sustained temperature divergence strengthened contextual concern and moved the instrument into threshold-proximate posture. The event was converted from predictive signal into governed workflow, attributed to a named reviewing role, preserved through explicit evidence checkpoints, and rendered into bounded audit-ready form.",
        environmentalSummary: environment.interpretation,
        workflowSummary: workflow.summary,
        evidenceSummary: evidence.result
      };
    },

    buildEvidenceTimeline() {
      const evidence = this.getEvidenceObject();
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();

      if (!evidence || !workflow || !instrument) {
        return [];
      }

      return [
        {
          stepId: "EV-STEP-01",
          label: "Condition Preserved",
          state: evidence.condition ? "complete" : "incomplete",
          detail:
            "Contextual movement and instrument threshold posture preserved as explicit condition."
        },
        {
          stepId: "EV-STEP-02",
          label: "Decision Preserved",
          state: evidence.decision ? "complete" : "incomplete",
          detail:
            "Review decision preserved as governed event meaning."
        },
        {
          stepId: "EV-STEP-03",
          label: "Actor Preserved",
          state: evidence.actor ? "complete" : "incomplete",
          detail:
            "Attributable human role preserved inside the event chain."
        },
        {
          stepId: "EV-STEP-04",
          label: "Action Preserved",
          state: evidence.action ? "complete" : "incomplete",
          detail:
            "Workflow action path preserved as explicit institutional record."
        },
        {
          stepId: "EV-STEP-05",
          label: "Result Preserved",
          state: evidence.result ? "complete" : "incomplete",
          detail:
            "Result preserved so the event remains reconstructible after conclusion."
        },
        {
          stepId: "EV-STEP-06",
          label: "Audit Continuity",
          state: workflow.closureBlocked ? "blocked" : "complete",
          detail:
            "Bounded audit continuity depends on sealed evidence and released closure gate."
        }
      ].map((item) => ({
        ...item,
        stateLabel: formatLabel(item.state)
      }));
    },

    serialize() {
      return {
        generatedAt: createTimestamp(),
        version: this.version,
        mode: this.mode,
        chain: this.buildEvidenceChain(),
        timeline: this.buildEvidenceTimeline(),
        narrative: this.buildAuditNarrative()
      };
    }
  };

  window.WP_DEMO_EVIDENCE = evidenceEngine;
})();
