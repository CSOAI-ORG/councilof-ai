import { Redirect } from "wouter";

/**
 * AG UI is Council OS. Deep-link stays `?lobby=`.
 *
 * Do not iframe `/os` as Home. Do not remount a second CouncilConsole.
 * A previous revision embedded csoai-site.pages.dev/ag-ui — that is a
 * second console on the DID/static project, not the product door.
 */
export default function AgUiBridge() {
  return <Redirect to="/?lobby=home" />;
}
