const BrowserWindow = require('electron').remote.BrowserWindow
const randomString = require('crypto-random-string')
const request = require('request')

const { getDistribution } = require('./distromanager')



let state = randomString({ length: 32, type: 'url-safe' })
const authWindowConfig = {
    title: 'Microsoft-Login',
    backgroundColor: '#222222'
}

let authWindow

const getState = function () {
    return state
}

exports.getState = getState

exports.openAuthWindow = function (state) {
    if (authWindow != null) {
        authWindow.close()
        authWindow = null
    }
    authWindow = new BrowserWindow(authWindowConfig)
    authWindow.loadURL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=3530b541-1564-4c3d-bb2f-407c1b0e0e5d&response_type=code&redirect_uri=https%3A%2F%2Fnexusauth.herokuapp.com%2Fredirect&scope=XboxLive.signin%20offline_access&state=' + getState())
    authWindow.setMenu(null)
    authWindow.once('ready-to-show', () => {
        authWindow.show()
    })
    return
}

exports.closeAuthWindow = function () {
    if (authWindow) {
        authWindow.close()
    }

    authWindow = null
}

exports.newState = function () {
    state = randomString({ length: 32, type: 'url-safe' })
}

let uhs
exports.tryToLogin = function (tokens) {
    return new Promise((resolve, reject) => {
        if (tokens.access_token) {
            xbl(tokens.access_token).catch(err => reject(err)).then(res => {
                if (res.uhs) {
                    uhs = res.uhs
                }
                xsts(res.token).catch(err => reject(err)).then(resp => {
                    mcToken(resp, uhs).catch(err => reject(err)).then(respo => {
                        mcEntitlements(respo).catch(err => reject(err)).then(content => {
                            if (content.items.length == 0) {
                                reject({
                                    error: true,
                                    error_details: 'Du hast kein Minecraft gekauft!'
                                })
                                return
                            }
                            mcProfile(respo).catch(err => { reject(err) }).then(content => {
                                resolve({
                                    profile: content,
                                    mcAccessToken: respo,
                                    microsoft: {
                                        access_token: tokens.access_token,
                                        refresh_token: tokens.refresh_token
                                    }
                                })
                            })
                        })
                    })
                })
            })
        }
    })
}
const refresh = async function (refreshToken) {
    return new Promise((resolve, reject) => {
        request.post({
            url: 'http://' + getDistribution().getAuthServer() + '/refresh',
            json: true,
            body: {
                refresh_token: refreshToken
            }
        }, (err, res, body) => {
            if (err || !body.access_token || !body.refresh_token) {
                if (err) {
                    reject(err)
                }
                if (!body.access_token || !body.refresh_token) {
                    reject(body)
                }

            } else {
                resolve(body)
            }

        })
    })

}
exports.refresh = refresh

exports.validate = async function (access_token) {
    {
        try {
            const isValid = await xbl(access_token)
            return isValid != null
        } catch (e) {
            return false
        }
    }

}

const xbl = function (token) {
    return new Promise((resolve, reject) => {
        request.post({
            url: 'https://user.auth.xboxlive.com/user/authenticate',
            json: true,
            body: {
                Properties: {
                    AuthMethod: 'RPS',
                    SiteName: 'user.auth.xboxlive.com',
                    RpsTicket: 'd=' + token
                },
                RelyingParty: 'http://auth.xboxlive.com',
                TokenType: 'JWT'
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, (err, res, body) => {
            if (err) {
                reject(err)
            }
            if (!body.Token) {
                reject(body)
            }
            if (body.DisplayClaims.xui.length >= 1) {
                resolve({
                    token: body.Token,
                    uhs: body.DisplayClaims.xui[0].uhs
                })
            } else {
                resolve({
                    token: body.Token
                })
            }

        })
    })
}

const xsts = function (token) {
    return new Promise((resolve, reject) => {
        request.post({
            url: 'https://xsts.auth.xboxlive.com/xsts/authorize',
            json: true,
            body: {
                Properties: {
                    SandboxId: 'RETAIL',
                    UserTokens: [
                        token
                    ]
                },
                RelyingParty: 'rp://api.minecraftservices.com/',
                TokenType: 'JWT'
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, (err, res, body) => {

            if (err) {
                reject(err)
            }

            if (!body.Token) {
                reject(body)
            }

            switch (body.XErr) {
                case 2148916233:
                    reject({
                        error: true,
                        error_details: 'Du besitzt keinen Xbox-Account!<br><a href="https://www.xbox.com/de-DE/live">Erstelle</a> dir einen.'

                    })
                    break
                case 2148916238:
                    reject({
                        error: true,
                        error_details: 'Dein Xbox-Account wurde keiner Familie Zugeordnet!<br>Um diesen Launcher nutzen zu können, muss dich ein Erwachsener zu einer Familie hinzufügen'
                    })
            }
            resolve(body.Token)
        })
    })
}

const mcToken = function (token, uhs) {
    return new Promise((resolve, reject) => {
        request.post({
            url: 'https://api.minecraftservices.com/authentication/login_with_xbox',
            json: true,
            body: {
                identityToken: 'XBL3.0 x=' + uhs + ';' + token
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, (err, res, body) => {
            if (err) {
                reject(err)
            }

            if (!body.access_token) {
                reject(body)
            }

            resolve(body.access_token)
        })
    })

}

const mcProfile = function (token) {
    return new Promise((resolve, reject) => {
        request.get({
            url: 'https://api.minecraftservices.com/minecraft/profile',
            json: true,
            headers: {
                Authorization: 'Bearer ' + token
            }
        }, (err, res, body) => {
            if (err) {
                reject({
                    error: true,
                    error_details: err
                })
            }
            if (body.error === 'NOT_FOUND') {
                reject({
                    error: true,
                    error_details: 'Dieser Microsoft/Xbox-Account besitzt kein Minecraft!'
                })
                return
            }

            resolve(body)

        })
    })
}

const mcEntitlements = function (token) {
    return new Promise((resolve, reject) => {
        request.get({
            url: 'https://api.minecraftservices.com/entitlements/mcstore',
            json: true,
            headers: {
                Authorization: 'Bearer ' + token
            }
        }, (err, res, body) => {
            if (err) {
                reject({
                    error: true,
                    error_details: err
                })
            }
            resolve(body)

        })
    })
}

