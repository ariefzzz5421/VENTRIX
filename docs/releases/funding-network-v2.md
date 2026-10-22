# VENTRIX · Funding & Network release

Release candidate created from the existing green GitHub `main` build, which includes the interactive investment network, curated official funding rounds, updated project search, and research proxy performance dashboard.

## Release verification

- GitHub Actions: `npm run lint` and `npm run build`
- GitHub source is NOT equivalent to Vercel production until a deployment returns `READY`.
- After deployment, inspect `GET https://ventrix-kappa.vercel.app/api/release`; the `deployedCommit` should match the production deployment's GitHub commit SHA.
- Check `/network`, `/performance`, `/deals`, `/projects`, and `/api/funding-rounds` return HTTP 200.
- The `release` label describes an application feature set. It does not establish accuracy of unverified VC returns.

## When Vercel rejects deployments

A Vercel `api-deployments-free-per-day` 402 error is a quota block, not a Next.js compilation error.
Wait for quota reset or review account usage with the Vercel account owner, then deploy the current `main` SHA. Redeploying an older build cannot activate newer source.
