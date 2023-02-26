# Terraform Cloud actions

- [apply](apply/): Create a plan and apply run and optionally auto-apply it and wait for it to complete using the latest configuration version of a workspace.
- [outputs](outputs/): Get the outputs from a workspace.
- [destroy](destroy/): Create a destroy run and optionally auto-apply it and wait for it to complete.

Using these three actions, you can assemble a workflow to create, use, and destroy infrastructure managed by Terraform Cloud.

## Example Usage

```yaml
name: Nightly Test
on:
  workflow_dispatch:
  schedule:
    - cron: 0 0 * * *

jobs:
  infra:
    runs-on: ubuntu-latest
    steps:
      - name: Create infra
        uses: hashicorp-forge/terraform-cloud-action/apply@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: example-org
          workspace: my-workspace
          wait: true
          replace-addrs: |
            aws_instance.web

  tests:
    runs-on: ubuntu-latest
    needs: [ infra ]
    steps:
      # If your outputs contain secrets, it's better to fetch the outputs within the job
      # that is utilizing them. terraform-cloud-actions redacts sensitive output values and
      # therefore it is not possible to make those values job outputs.
      - name: Fetch Infra Secrets
        id: fetch
        uses: hashicorp-forge/terraform-cloud-action/outputs@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: example-org
          workspace: my-workspace

      - name: Checkout code
        uses: actions/checkout@v3

      - name: Tests
        run: go test ./...
        env:
          SOME_FOO: ${{ fromJSON(steps.fetch.outputs.workspace-outputs-json).foo }}
          SOME_BAR: ${{ fromJSON(steps.fetch.outputs.workspace-outputs-json).bar }}

  destroy-infra:
    runs-on: ubuntu-latest
    needs: [ tests ]
    if: "${{ always() }}"
    steps:
      - name: Destroy infra
        uses: hashicorp-forge/terraform-cloud-action/destroy@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: example-org
          workspace: my-workspace
```

## In Action

The [actions](actions) in this repo use themselves [in a CI workflow](blob/main/.github/workflows/ci.yml)
