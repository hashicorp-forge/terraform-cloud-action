# Destroy action

A GitHub Action that creates a destroy run in an HCP Terraform workspace. Usually used to tear down infrastructure that you created with the apply action.

## Documentation

### Inputs

- `token` (**Required**): HCP Terraform API access token
- `organization` (**Required**): The organization
- `workspace` (**Required**): The name of the workspace
- `hostname` (**Optional**): The hostname (if not using HCP Terraform) of the Terraform Enterprise instance. Defaults to `app.terraform.io`
- `wait` (**Optional**): If set, waits for the run to terminate and resources to be processed before the action finishes. Defaults to false.
- `auto-apply` (**Optional**): If set, applies changes when a Terraform plan is successful. Defaults to true.
- `message` (**Optional**): A custom message to associate with the run. Default to "Run created by GitHub action"

[Read more about the Runs API](https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#create-a-run)

### Outputs

- `run-id`: The run ID for the created run.

## Example Usage

```yaml
name: Nightly Test
on:
  workflow_dispatch:
  schedule:
    - cron: 0 0 * * *

jobs:
  # .. create and use infra in jobs

  destroy-infra:
    name: Destroy infrastructure
    runs-on: ubuntu-latest
    needs: [ tests ]
    if: "${{ always() }}"
    steps:
      - uses: hashicorp-forge/terraform-cloud-action/destroy@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: example-org
          workspace: my-workspace
```
