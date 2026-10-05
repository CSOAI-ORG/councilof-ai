import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { Box, Heading, Link, Text } from "@metamask/snaps-sdk/jsx";

import { contractCaip19, lookup, type Lookup } from "./lookup";

export const TITLE = "SovX wrapped-asset measurements";
export const FOOTNOTE = "A state records what was read on-chain at a pinned block. It is not a rating or advice.";
export const NOTHING_TO_LOOK_UP = "This transaction names no EVM contract address, so there is nothing to look up.";
export const NO_RECORD = "No wrapped-asset measurement is on record for this address.";

export const Insight = ({ result }: { result: Lookup | null }) => {
  if (result === null) {
    return (
      <Box>
        <Heading>{TITLE}</Heading>
        <Text>{NOTHING_TO_LOOK_UP}</Text>
      </Box>
    );
  }
  if (result.kind === "records") {
    return (
      <Box>
        <Heading>{TITLE}</Heading>
        {result.records.map((r) => (
          <Box key={r.id}>
            <Text>{`Measured state: ${r.state} as of ${r.asOf}`}</Text>
            <Text>{`Freshness: ${r.freshness.state} (${r.freshness.reason})`}</Text>
            <Link href={r.evidence}>{`Record ${r.id}`}</Link>
          </Box>
        ))}
        <Text>{FOOTNOTE}</Text>
      </Box>
    );
  }
  if (result.kind === "none") {
    return (
      <Box>
        <Heading>{TITLE}</Heading>
        <Text>{NO_RECORD}</Text>
        <Text>{result.caip19}</Text>
      </Box>
    );
  }
  return (
    <Box>
      <Heading>{TITLE}</Heading>
      <Text>{`The record could not be fetched (${result.reason}).`}</Text>
      <Text>{result.caip19}</Text>
    </Box>
  );
};

/**
 * For the contract a pending transaction calls, fetch the free preview and show each record's state
 * and date with a link. No score, no severity, no advice: the insight never sets `severity`.
 */
export const onTransaction: OnTransactionHandler = async ({ transaction, chainId }) => {
  const caip19 = contractCaip19(chainId, transaction.to as string | undefined);
  return { content: <Insight result={caip19 ? await lookup(caip19) : null} /> };
};
