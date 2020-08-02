console.log('loaded Network.js')


class Network{
    constructor(){
        this.connections = {}
        this.ws
        this.localId
        this.peerList
        this.setup()
    }
    setup(){
        // Setup websocket
        this.ws = new WebSocket(location.origin.replace(/^http/,'ws'))
        // ws
        this.ws.sendPayload = (destId,data)=>{
            if(data.sdp){
                console.log('Sending sdp')
            }else{
                console.log('Sending not')
            }
            this.ws.send(JSON.stringify([destId,data]))
        }

        this.ws.addEventListener('message',this.handleSignallingServer)
    }
    establishConnectionList(){
        // Tries to ESTABLISH a connection with all peers in peerList
        this.peerList.forEach(id=>{
            this.createConnection(id)
            this.sendOffer(id)
        })
    }
    createConnection(remoteId=this.peerList[0]){  // $$$$$$$$$$
        const connection = new Connection(this.localId,remoteId,this.ws)
        this.connections[remoteId] = connection

        return connection
    }
    sendOffer(remoteId=this.peerList[0]){  // $$$$$
        this.connections[remoteId].sendOffer()
    }

    handleSignallingServer = e => 
    {
        // console.log('handleSignallingServer e.data:',e.data)
        if(this.peerList){
            // Two cases:
            // 1) A new peron is trying to establish a connection and has sent an offer
            // 2) You, the new person has sent an offer and you've got a reply
            // How do we tell them appart? => Only the "new person" has the remote peer in his peerList
            const payload = JSON.parse(e.data)
            console.log('payload',payload)

            const senderId = payload[0]
            const data = payload[1]
            if(this.peerList.indexOf(senderId) === -1){
                // you don't have senderId in your peerList => case 1)

                // Create a new connection with that senderId
                const connection = this.createConnection(senderId)
                connection.handleSignallingServer(data,false)


                // add senderId ? (might be good leaving it out for now for debugging purposes) !@#!@#!@#
            }else{
                // You are the new person, case 2)
                const connection = this.connections[senderId]
                connection.handleSignallingServer(data,true)
            }
        }else{
            // THIS ONLY RUNS ONCE WHEN USER CONNECTS
            const data =  JSON.parse(e.data)

            // Extract data (localId, peerList)
            this.localId = data[0]
            this.peerList = data[1]

            console.log('Your are: ',this.localId)
        }
    }
}

class Connection{
    constructor(localId,remoteId,ws){
        this.pc
        this.localId = localId
        this.remoteId = remoteId
        this.ws = ws
        this.dataChannel
        this.candidateBacklog = []  // list of ice canidadates that have yet to been added

        this.setup()
        return this
    }
    setup(){
        check(this)
        // Setup peerconnection 
        this.pc = new RTCPeerConnection(config)

        // ice
        this.pc.onicecandidate = this.gotIceCandidate

        // datachannel
        // this.pc.ondatachannel = 
        this.pc.ondatachannel = this.dataChannelHandler
    }
    sendOffer(){
        check(this)
        // create dataChannel
        // !@#!@#!@# need to complete
        this.dataChannel = this.pc.createDataChannel('憂')
        this.setupDataChannel()

        // offer
        this.createSession(1)
    }
    gotIceCandidate = (e) =>{
        check(this)
        // Send ice candidate to remote peer
        console.log('gotIceCandidate',e)
        const candidate = e.candidate
        if(candidate){
            this.ws.sendPayload(this.remoteId,{ice:candidate})
        }
    }
    createSession = async (isOffer) =>{
        check(this)
        try{
            let session
            if(isOffer){
                session = await this.pc.createOffer()
            }else{
                session = await this.pc.createAnswer()
            }
            await this.pc.setLocalDescription(session)
            console.log('Connection to: ',this.remoteId,', has localDescription of:',this.pc.localDescription)
            this.ws.sendPayload(this.remoteId,this.pc.localDescription)
        }catch(err){
            console.warn('ERROR:',err)
        }
    }
    handleSignallingServer = async (data,isOfferer) =>{
        check(this)
        //!@#!@#!@# handle for ice

        if(data.sdp){
            // Set remoteDescription
            this.pc.setRemoteDescription(data)
                .then(_=>{
                    console.log('Connection to: ',this.remoteId,', has remoteDescription of:',this.pc.remoteDescription)
                    if(!isOfferer){
                        // Create answer
                        this.createSession(false)
                    }
                    if(this.candidateBacklog.length>0){
                        this.addBacklog()
                    }
                })
                .catch(err=>console.warn(err))
        }else if(data.ice){
            if(this.pc.remoteDescription){
                // When can add ice candidate without it causing an error
                this.pc.addIceCandidate(data.ice)
                .then()
                .catch(err=>console.warn(err))
            }else{
                // network.connections[1].pc.remoteDescription === null
                // add to backlog to be added later
                this.candidateBacklog.push(data.ice)
            }
            console.log('data.ice',data.ice)
        }else{
            console.warn('ERROR: this should not be happening! Make sure not to send anything from remote client if candidate == undefined')
        }
    }
    dataChannelHandler = e =>{
        check(this)
        console.log('added the dataChannel')
        this.dataChannel = e.channel
        a.b = e.channel
        this.setupDataChannel()
    }
    addBacklog(){
        check(this)
        this.candidateBacklog.forEach(candidate=>{
            this.pc.addIceCandidate(candidate)
            .then()
            .catch(err=>console.warn(err))
        })
    }
    setupDataChannel(){
        check(this)
        console.log('Datachannel established')

        // this.dataChannel.addEventListener('message',e=>{
        //     console.log('dataChannel message: ',e)
        // })
    }
}
a = {

}

const config = {
    iceServers:[
        {urls: 'stun:stun.stunprotocol.org:3478'},
        {urls: 'stun:stun.l.google.com:19302'},
    ]
}

function check(that){
    const a = network.connections[Object.keys(network.connections)[0]]
    addToUniqueList(that)
    if(Object.keys(network.connections).length>0){
        console.log('#####',that===a)
        if((that===a)===false){
            console.log('that',that)
            console.log('network.connections',a)
            console.log('findDifferentKeys',findDifferentKeys(that,a))
        }
        debugger
    }
}

function findDifferentKeys(a,b){
    const nonMatching = []
    nonMatching.push(...findDifferentKeys2(a,b))
    nonMatching.push(...findDifferentKeys2(b,a))
    return nonMatching
}

function findDifferentKeys2(a,b){
    const nonMatching = []
    aList = Object.keys(a)
    bList = Object.keys(b)
    for(let i=0;i<aList.length;i++){
        let foundMatch = false
        for(let j=0;j<bList.length;j++){
            if(aList[i] === bList[j]){
                foundMatch = true
                break
            }
        }

        if(foundMatch === false){
            nonMatching.push(aList[i])
        }
    }
    return nonMatching
}

var uniqueList = []

function addToUniqueList(item){
    if(uniqueList.indexOf(item)===-1){
        uniqueList.push(item)
    }
}