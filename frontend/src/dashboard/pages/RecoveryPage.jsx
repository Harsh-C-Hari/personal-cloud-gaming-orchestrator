import { RecoveryStats } from "../../components/RecoveryStats.jsx";
import { RecoveryEvents } from "../../components/RecoveryEvents.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function RecoveryPage({
  recoveryStats,
  recoveryEvents,
  recoveryEventsLoading,
  showTailscaleRecoveryDetails,
  setShowTailscaleRecoveryDetails,
  showTailscaleFailureDetails,
  setShowTailscaleFailureDetails,
  showAllRecoveryEvents,
  setShowAllRecoveryEvents,
  onBack,
}) {
  return (
    <div className="pcgo-feature-page pcgo-recovery-page">
      <PageHeader title="Recovery" subtitle="Automated recovery activity, failure signals, and event history" onBack={onBack} />

      <div className="pcgo-recovery-layout">
        <RecoveryStats
          recoveryStats={recoveryStats}
          showTailscaleRecoveryDetails={showTailscaleRecoveryDetails}
          setShowTailscaleRecoveryDetails={setShowTailscaleRecoveryDetails}
          showTailscaleFailureDetails={showTailscaleFailureDetails}
          setShowTailscaleFailureDetails={setShowTailscaleFailureDetails}
        />

        <RecoveryEvents
          recoveryEvents={recoveryEvents}
          recoveryEventsLoading={recoveryEventsLoading}
          showAllRecoveryEvents={showAllRecoveryEvents}
          setShowAllRecoveryEvents={setShowAllRecoveryEvents}
        />
      </div>
    </div>
  );
}
