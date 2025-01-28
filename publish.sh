#!/bin/bash
pnpm build

# Publish to NPM
pnpm publish --access public --no-git-checks
