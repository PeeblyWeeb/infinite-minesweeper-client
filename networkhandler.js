const packetRegistry = [
    new ChunkReceivedPacket(),
    new PlayerRegisterPacket(),
    new CursorUpdatePacket(),
    new RevealCellPacket(),
    new MarkCellPacket(),
    new BannedPacket(),
    new PlayerUnregisterPacket(),
    new ChunkDoesntExistPacket(),
    new ChordCellPacket()
]

function ReceivedData(data) {
    let view = new DataView(data);
    let packetId = view.getUint8(0)

    let u8 = new Uint8Array(data);
    let rawData = u8.subarray(1);

    let rawView = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);

    console.log(`received packet ${packetId}`)

    let foundPacket = false
    for (let i = 0; i < packetRegistry.length; i++) {
        let packet = packetRegistry[i]
        if (packet.packetId == packetId) {
            packet.Received(rawView)
            foundPacket = true
            break
        }
    }

    if (!foundPacket) {
        console.warn(`could not find handler for packet ${packetId}`)
    }
}