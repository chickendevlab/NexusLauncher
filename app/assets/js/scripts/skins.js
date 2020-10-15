const logger = LoggerUtil('%c[SkinManager]', 'color: #110668; font-weight: bold')

let skinRender = new SkinRender({
    autoResize: true,
    render: {
        taa: true
    }
}, document.getElementById('skin-manager'))
skinRender.render(ConfigManager.getSelectedAccount().displayName)
const startTime = Date.now();
document.getElementById('skin-manager').addEventListener('skinRender', function (e) {
    if (animate) {
        let t = (Date.now() - startTime) / 1000
        e.detail.playerModel.children[2].rotation.x = Math.sin(t * 5) / 2
        e.detail.playerModel.children[3].rotation.x = -Math.sin(t * 5) / 2
        e.detail.playerModel.children[4].rotation.x = Math.sin(t * 5) / 2
        e.detail.playerModel.children[5].rotation.x = -Math.sin(t * 5) / 2
    }
})
