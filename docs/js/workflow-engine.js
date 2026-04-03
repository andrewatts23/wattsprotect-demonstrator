(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const simulation = window.WP_DEMO_SIMULATION;

  if (!app || !simulation) {
    console.error("WattsProtect™ workflow engine dependencies are unavailable.");
    return;
  }

  const { state, formatLabel, formatDateTime } = app;

  const createTimestamp = () => new Date().toISOString();

  const workflowEngine = {
    version: "1.0.0",
    mode: "governed_workflow_simulation",

    getPrimaryWorkflow() {
      return state.workflows.find((item) => item.workflowId === "WF-104-REV-01") || null;
    },

    getPrimaryInstrument() {
      return state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;
    },

    getPrimaryEvidence() {
      return state.evidence || null;
    },

    getPrimaryAlert() {
      return state.alerts.find((item) => item.alertId === "ALT-WP-104-REV-01") || null;
    },

    getEvidenceHoldAlert() {
      return state.alerts.find((item) => item.alertId === "ALT-WP-104-EVD-01") || null;
    },

    getEscalationAlert() {
      return state.alerts.find((item) => item.alertId === "ALT-WP-104-ESC-01") || null;
    },

    buildWorkflowStatus() {
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();
      const evidence = this.getPrimaryEvidence();

      if (!workflow || !instrument || !evidence) {
        return null;
      }

      return {
        workflowId: workflow.workflowId,
        state: workflow.state,
        stateLabel: formatLabel(workflow.state),
        assignedRole: workflow.assignedRole,
        closureBlocked: Boolean(workflow.closureBlocked),
        escalationAvailable: Boolean(workflow.escalationAvailable),
        overrideAvailable: Boolean(workflow.overrideAvailable),
        instrumentId: instrument.instrumentId,
        predictedState: formatLabel(instrument.predictedState),
        evidenceState: formatLabel(instrument.evidenceState),
        chainStatus: formatLabel(evidence.chainStatus),
        generatedAt: createTimestamp()
      };
    },

    buildRequiredCheckpoints() {
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();

      if (!workflow || !evidence) {
        return [];
      }

      const checkpoints = [
        {
          checkpointId: "CHK-COND-01",
          label: "Condition Preserved",
          status: evidence.condition ? "complete" : "incomplete",
          description:
            "The condition that triggered governed review must be preserved as explicit event meaning."
        },
        {
          checkpointId: "CHK-DEC-01",
          label: "Decision Preserved",
          status: evidence.decision ? "complete" : "incomplete",
          description:
            "The decision to govern the event through workflow must be preserved."
        },
        {
          checkpointId: "CHK-ACTR-01",
          label: "Actor Preserved",
          status: evidence.actor ? "complete" : "incomplete",
          description:
            "The attributable human or supervisory role must remain visible in the chain."
        },
        {
          checkpointId: "CHK-ACTN-01",
          label: "Action Preserved",
          status: evidence.action ? "complete" : "incomplete",
          description:
            "The governed response path taken must be preserved as explicit workflow action."
        },
        {
          checkpointId: "CHK-RSLT-01",
          label: "Result Preserved",
          status: evidence.result ? "complete" : "incomplete",
          description:
            "The resulting event state must remain reconstructible at closure and export."
        },
        {
          checkpointId: "CHK-CLOS-01",
          label: "Closure Gate",
          status: workflow.closureBlocked ? "blocked" : "released",
          description:
            "Closure remains blocked until the event chain is sufficiently preserved."
        }
      ];

      return checkpoints.map((item) => ({
        ...item,
        statusLabel: formatLabel(item.status)
      }));
    },

    buildAvailableActions() {
      const workflow = this.getPrimaryWorkflow();

      if (!workflow) {
        return [];
      }

      return [
        {
          actionId: "ACT-TECH-REVIEW",
          label: "Technician Review",
          allowed: workflow.assignedRole === "Technician / Metrology" || workflow.state === "review_pending",
          description:
            "Initial attributable review path performed by the assigned technician role."
        },
        {
          actionId: "ACT-SUP-ESCALATE",
          label: "Supervisor Escalation",
          allowed: Boolean(workflow.escalationAvailable),
          description:
            "Escalation path used when technician review alone is insufficient to close the event responsibly."
        },
        {
          actionId: "ACT-OVERRIDE-REQ",
          label: "Override Request",
          allowed: Boolean(workflow.overrideAvailable),
          description:
            "Controlled override path that requires explicit justification and preserved chain continuity."
        },
        {
          actionId: "ACT-HOLD-EVIDENCE",
          label: "Hold Pending Evidence",
          allowed: Boolean(workflow.closureBlocked),
          description:
            "Workflow hold posture that prevents premature closure until evidence requirements are satisfied."
        },
        {
          actionId: "ACT-CLOSE-EVENT",
          label: "Close Event",
          allowed: !workflow.closureBlocked,
          description:
            "Final closure action only after the evidence chain is complete and export readiness is established."
        }
      ];
    },

    technicianReview(payload = {}) {
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();
      const alert = this.getPrimaryAlert();

      if (!workflow || !evidence || !alert) {
        return null;
      }

      workflow.state = "review_pending";
      workflow.assignedRole = "Technician / Metrology";
      workflow.closureBlocked = true;
      workflow.summary =
        "Technician review has been recorded and the event remains under governed control pending evidence completeness.";

      alert.status = "open";
      alert.summary =
        "Technician review confirms the event remains review-worthy and must continue under governed workflow control.";

      evidence.actor =
        payload.actor ||
        "Technician / Metrology role confirmed as attributable reviewing actor.";
      evidence.action =
        payload.action ||
        "Technician review performed under governed workflow control with evidence gating preserved.";
      evidence.decision =
        payload.decision ||
        "The event remains inside the governed review path and is not eligible for casual dismissal.";
      evidence.result =
        payload.result ||
        "Workflow remains open pending complete evidence preservation and possible escalation if required.";

      simulation.annotateRuntimeState();

      return {
        action: "technician_review_recorded",
        workflow: this.buildWorkflowStatus(),
        checkpoints: this.buildRequiredCheckpoints(),
        generatedAt: createTimestamp()
      };
    },

    escalateToSupervisor(payload = {}) {
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();
      const escalationAlert = this.getEscalationAlert();

      if (!workflow || !evidence || !escalationAlert) {
        return null;
      }

      workflow.state = "escalated_review";
      workflow.assignedRole = "Supervisor Review";
      workflow.closureBlocked = true;
      workflow.summary =
        "Supervisor review has been activated to preserve controlled resolution under heightened or unresolved concern.";

      escalationAlert.status = "open";
      escalationAlert.summary =
        "Supervisor review path is active and now forms part of the attributable event chain.";

      evidence.actor =
        payload.actor ||
        "Supervisor Review role added to the attributable chain after escalation.";
      evidence.action =
        payload.action ||
        "Escalation path activated under workflow governance.";
      evidence.decision =
        payload.decision ||
        "Supervisor participation is required because technician review alone is insufficient to conclude the event responsibly.";
      evidence.result =
        payload.result ||
        "Event remains open under supervisory review and may not close until preserved evidence supports defensible completion.";

      state.metrics.escalatedEvents = Math.max(state.metrics.escalatedEvents, 1);

      simulation.setPhase("escalated_review");

      return {
        action: "supervisor_escalation_recorded",
        workflow: this.buildWorkflowStatus(),
        checkpoints: this.buildRequiredCheckpoints(),
        generatedAt: createTimestamp()
      };
    },

    requestOverride(payload = {}) {
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();

      if (!workflow || !evidence) {
        return null;
      }

      workflow.state = "evidence_hold";
      workflow.closureBlocked = true;
      workflow.summary =
        "Override request has been recorded but closure remains blocked until justification and evidence continuity requirements are satisfied.";

      evidence.decision =
        payload.decision ||
        "A controlled override has been requested but not silently granted.";
      evidence.actor =
        payload.actor ||
        "Override request attributed to authorized reviewing role.";
      evidence.action =
        payload.action ||
        "Override request preserved as a governed exception path requiring justification.";
      evidence.result =
        payload.result ||
        "Event remains on hold because override does not dissolve evidence or closure obligations.";

      simulation.setPhase("evidence_hold");

      return {
        action: "override_requested",
        workflow: this.buildWorkflowStatus(),
        checkpoints: this.buildRequiredCheckpoints(),
        generatedAt: createTimestamp()
      };
    },

    placeEvidenceHold(payload = {}) {
      const workflow = this.getPrimaryWorkflow();
      const evidence = this.getPrimaryEvidence();
      const evidenceHoldAlert = this.getEvidenceHoldAlert();

      if (!workflow || !evidence || !evidenceHoldAlert) {
        return null;
      }

      workflow.state = "evidence_hold";
      workflow.closureBlocked = true;
      workflow.summary =
        "Evidence hold remains active because one or more required event elements remain incomplete.";

      evidenceHoldAlert.status = "open";
      evidenceHoldAlert.summary =
        "Closure gate remains active pending evidence completion.";

      evidence.decision =
        payload.decision ||
        "Closure may not proceed because evidence completeness remains a governing requirement.";
      evidence.action =
        payload.action ||
        "Workflow remains on hold pending final preservation of required event meaning.";
      evidence.result =
        payload.result ||
        "Event cannot close until the evidence object is complete and audit continuity is preserved.";

      simulation.setPhase("evidence_hold");

      return {
        action: "evidence_hold_recorded",
        workflow: this.buildWorkflowStatus(),
        checkpoints: this.buildRequiredCheckpoints(),
        generatedAt: createTimestamp()
      };
    },

    releaseClosureGate(payload = {}) {
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();
      const evidence = this.getPrimaryEvidence();
      const evidenceHoldAlert = this.getEvidenceHoldAlert();

      if (!workflow || !instrument || !evidence || !evidenceHoldAlert) {
        return null;
      }

      workflow.state = "export_ready";
      workflow.closureBlocked = false;
      workflow.summary =
        "Closure gate has been released because the event chain is sufficiently complete for bounded export.";

      instrument.evidenceState = "available_for_linkage";

      evidenceHoldAlert.status = "resolved";
      evidenceHoldAlert.summary =
        "Evidence completion requirement has been satisfied and the closure gate is now released.";

      evidence.chainStatus = "preserved_reviewable";
      evidence.decision =
        payload.decision ||
        "Evidence chain has been reviewed and accepted as sufficiently complete for bounded audit export.";
      evidence.actor =
        payload.actor ||
        "Final attributable review acknowledged within the event chain.";
      evidence.action =
        payload.action ||
        "Evidence object sealed and linked to the audit export path.";
      evidence.result =
        payload.result ||
        "Event is now closure-eligible and export-ready in bounded review form.";

      state.metrics.evidenceIncompleteEvents = 0;

      simulation.setPhase("export_ready");

      return {
        action: "closure_gate_released",
        workflow: this.buildWorkflowStatus(),
        checkpoints: this.buildRequiredCheckpoints(),
        generatedAt: createTimestamp()
      };
    },

    buildWorkflowTimeline() {
      const workflow = this.getPrimaryWorkflow();
      const instrument = this.getPrimaryInstrument();

      if (!workflow || !instrument) {
        return [];
      }

      return [
        {
          stepId: "WF-TL-01",
          label: "Alert Intake",
          state: "complete",
          detail:
            "Predictive review alert for " +
            instrument.instrumentId +
            " has been converted from system signal into governed event."
        },
        {
          stepId: "WF-TL-02",
          label: "Actor Assignment",
          state: "complete",
          detail:
            "Assigned role is " + workflow.assignedRole + " under attributable control."
        },
        {
          stepId: "WF-TL-03",
          label: "Governed Review",
          state:
            workflow.state === "review_pending" ||
            workflow.state === "escalated_review" ||
            workflow.state === "evidence_hold" ||
            workflow.state === "export_ready"
              ? "complete"
              : "incomplete",
          detail:
            "Review path has been opened and remains governed rather than passive."
        },
        {
          stepId: "WF-TL-04",
          label: "Escalation / Override Control",
          state:
            workflow.state === "escalated_review" || workflow.state === "evidence_hold"
              ? "active"
              : "available",
          detail:
            "Escalation and override remain bounded and attributable rather than informal."
        },
        {
          stepId: "WF-TL-05",
          label: "Evidence Checkpoint",
          state: workflow.closureBlocked ? "blocked" : "complete",
          detail:
            "Closure remains blocked until evidence continuity is preserved."
        },
        {
          stepId: "WF-TL-06",
          label: "Export / Closure",
          state: workflow.closureBlocked ? "incomplete" : "complete",
          detail:
            "Final closure and bounded export become available only after evidence completion."
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
        workflow: this.buildWorkflowStatus(),
        checkpoints: this.buildRequiredCheckpoints(),
        actions: this.buildAvailableActions(),
        timeline: this.buildWorkflowTimeline()
      };
    }
  };

  window.WP_DEMO_WORKFLOW = workflowEngine;
})();
