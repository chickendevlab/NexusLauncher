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
        this.authWindow.loadURL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=3530b541-1564-4c3d-bb2f-407c1b0e0e5d&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&scope=XboxLive.signin%20offline_access&state=' + state)
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
        if (tokens.access_token) {
            request.post({
                url: 'https://user.auth.xboxlive.com/user/authenticate',
                json: true,
                body: {
                    Properties: {
                        AuthMethod: 'RPS',
                        SiteName: 'user.auth.xboxlive.com',
                        RpsTicket: 'd=' + tokens.access_token
                    },
                    RelyingParty: 'http://auth.xboxlive.com',
                    TokenType: 'JWT'
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }, (err, res, body) => {
                if (err || body == null) {
                    return {
                        error: true,
                        error_details: err
                    }
                }

                if (body.Token && body.DisplayClaims.xui.length >= 1) {
                    this._uhs = body.DisplayClaims.xui[0].uhs
                    request.post({
                        url: 'https://xsts.auth.xboxlive.com/xsts/authorize',
                        json: true,
                        body: {
                            Properties: {
                                SandboxId: 'RETAIL',
                                UserTokens: [
                                    body.Token
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
                            return {
                                error: true,
                                error_details: err
                            }
                        }
                        switch (body.XErr) {
                            case 2148916233:
                                return {
                                    error: true,
                                    error_details: 'Du besitzt keinen Xbox-Account!<br><a href="https://www.xbox.com/de-DE/live">Erstelle</a> dir einen.'

                                }
                            case 2148916238:
                                return {
                                    error: true,
                                    error_details: 'Dein Xbox-Account wurde keiner Familie Zugeordnet!<br>Um diesen Launcher nutzen zu können, muss dich ein Erwachsener zu einer Familie hinzufügen'
                                }
                        }

                        if (body.Token) {
                            request.post({
                                url: 'https://api.minecraftservices.com/authentication/login_with_xbox',
                                json: true,
                                body: {
                                    identityToken: 'XBL3.0 x=' + this._uhs + ';' + body.Token
                                },
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                }
                            }, (err, res, body) => {
                                console.log(err, res, body)
                                request.get({
                                    url: 'https://api.minecraftservices.com/minecraft/profile',
                                    json: true,
                                    headers: {
                                        Authorization: 'Bearer ' + body.access_token
                                    }
                                }, (err, res, body) => {
                                    if(err){
                                        return {
                                            error: true,
                                            error_details: err
                                        }
                                    }
                                    if(body.error === 'NOT_FOUND'){
                                        return {
                                            error: true,
                                            error_details: 'Dieser Microsoft/Xbox-Account besitzt kein Minecraft!'
                                        }
                                    }

                                })
                            })
                        }


                    })
                }
            })
        }
    }

    async refresh(refreshToken) {
        const res = await axios.post('http://' + this.authServer + '/refresh', {
            refresh_token: refreshToken
        })
        return res

    }
}

const microsoft = new Microsoft()

exports.microsoft = microsoft