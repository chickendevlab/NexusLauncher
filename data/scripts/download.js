const id = 'id'

fetch('https://ChickenDevLab.github.io/NexusLauncher/data/installer.json').then(response => response.json()).then(data => {
    console.log(data)
    document.getElementById(id).href = data.latest
})