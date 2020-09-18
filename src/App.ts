import * as core from '@actions/core'
import axios from 'axios'

import {
    RequestResult,
    AppProps,
    axiosConfig,
    Errors,
    RequestResponse,
    ResponseStatus,
    User,
    ErrorResult,
} from './App.types'

export default class App {
    sleepTime = 3000
    user: User
    config: axiosConfig
    props: AppProps
    errCodeMessages: any = {
        401: 'The user credentials are incorrect.',
        403: 'Forbidden. The user is not an admin or does not have the CICD role.',
        404: 'Not found. The requested item was not found.',
        405: 'Invalid method. The functionality is disabled.',
        409: 'Conflict. The requested item is not unique.',
        500: 'Internal server error. An unexpected error occurred while processing the request.',
    }

    constructor(props: AppProps) {
        this.props = props
        this.user = {
            username: props.username,
            password: props.password,
        }
        this.config = {
            headers: { Accept: 'application/json' },
            auth: this.user,
        }
    }

    /**
     * @param plugin_id
     *
     * @returns string  Url to API
     */
    buildRequestUrl(plugin_id: string): string {
        if (!this.props.snowInstallInstance || !plugin_id) throw new Error(Errors.INCORRECT_CONFIG)

        return `https://${this.props.snowInstallInstance}.service-now.com/api/sn_cicd/plugin/${encodeURIComponent(
            plugin_id,
        )}/activate`
    }

    /**
     * Get plugin id
     * Makes the request to SNow api plugin/{plugin_id}/activate
     * Prints the progress
     * @returns         Promise void
     */
    async activatePlugin(): Promise<void | never> {
        try {
            const plugin_id: string = this.getPluginID()

            const url: string = this.buildRequestUrl(plugin_id)
            const response: RequestResponse = await axios.post(url, {}, this.config)
            await this.printStatus(response.data.result)
        } catch (error) {
            let message: string
            if (error.response && error.response.status) {
                if (this.errCodeMessages[error.response.status]) {
                    message = this.errCodeMessages[error.response.status]
                } else {
                    const result: ErrorResult = error.response.data.result
                    message = result.error || result.status_message
                }
            } else {
                message = error.message
            }
            throw new Error(message)
        }
    }

    /**
     * Some kind of throttling, it used to limit the number of requests
     * in the recursion
     *
     * @param ms    Number of milliseconds to wait
     *
     * @returns     Promise void
     */
    sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    /**
     * Print the result of the task.
     * Task will be working until it get the response with successful or failed or canceled status.
     * Set output rollBack_version variable
     *
     * @param result    TaskResult enum of Succeeded, SucceededWithIssues, Failed, Cancelled or Skipped.
     *
     * @returns         void
     */
    async printStatus(result: RequestResult): Promise<void> {
        if (+result.status === ResponseStatus.Pending) console.log(result.status_label)

        if (+result.status === ResponseStatus.Running || +result.status === ResponseStatus.Successful)
            console.log(`${result.status_label}: ${result.percent_complete}%`)

        // Recursion to check the status of the request
        if (+result.status < ResponseStatus.Successful) {
            const response: RequestResponse = await axios.get(result.links.progress.url, this.config)
            // Throttling
            await this.sleep(this.sleepTime)
            // Call itself if the request in the running or pending state
            await this.printStatus(response.data.result)
        } else {
            // Log the success result, the step of the pipeline is success as well
            if (+result.status === ResponseStatus.Successful) {
                console.log(result.status_message)
                console.log(result.status_detail)
            }

            // Log the failed result, the step throw an error to fail the step
            if (+result.status === ResponseStatus.Failed) {
                throw new Error(result.error || result.status_message)
            }

            // Log the canceled result, the step throw an error to fail the step
            if (+result.status === ResponseStatus.Canceled) {
                throw new Error(Errors.CANCELLED)
            }
        }
    }

    /**
     * Gets the id of the plugin which will be installed.
     * pluginID can be set in the workflow file
     * and read in the action.yml file from the input variable
     */
    getPluginID(): string {
        const pluginID: string | undefined = core.getInput('pluginID')
        if (!pluginID) throw new Error(Errors.PLUGIN_ID)
        return pluginID
    }
}
