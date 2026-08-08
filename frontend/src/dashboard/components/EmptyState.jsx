/**
 * dashboard/components/EmptyState.jsx
 *
 * Thin wrapper around the shared components/ui/primitives.jsx EmptyState so
 * every empty-state in the app shares one implementation. Same prop API as
 * before (`label`, `hint`) — visual only, mapped onto the primitive's
 * `message` / `subtext` props.
 */

import { EmptyState as EmptyStatePrimitive } from "../../components/ui/primitives.jsx";

export function EmptyState({ label = "Nothing here yet", hint }) {
  return <EmptyStatePrimitive message={label} subtext={hint} />;
}
