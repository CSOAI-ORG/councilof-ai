---
license: cc-by-4.0
pretty_name: Cross-ledger supply (issuer-listed deployments, evidence-labelled)
tags:
- tokenization
- stablecoins
- tokenized-funds
- deposit-tokens
- measurement
- merkle-proofs
- council-of-ai
size_categories:
- n<1K
configs:
- config_name: ots-upgraded-ots-upgrade
  data_files:
  - split: train
    path: ots-upgraded/*/OTS-UPGRADE.json
  default: true
- config_name: xl-daily-assets-bny-digital-cash
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/bny-digital-cash.json.gz
    - xl-daily/2026-09-27/assets/bny-digital-cash.json.gz
    - xl-daily/2026-09-28/assets/bny-digital-cash.json.gz
    - xl-daily/2026-09-29/assets/bny-digital-cash.json.gz
    - xl-daily/2026-09-30/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-01/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-02/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-03/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-06/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-07/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-08/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-16/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-17/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-18/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-19/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-20/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-21/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-22/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-23/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-24/assets/bny-digital-cash.json.gz
    - xl-daily/2026-10-25/assets/bny-digital-cash.json.gz
- config_name: xl-daily-assets-buidl
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/buidl.json.gz
    - xl-daily/2026-09-27/assets/buidl.json.gz
    - xl-daily/2026-09-28/assets/buidl.json.gz
    - xl-daily/2026-09-29/assets/buidl.json.gz
    - xl-daily/2026-09-30/assets/buidl.json.gz
    - xl-daily/2026-10-01/assets/buidl.json.gz
    - xl-daily/2026-10-02/assets/buidl.json.gz
    - xl-daily/2026-10-03/assets/buidl.json.gz
    - xl-daily/2026-10-06/assets/buidl.json.gz
    - xl-daily/2026-10-07/assets/buidl.json.gz
    - xl-daily/2026-10-08/assets/buidl.json.gz
    - xl-daily/2026-10-16/assets/buidl.json.gz
    - xl-daily/2026-10-17/assets/buidl.json.gz
    - xl-daily/2026-10-18/assets/buidl.json.gz
    - xl-daily/2026-10-19/assets/buidl.json.gz
    - xl-daily/2026-10-20/assets/buidl.json.gz
    - xl-daily/2026-10-21/assets/buidl.json.gz
    - xl-daily/2026-10-22/assets/buidl.json.gz
    - xl-daily/2026-10-23/assets/buidl.json.gz
    - xl-daily/2026-10-24/assets/buidl.json.gz
    - xl-daily/2026-10-25/assets/buidl.json.gz
- config_name: xl-daily-assets-citi-token-services
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/citi-token-services.json.gz
    - xl-daily/2026-09-27/assets/citi-token-services.json.gz
    - xl-daily/2026-09-28/assets/citi-token-services.json.gz
    - xl-daily/2026-09-29/assets/citi-token-services.json.gz
    - xl-daily/2026-09-30/assets/citi-token-services.json.gz
    - xl-daily/2026-10-01/assets/citi-token-services.json.gz
    - xl-daily/2026-10-02/assets/citi-token-services.json.gz
    - xl-daily/2026-10-03/assets/citi-token-services.json.gz
    - xl-daily/2026-10-06/assets/citi-token-services.json.gz
    - xl-daily/2026-10-07/assets/citi-token-services.json.gz
    - xl-daily/2026-10-08/assets/citi-token-services.json.gz
    - xl-daily/2026-10-16/assets/citi-token-services.json.gz
    - xl-daily/2026-10-17/assets/citi-token-services.json.gz
    - xl-daily/2026-10-18/assets/citi-token-services.json.gz
    - xl-daily/2026-10-19/assets/citi-token-services.json.gz
    - xl-daily/2026-10-20/assets/citi-token-services.json.gz
    - xl-daily/2026-10-21/assets/citi-token-services.json.gz
    - xl-daily/2026-10-22/assets/citi-token-services.json.gz
    - xl-daily/2026-10-23/assets/citi-token-services.json.gz
    - xl-daily/2026-10-24/assets/citi-token-services.json.gz
    - xl-daily/2026-10-25/assets/citi-token-services.json.gz
- config_name: xl-daily-assets-dai
  data_files:
  - split: train
    path: xl-daily/*/assets/dai.json.gz
- config_name: xl-daily-assets-swift-ledger
  data_files:
  - split: train
    path: xl-daily/*/assets/swift-ledger.json.gz
- config_name: xl-daily-assets-usdc
  data_files:
  - split: train
    path: xl-daily/*/assets/usdc.json.gz
- config_name: xl-daily-assets-usdg
  data_files:
  - split: train
    path: xl-daily/*/assets/usdg.json.gz
- config_name: xl-daily-assets-usds
  data_files:
  - split: train
    path: xl-daily/*/assets/usds.json.gz
- config_name: xl-daily-proofs-rlusd-base-rlusd-proof
  data_files:
  - split: train
    path: xl-daily/*/proofs/rlusd-base-RLUSD-proof.json.gz
- config_name: xl-daily-proofs-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-10-24/proofs/usdg-ethereum-USDG-proof.json.gz
    - xl-daily/2026-10-24/proofs/usdt-ethereum-USDT-proof.json.gz
    - xl-daily/2026-10-24/proofs/ustb-ethereum-USTB-proof.json.gz
    - xl-daily/2026-10-24/proofs/usyc-ethereum-USYC-proof.json.gz
    - xl-daily/2026-10-25/proofs/benji-ethereum-BENJI-proof.json.gz
    - xl-daily/2026-10-25/proofs/benji-ethereum-iBENJI-proof.json.gz
    - xl-daily/2026-10-25/proofs/eurau-ethereum-EURAU-proof.json.gz
    - xl-daily/2026-10-25/proofs/eurc-ethereum-EURC-proof.json.gz
    - xl-daily/2026-10-25/proofs/eurc-worldchain-EURC-proof.json.gz
    - xl-daily/2026-10-25/proofs/pyusd-ethereum-PYUSD-proof.json.gz
    - xl-daily/2026-10-25/proofs/rlusd-ethereum-RLUSD-proof.json.gz
    - xl-daily/2026-10-25/proofs/rlusd-optimism-RLUSD-proof.json.gz
    - xl-daily/2026-10-25/proofs/rlusd-xrplevm-RLUSD-proof.json.gz
    - xl-daily/2026-10-25/proofs/usd1-bsc-USD1-proof.json.gz
    - xl-daily/2026-10-25/proofs/usd1-ethereum-USD1-proof.json.gz
    - xl-daily/2026-10-25/proofs/usd1-mantle-USD1-proof.json.gz
    - xl-daily/2026-10-25/proofs/usdc-ethereum-USDC-proof.json.gz
    - xl-daily/2026-10-25/proofs/usdc-optimism-USDC-proof.json.gz
    - xl-daily/2026-10-25/proofs/usdc-worldchain-USDC-proof.json.gz
    - xl-daily/2026-10-25/proofs/usde-ethereum-USDe-proof.json.gz
    - xl-daily/2026-10-25/proofs/usdg-ethereum-USDG-proof.json.gz
    - xl-daily/2026-10-25/proofs/usdt-ethereum-USDT-proof.json.gz
    - xl-daily/2026-10-25/proofs/ustb-ethereum-USTB-proof.json.gz
    - xl-daily/2026-10-25/proofs/usyc-ethereum-USYC-proof.json.gz
- config_name: xl-daily-assets-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-09-28/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-09-29/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-09-30/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-01/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-02/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-03/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-06/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-07/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-08/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-16/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-17/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-18/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-19/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-20/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-21/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-22/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-23/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-24/assets/hsbc-tokenised-deposit-service.json.gz
    - xl-daily/2026-10-25/assets/hsbc-tokenised-deposit-service.json.gz
- config_name: xl-daily-signed-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/institutional-evidence-links-2026-09-27.signed.json
    - xl-daily/2026-09-28/institutional-evidence-links-2026-09-28.signed.json
    - xl-daily/2026-09-29/institutional-evidence-links-2026-09-29.signed.json
    - xl-daily/2026-09-30/institutional-evidence-links-2026-09-30.signed.json
    - xl-daily/2026-10-01/institutional-evidence-links-2026-10-01.signed.json
    - xl-daily/2026-10-02/institutional-evidence-links-2026-10-02.signed.json
    - xl-daily/2026-10-03/institutional-evidence-links-2026-10-03.signed.json
    - xl-daily/2026-10-06/institutional-evidence-links-2026-10-06.signed.json
    - xl-daily/2026-10-07/institutional-evidence-links-2026-10-07.signed.json
    - xl-daily/2026-10-08/institutional-evidence-links-2026-10-08.signed.json
    - xl-daily/2026-10-16/institutional-evidence-links-2026-10-16.signed.json
    - xl-daily/2026-10-17/institutional-evidence-links-2026-10-17.signed.json
    - xl-daily/2026-10-18/institutional-evidence-links-2026-10-18.signed.json
    - xl-daily/2026-10-19/institutional-evidence-links-2026-10-19.signed.json
    - xl-daily/2026-10-20/institutional-evidence-links-2026-10-20.signed.json
    - xl-daily/2026-10-21/institutional-evidence-links-2026-10-21.signed.json
    - xl-daily/2026-10-22/institutional-evidence-links-2026-10-22.signed.json
    - xl-daily/2026-10-23/institutional-evidence-links-2026-10-23.signed.json
    - xl-daily/2026-10-24/institutional-evidence-links-2026-10-24.signed.json
    - xl-daily/2026-10-25/institutional-evidence-links-2026-10-25.signed.json
- config_name: xl-daily-assets-ousg-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/ousg.json.gz
    - xl-daily/2026-09-27/assets/ousg.json.gz
    - xl-daily/2026-09-28/assets/ousg.json.gz
    - xl-daily/2026-09-29/assets/ousg.json.gz
    - xl-daily/2026-09-30/assets/ousg.json.gz
    - xl-daily/2026-10-01/assets/ousg.json.gz
    - xl-daily/2026-10-02/assets/ousg.json.gz
    - xl-daily/2026-10-06/assets/ousg.json.gz
    - xl-daily/2026-10-07/assets/ousg.json.gz
    - xl-daily/2026-10-08/assets/ousg.json.gz
    - xl-daily/2026-10-16/assets/ousg.json.gz
    - xl-daily/2026-10-17/assets/ousg.json.gz
    - xl-daily/2026-10-18/assets/ousg.json.gz
    - xl-daily/2026-10-19/assets/ousg.json.gz
    - xl-daily/2026-10-20/assets/ousg.json.gz
    - xl-daily/2026-10-21/assets/ousg.json.gz
    - xl-daily/2026-10-22/assets/ousg.json.gz
    - xl-daily/2026-10-23/assets/ousg.json.gz
    - xl-daily/2026-10-24/assets/ousg.json.gz
    - xl-daily/2026-10-25/assets/ousg.json.gz
- config_name: xl-daily-assets-usyc-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/usyc.json.gz
    - xl-daily/2026-09-27/assets/usyc.json.gz
    - xl-daily/2026-09-28/assets/usyc.json.gz
    - xl-daily/2026-09-29/assets/usyc.json.gz
    - xl-daily/2026-10-01/assets/usyc.json.gz
    - xl-daily/2026-10-02/assets/usyc.json.gz
    - xl-daily/2026-10-03/assets/usyc.json.gz
    - xl-daily/2026-10-06/assets/usyc.json.gz
    - xl-daily/2026-10-07/assets/usyc.json.gz
    - xl-daily/2026-10-08/assets/usyc.json.gz
    - xl-daily/2026-10-16/assets/usyc.json.gz
    - xl-daily/2026-10-17/assets/usyc.json.gz
    - xl-daily/2026-10-18/assets/usyc.json.gz
    - xl-daily/2026-10-19/assets/usyc.json.gz
    - xl-daily/2026-10-20/assets/usyc.json.gz
    - xl-daily/2026-10-21/assets/usyc.json.gz
    - xl-daily/2026-10-22/assets/usyc.json.gz
    - xl-daily/2026-10-23/assets/usyc.json.gz
    - xl-daily/2026-10-24/assets/usyc.json.gz
    - xl-daily/2026-10-25/assets/usyc.json.gz
- config_name: xl-daily-assets-usde-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/usde.json.gz
    - xl-daily/2026-09-27/assets/usde.json.gz
    - xl-daily/2026-09-28/assets/usde.json.gz
    - xl-daily/2026-09-29/assets/usde.json.gz
    - xl-daily/2026-09-30/assets/usde.json.gz
    - xl-daily/2026-10-01/assets/usde.json.gz
    - xl-daily/2026-10-02/assets/usde.json.gz
    - xl-daily/2026-10-03/assets/usde.json.gz
    - xl-daily/2026-10-06/assets/usde.json.gz
    - xl-daily/2026-10-07/assets/usde.json.gz
    - xl-daily/2026-10-08/assets/usde.json.gz
    - xl-daily/2026-10-18/assets/usde.json.gz
    - xl-daily/2026-10-19/assets/usde.json.gz
    - xl-daily/2026-10-20/assets/usde.json.gz
    - xl-daily/2026-10-21/assets/usde.json.gz
    - xl-daily/2026-10-22/assets/usde.json.gz
    - xl-daily/2026-10-23/assets/usde.json.gz
    - xl-daily/2026-10-24/assets/usde.json.gz
    - xl-daily/2026-10-25/assets/usde.json.gz
- config_name: xl-daily-assets-eurc-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-26/assets/eurc.json.gz
    - xl-daily/2026-09-27/assets/eurc.json.gz
    - xl-daily/2026-09-28/assets/eurc.json.gz
    - xl-daily/2026-09-29/assets/eurc.json.gz
    - xl-daily/2026-10-01/assets/eurc.json.gz
    - xl-daily/2026-10-03/assets/eurc.json.gz
    - xl-daily/2026-10-07/assets/eurc.json.gz
    - xl-daily/2026-10-08/assets/eurc.json.gz
    - xl-daily/2026-10-16/assets/eurc.json.gz
    - xl-daily/2026-10-17/assets/eurc.json.gz
    - xl-daily/2026-10-18/assets/eurc.json.gz
    - xl-daily/2026-10-19/assets/eurc.json.gz
    - xl-daily/2026-10-20/assets/eurc.json.gz
    - xl-daily/2026-10-21/assets/eurc.json.gz
    - xl-daily/2026-10-22/assets/eurc.json.gz
    - xl-daily/2026-10-23/assets/eurc.json.gz
    - xl-daily/2026-10-24/assets/eurc.json.gz
    - xl-daily/2026-10-25/assets/eurc.json.gz
- config_name: xl-daily-assets-usdt-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/assets/usdt.json.gz
    - xl-daily/2026-09-28/assets/usdt.json.gz
    - xl-daily/2026-09-29/assets/usdt.json.gz
    - xl-daily/2026-10-01/assets/usdt.json.gz
    - xl-daily/2026-10-02/assets/usdt.json.gz
    - xl-daily/2026-10-06/assets/usdt.json.gz
    - xl-daily/2026-10-07/assets/usdt.json.gz
    - xl-daily/2026-10-08/assets/usdt.json.gz
    - xl-daily/2026-10-16/assets/usdt.json.gz
    - xl-daily/2026-10-17/assets/usdt.json.gz
    - xl-daily/2026-10-18/assets/usdt.json.gz
    - xl-daily/2026-10-19/assets/usdt.json.gz
    - xl-daily/2026-10-20/assets/usdt.json.gz
    - xl-daily/2026-10-21/assets/usdt.json.gz
    - xl-daily/2026-10-22/assets/usdt.json.gz
    - xl-daily/2026-10-23/assets/usdt.json.gz
    - xl-daily/2026-10-24/assets/usdt.json.gz
    - xl-daily/2026-10-25/assets/usdt.json.gz
- config_name: xl-daily-assets-usdy-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/assets/usdy.json.gz
    - xl-daily/2026-09-28/assets/usdy.json.gz
    - xl-daily/2026-10-01/assets/usdy.json.gz
    - xl-daily/2026-10-02/assets/usdy.json.gz
    - xl-daily/2026-10-06/assets/usdy.json.gz
    - xl-daily/2026-10-07/assets/usdy.json.gz
    - xl-daily/2026-10-08/assets/usdy.json.gz
    - xl-daily/2026-10-16/assets/usdy.json.gz
    - xl-daily/2026-10-17/assets/usdy.json.gz
    - xl-daily/2026-10-18/assets/usdy.json.gz
    - xl-daily/2026-10-19/assets/usdy.json.gz
    - xl-daily/2026-10-20/assets/usdy.json.gz
    - xl-daily/2026-10-21/assets/usdy.json.gz
    - xl-daily/2026-10-22/assets/usdy.json.gz
    - xl-daily/2026-10-23/assets/usdy.json.gz
    - xl-daily/2026-10-24/assets/usdy.json.gz
    - xl-daily/2026-10-25/assets/usdy.json.gz
- config_name: xl-daily-assets-v2-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/assets/usd1.json.gz
    - xl-daily/2026-09-28/assets/usd1.json.gz
    - xl-daily/2026-09-29/assets/usd1.json.gz
    - xl-daily/2026-09-30/assets/usd1.json.gz
    - xl-daily/2026-10-01/assets/usd1.json.gz
    - xl-daily/2026-10-07/assets/usd1.json.gz
    - xl-daily/2026-10-08/assets/usd1.json.gz
    - xl-daily/2026-10-16/assets/usd1.json.gz
    - xl-daily/2026-10-17/assets/usd1.json.gz
    - xl-daily/2026-10-18/assets/usd1.json.gz
    - xl-daily/2026-10-20/assets/usd1.json.gz
    - xl-daily/2026-10-21/assets/usd1.json.gz
    - xl-daily/2026-10-22/assets/usd1.json.gz
    - xl-daily/2026-10-23/assets/usd1.json.gz
    - xl-daily/2026-10-25/assets/usd1.json.gz
- config_name: xl-daily-assets-ustb-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-10-06/assets/ustb.json.gz
    - xl-daily/2026-10-07/assets/ustb.json.gz
    - xl-daily/2026-10-08/assets/ustb.json.gz
    - xl-daily/2026-10-16/assets/ustb.json.gz
    - xl-daily/2026-10-17/assets/ustb.json.gz
    - xl-daily/2026-10-18/assets/ustb.json.gz
    - xl-daily/2026-10-19/assets/ustb.json.gz
    - xl-daily/2026-10-20/assets/ustb.json.gz
    - xl-daily/2026-10-21/assets/ustb.json.gz
    - xl-daily/2026-10-22/assets/ustb.json.gz
    - xl-daily/2026-10-23/assets/ustb.json.gz
    - xl-daily/2026-10-24/assets/ustb.json.gz
    - xl-daily/2026-10-25/assets/ustb.json.gz
- config_name: xl-daily-assets-jpmd-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/assets/jpmd.json.gz
    - xl-daily/2026-09-28/assets/jpmd.json.gz
    - xl-daily/2026-09-29/assets/jpmd.json.gz
    - xl-daily/2026-10-02/assets/jpmd.json.gz
    - xl-daily/2026-10-03/assets/jpmd.json.gz
    - xl-daily/2026-10-06/assets/jpmd.json.gz
    - xl-daily/2026-10-07/assets/jpmd.json.gz
    - xl-daily/2026-10-08/assets/jpmd.json.gz
    - xl-daily/2026-10-16/assets/jpmd.json.gz
    - xl-daily/2026-10-17/assets/jpmd.json.gz
    - xl-daily/2026-10-18/assets/jpmd.json.gz
    - xl-daily/2026-10-19/assets/jpmd.json.gz
- config_name: xl-daily-signed-v2-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/xl-daily-2026-09-27.signed.json
    - xl-daily/2026-09-28/xl-daily-2026-09-28.signed.json
    - xl-daily/2026-09-29/xl-daily-2026-09-29.signed.json
    - xl-daily/2026-09-30/xl-daily-2026-09-30.signed.json
    - xl-daily/2026-10-01/xl-daily-2026-10-01.signed.json
    - xl-daily/2026-10-02/xl-daily-2026-10-02.signed.json
    - xl-daily/2026-10-06/xl-daily-2026-10-06.signed.json
    - xl-daily/2026-10-07/xl-daily-2026-10-07.signed.json
    - xl-daily/2026-10-08/xl-daily-2026-10-08.signed.json
    - xl-daily/2026-10-18/xl-daily-2026-10-18.signed.json
    - xl-daily/2026-10-23/xl-daily-2026-10-23.signed.json
- config_name: xl-daily-assets-pyusd-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-09-27/assets/pyusd.json.gz
    - xl-daily/2026-09-28/assets/pyusd.json.gz
    - xl-daily/2026-09-29/assets/pyusd.json.gz
    - xl-daily/2026-09-30/assets/pyusd.json.gz
    - xl-daily/2026-10-01/assets/pyusd.json.gz
    - xl-daily/2026-10-02/assets/pyusd.json.gz
    - xl-daily/2026-10-03/assets/pyusd.json.gz
    - xl-daily/2026-10-06/assets/pyusd.json.gz
    - xl-daily/2026-10-07/assets/pyusd.json.gz
    - xl-daily/2026-10-08/assets/pyusd.json.gz
- config_name: xl-daily-assets-pyusd-v2-sample
  data_files:
  - split: train
    path:
    - xl-daily/2026-10-16/assets/pyusd.json.gz
    - xl-daily/2026-10-17/assets/pyusd.json.gz
    - xl-daily/2026-10-18/assets/pyusd.json.gz
    - xl-daily/2026-10-19/assets/pyusd.json.gz
    - xl-daily/2026-10-20/assets/pyusd.json.gz
    - xl-daily/2026-10-21/assets/pyusd.json.gz
    - xl-daily/2026-10-22/assets/pyusd.json.gz
    - xl-daily/2026-10-23/assets/pyusd.json.gz
    - xl-daily/2026-10-24/assets/pyusd.json.gz
    - xl-daily/2026-10-25/assets/pyusd.json.gz
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Cross-ledger supply — 2026-09-25

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

**Question.** For a token its issuer says lives on several ledgers: does each deployment the issuer
itself lists resolve as that token, and what supply (`totalSupply()` or the ledger's equivalent) does each
ledger's own state show?
Published by the Council of AI (CSOAI), an independent measurement layer. We measure; we never
certify. No institution named here is a client, partner or member of anything of ours.

## What it is NOT

An on-chain supply read is **not** AUM, NAV, ownership, redeemability, fund compliance, settlement
finality, reserves or backing. It is the ledger's `totalSupply()` (or equivalent) at a recorded height on one
ledger, which includes any tokens the issuer itself holds; it is not issued or circulating supply. It must
be reconciled against the controlling record (a fund's transfer-agent register, a bank's deposit
ledger); **no such reconciliation exists here**, and every record says so
(`reconciliation_state`, e.g. `UNRECONCILED_WITH_TRANSFER_AGENT`). An issuer's own figure is kept in a
separate `issuer_reported` block, never merged with measured supply — the issuer's statement is the
claim, not the evidence.

## Method

1. **Deployment list only from the issuer's own public page** (URL, fetched_at, sha256 of the bytes in
   each record). If no issuer-published list exists: `ISSUER_LIST_UNAVAILABLE`, nothing read
   (explorer/aggregator addresses are not issuer lists). If the issuer says the token lives on a
   private ledger: `PERMISSIONED_NOT_READABLE`, with the issuer's sentence.
2. Each deployment is read from its ledger's public endpoints. **EVM**: the `totalSupply` storage slot
   is found empirically over a declared candidate set (slots 0..64 + the OpenZeppelin ERC-7201 ERC20
   namespace), proven with `eth_getProof` and verified in the reader against the stateRoot of a block
   whose hash the reader recomputes from the header fields. **Stellar, Solana, Aptos, Sui, XRPL,
   Hedera**: operator APIs, with a second independent operator where a keyless one exists.
3. Identity: the on-ledger symbol / asset code / metadata symbol must equal the product ticker the
   issuer page names, else `REJECTED` and no supply is counted.
4. **Sums per product and per evidence kind only.** Products on one issuer page (BENJI, iBENJI,
   gBENJI, …) are different instruments and are never added.

## Evidence ladder

| kind | meaning |
|---|---|
| `STATE_PROOF_VERIFIED` | Merkle proof verified here against the stateRoot of a header whose hash was recomputed here; proven value == API value. Header not checked against consensus; an L2 header is not checked against L1. |
| `STATE_PROOF_RECORDED` | proof kept but not fully verified (failed, or the header hash could not be recomputed for that chain's header format); reason in the row |
| `OPERATOR_API` | one operator's answer; `two_operators_agree` records a second independent operator. Agreement is not a proof. |
| `UNCHECKABLE` | read failed; error kept. Never zero, never absent. |
| `REJECTED` | identity did not match; no supply counted |

## Reads

| record (issuer page) | product | ledger | supply (token units) | evidence | two operators agree | height |
|---|---|---|---|---|---|---|
| USDC | USDC | ethereum | 50430781860.131977 | `STATE_PROOF_VERIFIED` | true | 26051941 |
| USDC | USDC | solana | 8217034486.977972 | `OPERATOR_API` | true | 450242496 |
| USDC | USDC | stellar | 351156763.2854447 | `OPERATOR_API` | true | 64604829 |
| USDC | USDC | hedera | 450010110.000000 | `OPERATOR_API` | NOT_TRIED | 100361996 |
| USDC | USDC | sui | 308316102.717780 | `OPERATOR_API` | true | 326606936 |
| USDC | USDC | noble | 103762748.544811 | `STATE_PROOF_VERIFIED` | true | 60056091 |
| USDC | USDC | xrpl | 4617919.108900781 | `OPERATOR_API` | true | 107218481 |
| USDC | USDC | arbitrum | 2936979871.811699 | `OPERATOR_API` | NOT_TRIED | 508654840 |
| USDC | USDC | avalanche | 400293471.158739 | `OPERATOR_API` | NOT_TRIED | 96099554 |
| USDC | USDC | base | 4294533060.719965 | `OPERATOR_API` | NOT_TRIED | 51760296 |
| USDC | USDC | celo | 15228623.488166 | `OPERATOR_API` | NOT_TRIED | 78409182 |
| USDC | USDC | hyperevm | 6833999685.532186 | `OPERATOR_API` | NOT_TRIED | 46821059 |
| USDC | USDC | linea | 24249450.507182 | `OPERATOR_API` | NOT_TRIED | 32136842 |
| USDC | USDC | optimism | 166249049.371377 | `OPERATOR_API` | NOT_TRIED | 157355585 |
| USDC | USDC | polygon | 605542291.149054 | `OPERATOR_API` | NOT_TRIED | 94403206 |
| USDC | USDC | sonic | 126238586.178445 | `OPERATOR_API` | NOT_TRIED | 79869922 |
| USDC | USDC | unichain | 23588472.591813 | `OPERATOR_API` | NOT_TRIED | 59561588 |
| USDC | USDC | zksync | 10636491.412155 | `OPERATOR_API` | NOT_TRIED | 72209107 |
| BENJI | BENJI | stellar | 430691880.4855482 | `OPERATOR_API` | true | 64609792 |
| BENJI | BENJI | polygon | 32206461.812513615916650543 | `STATE_PROOF_VERIFIED` | true | 94419754 |
| BENJI | BENJI | arbitrum | 47950819.162464907015564307 | `STATE_PROOF_VERIFIED` | true | 508744906 |
| BENJI | BENJI | avalanche | 34309356.142162081852426527 | `STATE_PROOF_RECORDED` | true | 96120688 |
| BENJI | BENJI | aptos | 14713483.381624994 | `OPERATOR_API` | true | 7356338123 |
| BENJI | BENJI | ethereum | 48209314.242417926951548284 | `STATE_PROOF_VERIFIED` | true | 26054009 |
| BENJI | BENJI | base | 59725674.950165151280437460 | `STATE_PROOF_VERIFIED` | true | 51772802 |
| BENJI | BENJI | solana | 209512.057557357 | `OPERATOR_API` | true | 450336516 |
| BENJI | gBENJI | stellar | 56720355.5672037 | `OPERATOR_API` | true | 64609839 |
| BENJI | iBENJI | ethereum | 195922530.492655972484309178 | `STATE_PROOF_VERIFIED` | true | 26054041 |
| BENJI | iBENJI | bsc | 1524087437.202981538514940268 | `STATE_PROOF_VERIFIED` | true | 123939466 |
| BENJI | sgBENJI | stellar | 24352527.5694453 | `OPERATOR_API` | true | 64609854 |
| BENJI | grBENJI | stellar | 516072.2845994 | `OPERATOR_API` | true | 64609855 |
| JPMD | JPMD | base | 1001000.00 | `STATE_PROOF_VERIFIED` | true | 51772880 |
| BUIDL | — | — | — | `ISSUER_LIST_UNAVAILABLE` | — | — |
| Citi Token Services (tokenized deposits) | — | — | — | `PERMISSIONED_NOT_READABLE` | — | — |
| HSBC Tokenised Deposit Service | — | — | — | `PERMISSIONED_NOT_READABLE` | — | — |
| BNY digital cash / tokenized deposits | — | — | — | `PERMISSIONED_NOT_READABLE` | — | — |

## Issuer-reported (kept apart)

BENJI's fund (Franklin OnChain U.S. Government Money Fund, series `S000067043`) reports in its
SEC N-MFP3 for 2026-08-31 (filed 2026-09-04, accession `0002071691-26-021281`):
net assets USD 686635362.22, shares outstanding 686637083.5800; transfer
agent named in the filing: Franklin Templeton Investor Services LLC. **Not compared** with the ledger reads:
different date, a share count is not a ledger supply, and no transfer-agent register is public.

## Records, signatures, timestamps

| asset | issuer list | signed_at (Ed25519, did:web:csoai.org#board-attestation-1) | OpenTimestamps |
|---|---|---|---|
| usdc | `READ` | 2026-09-25T11:22:18.153Z | PENDING_CALENDAR_COMMITMENT |
| benji | `READ` | 2026-09-25T11:22:15.085Z | PENDING_CALENDAR_COMMITMENT |
| jpmd | `READ` | 2026-09-25T11:22:17.940Z | PENDING_CALENDAR_COMMITMENT |
| buidl | `ISSUER_LIST_UNAVAILABLE` | 2026-09-25T11:22:16.580Z | PENDING_CALENDAR_COMMITMENT |
| citi-token-services | `PERMISSIONED_NOT_READABLE` | 2026-09-25T11:22:17.186Z | PENDING_CALENDAR_COMMITMENT |
| hsbc-tokenised-deposit-service | `PERMISSIONED_NOT_READABLE` | 2026-09-25T11:22:17.529Z | PENDING_CALENDAR_COMMITMENT |
| bny-digital-cash | `PERMISSIONED_NOT_READABLE` | 2026-09-25T11:22:16.030Z | PENDING_CALENDAR_COMMITMENT |

The USDC record is the 2026-09-25 04:18Z pilot run, bytes unchanged; it was signed later the same day
(its internal "unsigned" status line describes the run, not the signature). `institutional-evidence-links.json`
maps the estate's institutional binding keys to these records, or to `UNMEASURED` with the reason.

Paths: a record's site path `/interop/X` is dataset path `interop/X`. `cross_ledger_assets.json` is the
asset registry (asset → issuer list → per-ledger adapter) the reader ran from.

## How to verify

**Signature.** In `X.signed.json`: serialise `payload` as JSON, keys sorted recursively, no whitespace,
UTF-8; its sha256 must equal `signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of
`X.json`. Verify `signature.sig_ed25519` (hex) with the `#board-attestation-1` Ed25519 key
(`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json. Change one byte: it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("interop/cross-ledger-benji-2026-09-25.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("interop/cross-ledger-benji-2026-09-25.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
# csoai.org answers 403 to Python's default User-Agent, so send a named one
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)"})))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
```

**Proofs.** Each `interop/cross-ledger-<asset>-2026-09-25/<ledger>-<product>-proof.json` carries the header,
the `eth_getProof` response and `how_to_check`: keccak(rlp(header)) == block_hash; walk accountProof from
stateRoot along keccak(address); storageRoot == storageHash; walk storageProof along keccak(slot); leaf ==
rlp(totalSupply). No trust in us is needed for that step; trust in the header remains (no light client).

**Timestamp.** `ots upgrade X.json.ots` then `ots verify X.json.ots`. At publication each proof held pending
calendar attestations: a **pending calendar commitment, not a Bitcoin attestation**.

Without a Bitcoin node (a full `ots verify` needs one), check an upgraded proof offline and compare the merkle root with a
public block explorer (two independent ones is better):

```sh
# (a pending proof must first be upgraded: ots upgrade <proof>)
ots --no-bitcoin verify -f interop/cross-ledger-usdc-2026-09-25.json interop/cross-ledger-usdc-2026-09-25.json.bitcoin.ots
# -> "To verify manually, check that Bitcoin block H has merkleroot M"
B=$(curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block-height/H)
curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# must print M; repeat against https://blockstream.info/api/...
```

## Contact, objections and re-checks

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the contract, ledger or issuer page you mean.
- **Ask for a re-check.** Reply with the contract, ledger or issuer page. We re-measure it with the same read-only instrument and run a tamper
  control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future reads.** Name the contract, ledger or issuer page. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), and the next run honours it before sending
  any request and records the skip by name. The reader behind this dataset (`scripts/readers/cross_ledger_funds.py`) does not yet read that list in code; until it does, an entry is honoured by hand before the next run, and the skip is still recorded by name.
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

## Changelog

- **2026-09-26 — correction C-2026-0926-06: `xl-daily/2026-09-26/v2/` supersedes `xl-daily/2026-09-26/`.**
  The daily record `xl-daily/2026-09-26/xl-daily-2026-09-26.json` (sha256 `b02851fcbc8ea5ad6460c6c847e8af9eaec74d36a09121989590dc180a5d700d`,
  dataset commit `d58a0a7b`) graded three Tether deployments `INCONSISTENT`: EUR₮ on Ethereum, CNH₮ on Ethereum and CNH₮ on Tron.
  The reason given was that Tether's supported-protocols page lists them under "Deprecated Asset Protocols:" while their ledgers
  show `totalSupply()` of 50,000,050, 25,000,000 and 20,000,000. "Deprecated" states no supply figure, so there were never two
  statements that differ. The three rows are now `NOT_A_SUPPLY_CLAIM` (recorded, not compared), and the USDT record's parity state
  is `UNCHECKABLE` (some of its listed deployments are not read), not `INCONSISTENT`. The record also called `totalSupply()`
  "issued supply". In Tether's own terms `totalSupply()` is "total authorized", which includes tokens the issuer holds as not
  issued, so the record now says `totalSupply()` (or the ledger's equivalent). This card's two uses of "issued supply" are
  corrected the same way.
  The corrected record `xl-daily/2026-09-26/v2/xl-daily-2026-09-26.json` (sha256 `6acf5f9e976e790efef2ce459e0cc47e1234443ce4b198ce45840ec29a8238e1`)
  was re-derived from the same reads. No ledger, issuer page or value source was re-read, and every supply figure, height and
  evidence kind is unchanged. `xl-daily/2026-09-26/correction-C-2026-0926-06.diff.json` lists every changed path. The original record stays published byte for byte with
  its signature and timestamp proof. This says nothing about Tether's reserves, solvency or redemptions.
  Ledger entry: https://councilof.ai/api/corrections (`C-2026-0926-06`).

## Citation

```bibtex
@misc{csoai_cross_ledger_supply_2026,
  author       = {{Council of AI (CSOAI)}},
  title        = {Cross-ledger supply: issuer-listed deployments, 2026-09-25},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/cross-ledger-supply}}
}
```

## Licence

CC-BY-4.0. Cite as: Council of AI (CSOAI), *Cross-ledger supply, issuer-listed deployments, 2026-09-25*,
csoai/cross-ledger-supply. Reader: `scripts/readers/cross_ledger_funds.py` (councilof-ai repository).

## Timestamp status

Checked 2026-09-25T13:57Z by `ots upgrade` on a copy of each published pending proof. A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it. BITCOIN_ATTESTED means the proof carries a BitcoinBlockHeaderAttestation whose commitment (byte-reversed) equals the merkle root of the block header at that height as served by **two independent public sources** (blockstream.info and mempool.space; each raw header also double-SHA256s to the block hash it is served under). No local Bitcoin node was used. Details: `ots-bitcoin-check-2026-09-25.json`.

- `interop/cross-ledger-benji-2026-09-25.json` (sha256 `51ec46fbe5ab0d30d0a68ed35bb63ee48517a08a9f7cc4b751b415c9544fed77`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-benji-2026-09-25.json.bitcoin.ots` (sha256 `88a562149a503679c2d2c95f7054396c1a4050f11ed1f0be07250edb5b578b77`); the published pending proof `interop/cross-ledger-benji-2026-09-25.json.ots` is unchanged.
- `interop/cross-ledger-bny-digital-cash-2026-09-25.json` (sha256 `ec9bf90130e449a01c4814a697dac351a02abc832cd2c426db3255ef1bbf03c9`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-bny-digital-cash-2026-09-25.json.bitcoin.ots` (sha256 `8ce63ae7b3c5ffc491a5c31781a79e1f7eb5a69043dbe5476b4611e65d463d5d`); the published pending proof `interop/cross-ledger-bny-digital-cash-2026-09-25.json.ots` is unchanged.
- `interop/cross-ledger-buidl-2026-09-25.json` (sha256 `cf280c0b6c99359e86767c0f646a287835b33ee6c34bc2a46164c2c23034db56`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-buidl-2026-09-25.json.bitcoin.ots` (sha256 `e117c4c6b258b9b0300338e2c99b7e96d1775fa09c14255381c3312835e297d1`); the published pending proof `interop/cross-ledger-buidl-2026-09-25.json.ots` is unchanged.
- `interop/cross-ledger-citi-token-services-2026-09-25.json` (sha256 `796c03215483b769e07354b488109e9b1c58a25e3b1653c43745f825d265bcab`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-citi-token-services-2026-09-25.json.bitcoin.ots` (sha256 `deb8a6abf11e3942e7c9a310be9560f1c4309b5d62395d843e4e9d1d6b56cf27`); the published pending proof `interop/cross-ledger-citi-token-services-2026-09-25.json.ots` is unchanged.
- `interop/cross-ledger-hsbc-tokenised-deposit-service-2026-09-25.json` (sha256 `48dd4f9722bd1d27836fa65cfc4081b45c41eee51fea7d686b3483fd7ac364e3`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-hsbc-tokenised-deposit-service-2026-09-25.json.bitcoin.ots` (sha256 `d2c98df75c87b1776f1b3924633f457f3c1d8108415720a8fe81f58ffcf51fad`); the published pending proof `interop/cross-ledger-hsbc-tokenised-deposit-service-2026-09-25.json.ots` is unchanged.
- `interop/cross-ledger-jpmd-2026-09-25.json` (sha256 `ce0e151f6dd0806c9daa691f220684547e0290200679ae5e778d81866eda106b`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-jpmd-2026-09-25.json.bitcoin.ots` (sha256 `88f6d1a59944e85a406a0a04e8fff926162d6b00643cb93779af329a38cf7416`); the published pending proof `interop/cross-ledger-jpmd-2026-09-25.json.ots` is unchanged.
- `interop/cross-ledger-usdc-2026-09-25.json` (sha256 `1a1009dc98a6a459d00e9f34a1581c295a0f803d832111b04531513ad642b63a`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/cross-ledger-usdc-2026-09-25.json.bitcoin.ots` (sha256 `e30131ab616af7f6efbef57259196edaec179b34a9ae7bb95e3157ec47e7e927`); the published pending proof `interop/cross-ledger-usdc-2026-09-25.json.ots` is unchanged.
- `interop/institutional-evidence-links.json` (sha256 `93bf6eae5289f0d000363ef512a91d84ae583d4f6ee43fe57678f724bf45fbf3`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `interop/institutional-evidence-links.json.bitcoin.ots` (sha256 `c7afad76ca87c4b289260a3020bc5252a41a550330f355f00a70a4e4a8b229c1`); the published pending proof `interop/institutional-evidence-links.json.ots` is unchanged.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *Cross-ledger supply (issuer-listed deployments, evidence-labelled)*. 2026. Hugging Face dataset `csoai/cross-ledger-supply`. https://huggingface.co/datasets/csoai/cross-ledger-supply

```bibtex
@misc{csoai_cross_ledger_supply,
  title        = {Cross-ledger supply (issuer-listed deployments, evidence-labelled)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/cross-ledger-supply},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- DATA-ACCESS:START -->
## Read this product

This is a structured evidence archive, not a training table. The automatic table viewer is disabled because the repository contains documents with different schemas, signatures or timestamp proofs. All original evidence files remain available.

```python
import json
from huggingface_hub import hf_hub_download
path = hf_hub_download("csoai/cross-ledger-supply", "cross_ledger_assets.json", repo_type="dataset")
with open(path, encoding="utf-8") as source:
    document = json.load(source)
records = document["assets"]
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `ots-upgraded-ots-upgrade` (default) | `ots-upgraded/*/OTS-UPGRADE.json` | 21 |
| `xl-daily-assets-bny-digital-cash` | `xl-daily/2026-09-26/assets/bny-digital-cash.json.gz`, `xl-daily/2026-09-27/assets/bny-digital-cash.json.gz`, `xl-daily/2026-09-28/assets/bny-digital-cash.json.gz` … (+18) | 21 |
| `xl-daily-assets-buidl` | `xl-daily/2026-09-26/assets/buidl.json.gz`, `xl-daily/2026-09-27/assets/buidl.json.gz`, `xl-daily/2026-09-28/assets/buidl.json.gz` … (+18) | 21 |
| `xl-daily-assets-citi-token-services` | `xl-daily/2026-09-26/assets/citi-token-services.json.gz`, `xl-daily/2026-09-27/assets/citi-token-services.json.gz`, `xl-daily/2026-09-28/assets/citi-token-services.json.gz` … (+18) | 21 |
| `xl-daily-assets-dai` | `xl-daily/*/assets/dai.json.gz` | 21 |
| `xl-daily-assets-swift-ledger` | `xl-daily/*/assets/swift-ledger.json.gz` | 21 |
| `xl-daily-assets-usdc` | `xl-daily/*/assets/usdc.json.gz` | 21 |
| `xl-daily-assets-usdg` | `xl-daily/*/assets/usdg.json.gz` | 21 |
| `xl-daily-assets-usds` | `xl-daily/*/assets/usds.json.gz` | 21 |
| `xl-daily-proofs-rlusd-base-rlusd-proof` | `xl-daily/*/proofs/rlusd-base-RLUSD-proof.json.gz` | 21 |
| `xl-daily-proofs-sample` | `xl-daily/2026-10-24/proofs/usdg-ethereum-USDG-proof.json.gz`, `xl-daily/2026-10-24/proofs/usdt-ethereum-USDT-proof.json.gz`, `xl-daily/2026-10-24/proofs/ustb-ethereum-USTB-proof.json.gz` … (+21) | 24 |
| `xl-daily-assets-sample` | `xl-daily/2026-09-27/assets/hsbc-tokenised-deposit-service.json.gz`, `xl-daily/2026-09-28/assets/hsbc-tokenised-deposit-service.json.gz`, `xl-daily/2026-09-29/assets/hsbc-tokenised-deposit-service.json.gz` … (+17) | 20 |
| `xl-daily-signed-sample` | `xl-daily/2026-09-27/institutional-evidence-links-2026-09-27.signed.json`, `xl-daily/2026-09-28/institutional-evidence-links-2026-09-28.signed.json`, `xl-daily/2026-09-29/institutional-evidence-links-2026-09-29.signed.json` … (+17) | 20 |
| `xl-daily-assets-ousg-sample` | `xl-daily/2026-09-26/assets/ousg.json.gz`, `xl-daily/2026-09-27/assets/ousg.json.gz`, `xl-daily/2026-09-28/assets/ousg.json.gz` … (+17) | 20 |
| `xl-daily-assets-usyc-sample` | `xl-daily/2026-09-26/assets/usyc.json.gz`, `xl-daily/2026-09-27/assets/usyc.json.gz`, `xl-daily/2026-09-28/assets/usyc.json.gz` … (+17) | 20 |
| `xl-daily-assets-usde-sample` | `xl-daily/2026-09-26/assets/usde.json.gz`, `xl-daily/2026-09-27/assets/usde.json.gz`, `xl-daily/2026-09-28/assets/usde.json.gz` … (+16) | 19 |
| `xl-daily-assets-eurc-sample` | `xl-daily/2026-09-26/assets/eurc.json.gz`, `xl-daily/2026-09-27/assets/eurc.json.gz`, `xl-daily/2026-09-28/assets/eurc.json.gz` … (+15) | 18 |
| `xl-daily-assets-usdt-sample` | `xl-daily/2026-09-27/assets/usdt.json.gz`, `xl-daily/2026-09-28/assets/usdt.json.gz`, `xl-daily/2026-09-29/assets/usdt.json.gz` … (+15) | 18 |
| `xl-daily-assets-usdy-sample` | `xl-daily/2026-09-27/assets/usdy.json.gz`, `xl-daily/2026-09-28/assets/usdy.json.gz`, `xl-daily/2026-10-01/assets/usdy.json.gz` … (+14) | 17 |
| `xl-daily-assets-v2-sample` | `xl-daily/2026-09-27/assets/usd1.json.gz`, `xl-daily/2026-09-28/assets/usd1.json.gz`, `xl-daily/2026-09-29/assets/usd1.json.gz` … (+12) | 15 |
| `xl-daily-assets-ustb-sample` | `xl-daily/2026-10-06/assets/ustb.json.gz`, `xl-daily/2026-10-07/assets/ustb.json.gz`, `xl-daily/2026-10-08/assets/ustb.json.gz` … (+10) | 13 |
| `xl-daily-assets-jpmd-sample` | `xl-daily/2026-09-27/assets/jpmd.json.gz`, `xl-daily/2026-09-28/assets/jpmd.json.gz`, `xl-daily/2026-09-29/assets/jpmd.json.gz` … (+9) | 12 |
| `xl-daily-signed-v2-sample` | `xl-daily/2026-09-27/xl-daily-2026-09-27.signed.json`, `xl-daily/2026-09-28/xl-daily-2026-09-28.signed.json`, `xl-daily/2026-09-29/xl-daily-2026-09-29.signed.json` … (+8) | 11 |
| `xl-daily-assets-pyusd-sample` | `xl-daily/2026-09-27/assets/pyusd.json.gz`, `xl-daily/2026-09-28/assets/pyusd.json.gz`, `xl-daily/2026-09-29/assets/pyusd.json.gz` … (+7) | 10 |
| `xl-daily-assets-pyusd-v2-sample` | `xl-daily/2026-10-16/assets/pyusd.json.gz`, `xl-daily/2026-10-17/assets/pyusd.json.gz`, `xl-daily/2026-10-18/assets/pyusd.json.gz` … (+7) | 10 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/cross-ledger-supply", "ots-upgraded-ots-upgrade", split="train")
```

<!-- csoai-card-fixes:end -->
