<<<<<<< HEAD
const BrowserWindow = require('electron').remote.BrowserWindow
const randomString = require('crypto-random-string')
const request = require('request')

const path = require('path')

const { getDistribution } = require('./distromanager')



let state = randomString({ length: 32, type: 'url-safe' })
const authWindowConfig = {
    title: 'Microsoft-Login',
    backgroundColor: '#222222',
    width: 520,
    height: 600,
    frame: false,
    icon: getPlatformIcon('SealCircle')
}

function getPlatformIcon(filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, '..', 'images', `${filename}.${ext}`)
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
    authWindow.loadURL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?prompt=consent&client_id=3530b541-1564-4c3d-bb2f-407c1b0e0e5d&response_type=code&redirect_uri=https%3A%2F%2Fnexusauth.herokuapp.com%2Fredirect&scope=XboxLive.signin%20offline_access&state=' + getState())
    authWindow.setMenu(null)
    authWindow.once('ready-to-show', () => {
        authWindow.show()
    })
    return authWindow
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

=======
// Requirements
const { reject } = require('async')
const request = require('request')
// const logger = require('./loggerutil')('%c[Microsoft]', 'color: #01a6f0; font-weight: bold')

// Constants
const clientId = '3530b541-1564-4c3d-bb2f-407c1b0e0e5d'
const tokenUri = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token'
const authXBLUri = 'https://user.auth.xboxlive.com/user/authenticate'
const authXSTSUri = 'https://xsts.auth.xboxlive.com/xsts/authorize'
const authMCUri = 'https://api.minecraftservices.com/authentication/login_with_xbox'
const profileURI = 'https://api.minecraftservices.com/minecraft/profile'

// Functions
function requestPromise(uri, options) {
    return new Promise((resolve, reject) => {
        request(uri, options, (error, response, body) => {
            if (error) {
                reject(error)
            } else if (response.statusCode !== 200) {
                reject([response.statusCode, response.statusMessage, response])
            } else {
                resolve(response)
            }
        })
    })
}

function getXBLToken(accessToken) {
    return new Promise((resolve, reject) => {
        const data = new Object()

        const options = {
            method: 'post',
            json: {
                Properties: {
                    AuthMethod: 'RPS',
                    SiteName: 'user.auth.xboxlive.com',
                    RpsTicket: `d=${accessToken}`
                },
                RelyingParty: 'http://auth.xboxlive.com',
                TokenType: 'JWT'
            }
        }
        requestPromise(authXBLUri, options).then(response => {
            const body = response.body

            data.token = body.Token
            data.uhs = body.DisplayClaims.xui[0].uhs

            resolve(data)
        }).catch(error => {
            reject(error)
>>>>>>> ms-auth2
        })
    })
}

<<<<<<< HEAD
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
=======
function getXSTSToken(XBLToken) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'post',
            json: {
                Properties: {
                    SandboxId: 'RETAIL',
                    UserTokens: [XBLToken]
                },
                RelyingParty: 'rp://api.minecraftservices.com/',
                TokenType: 'JWT'
            }
        }
        requestPromise(authXSTSUri, options).then(response => {
            if (response.body.XErr) {
                switch (response.body.XErr) {
                    case 2148916233:
                        reject({
                            message: 'Dein Microsoft-Account ist nicht mit einem Xbox-Account verbunden. Bitte erstelle dir einen.<br>'
                        })
                        return
        
                    case 2148916238: 
                        reject({
                            message: 'Da du noch nicht 18 Jahre alt bist, muss dich ein Erwachsener zu einer Familie hinzufügen, damit du den NexusLauncher nutzen kannst!'
                        })
                        return
                
                }
                reject(response.body)
            }
            resolve(response.body.Token)
        }).catch(error => {
            reject(error)
        })
    })
}

function getMCAccessToken(UHS, XSTSToken) {
    return new Promise((resolve, reject) => {
        const data = new Object()
        const expiresAt = new Date()

        const options = {
            method: 'post',
            json: {
                identityToken: `XBL3.0 x=${UHS};${XSTSToken}`
            }
        }
        requestPromise(authMCUri, options).then(response => {
            const body = response.body

            expiresAt.setSeconds(expiresAt.getSeconds() + body.expires_in)
            data.access_token = body.access_token
            data.expires_at = expiresAt

            resolve(data)
        }).catch(error => {
            reject(error)
>>>>>>> ms-auth2
        })
    })
}

<<<<<<< HEAD
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

=======
// Exports
exports.getAccessToken = authCode => {
    return new Promise((resolve, reject) => {
        const expiresAt = new Date()
        const data = new Object()

        const options = {
            method: 'post',
            formData: {
                client_id: clientId,
                code: authCode,
                scope: 'XboxLive.signin',
                redirect_uri: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
                grant_type: 'authorization_code'
            }
        }
        requestPromise(tokenUri, options).then(response => {
            const body = JSON.parse(response.body)
            expiresAt.setSeconds(expiresAt.getSeconds() + body.expires_in)
            data.expires_at = expiresAt
            data.access_token = body.access_token
            data.refresh_token = body.refresh_token

            resolve(data)
        }).catch(error => {
            reject(error)
        })
    })
}

exports.refreshAccessToken = refreshToken => {
    return new Promise((resolve, reject) => {
        const expiresAt = new Date()
        const data = new Object()

        const options = {
            method: 'post',
            formData: {
                client_id: clientId,
                refresh_token: refreshToken,
                scope: 'XboxLive.signin',
                redirect_uri: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
                grant_type: 'refresh_token'
            }
        }
        requestPromise(tokenUri, options).then(response => {
            const body = JSON.parse(response.body)
            expiresAt.setSeconds(expiresAt.getSeconds() + body.expires_in)
            data.expires_at = expiresAt
            data.access_token = body.access_token

            resolve(data)
        }).catch(error => {
            reject(error)
        })
    })
}

exports.authMinecraft = async accessToken => {
    try {
        const XBLToken = await getXBLToken(accessToken)
        const XSTSToken = await getXSTSToken(XBLToken.token)
        const MCToken = await getMCAccessToken(XBLToken.uhs, XSTSToken)

        return MCToken
    } catch (error) {
        Promise.reject(error)
    }
}

exports.checkMCStore = async function(access_token){
    return new Promise((resolve, reject) => {
        request.get({
            url: 'https://api.minecraftservices.com/entitlements/mcstore',
            json: true,
            headers: {
                Authorization: 'Bearer ' + access_token
            }
        }, (err, res, body) => {
            if (err) {
                resolve(false)
                return
            }
            if(body.items && body.items.length > 0) resolve(true)
            else resolve(false)
>>>>>>> ms-auth2
        })
    })
}

<<<<<<< HEAD
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

=======
exports.getMCProfile = MCAccessToken => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'get',
            headers: {
                Authorization: `Bearer ${MCAccessToken}`
            }
        }
        requestPromise(profileURI, options).then(response => {
            const body = JSON.parse(response.body)

            resolve(body)
        }).catch(error => {
            reject(error)
        })
    })
}  
>>>>>>> ms-auth2
