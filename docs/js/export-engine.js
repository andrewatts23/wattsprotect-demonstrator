(function () {
  "use strict";

  const app = window.WP_DEMO_APP;
  const simulation = window.WP_DEMO_SIMULATION;
  const workflowEngine = window.WP_DEMO_WORKFLOW;
  const evidenceEngine = window.WP_DEMO_EVIDENCE;

  if (!app || !simulation || !workflowEngine || !evidenceEngine) {
    console.error("WattsProtect™ export engine dependencies are unavailable.");
    return;
  }

  const { state, formatLabel, formatDateTime } = app;

  const createTimestamp = () => new Date().toISOString();

  const prettyJson = (value) => JSON.stringify(value, null, 2);

  const exportEngine = {
    version: "1.0.0",
    mode: "bounded_audit_export_simulation",

    getRepositoryHeader() {
      return {
        systemName: state.repository.systemName,
        edition: state.repository.edition,
        posture: state.repository.posture,
        rights: state.repository.rights,
        boundary: state.repository.boundary
      };
    },

    getPrimaryPackageMeta() {
      const evidence = state.evidence;
      const workflow = state.workflows.find((item) => item.workflowId === "WF-104-REV-01") || null;
      const instrument =
        state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;

      return {
        packageId: evidence ? evidence.auditObjectId : "AU-UNAVAILABLE",
        packageClass: evidence ? formatLabel(evidence.exportClass) : "Unavailable",
        generatedAt: createTimestamp(),
        instrumentId: instrument ? instrument.instrumentId : "Unavailable",
        workflowId: workflow ? workflow.workflowId : "Unavailable",
        scenarioId: state.activeScenario.scenarioId
      };
    },

    buildAuditReviewPackage() {
      const packageMeta = this.getPrimaryPackageMeta();
      const repositoryHeader = this.getRepositoryHeader();
      const simulationSnapshot = simulation.summarizeCurrentState();
      const workflowSnapshot = workflowEngine.serialize();
      const evidenceSnapshot = evidenceEngine.serialize();

      return {
        header: repositoryHeader,
        packageMeta,
        packageBoundary: {
          classification: "review_only_bounded_export",
          statement:
            "This export package is a governed simulation of architecture behavior and is not represented as validated predictive performance, live regulated deployment, implementation authorization, or commercialization permission."
        },
        scenarioSummary: {
          title: state.activeScenario.title,
          summary: state.activeScenario.summary,
          phase: formatLabel(state.activeScenario.phase),
          reviewWindowHours: state.activeScenario.reviewWindowHours
        },
        operationalSnapshot: simulationSnapshot,
        workflowSnapshot,
        evidenceSnapshot
      };
    },

    buildManagementSummaryPackage() {
      const activeInstrument =
        state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;
      const workflow =
        state.workflows.find((item) => item.workflowId === "WF-104-REV-01") || null;
      const evidence = state.evidence;

      return {
        header: this.getRepositoryHeader(),
        packageMeta: {
          packageId: "MGMT-" + (evidence ? evidence.auditObjectId : "UNAVAILABLE"),
          packageClass: "Management Review Summary",
          generatedAt: createTimestamp()
        },
        summary: {
          monitoredInstruments: state.metrics.monitoredInstruments,
          openWorkflowEvents: state.metrics.openWorkflowEvents,
          escalatedEvents: state.metrics.escalatedEvents,
          evidenceIncompleteEvents: state.metrics.evidenceIncompleteEvents
        },
        focalEvent: {
          instrumentId: activeInstrument ? activeInstrument.instrumentId : "Unavailable",
          predictedState: activeInstrument ? formatLabel(activeInstrument.predictedState) : "Unavailable",
          workflowState: workflow ? formatLabel(workflow.state) : "Unavailable",
          chainStatus: evidence ? formatLabel(evidence.chainStatus) : "Unavailable"
        },
        boundary: {
          statement:
            "This summary is for bounded review only and does not imply live deployment, completed validation, or implementation rights."
        }
      };
    },

    buildValidationSupportPackage() {
      const workflow = workflowEngine.serialize();
      const evidence = evidenceEngine.serialize();

      return {
        header: this.getRepositoryHeader(),
        packageMeta: {
          packageId: "VALSUP-" + state.activeScenario.scenarioId,
          packageClass: "Validation Support Package",
          generatedAt: createTimestamp()
        },
        validationBoundary: {
          statement:
            "This package supports bounded review of architecture behavior and does not constitute completed validation, GMP qualification, TEVV completion, or production readiness."
        },
        controls: {
          scenarioPhase: formatLabel(state.activeScenario.phase),
          closureBlocked: workflow.workflow ? workflow.workflow.closureBlocked : true,
          chainStatus:
            evidence.chain && evidence.chain.chainStatus
              ? formatLabel(evidence.chain.chainStatus)
              : "Unavailable"
        },
        checkpoints: workflow.checkpoints,
        evidenceTimeline: evidence.timeline
      };
    },

    buildSingleEventPackage() {
      const instrument =
        state.instruments.find((item) => item.instrumentId === "WP-TMP-104") || null;
      const evidence = state.evidence;
      const environment = state.environmentalWindow;

      return {
        header: this.getRepositoryHeader(),
        packageMeta: {
          packageId: "SINGLE-" + (evidence ? evidence.evidenceObjectId : "UNAVAILABLE"),
          packageClass: "Single Event Review Package",
          generatedAt: createTimestamp()
        },
        event: {
          instrumentId: instrument ? instrument.instrumentId : "Unavailable",
          condition: evidence ? evidence.condition : "Unavailable",
          decision: evidence ? evidence.decision : "Unavailable",
          actor: evidence ? evidence.actor : "Unavailable",
          action: evidence ? evidence.action : "Unavailable",
          result: evidence ? evidence.result : "Unavailable"
        },
        context: {
          classification: formatLabel(environment.classification),
          temperatureCurrent: environment.signals.temperatureF.current,
          temperatureDelta: environment.signals.temperatureF.baselineDelta,
          humidityCurrent: environment.signals.humidityRh.current,
          humidityDelta: environment.signals.humidityRh.baselineDelta
        }
      };
    },

    buildPackageByClass(packageClass) {
      switch (packageClass) {
        case "management_review_summary":
          return this.buildManagementSummaryPackage();
        case "validation_support_package":
          return this.buildValidationSupportPackage();
        case "single_event_review_package":
          return this.buildSingleEventPackage();
        case "audit_review_package":
        default:
          return this.buildAuditReviewPackage();
      }
    },

    serializePackage(packageClass = "audit_review_package") {
      return {
        generatedAt: createTimestamp(),
        version: this.version,
        mode: this.mode,
        packageClass,
        package: this.buildPackageByClass(packageClass)
      };
    },

    serializePretty(packageClass = "audit_review_package") {
      return prettyJson(this.serializePackage(packageClass));
    },

    downloadJson(filename = "wattsprotect_audit_review_package.json", packageClass = "audit_review_package") {
      const payload = this.serializePretty(packageClass);
      const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        action: "download_triggered",
        filename,
        packageClass,
        generatedAt: createTimestamp()
      };
    },

    buildHumanReadableSummary() {
      const pkg = this.buildAuditReviewPackage();
      const instrumentId = pkg.packageMeta.instrumentId;
      const workflowId = pkg.packageMeta.workflowId;
      const phase = pkg.scenarioSummary.phase;
      const chainStatus =
        pkg.evidenceSnapshot.chain && pkg.evidenceSnapshot.chain.chainStatus
          ? formatLabel(pkg.evidenceSnapshot.chain.chainStatus)
          : "Unavailable";

      return [
        "WattsProtect™ Audit Review Package",
        "Package ID: " + pkg.packageMeta.packageId,
        "Generated At: " + formatDateTime(pkg.packageMeta.generatedAt),
        "Instrument ID: " + instrumentId,
        "Workflow ID: " + workflowId,
        "Scenario Phase: " + phase,
        "Chain Status: " + chainStatus,
        "Boundary: " + pkg.packageBoundary.statement
      ].join("\n");
    }
  };

  window.WP_DEMO_EXPORT = exportEngine;
})();
