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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader title="Recovery" subtitle="Host recovery statistics and event history" onBack={onBack} />

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
  );
}
