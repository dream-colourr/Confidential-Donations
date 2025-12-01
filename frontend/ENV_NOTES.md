Local env notes
===============

Frontend Configuration for Zama Relayer Integration
====================================================

This frontend uses the real Zama relayer SDK for FHE encryption. It requires a reachable relayer endpoint.

**Default Relayer (Testnet):**
- `https://relayer.testnet.zama.org` (automatically used if VITE_RELAYER_URL is not set)

**Required Environment Variables (in `frontend/.env.local`):**

```bash
# Your deployed donation contract address
VITE_CONTRACT_ADDRESS=0x...

# Network RPC URL (Sepolia testnet)
VITE_NETWORK_URL=https://eth-sepolia.public.blastapi.io

# Optional: Override the default relayer URL
# VITE_RELAYER_URL=https://relayer.testnet.zama.org
```

**Zama FHE Relayer Addresses (Sepolia + Gateway):**
These are pre-configured and should not need changes for testnet:
- ACL Contract (Sepolia): `0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5`
- KMS Contract (Sepolia): `0x9D6891A6240D6130c54ae243d8005063D05fE14b`
- Verifying Contract (Gateway): `0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1` (decryption)
- Verifying Contract (Gateway): `0x7048C39f048125eDa9d678AEbaDfB22F7900a29F` (input verification)

**Troubleshooting:**

If you see "Relayer didn't response correctly. Bad JSON" or DNS errors:
1. Check if `VITE_RELAYER_URL` is set correctly (or leave blank to use default)
2. Verify the relayer hostname is reachable: `curl -I https://relayer.testnet.zama.org/v1/keyurl`
3. Ensure your network allows HTTPS outbound connections to the relayer
4. Check Zama docs: https://docs.zama.org/protocol/relayer-sdk-guides
