const playerUpdateRate = 20
const playerInterpRate = 0.75

const img = new Image(32, 32)
img.src = "/static/cursor_black.webp"

function lerp(a, b, t) {
    return a + (b - a) * t
}

let players = []

class Player {
    playerId = 0
    x = 0
    y = 0

    renderX = 0
    renderY = 0

    interpProgress = 0

    interpStartX = 0
    interpStartY = 0

    local = false

    constructor(playerId, local) {
        this.playerId = playerId
        this.local = local

        players.push(this)
    }

    position(rawX, rawY) {
        this.x = rawX
        this.y = rawY

        this.interpProgress = 0

        this.interpStartX = this.renderX
        this.interpStartY = this.renderY
    }

    render(ctx) {
        if (this.local)
            return
        ctx.drawImage(img, this.renderX + panCanvas.viewportPosition.x, this.renderY + panCanvas.viewportPosition.y, 11, 18)
    }

    update(deltaTime) {
        if (this.local)
            return
        this.interpProgress = Math.min(this.interpProgress + (deltaTime * playerUpdateRate * playerInterpRate), 1)

        this.renderX = lerp(this.interpStartX, this.x, this.interpProgress)
        this.renderY = lerp(this.interpStartY, this.y, this.interpProgress)
    }

    dispose() {
        for (let i = 0; i < players.length; i++) {
            let player = players[i]
            if (this != player)
                continue
            players.splice(i, 1)
            break
        }
    }
}

function GetPlayerById(id) {
    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        if (player.playerId == id) {
            return player
        }
    }
}