---
title: Price, volume, TVL: reading different numbers differently
date: 2026-10-25
category: Data
summary: Volume, market cap and TVL measure different things. The basics to check before you decide anything.
---
Digital asset data comes with so many numbers that it's easy to misread. Here are three metrics that often get mixed up.

## Market cap and volume
- **Market cap** is price × circulating supply. It's how much the market currently values the asset.
- **24-hour volume** is the amount actually traded in a day. It shows liquidity: whether you can buy or sell when you want.

A large market cap with thin volume makes big orders hard to move. A sudden jump in volume means you should first check for an event such as a listing, an announcement or liquidations.

## TVL (Total Value Locked)
TVL is the **estimated dollar value of assets deposited** in a chain's or protocol's DeFi. It shows how much capital is tied up in an ecosystem, but it's different from volume or active users. TVL rises even when only the price of the deposited assets rises.

## Check when the data was updated
- Free APIs usually lag by tens of seconds to a few minutes.
- Providers aggregate different exchanges and rules, so numbers differ slightly.
- Showing **when the value was fetched** and **where it came from** is the baseline.

The BLOCKKEY [Markets](/markets/) page follows the same rule and shows the source and the last fetch time.
