const logger = LoggerUtil('%c[SkinManager]', 'color: #110668; font-weight: bold')

const SkinManager = document.getElementById('skin-manager')

let skinRender = new SkinRender({
    autoResize: true,
    render: {
        taa: true
    },
    pauseHidden: false
}, SkinManager)
skinRender.render(ConfigManager.getSelectedAccount().displayName, e => console.log(e))
const startTime = Date.now()
/* SkinManager.addEventListener('skinRender', function (e) {
    if (true) {
        let t = (Date.now() - startTime) / 1000
        e.detail.playerModel.children[2].rotation.x = Math.sin(t * 5) / 2
        e.detail.playerModel.children[3].rotation.x = -Math.sin(t * 5) / 2
        e.detail.playerModel.children[4].rotation.x = Math.sin(t * 5) / 2
        e.detail.playerModel.children[5].rotation.x = -Math.sin(t * 5) / 2
    }
}) */

document.getElementById('skinBtn').addEventListener('click', e => SkinManager.style.display = 'block')
