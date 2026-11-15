# Current balance

The current unified-carrier and sparse-reward rules are documented in [FUSION-ECONOMY.md](FUSION-ECONOMY.md). The previous simultaneous multi-weapon model has been replaced.

Tri Attack total direct damage retains 65% / 50%, Swift 55% / 40%, with multiplicative combined penalties. Floor HP remains `1 + 0.4L + 0.075L²`; Gengar HP is 180 / 270 / 380 / 520 / 680. Mewtwo HP remains 420 / 520 / 640. Firing cancels entry grace; damage invulnerability remains separate.

Run `node --import tsx scripts/balance-audit.ts` for 300-seed reward-economy and stationary damage projections. See the current report for assumptions, bounds and observed browser checks.
