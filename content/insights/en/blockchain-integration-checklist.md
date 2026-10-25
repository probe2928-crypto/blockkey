---
title: Blockchain integration checklist
date: 2026-10-24
category: Blockchain
summary: What to settle before you connect a Web3 service to your existing business systems.
---
Blockchain integration differs from an ordinary API integration in one way: a deployed contract and a sent transaction are hard to undo. Settle the following before development starts.

## Wallets and permissions
- Who can move the company's wallet, and with how many approvals (multisig)
- Where private keys and seed phrases are stored, and how they're handed over when people change roles
- How limits are split between the operating hot wallet and the cold wallet for storage

## API and webhook integration
- How on-chain events (deposits, transfers, contract calls) reach your existing systems
- How many block confirmations you wait for to guard against reorgs
- A fallback path when an external node or indexer goes down

## Security and operations monitoring
- Scope and schedule of the contract audit before deployment
- Thresholds for unusual-transaction alerts, and who receives them
- Records of admin actions (audit logs)

> More than half of this checklist is operating rules, not technology. That's why it has to be decided before development.
