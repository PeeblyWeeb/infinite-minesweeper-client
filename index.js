const socket = new WebSocket("wss://ws-sweep.salamithecat.com/")
socket.binaryType = "arraybuffer"

const connection_overlay = document.getElementById("connection_overlay")

console.log("Connecting to the server...")

socket.onopen = (e) => {
    console.info("Connection established with server!")
}
socket.onclose = (e) => {
    console.warn("Socket connection was lost")
    connection_overlay.style.visibility = "visible"
}
socket.onmessage = (event) => {
    ReceivedData(event.data)
}

/*for (let x = -6; x < 6; x++) {
    for (let y = -6; y < 6; y++) {
        let chunk = new Chunk(x, y)
        flatchunks.push(chunk)

        if (chunks[x] == null)
            chunks[x] = []

        chunks[x][y] = chunk

        chunk.cells[0][0].calculateAdjacentCells()
    }
}*/

let deltaTime = 0

let mx = 0
let my = 0

function magnitude(x, y) {
    return Math.sqrt(x * x + y * y)
}

function unit(x, y) {
    let mag = magnitude(x, y)
    if (mag === 0)
        return { x: 0, y: 0 }

    let ux = x / mag
    let uy = y / mag

    if (Number.isNaN(ux) || Number.isNaN(uy)) {
        return { x: 0, y: 0 }
    }

    return { x: ux, y: uy }
}

function GetCellAtPosition(posx, posy) {
    let rawXViewport = posx - panCanvas.viewportPosition.x
    let rawYViewport = posy - panCanvas.viewportPosition.y

    let x = rawXViewport - (cellsPerChunkScaled / 2)
    let y = rawYViewport - (cellsPerChunkScaled / 2)

    let chunkX = Math.round(x / cellsPerChunkScaled)
    let chunkY = Math.round(y / cellsPerChunkScaled)

    if (chunks[chunkX] == null)
        return;
    if (chunks[chunkX][chunkY] == null)
        return

    let chunk = chunks[chunkX][chunkY]
    let cell = chunk.findCell(rawXViewport, rawYViewport)
    return cell
}

function GenericRevealCell(cell) {
    if (cell.revealed)
        return
    if (cell.marked)
        return
    cell.reveal()
    if (cell.revealed && cell.bomb && isDead == false) {
        Kill()
    }
    return true
}

class PannableCanvas {
    constructor() {
        this.canvas = document.createElement("canvas")

        this.viewportPosition = {
            x: 0,
            y: 0,
        }

        this.internal_viewportPosition = {
            x: 0,
            y: 0,
        }

        this.panStartPosition = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
        }

        this.lastMouseX = 0
        this.lastMouseY = 0

        this.velocityX = 0
        this.velocityY = 0

        this.dragDifference = 0
        this.mouseDown = false

        this.canvas.oncontextmenu = (e) => {
            e.preventDefault()

            if (isDead) {
                return
            }

            let cell = GetCellAtPosition(mx, my)
            if (cell == null)
                return
            if (cell.revealed)
                return
            cell.cycleMarkedState()

            const buffer = new ArrayBuffer(12);
            const view = new DataView(buffer);
            view.setUint8(0, 3)
            view.setInt32(1, cell.chunk.x, false)
            view.setInt32(5, cell.chunk.y, false)
            view.setUint8(9, cell.x)
            view.setUint8(10, cell.y)

            socket.send(buffer)
        }

        this.canvas.onauxclick = (e) => {
            if (e.button != 1)
                return
            if (isDead)
                return

            let cell = GetCellAtPosition(mx, my)
            if (cell == null)
                return
            if (cell.marked)
                return
            if (!cell.revealed)
                return
            if (cell.bomb)
                return

            let flagged = cell.getMarkedAdjacentCount()
            if (flagged < cell.adjacentBombs) {
                console.log(`${flagged} ${cell.adjacentBombs} too little flagged to reveal`)
                return
            }

            console.log("revealing adjacent")

            let revealed = []
            for (let i = 0; i < cell.adjacentCells.length; i++) {
                let adjacentCell = cell.adjacentCells[i]
                let success = GenericRevealCell(adjacentCell)
                if (success)
                    revealed.push(adjacentCell)
            }

            const buffer = new ArrayBuffer((revealed.length * 10) + 3);

            const view = new DataView(buffer);
            view.setUint8(0, 4)

            view.setUint16(1, revealed.length)

            let currentIndex = 3
            for (let i = 0; i < revealed.length; i++) {
                let revealedCell = revealed[i]
                view.setInt32(currentIndex, revealedCell.chunk.x)
                view.setInt32(currentIndex + 4, revealedCell.chunk.y)
                view.setUint8(currentIndex + 8, revealedCell.x)
                view.setUint8(currentIndex + 9, revealedCell.y)
                currentIndex += 10
            }

            socket.send(buffer)
        }

        this.canvas.onclick = (e) => {
            if (e.button != 0) {
                return
            }
            if (this.dragDifference > 10) {
                return
            }
            if (isDead)
                return

            let cell = GetCellAtPosition(mx, my)
            if (cell == null)
                return
            let success = GenericRevealCell(cell)
            if (!success)
                return

            const buffer = new ArrayBuffer(11);

            const view = new DataView(buffer);
            view.setUint8(0, 1)
            view.setInt32(1, cell.chunk.x, false)
            view.setInt32(5, cell.chunk.y, false)
            view.setUint8(9, cell.x)
            view.setUint8(10, cell.y)

            socket.send(buffer)
        }

        this.canvas.onmousedown = (e) => {
            if (e.button != 0) {
                return
            }
            this.dragDifference = 0
            this.panStartPosition = {
                x: e.clientX,
                y: e.clientY,
                vx: this.internal_viewportPosition.x,
                vy: this.internal_viewportPosition.y
            }
            this.mouseDown = true

            this.velocityX = 0
            this.velocityY = 0
        }
        this.canvas.onmouseup = (e) => this.stopPanning(e)
        this.canvas.onmouseout = () => this.cancelPanning()
        this.canvas.onmousemove = (e) => {
            this.lastMouseX = mx
            this.lastMouseY = my

            mx = e.clientX
            my = e.clientY

            this.dragDifference = Math.abs((this.panStartPosition.x - e.clientX) + (this.panStartPosition.y - e.clientY))
            if (this.dragDifference > 5 && this.mouseDown) {
                this.internal_viewportPosition.x = this.panStartPosition.vx - (this.panStartPosition.x - e.clientX)
                this.internal_viewportPosition.y = this.panStartPosition.vy - (this.panStartPosition.y - e.clientY)
            }
        }
    }

    cancelPanning() {
        this.mouseDown = false
    }

    stopPanning(e) {
        if (e.button != 0)
            return
        this.mouseDown = false

        if (this.dragDifference <= 10)
            return
        mx = e.clientX
        my = e.clientY

        let differenceX = (mx - this.lastMouseX) ^ 0.6
        let differenceY = (my - this.lastMouseY) ^ 0.6

        let mouseVelocityX = differenceX * 0.3 / deltaTime
        let mouseVelocityY = differenceY * 0.3 / deltaTime

        this.velocityX += mouseVelocityX
        this.velocityY += mouseVelocityY

        this.lastMouseX = mx
        this.lastMouseY = my
    }

    update() {
        // this.internal_viewportPosition.x += this.velocityX * deltaTime
        // this.internal_viewportPosition.y += this.velocityY * deltaTime

        let currentMagnitude = magnitude(this.velocityX, this.velocityY)
        let newMagnitude = Math.max(currentMagnitude - deltaTime * 3500, 0)
        let unitVelocity = unit(this.velocityX, this.velocityY)
        this.velocityX = unitVelocity.x * (newMagnitude - deltaTime)
        this.velocityY = unitVelocity.y * (newMagnitude - deltaTime)

        this.viewportPosition.x = Math.round(this.internal_viewportPosition.x)
        this.viewportPosition.y = Math.round(this.internal_viewportPosition.y)
    }
}

const panCanvas = new PannableCanvas()
const context = panCanvas.canvas.getContext("2d")
context.imageSmoothingEnabled = false;
document.body.append(panCanvas.canvas)

panCanvas.internal_viewportPosition.x = window.innerWidth / 2 - cellsPerChunkScaled / 2
panCanvas.internal_viewportPosition.y = window.innerHeight / 2 - cellsPerChunkScaled / 2

let chunkPerFrame = 3
let currentChunkIndex = 0

function viewport_update() {
    panCanvas.canvas.width = window.innerWidth
    panCanvas.canvas.height = window.innerHeight
}

function viewport_render() {
    context.clearRect(0, 0, panCanvas.canvas.width, panCanvas.canvas.height);

    RenderDeath(context)

    for (let i = 0; i < flatPendingChunks.length; i++) {
        let pending = flatPendingChunks[i]
        pending.render(context)
    }

    flatchunks.forEach(chunk => {
        chunk.render(context);
    })

    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        player.render(context)
    }

    if (flatchunks.length <= 0)
        return;

    // batch processing 😛🥰😘😍
    for (let i = 0; i < chunkPerFrame; i++) {
        let chunk = flatchunks[currentChunkIndex]
        chunk.dynamicCull()

        currentChunkIndex++
        if (currentChunkIndex >= flatchunks.length) {
            if (i < chunkPerFrame) {
                currentChunkIndex = 0;
                break;
            }
            currentChunkIndex = 0;
        }
    }
}

var lastChunkX = 1000
var lastChunkY = 1000

function reqChunks(chunkX, chunkY) {
    if (socket.readyState == socket.OPEN && (chunks[chunkX] == null || chunks[chunkX][chunkY] == null) && (lastChunkX != chunkX || lastChunkY != chunkY)) {
        let pending = GetPendingChunkByXY(chunkX, chunkY)
        if (pending != null)
            return

        const buffer = new ArrayBuffer(9);

        const view = new DataView(buffer);
        view.setUint8(0, 0)
        view.setInt32(1, chunkX, false)
        view.setInt32(5, chunkY, false)

        socket.send(buffer)

        lastChunkX = chunkX
        lastChunkY = chunkY

        new PendingChunk(chunkX, chunkY)
    }
}

var lastMouseUpdate = Date.now()
function sendMouseUpdate() {
    if (socket.readyState != socket.OPEN)
        return
    if (Date.now() - lastMouseUpdate <= 50)
        return
    const buffer = new ArrayBuffer(9);

    let leftCanvasX = -panCanvas.viewportPosition.x
    let topCanvasY = -panCanvas.viewportPosition.y

    const view = new DataView(buffer);
    view.setUint8(0, 2)
    view.setInt32(1, mx + leftCanvasX, false)
    view.setInt32(5, my + topCanvasY, false)

    socket.send(buffer)
    lastMouseUpdate = Date.now()
}

document.addEventListener("keydown", (e) => {
    if (e.key == "w") {
        debugDrawBorders = !debugDrawBorders
    }
})

var lastUpdate = Date.now()
var historicalFps = []
function update() {
    let now = Date.now()
    deltaTime = (now - lastUpdate) / 1000
    lastUpdate = now

    panCanvas.update()

    sendMouseUpdate()

    let tempFlatPendingChunks = Array.from(flatPendingChunks)
    for (let i = 0; i < tempFlatPendingChunks.length; i++) {
        let pending = tempFlatPendingChunks[i]
        pending.update(deltaTime)
    }

    viewport_update()
    viewport_render()

    let fps = Math.round(1 / deltaTime)
    let historicalFpsSum = historicalFps.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    historicalFps.push(fps)
    if (historicalFps.length > 100) {
        historicalFps.shift()
    }

    let rawXViewport = (window.innerWidth / 2) - panCanvas.viewportPosition.x
    let rawYViewport = (window.innerHeight / 2) - panCanvas.viewportPosition.y

    let x = rawXViewport - (cellsPerChunkScaled / 2)
    let y = rawYViewport - (cellsPerChunkScaled / 2)

    let chunkX = Math.round(x / cellsPerChunkScaled)
    let chunkY = Math.round(y / cellsPerChunkScaled)

    document.getElementById("dbg_pos_ch").innerText = `Coordinates (Chunk): ${chunkX}, ${chunkY}`
    document.getElementById("dbg_pos_tl").innerText = `Coordinates (Tile): ${Math.floor(panCanvas.viewportPosition.x / 16)}, ${Math.floor(panCanvas.viewportPosition.y / 16)}`
    document.getElementById("dbg_fps").innerText = `FPS: ${Math.round(historicalFpsSum / historicalFps.length)}`

    reqChunks(chunkX, chunkY)
    for (let i = 0; i < directions.length; i++) {
        let direction = directions[i]
        reqChunks(chunkX + direction[0], chunkY + direction[1])
    }

    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        player.update(deltaTime)
    }

    UpdateDeath(deltaTime)

    requestAnimationFrame(update)
}

requestAnimationFrame(update)