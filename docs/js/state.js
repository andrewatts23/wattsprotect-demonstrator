window.WP_DEMO_STATE = {
  repository: {
    systemName: "WattsProtect™",
    edition: "Canonical Review-Only Demonstrator",
    posture: "Governed Live-Context Demonstrator",
    rights: "All rights reserved",
    boundary:
      "No claim may exceed implemented, tested, validated, and released reality."
  },

  liveEnvironment: {
    enabled: true,
    provider: "open-meteo",
    refreshIntervalMs: 300000,
    units: {
      temperature: "fahrenheit",
      pressure: "hPa",
      humidity: "percent"
    },
    defaultLocation: {
      label: "New Brunswick, NJ",
      latitude: 40.4862,
      longitude: -74.4518,
      timezone: "America/New_York"
    },
    activeLocation: {
      label: "New Brunswick, NJ",
      latitude: 40.4862,
      longitude: -74.4518,
      timezone: "America/New_York"
    },
    status: "idle",
    lastUpdatedAt: null,
    lastError: null
  },

  activeScenario: {
    scenarioId: "SCN-WP-104-LIVE-01",
    title: "Live Environmental Context → Threshold-Proximate Review Event",
    summary:
      "Live outside temperature, humidity, and pressure are ingested as contextual signals and interpreted as bounded environmental input for governed calibration-risk review.",
    status: "active",
    phase: "review_pending",
    reviewWindowHours: 6,
    mode: "live_context_with_bounded_instrument_logic"
  },

  metrics: {
    monitoredInstruments: 12,
    openWorkflowEvents: 3,
    escalatedEvents: 1,
    evidenceIncompleteEvents: 1
  },

  thresholds: {
    environment: {
      temperatureDeltaReviewF: 3.5,
      temperatureDeltaEscalationF: 6.0,
      humidityDeltaReview: 8,
      humidityDeltaEscalation: 14,
      cumulativeConcernThresholdProximate: 12,
      cumulativeConcernEscalation: 18
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
      driftModel: {
        baselineScore: 5,
        environmentalWeighting: {
          temperature: 0.65,
          humidity: 0.85,
          pressure: 0.2
        },
        currentRiskScore: 16,
        currentRiskClass: "review_worthy"
      },
      summary:
        "Primary monitored instrument in the active scenario. Live contextual movement strengthens bounded forward-looking review significance."
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
      driftModel: {
        baselineScore: 2,
        environmentalWeighting: {
          temperature: 0.15,
          humidity: 0.1,
          pressure: 0.4
        },
        currentRiskScore: 4,
        currentRiskClass: "normal"
      },
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
      driftModel: {
        baselineScore: 0,
        environmentalWeighting: {
          temperature: 0.1,
          humidity: 1,
          pressure: 0.05
        },
        currentRiskScore: 11,
        currentRiskClass: "contextual"
      },
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
      driftModel: {
        baselineScore: 3,
        environmentalWeighting: {
          temperature: 0.25,
          humidity: 0.2,
          pressure: 0.15
        },
        currentRiskScore: 5,
        currentRiskClass: "normal"
      },
      summary:
        "Flow-related instrument within expected operating posture and outside the active review event."
    }
  ],

  environmentalWindow: {
    windowId: "ENV-WIN-LIVE-B14-01",
    location: "New Brunswick, NJ",
    classification: "elevated_environmental_concern",
    startAt: null,
    endAt: null,
    baseline: {
      temperatureF: 72.6,
      humidityRh: 56,
      pressureHpa: 1015.2
    },
    signals: {
      temperatureF: {
        current: 76.8,
        baselineDelta: 4.2,
        state: "elevated",
        summary:
          "Live outside temperature remains elevated above bounded operating baseline."
      },
      humidityRh: {
        current: 67,
        baselineDelta: 11,
        state: "elevated",
        summary:
          "Live outside humidity remains above bounded operating baseline."
      },
      pressureHpa: {
        current: 1013.4,
        baselineDelta: -1.8,
        state: "stable",
        summary:
          "Live outside pressure remains inside bounded relative range and is not a dominant anomaly driver."
      }
    },
    source: {
      provider: "open-meteo",
      mode: "live_api_ingestion",
      lastFetchAt: null,
      fetchStatus: "idle"
    },
    interpretation:
      "Live environmental movement is not treated as calibration truth. It is treated as contextual strengthening that increases review significance for the monitored event."
  },

  historicalPattern: {
    instrumentId: "WP-TMP-104",
    lastCalibrationOutcome: "acceptable_administrative_outcome",
    driftPatternClass: "minor_directional_drift",
    contextualStrengthening: true,
    interpretation:
      "Historical behavior alone was not sufficient to force intervention. Under the present live environmental window, the same pattern becomes review-worthy."
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
        "Threshold-proximate posture detected under live environmental strengthening."
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
        "Primary governed workflow event for the active live-context scenario."
    }
  ],

  evidence: {
    evidenceObjectId: "EV-104-CHAIN-01",
    auditObjectId: "AU-104-EXP-01",
    instrumentId: "WP-TMP-104",
    workflowId: "WF-104-REV-01",
    chainStatus: "preserved_reviewable",
    condition:
      "Live outside temperature and humidity strengthened contextual concern while the instrument moved into threshold-proximate posture.",
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
