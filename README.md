# ServiceNow CI/CD GitHub Action for Activate Plugin

Activate a desired plugin on your ServiceNow instance

# Usage
## Step 1: Collect the data from ServiceNow
Collect all required data from the ServiceNow - username, password, instance
## Step 2: Configure Secrets in your GitHub repository
On GitHub, go in your repository settings, click on the secret _Secrets_ and create a new secret.

Create secrets called 
- `SNOW_USERNAME`
- `SNOW_PASSWORD`
- `SNOW_INSTALL_INSTANCE` **domain** only required from the url like https://**domain**.service-now.com

## Step 3: Configure the GitHub action
```yaml
- name: Activate Plugin 
  id: activate_plugin # id of the step
  uses: ServiceNow/sncicd_plugin_activate@1.0 # like username/repo-name
  with:
    pluginID: 
  env:
    snowUsername: ${{ secrets.SNOW_USERNAME }}
    snowPassword: ${{ secrets.SNOW_PASSWORD }}
    snowInstallInstance: ${{ secrets.SNOW_INSTALL_INSTANCE }}
```
Inputs:
- **pluginID** - Plugin ID to be installed (like com.servicenow_now_calendar)

Outputs:
- **failed** - Indicates if plugin installed correctly

Environment variable should be set up in the Step 1
- snowUsername - Username to ServiceNow instance
- snowPassword - Password to ServiceNow instance
- snowInstallInstance - ServiceNow instance where plugin will be activated

## Tests

Tests should be ran via npm commands:

#### Unit tests
```shell script
npm run test
```   

#### Integration test
```shell script
npm run integration
```   

## Build

```shell script
npm run buid
```

## Formatting and Linting
```shell script
npm run format
npm run lint
```

## Support Model

ServiceNow built this integration with the intent to help customers get started faster in adopting CI/CD APIs for DevOps workflows, but __will not be providing formal support__. This integration is therefore considered "use at your own risk", and will rely on the open-source community to help drive fixes and feature enhancements via Issues. Occasionally, ServiceNow may choose to contribute to the open-source project to help address the highest priority Issues, and will do our best to keep the integrations updated with the latest API changes shipped with family releases. This is a good opportunity for our customers and community developers to step up and help drive iteration and improvement on these open-source integrations for everyone's benefit. 
