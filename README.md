# Terraform Cloud action

Create and destroy infrastructure by creating an apply run **followed by a destroy run** within a GitHub action workflow.

## Documentation
---

### Inputs

- `token` (**Required**): Terraform Cloud API access token
- `organization` (**Required**): The organization
- `workspace` (**Required**): The name of the workspace
- `cleanup` (**Required**): If set, the destroy run will be applied. This input should usually be true but exists to make sure you understand that infrastructure will be destroyed at the end of the workflow.
- `hostname` (**Optional**): The hostname (if not using Terraform Cloud) of the Terraform Enterprise instance. Defaults to `app.terraform.io`
- `auto-apply` (**Optional**): If set, applies changes when a Terraform plan is successful. Defaults to true.
- `message` (**Optional**): A custom message to associate with the run. Default to "Run created by GitHub action"
- `replace-addrs` (**Optional**): Multi-line list of resource addresses to be replaced. Use one address per line.
- `target-addrs` (**Optional**): Multi-line list of resource addresses that Terraform should focus its planning efforts on. Use one address per line.

[Read more about the Runs API](https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#create-a-run)

### Outputs

- `run-id`: The run ID for the created run.

## Example Usage

You can use this action in conjunction with `hashicorp-forge/terraform-cloud-outputs-action` to create infrastructure and fetch new outputs to help utilize it:

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
        id: tfc
        uses: hashicorp-forge/terraform-cloud-action@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: example-org
          workspace: my-workspace
          cleanup: true
    outputs:
      foo: ${{ fromJSON(steps.tfc.outputs.workspace-outputs-json).foo }}
      bar: ${{ fromJSON(steps.tfc.outputs.workspace-outputs-json).bar }}

  tests:
    runs-on: ubuntu-latest
    needs: [ infra ]
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Tests
        run: go test ./...
        env:
          SOME_FOO: ${{ needs.infra.outputs.foo }}
          SOME_BAR: ${{ needs.infra.outputs.bar }}
```
