const BrowserWindow = require('electron').remote.BrowserWindow
const randomString = require('crypto-random-string')
const axios = require('axios')
const DistroManager = require('./distromanager')

class Microsoft {
    constructor(){
        this.state = randomString({length: 32, type: 'url-safe'})
        this.authWindowConfig = {
            title: 'Microsoft-Login',
            backgroundColor: '#222222'
        }
    }
    
    openAuthWindow(state){
        if(this.authWindow != null){
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

    closeAuthWindow(){
        if(this.authWindow){
            this.authWindow.close()
        }

        this.authWindow = null
    }

    newState(){
        this.state = randomString({length: 32, type: 'url-safe'})
    }

    tryToLogin(tokens){

    }

    async refresh(refreshToken){
        const res = await axios.post('http://' +  DistroManager.getDistribution().getAuthServer() + '/refresh', {
            refresh_token: refreshToken
        })
        return res
        
    }
}

const microsoft = new Microsoft()

exports.microsoft = microsoft