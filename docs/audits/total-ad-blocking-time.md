# Reduce Ad JS Blocking Time

## Overview

This audit measures how much [blocking time](https://web.dev/tbt/) is
attributable to ads scripts. This captures time where the JS thread is blocked
by an ad script for long enough to be noticeable by users when it impacts
input delay or content loading.

## Recommendations

The most important factor in ad JS blocking time is how many ads are being
loaded. Our recommendations are:

- Load fewer ads or reduce ad density, if feasible
- Lazy load ads below the fold
- Reduce batch sizes if using Single Request Architecture (SRA) in GPT.

