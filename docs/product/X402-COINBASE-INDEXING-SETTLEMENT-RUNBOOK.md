# Coinbase Bazaar indexing settlement runbook

This procedure tests whether one valid CSOAI x402 resource becomes discoverable in Coinbase CDP after a real settlement. It is a distribution test. A payment funded by the operator is **SELF_TEST**, not revenue, customer demand, or product validation.

## Fixed test scope

- Resource: `https://councilof.ai/api/proof?bundle=1`
- Network: Base (`eip155:8453`)
- Asset: USDC
- Maximum resource price: 10,000 atomic USDC (0.01 USDC)
- Expected payee: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`
- Buyer: a different wallet controlled by the operator
- Facilitator under test: Coinbase CDP x402
- Allowed spend: exactly one resource payment plus Base network gas

Stop before signing if any live value differs from this scope.

## Before the wallet signature

1. Fetch the resource without payment and preserve the `402 Payment Required` response, `PAYMENT-REQUIRED` header, timestamp, and response body.
2. Decode the payment requirements and confirm the exact network, asset, amount, payee, resource URL, and scheme.
3. Submit the decoded requirements to the Coinbase CDP read-only validator and require `valid: true`.
4. Confirm the buyer address differs from the payee and has only the required USDC plus enough Base ETH for gas.
5. Obtain an explicit action-time authorization for this exact payment. General permission to operate is not a wallet signature authorization.

## Settlement

1. Request payment through the Coinbase CDP facilitator path.
2. Present the wallet transaction for human inspection and signature.
3. Sign only if the wallet shows Base, USDC, no token approval, the expected payee, and no more than 0.01 USDC plus gas.
4. Do not grant an unlimited allowance. Do not sign a second attempt until the first transaction has a final state.

## Evidence to preserve

- Request timestamp and final resource URL
- Unpaid 402 headers and decoded requirements
- Coinbase validator response
- Buyer and payee public addresses
- Transaction hash, chain, block, status, amount, and gas
- Paid response status and returned deliverable hash
- Any `PAYMENT-RESPONSE` or `EXTENSION-RESPONSES` values
- Coinbase search/list results before settlement and during polling
- PayAI listing state before and after settlement
- `/api/revenue` before and after settlement

Never store a private key, seed phrase, wallet export, API secret, or signed raw transaction in the repository.

## Index polling and verdict

Poll Coinbase discovery after settlement at 1, 5, 15, 30, and 60 minutes using the exact payee and resource URL.

- `OBSERVED_INDEXED`: the exact resource is returned by Coinbase discovery.
- `OBSERVED_NOT_INDEXED`: the exact resource is absent after the final poll.
- `UNCHECKABLE`: discovery, settlement, or evidence retrieval fails in a way that prevents a conclusion.

Record the result without claiming that the settlement created demand. The revenue endpoint must exclude this payment from non-self payer counts.

## Expansion gate

Do not pay the other nine valid resources unless this first test produces `OBSERVED_INDEXED` or Coinbase provides a documented reason that another compliant settlement would be informative. The maximum expansion budget is 0.09 USDC plus gas, and it requires a new explicit authorization.
