# Template Typescript Action

A template repository for building javascript github actions in Typescript. Here is the tooling setup:

- [@vercel/ncc](https://github.com/vercel/ncc) compiles typescript to a single file
- ts-jest testing
- prettier formatting
- CI checks
- pre-commit protections

## Install

`npm install`
`npm prepare`

## Run Tests

`npm run test`

---

Example README for Actions follows

---

# Template Typescript Action

This action logs a phrase given as input

## Inputs

### `motd`

**Optional** The phrase to log
