# Apply action

A GitHub Action that creates an apply (or destroy) run in a Terraform Cloud workspace. Use this in conjunction with the [outputs action](../outputs) to assemble GitHub Action pipelines using infrastructure managed by Terraform Cloud.

## Documentation

### Inputs

- `token` (**Required**): Terraform Cloud API access token
- `organization` (**Required**): The organization
- `workspace` (**Required**): The name of the workspace
- `hostname` (**Optional**): The hostname (if not using Terraform Cloud) of the Terraform Enterprise instance. Defaults to `app.terraform.io`
- `wait` (**Optional**): If set, waits for the run to terminate and resources to be processed before the action finishes. Defaults to true.
- `auto-apply` (**Optional**): If set, applies changes when a Terraform plan is successful. Defaults to true.
- `is-destroy` (**Optional**): If set, a destroy plan will be run. Defaults to false.
- `message` (**Optional**): A custom message to associate with the run. Default to "Run created by GitHub action"
- `replace-addrs` (**Optional**): Multi-line list of resource addresses to be replaced. Use one address per line.
- `target-addrs` (**Optional**): Multi-line list of resource addresses that Terraform should focus its planning efforts on. Use one address per line.

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
  infra:
    runs-on: ubuntu-latest
    steps:
      - name: Create infra
        id: infra
        uses: hashicorp-forge/terraform-cloud-action/apply@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: example-org
          workspace: my-workspace
          wait: true
```
