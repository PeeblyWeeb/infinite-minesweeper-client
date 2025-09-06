const maxPendingFor = 5

let flatPendingChunks = []

function GetPendingChunkByXY(x, y) {
    for (let i = 0; i < flatPendingChunks.length; i++) {
        let chunk = flatPendingChunks[i]
        if (chunk.x == x && chunk.y == y) {
            return chunk
        }
    }
}

function MarkPendingChunkAsNonExistant(x, y) {
    let chunk = GetPendingChunkByXY(x, y)
    chunk.doesntExist = true
}

const loaderImg = new Image(32, 32)
loaderImg.src = "/static/loader.webp"

const loaderScale = 0.5
const inverse = 1 - loaderScale

class PendingChunk extends BaseChunk {
    pendingFor = 0
    doesntExist = false

    constructor(x, y) {
        super()

        this.x = x
        this.y = y

        flatPendingChunks.push(this)
    }

    render(ctx) {
        if (this.doesntExist)
            return
        let renderPosition = this.getRenderPositionPan()

        ctx.drawImage(loaderImg, renderPosition.x + (cellsPerChunkScaled * inverse / 2), renderPosition.y + (cellsPerChunkScaled * inverse / 2), cellsPerChunkScaled * loaderScale, cellsPerChunkScaled * loaderScale)
    }

    update(dt) {
        if (this.doesntExist) {
            return
        }
        this.pendingFor += dt
        if (this.pendingFor > maxPendingFor) {
            this.dispose()
        }
    }

    dispose() {
        for (let i = 0; i < flatPendingChunks.length; i++) {
            let chunk = flatPendingChunks[i]
            if (chunk != this)
                continue
            flatPendingChunks.splice(i, 1)
            break
        }
    }
}