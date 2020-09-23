import * as core from '@actions/core'
import axios from 'axios'
import App from '../App'
import { AppProps, axiosConfig, Errors, RequestResponse } from '../App.types'

describe(`App lib`, () => {
    let props: AppProps
    const inputs: any = {
        pluginID: 'com.test.plugin',
    }

    beforeAll(() => {
        jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
            return inputs[name]
        })

        // Mock error/warning/info/debug
        jest.spyOn(core, 'error').mockImplementation(jest.fn())
        jest.spyOn(core, 'warning').mockImplementation(jest.fn())
        jest.spyOn(core, 'info').mockImplementation(jest.fn())
        jest.spyOn(core, 'debug').mockImplementation(jest.fn())
    })

    beforeEach(() => {
        props = { password: 'test', snowInstallInstance: 'test', username: 'test' }
    })
    describe(`builds request url`, () => {
        it(`with correct params`, () => {

            const pluginID: string = inputs.pluginID
            const app = new App(props)

            expect(app.buildRequestUrl(inputs.pluginID)).toEqual(
                `https://${props.snowInstallInstance}.service-now.com/api/sn_cicd/plugin/${encodeURIComponent(
                    pluginID,
                )}/activate`
            )
        })
        it(`without instance parameter`, () => {
            props.snowInstallInstance = ''
            const pluginID: string = inputs.pluginID
            const app = new App(props)

            expect(() => app.buildRequestUrl(pluginID)).toThrow(Errors.INCORRECT_CONFIG)
        })
        it(`without pluginID parameter`, () => {
            const pluginID: string = ''
            const app = new App(props)

            expect(() => app.buildRequestUrl(pluginID)).toThrow(Errors.INCORRECT_CONFIG)
        })
    })

    it(`Activate Plugin`, () => {
        const post = jest.spyOn(axios, 'post')
        const response: RequestResponse = {
            data: {
                result: {
                    links: {
                        progress: {
                            id: 'id',
                            url: 'http://test.xyz',
                        },
                    },
                    status: '2',
                    status_label: 'success',
                    status_message: 'label',
                    status_detail: 'detail',
                    error: '',
                    percent_complete: 100,
                    rollback_version: '1.0.0',
                },
            },
        }
        post.mockResolvedValue(response)
        jest.spyOn(global.console, 'log')
        const app = new App(props)
        app.activatePlugin()
        const config: axiosConfig = {
            auth: {
                username: props.username,
                password: props.password,
            },
            headers: {
                'User-Agent': 'sncicd_extint_github',
                Accept: 'application/json',
            },
        }
        const url = `https://${props.snowInstallInstance}.service-now.com/api/sn_cicd/plugin/${encodeURIComponent(
            inputs.pluginID,
        )}/activate`

        expect(post).toHaveBeenCalledWith(url, {}, config)
    })
    describe(`getPluginID`, () => {
        it(`success`, () => {
            const app = new App(props)
            expect(app.getPluginID()).toEqual(inputs.pluginID)
        })
        it(`throws an error`, () => {
            inputs.pluginID = undefined
            const app = new App(props)
            expect(() => app.getPluginID()).toThrow(Errors.PLUGIN_ID)
        })
    })
    // it(`sleep throttling`, async done => {
    //     props.appSysID = '123'
    //     const app = new App(props)
    //     const time = 2500
    //     setTimeout(() => done(new Error("it didn't resolve or took longer than expected")), time)
    //     await app.sleep(time - 500)
    //     done()
    // })
})
