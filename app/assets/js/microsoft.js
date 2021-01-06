const BrowserWindow = require('electron').remote.BrowserWindow
const randomString = require('crypto-random-string')
const axios = require('axios')
const request = require('request')

class Microsoft {
    constructor() {
        this.state = randomString({ length: 32, type: 'url-safe' })
        this.authWindowConfig = {
            title: 'Microsoft-Login',
            backgroundColor: '#222222'
        }
    }

    openAuthWindow(state) {
        if (this.authWindow != null) {
            this.authWindow.close()
            this.authWindow = null
        }
        this.authWindow = new BrowserWindow(this.authWindowConfig)
        this.authWindow.loadURL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=3530b541-1564-4c3d-bb2f-407c1b0e0e5d&response_type=code&redirect_uri=https%3A%2F%2Fnexusauth.herokuapp.com%2Fredirect&scope=XboxLive.signin%20offline_access&state=' + state)
        console.log(state)
        this.authWindow.setMenu(null)
        this.authWindow.once('ready-to-show', () => {
            this.authWindow.show()
        })
        return
    }

    closeAuthWindow() {
        if (this.authWindow) {
            this.authWindow.close()
        }

        this.authWindow = null
    }

    newState() {
        this.state = randomString({ length: 32, type: 'url-safe' })
    }

    tryToLogin(tokens) {
        return new Promise((resolve, reject) => {
            if (tokens.access_token) {
                this._xbl(tokens.access_token).catch(err => reject(err)).then(res => {
                    if (res.uhs) {
                        this._uhs = res.uhs
                    }
                    this._xsts(res.token).catch(err => reject(err)).then(resp => {
                        this._mcToken(resp, this._uhs).catch(err => reject(err)).then(respo => {
                            this._mcEntitlements(respo).catch(err => reject(err)).then(content =>{
                                if(content.items.length == 0){
                                    reject({
                                        error: true,
                                        error_details: 'Du hast kein Minecraft gekauft!'
                                    })
                                    return
                                }
                                this._mcProfile(respo).catch(err => {reject(err)}).then(content => {
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

    async refresh(refreshToken) {
        const res = await axios.post('http://' + this.authServer + '/refresh', {
            refresh_token: refreshToken
        })
        return res

    }

    _xbl(token) {
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

    _xsts(token) {
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
                console.log(body)
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

    _mcToken(token, uhs) {
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

    _mcProfile(token) {
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

    _mcEntitlements(token) {
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
}

const microsoft = new Microsoft()

exports.microsoft = microsoft