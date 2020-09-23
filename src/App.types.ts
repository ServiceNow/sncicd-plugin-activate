export interface User {
    username: string;
    password: string;
}

export interface AppProps extends User {
    snowInstallInstance: string;
}

export interface ErrorResult {
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
}

export enum Errors {
    USERNAME = 'snowUsername is not set',
    PASSWORD = 'snowPassword is not set',
    INSTALL_INSTANCE = 'snowInstallInstance is not set',
    PLUGIN_ID = 'pluginID is not set',
    INCORRECT_CONFIG = 'Configuration is incorrect',
    CANCELLED = 'Canceled',
}

export interface RequestResponse {
    data: {
        result: RequestResult,
    };
}

export interface RequestResult {
    links: {
        progress: {
            id: string,
            url: string,
        },
    };
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
    percent_complete: number;
    rollback_version: string;
}

export enum ResponseStatus {
    Pending = 0,
    Running = 1,
    Successful = 2,
    Failed = 3,
    Canceled = 4,
}

export interface axiosConfig {
    headers: {
        'User-Agent': string,
        Accept: string,
    };
    auth: User;
}
