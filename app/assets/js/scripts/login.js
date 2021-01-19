//Translatet

/**
 * Script for login.ejs
 */
// Validation Regexes.
const validUsername = /^[a-zA-Z0-9_]{1,16}$/
const basicEmail = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const loginCancelContainer = document.getElementById('loginCancelContainer')
const loginCancelButton = document.getElementById('loginCancelButton')
const loginEmailError = document.getElementById('loginEmailError')
const loginUsername = document.getElementById('loginUsername')
const loginPasswordError = document.getElementById('loginPasswordError')
const loginPassword = document.getElementById('loginPassword')
const checkmarkContainer = document.getElementById('checkmarkContainer')
const loginRememberOption = document.getElementById('loginRememberOption')
const loginButton = document.getElementById('loginButton')
const loginForm = document.getElementById('loginForm')
<<<<<<< HEAD

const { getDistribution } = require('./assets/js/distromanager')
const microsoft = require('./assets/js/microsoft')
=======
const loginMSButton = document.getElementById('loginMSButton')
>>>>>>> ms-auth2

// Control variables.
let lu = false, lp = false

const loggerLogin = LoggerUtil('%c[Login]', 'color: #000668; font-weight: bold')


/**
 * Show a login error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value) {
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element) {
    if (element.style.opacity == 1) {
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * 
 * @param {string} value The email value.
 */
function validateEmail(value) {
    if (value) {
        if (!basicEmail.test(value) && !validUsername.test(value)) {
            showError(loginEmailError, Lang.queryJS('login.error.invalidValue'))
            loginDisabled(true)
            lu = false
        } else {
            loginEmailError.style.opacity = 0
            lu = true
            if (lp) {
                loginDisabled(false)
            }
        }
    } else {
        lu = false
        showError(loginEmailError, Lang.queryJS('login.error.requiredValue'))
        loginDisabled(true)
    }
}

/**
 * Validate that the password field is not empty.
 * 
 * @param {string} value The password value.
 */
function validatePassword(value) {
    if (value) {
        loginPasswordError.style.opacity = 0
        lp = true
        if (lu) {
            loginDisabled(false)
        }
    } else {
        lp = false
        showError(loginPasswordError, Lang.queryJS('login.error.invalidValue'))
        loginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginUsername.addEventListener('focusout', (e) => {
    validateEmail(e.target.value)
    shakeError(loginEmailError)
})
loginPassword.addEventListener('focusout', (e) => {
    validatePassword(e.target.value)
    shakeError(loginPasswordError)
})

// Validate input for each field.
loginUsername.addEventListener('input', (e) => {
    validateEmail(e.target.value)
})
loginPassword.addEventListener('input', (e) => {
    validatePassword(e.target.value)
})

/**
 * Enable or disable the login button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginDisabled(v) {
    if (loginButton.disabled !== v) {
        loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v) {
    if (v) {
        loginButton.setAttribute('loading', v)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.login'), Lang.queryJS('login.loggingIn'))
    } else {
        loginButton.removeAttribute('loading')
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.login'))
    }
}

/**
 * Enable or disable login form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function formDisabled(v) {
    loginDisabled(v)
    loginCancelButton.disabled = v
    loginUsername.disabled = v
    loginPassword.disabled = v
    if (v) {
        checkmarkContainer.setAttribute('disabled', v)
    } else {
        checkmarkContainer.removeAttribute('disabled')
    }
    loginRememberOption.disabled = v
}

/**
 * Parses an error and returns a user-friendly title and description
 * for our error overlay.
 * 
 * @param {Error | {cause: string, error: string, errorMessage: string}} err A Node.js
 * error or Mojang error response.
 */
function resolveError(err) {
    // Mojang Response => err.cause | err.error | err.errorMessage
    // Node error => err.code | err.message
    if (err.cause != null && err.cause === 'UserMigratedException') {
        return {
            title: Lang.queryJS('login.error.userMigrated.title'),
            desc: Lang.queryJS('login.error.userMigrated.desc')
        }
    } else {
        if (err.error != null) {
            if (err.error === 'ForbiddenOperationException') {
                if (err.errorMessage != null) {
                    if (err.errorMessage === 'Invalid credentials. Invalid username or password.') {
                        return {
                            title: Lang.queryJS('login.error.invalidCredentials.title'),
                            desc: Lang.queryJS('login.error.invalidCredentials.desc')
                        }
                    } else if (err.errorMessage === 'Invalid credentials.') {
                        return {
                            title: Lang.queryJS('login.error.rateLimit.title'),
                            desc: Lang.queryJS('login.error.rateLimit.desc')
                        }
                    }
                }
            }
        } else {
            // Request errors (from Node).
            if (err.code != null) {
                if (err.code === 'ENOENT') {
                    // No Internet.
                    return {
                        title: Lang.queryJS('login.error.noInternet.title'),
                        desc: Lang.queryJS('login.error.noInternet.desc')
                    }
                } else if (err.code === 'ENOTFOUND') {
                    // Could not reach server.
                    return {
                        title: Lang.queryJS('login.error.authDown.title'),
                        desc: Lang.queryJS('login.error.authDown.desc')
                    }
                }
            }
        }
    }
    if (err.message != null) {
        if (err.message === 'NotPaidAccount') {
            return {
                title: Lang.queryJS('login.error.notPaid.title'),
                desc: Lang.queryJS('login.error.notPaid.desc')
            }
        } else {
            // Unknown error with request.
            return {
                title: Lang.queryJS('login.error.unknown.title'),
                desc: err.message
            }
        }
    } else {
        // Unknown Mojang error.
        return {
            title: err.error,
            desc: err.errorMessage
        }
    }
}

let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler

function loginCancelEnabled(val) {
    if (val) {
        $(loginCancelContainer).show()
    } else {
        $(loginCancelContainer).hide()
    }
}

loginCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginUsername.value = ''
        loginPassword.value = ''
        loginCancelEnabled(false)
        if (loginViewCancelHandler != null) {
            loginViewCancelHandler()
            loginViewCancelHandler = null
        }
    })
}

// Disable default form behavior.
loginForm.onsubmit = () => { return false }

// Bind login button behavior.
loginButton.addEventListener('click', () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    AuthManager.addAccount(loginUsername.value, loginPassword.value).then((value) => {
        updateSelectedAccount(value)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                // Temporary workaround
                if (loginViewOnSuccess === VIEWS.settings) {
                    prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
            })
        }, 1000)
    }).catch((err) => {
        loginLoading(false)
        const errF = resolveError(err)
        setOverlayContent(errF.title, errF.desc, Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
        loggerLogin.log('Error while logging in.', err)
    })
})

loginMSButton.addEventListener('click', (event) => {
    loginMSButton.disabled = true
    ipcRenderer.send('openMSALoginWindow', 'open')
})

ipcRenderer.on('MSALoginWindowReply', (event, ...args) => {
    if (args[0] === 'error') {
        setOverlayContent('FEHLER!', 'Es ist bereits ein Login-Fenster offen!', 'OK')
        setOverlayHandler(() => {
            toggleOverlay(false)
        })
        toggleOverlay(true)
        return
    }

    const queryMap = args[0]
    if (queryMap.has('error')) {
        let error = queryMap.get('error')
        let errorDesc = queryMap.get('error_description')
        if(error === 'access_denied'){
            error = 'FEHLER'
            errorDesc = 'Um den NexusLauncher nutzen zu können, musst du uns den benötigten Berechtigungen zustimmen! Sonst kannst du diesen Launcher nicht mit Microsoft-Accounts nutzen.<br><br>Trotz dem Zustimmen der Berechtigungen gibst du uns keine Möglichkeit, irgendetwas mit deinem Account anzustellen, weil alle Daten immer SOFORT und OHNE UMWEGE an dich (den Launcher) zurück gesendet werden.'
        }        
        setOverlayContent(error, errorDesc, 'OK')
        setOverlayHandler(() => {
            loginMSButton.disabled = false
            toggleOverlay(false)
        })
        toggleOverlay(true)
        return
    }

    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    const authCode = queryMap.get('code')
    AuthManager.addMSAccount(authCode).then(account => {
        updateSelectedAccount(account)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                // Temporary workaround
                if (loginViewOnSuccess === VIEWS.settings) {
                    prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
            })
        }, 1000)
    }).catch(error => {
        loginMSButton.disabled = false
        loginLoading(false)
        setOverlayContent('FEHLER!', error.message ? error.message : 'Beim Anmelden mit Microsoft ist ein Fehler aufgetreten! Für detailiertere Informationen schaue bitte im Log nach. Diese öffnest du mit STRG + SHIFT + I', Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
        loggerLogin.error(error)
    })

})

const microsoftBtn = document.getElementById('microsoftlogin')
microsoftBtn.addEventListener('click', (event) => {
    microsoftBtn.disabled = true
    formDisabled(true)
    const ws = new WebSocket('ws://' + getDistribution().getAuthServer() + '/flow')
    let authWindow
    ws.onmessage = function (msg) {
        const data = JSON.parse(msg.data)
        switch (data.code) {
            case 'waitforstate':
                ws.send(JSON.stringify({
                    code: 'state',
                    state: microsoft.getState()
                }))
                break
            case 'stateaccept':
                authWindow = microsoft.openAuthWindow(microsoft.state)
                authWindow.once('close', () => {
                    microsoftBtn.disabled = false
                })
                break
            case 'statedeny':
                microsoft.newState()
                ws.send(JSON.stringify({
                    code: 'state',
                    state: microsoft.getState()
                }))
                break
            case 'authdeny':
                if (authWindow) {
                    authWindow.close()
                    microsoftBtn.disabled = false
                }
                setOverlayContent('Fehler beim Anmelden mit Microsoft', 'Du musst dem Launcher die benötigten Rechte geben, damit dieser Minecraft starten kann!', 'Zurück zum Login')
                setOverlayHandler(() => {
                    toggleOverlay(false, false)
                })
                toggleOverlay(true, false)
                break
            case 'final':
                microsoft.closeAuthWindow()
                ws.close()
                AuthManager.addMicrosoftAccount(data.response).then(value => {
                    updateSelectedAccount(value)
                    setTimeout(() => {
                        switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                            // Temporary workaround
                            if (loginViewOnSuccess === VIEWS.settings) {
                                prepareSettings()
                            }
                            loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                            loginCancelEnabled(false) // Reset this for good measure.
                            loginViewCancelHandler = null // Reset this for good measure.
                            loginUsername.value = ''
                            loginPassword.value = ''
                            loginLoading(false)
                            loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                            formDisabled(false)
                        })
                    }, 1000)
                }).catch(err => {
                    loggerLogin.log('Error while attemt to login to microsoft: ', err)
                    setOverlayContent('Fehler beim Anmelden mit Microsoft', err.error_details ? err.error_details : 'Für mehr Details schaue bitte in der Konsole nach. Diese kannst du mit STRG + SHIFT + I öffnen', 'Zurück zum Login')
                    setOverlayHandler(() => {
                        toggleOverlay(false, false)
                    })
                    toggleOverlay(true, false)
                    microsoftBtn.disabled = false
                    formDisabled(false)
                })
            //microsoft.tryToLogin(data.response).then(content => console.log(content)).catch(err => console.log(err))

        }

    }

    ws.onclose = function (event) {

    }
})

