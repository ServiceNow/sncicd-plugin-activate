"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const axios_1 = __importDefault(require("axios"));
const App_types_1 = require("./App.types");
class App {
    constructor(props) {
        this.sleepTime = 3000;
        this.errCodeMessages = {
            401: 'The user credentials are incorrect.',
            403: 'Forbidden. The user is not an admin or does not have the CICD role.',
            404: 'Not found. The requested item was not found.',
            405: 'Invalid method. The functionality is disabled.',
            409: 'Conflict. The requested item is not unique.',
            500: 'Internal server error. An unexpected error occurred while processing the request.',
        };
        this.props = props;
        this.user = {
            username: props.username,
            password: props.password,
        };
        this.config = {
            headers: { Accept: 'application/json' },
            auth: this.user,
        };
    }
    /**
     * Takes options object, convert it to encoded URI string
     * and append to the request url
     *
     * @param plugin_id
     *
     * @returns string  Url to API
     */
    buildRequestUrl(plugin_id) {
        if (!this.props.snowInstallInstance || !this.props.pluginID)
            throw new Error(App_types_1.Errors.INCORRECT_CONFIG);
        return `https://${this.props.snowInstallInstance}.service-now.com/api//sn_cicd/plugin/${encodeURIComponent(plugin_id)}/activate`;
    }
    /**
     * Get plugin id
     * Makes the request to SNow api plugin/{plugin_id}/activate
     * Prints the progress
     * @returns         Promise void
     */
    async activatePlugin() {
        try {
            const plugin_id = this.getPluginID();
            const url = this.buildRequestUrl(plugin_id);
            const response = await axios_1.default.post(url, {}, this.config);
            await this.printStatus(response.data.result);
        }
        catch (error) {
            let message;
            if (error.response && error.response.status) {
                if (this.errCodeMessages[error.response.status]) {
                    message = this.errCodeMessages[error.response.status];
                }
                else {
                    const result = error.response.data.result;
                    message = result.error || result.status_message;
                }
            }
            else {
                message = error.message;
            }
            throw new Error(message);
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
    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
    /**
     * Print the result of the task.
     * Execution will continue.
     * Task will be working until it get the response with successful or failed or canceled status.
     * Set output rollBack_version variable
     *
     * @param result    TaskResult enum of Succeeded, SucceededWithIssues, Failed, Cancelled or Skipped.
     *
     * @returns         void
     */
    async printStatus(result) {
        if (+result.status === App_types_1.ResponseStatus.Pending)
            console.log(result.status_label);
        if (+result.status === App_types_1.ResponseStatus.Running || +result.status === App_types_1.ResponseStatus.Successful)
            console.log(`${result.status_label}: ${result.percent_complete}%`);
        // Recursion to check the status of the request
        if (+result.status < App_types_1.ResponseStatus.Successful) {
            const response = await axios_1.default.get(result.links.progress.url, this.config);
            // Throttling
            await this.sleep(this.sleepTime);
            // Call itself if the request in the running or pending state
            await this.printStatus(response.data.result);
        }
        else {
            // Log the success result, the step of the pipeline is success as well
            if (+result.status === App_types_1.ResponseStatus.Successful) {
                console.log(result.status_message);
                console.log(result.status_detail);
            }
            // Log the failed result, the step throw an error to fail the step
            if (+result.status === App_types_1.ResponseStatus.Failed) {
                throw new Error(result.error || result.status_message);
            }
            // Log the canceled result, the step throw an error to fail the step
            if (+result.status === App_types_1.ResponseStatus.Canceled) {
                throw new Error(App_types_1.Errors.CANCELLED);
            }
        }
    }
    /**
     * Gets the id of the plugin which will be installed.
     * pluginID can be set in the workflow file
     * and read in the action.yml file from the input variable
     */
    getPluginID() {
        const pluginID = core.getInput('pluginID');
        if (!pluginID)
            throw new Error(App_types_1.Errors.PLUGIN_ID);
        return pluginID;
    }
}
exports.default = App;
