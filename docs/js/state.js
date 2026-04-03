window.WP_DEMO_STATE = {
  repository: {
    systemName: "WattsProtect™",
    edition: "Canonical Review-Only Demonstrator",
    posture: "Governed Simulation",
    rights: "All rights reserved",
    boundary:
      "No claim may exceed implemented, tested, validated, and released reality."
  },

  activeScenario: {
    scenarioId: "SCN-WP-104-ENV-01",
    title: "Environmental Shift → Threshold-Proximate Review Event",
    summary:
      "Humidity rises above recent baseline while temperature remains elevated across the monitored window, strengthening review significance for WP-TMP-104.",
    status: "active",
    phase: "review_pending",
    reviewWindowHours: 6
  },

  metrics: {
    monitoredInstruments: 12,
    openWorkflowEvents: 3,
    escalatedEvents: 1,
    evidenceIncompleteEvents: 1
  },

  instruments: [
    {
      instrumentId: "WP-TMP-104",
      name: "WP-TMP-104",
      classification: "Temperature-Sensitive Process Instrument",
      location: "Controlled Monitoring Zone B-14",
      operationalDomain: "Quality-Sensitive Monitoring Layer",
      observedState: "active",
      predictedState: "threshold_proximate",
      thresholdProximityClass: "review_worthy",
      confidenceClass: "reviewable",
      workflowState: "review_pending",
      evidenceState: "incomplete",
      lastCalibrationAt: "2026-03-11T09:32:00",
      currentReviewWindowHours: 6,
      assignedRolePath: [
        "Technician / Metrology",
        "Supervisor Review",
        "QA Review"
      ],
      summary:
        "Primary monitored instrument in the active scenario. Historical drift posture and current contextual strengthening have moved this instrument into threshold-proximate review posture."
    },
    {
      instrumentId: "WP-PRS-220",
      name: "WP-PRS-220",
      classification: "Pressure-Linked Instrument",
      location: "Process Support Zone C-02",
      operationalDomain: "Stable Monitoring Layer",
      observedState: "stable",
      predictedState: "stable",
      thresholdProximityClass: "normal",
      confidenceClass: "normal",
      workflowState: "none_open",
      evidenceState: "not_required",
      lastCalibrationAt: "2026-03-14T08:16:00",
      currentReviewWindowHours: 6,
      assignedRolePath: [
        "Technician / Metrology"
      ],
      summary:
        "Pressure-linked instrument inside stable contextual range with no active governance event required."
    },
    {
      instrumentId: "WP-HUM-318",
      name: "WP-HUM-318",
      classification: "Environmental Humidity Monitor",
      location: "Controlled Monitoring Zone B-14",
      operationalDomain: "Context-Signal Layer",
      observedState: "elevated",
      predictedState: "elevated_contextual",
      thresholdProximityClass: "contextual",
      confidenceClass: "high",
      workflowState: "supporting_signal_only",
      evidenceState: "available_for_linkage",
      lastCalibrationAt: "2026-03-19T10:04:00",
      currentReviewWindowHours: 6,
      assignedRolePath: [
        "Environmental Monitoring Role"
      ],
      summary:
        "Secondary environmental instrument providing contextual strengthening for the active scenario."
    },
    {
      instrumentId: "WP-FLW-091",
      name: "WP-FLW-091",
      classification: "Flow Monitoring Instrument",
      location: "Utility Corridor A-07",
      operationalDomain: "Stable Monitoring Layer",
      observedState: "stable",
      predictedState: "stable",
      thresholdProximityClass: "normal",
      confidenceClass: "normal",
      workflowState: "none_open",
      evidenceState: "not_required",
      lastCalibrationAt: "2026-03-22T11:45:00",
      currentReviewWindowHours: 6,
      assignedRolePath: [
        "Technician / Metrology"
      ],
      summary:
        "Flow-related instrument within expected operating posture and outside the active review event."
    }
  ],

  environmentalWindow: {
    windowId: "ENV-WIN-B14-2026-04-03-A",
    location: "Controlled Monitoring Zone B-14",
    classification: "elevated_environmental_concern",
    startAt: "2026-04-03T06:00:00",
    endAt: "2026-04-03T12:00:00",
    signals: {
      temperatureF: {
        current: 76.8,
        baselineDelta: 4.2,
        state: "elevated",
        summary:
          "Temperature remains elevated above recent baseline across the active review interval."
      },
      humidityRh: {
        current: 67,
        baselineDelta: 11,
        state: "elevated",
        summary:
          "Humidity has risen above recent baseline and remained elevated through the rolling review window."
      },
      pressureBand: {
        current: "stable_relative_band",
        state: "stable",
        summary:
          "Pressure remains inside stable relative band and is not a dominant anomaly driver in the current event."
      }
    },
    interpretation:
      "Environmental movement is not treated as calibration truth. It is treated as contextual strengthening that increases review significance for the monitored event."
  },

  historicalPattern: {
    instrumentId: "WP-TMP-104",
    lastCalibrationOutcome: "acceptable_administrative_outcome",
    driftPatternClass: "minor_directional_drift",
    contextualStrengthening: true,
    interpretation:
      "Historical behavior alone was not sufficient to force intervention. Under the present environmental window, the same pattern becomes review-worthy."
  },

  alerts: [
    {
      alertId: "ALT-WP-104-REV-01",
      type: "predictive_review_alert",
      instrumentId: "WP-TMP-104",
      severity: "review_worthy",
      status: "open",
      routedTo: "Technician / Metrology",
      summary:
        "Threshold-proximate posture detected under elevated humidity and sustained temperature divergence."
    },
    {
      alertId: "ALT-WP-104-EVD-01",
      type: "evidence_completion_hold",
      instrumentId: "WP-TMP-104",
      severity: "control_hold",
      status: "open",
      routedTo: "Workflow Closure Gate",
      summary:
        "Event closure remains blocked until condition, decision, actor, action, and result are all preserved."
    },
    {
      alertId: "ALT-WP-104-ESC-01",
      type: "supervisor_escalation_available",
      instrumentId: "WP-TMP-104",
      severity: "escalation_available",
      status: "available",
      routedTo: "Supervisor Review",
      summary:
        "Supervisor escalation path is available if technician review determines added oversight is required."
    }
  ],

  workflows: [
    {
      workflowId: "WF-104-REV-01",
      instrumentId: "WP-TMP-104",
      sourceAlertId: "ALT-WP-104-REV-01",
      state: "review_pending",
      assignedRole: "Technician / Metrology",
      escalationAvailable: true,
      overrideAvailable: true,
      closureBlocked: true,
      summary:
        "Primary governed workflow event for the active scenario."
    }
  ],

  evidence: {
    evidenceObjectId: "EV-104-CHAIN-01",
    auditObjectId: "AU-104-EXP-01",
    instrumentId: "WP-TMP-104",
    workflowId: "WF-104-REV-01",
    chainStatus: "preserved_reviewable",
    condition:
      "Elevated humidity and sustained temperature divergence strengthened contextual concern while the instrument moved into threshold-proximate posture.",
    decision:
      "A governed review event was opened rather than allowing the condition to remain passive awareness.",
    actor:
      "Technician / Metrology role assigned as initial attributable responder.",
    action:
      "Review path opened under workflow control with escalation, override, and evidence gates preserved.",
    result:
      "Event remains reviewable and export-ready because the chain preserves condition, decision, actor, action, and result.",
    exportClass: "audit_review_package"
  },

  users: [
    {
      userId: "USR-TECH-01",
      displayName: "Assigned Technician",
      role: "Technician / Metrology",
      permissions: [
        "review_event",
        "record_action",
        "request_escalation",
        "request_override"
      ]
    },
    {
      userId: "USR-SUP-01",
      displayName: "Supervisor Reviewer",
      role: "Supervisor Review",
      permissions: [
        "review_event",
        "approve_escalation",
        "approve_override",
        "record_supervisory_action"
      ]
    },
    {
      userId: "USR-QA-01",
      displayName: "QA Reviewer",
      role: "QA Review",
      permissions: [
        "review_event",
        "record_quality_review",
        "confirm_audit_chain"
      ]
    }
  ]
};
