window.WP_DEMO_STATE = {
  repository: {
    systemName: "WattsProtect™",
    edition: "Canonical Review-Only Demonstrator",
    posture: "Governed Simulation with Live Context",
    rights: "All rights reserved",
    boundary:
      "No claim may exceed implemented, tested, validated, and released reality."
  },

  runtime: {
    environmentMode: "live_context",
    autoRefreshMinutes: 10,
    lastUiRefreshAt: null
  },

  activeScenario: {
    scenarioId: "SCN-WP-104-ENV-01",
    title: "Environmental Shift → Threshold-Proximate Review Event",
    summary:
      "Live weather context is ingested from an external weather source and mapped into a bounded demonstrator showing how environmental movement can strengthen review significance for WP-TMP-104.",
    status: "active",
    phase: "baseline",
    reviewWindowHours: 6
  },

  metrics: {
    monitoredInstruments: 12,
    openWorkflowEvents: 1,
    escalatedEvents: 0,
    evidenceIncompleteEvents: 0
  },

  liveEnvironment: {
    enabled: true,
    provider: "Open-Meteo",
    status: "idle",
    query: "New Brunswick, NJ",
    resolvedName: "New Brunswick, NJ",
    latitude: null,
    longitude: null,
    timezone: null,
    lastUpdatedAt: null,
    error: null,
    current: {
      temperatureF: null,
      humidityRh: null,
      pressureHpa: null
    },
    baselines: {
      temperatureF: 72.0,
      humidityRh: 56,
      pressureHpa: 1013
    },
    deltas: {
      temperatureF: 0,
      humidityRh: 0,
      pressureHpa: 0
    }
  },

  instruments: [
    {
      instrumentId: "WP-TMP-104",
      name: "WP-TMP-104",
      classification: "Temperature-Sensitive Process Instrument",
      location: "Controlled Monitoring Zone B-14",
      operationalDomain: "Quality-Sensitive Monitoring Layer",
      observedState: "active",
      predictedState: "stable",
      thresholdProximityClass: "normal",
      confidenceClass: "normal",
      workflowState: "none_open",
      evidenceState: "not_required",
      lastCalibrationAt: "2026-03-11T09:32:00",
      currentReviewWindowHours: 6,
      assignedRolePath: [
        "Technician / Metrology",
        "Supervisor Review",
        "QA Review"
      ],
      summary:
        "Primary monitored instrument in the active scenario. Live contextual movement can strengthen review significance for this instrument."
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
      observedState: "stable",
      predictedState: "stable",
      thresholdProximityClass: "normal",
      confidenceClass: "normal",
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
    windowId: "ENV-WIN-B14-LIVE-01",
    location: "Controlled Monitoring Zone B-14",
    classification: "reviewable_environmental_shift",
    startAt: "2026-04-03T06:00:00",
    endAt: "2026-04-03T12:00:00",
    signals: {
      temperatureF: {
        current: 72.0,
        baselineDelta: 0,
        state: "stable",
        summary:
          "Temperature baseline established for bounded contextual demonstration."
      },
      humidityRh: {
        current: 56,
        baselineDelta: 0,
        state: "stable",
        summary:
          "Humidity baseline established for bounded contextual demonstration."
      },
      pressureBand: {
        current: "stable_relative_band",
        baselineDelta: 0,
        state: "stable",
        summary:
          "Pressure remains inside stable relative band and is not yet a dominant anomaly driver."
      }
    },
    interpretation:
      "Environmental movement is not treated as calibration truth. It is treated as contextual strengthening that may increase review significance for the monitored event."
  },

  historicalPattern: {
    instrumentId: "WP-TMP-104",
    lastCalibrationOutcome: "acceptable_administrative_outcome",
    driftPatternClass: "minor_directional_drift",
    contextualStrengthening: false,
    interpretation:
      "Historical behavior alone is not sufficient to force intervention. When live contextual movement strengthens the event, the same pattern can become review-worthy."
  },

  alerts: [
    {
      alertId: "ALT-WP-104-REV-01",
      type: "predictive_review_alert",
      instrumentId: "WP-TMP-104",
      severity: "review_worthy",
      status: "available",
      routedTo: "Technician / Metrology",
      summary:
        "Predictive review alert becomes active when contextual concern and historical pattern support governed review."
    },
    {
      alertId: "ALT-WP-104-EVD-01",
      type: "evidence_completion_hold",
      instrumentId: "WP-TMP-104",
      severity: "control_hold",
      status: "available",
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
      "Live environmental context is evaluated in bounded form to determine whether the active instrument has moved into review-worthy posture.",
    decision:
      "A governed review event is opened when contextual movement and historical pattern justify review significance.",
    actor:
      "Technician / Metrology role assigned as initial attributable responder.",
    action:
      "Review path opens under workflow control with escalation, override, and evidence gates preserved.",
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
