import { describe, expect, it } from "@jest/globals";
import { installSnap } from "@metamask/snaps-jest";
import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";

import { NOTHING_TO_LOOK_UP, TITLE } from ".";

/**
 * The BUILT bundle (dist/bundle.js, shasum in snap.manifest.json), installed in the snaps-jest
 * simulation: SES sandbox in a worker thread, with only the manifest's permissions. The worker's fetch
 * cannot be stubbed from this process, so this suite drives the paths that make no network call;
 * lookup.test.tsx covers every answer the free preview can give.
 */
describe("onTransaction in the snap sandbox", () => {
  it("installs with its manifest permissions and renders the panel when there is no contract to look up", async () => {
    const { onTransaction } = await installSnap();
    const response = await onTransaction({ to: "0x0", chainId: "eip155:1" });
    expect(response.getInterface()).toRender(
      <Box>
        <Heading>{TITLE}</Heading>
        <Text>{NOTHING_TO_LOOK_UP}</Text>
      </Box>,
    );
  });

  it("does not look anything up on a non-EVM chain", async () => {
    const { onTransaction } = await installSnap();
    const response = await onTransaction({ chainId: "cosmos:cosmoshub-4" });
    expect(response.getInterface()).toRender(
      <Box>
        <Heading>{TITLE}</Heading>
        <Text>{NOTHING_TO_LOOK_UP}</Text>
      </Box>,
    );
  });
});
