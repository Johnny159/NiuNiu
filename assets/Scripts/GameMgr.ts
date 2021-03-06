import GameMgrBase from "./components/GameMgrBase";
import Game from "./Game";
import Converter ,* as Define from "./Define";
import { ButtonSetting } from "./components/MessageBoxCtr";
import UIMgr from "./UIMgr";
import NetworkManager from "./NetworkManager";
import Waiting from "./FSM/Waiting";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameMgr extends GameMgrBase {
    start() {
        this.init();
        Game.Inst.networkMgr.registerEvent("websocket", (msg) => { this.receiveServerConnect(msg); });
        Game.Inst.networkMgr.registerEvent("self_info", (msg) => { this.receiveMyUID(msg); });
        Game.Inst.networkMgr.registerEvent("time_info", (msg) => { this.receiveTimeInfo(msg); });
        Game.Inst.networkMgr.registerEvent("deal_cards", (msg) => { this.receiveDealInfo(msg); });
        Game.Inst.networkMgr.registerEvent("game_results", (msg) => { this.receiveCalcInfo(msg); });
        Game.Inst.networkMgr.registerEvent("recover_info", (msg) => { this.receiveRecoverInfo(msg); });
        Game.Inst.networkMgr.registerEvent("spam_message", (msg) => { this.receiveSpamMsg(msg); });

        cc.game.on(cc.game.EVENT_HIDE, () => {
            cc.warn("////HIDE//////");
            Game.Inst.isNeedReconnect = false;
            Game.Inst.networkMgr.disconnect();
        });
        cc.game.on(cc.game.EVENT_SHOW, () => {
            cc.warn("////SHOW//////");
            Game.Inst.isNeedReconnect = true;
            this.checkPlayerPlaying(); 
        });
    }

    startStateMachine() {
        this.FSM.setState(Define.GameState.Waiting);
        //BGM
        UIMgr.Inst.AudioMgr.playBGM();
    }

    quitBtnClick() {
        cc.log("QUIT");
        if (Define.GameInfo.Inst.endGame == true){
            Game.Inst.EventListener.clear();
            let data = sessionStorage.getItem("key");
            if (data != null){
                var url = window.location.href
                var arr = url.split("/");
                window.open(arr[0] + '//' + arr[2] + '/index.html','_self');
            }
            else{
                cc.director.loadScene("scene_start");
            }
        }
        else{
            UIMgr.Inst.showCantQuitMsg();
        }

    }
    
    connectServerComplete() {
        Game.Inst.isNeedReconnect = false;
    }

    checkPlayerPlaying() {
        let url = 'http://' + NetworkManager.ServerURL.split(':')[0] + ':8080/player/playing';
        let token = NetworkManager.Token;
        console.log('url is ' + url);
        Game.Inst.networkMgr.httpRequest("GET", url, token, "", function (data) {
            cc.log(data);
            if (data.data.is_playing == true) {
                this.connectServer();
            }
            else {
                this.FSM.setState(Define.GameState.End);
            }
        }.bind(this));
    }

    disconnectServer() {
        //if not game over , reconnect.
        if (this.FSM != null) {
            let nowState: Define.GameState = this.FSM.activeState.state;
            switch(nowState){
                case Define.GameState.Waiting:
                case Define.GameState.GrabBanker:
                case Define.GameState.PlaceBet:
                case Define.GameState.PlayCard:
                    setTimeout(() => {
                    if (Game.Inst.isNeedReconnect) {
                        this.checkPlayerPlaying();
                        }
                    }, 500);
                    break;
                default:
                    break;
            }
        }
    }

    disconnectWebSocket(){
        Game.Inst.networkMgr.disconnect();
    }

    onRestartGame() {
    }

    quitGame() {
        Game.Inst.networkMgr.unregisterEvent("websocket");
        Game.Inst.networkMgr.unregisterEvent("matching");
        Game.Inst.networkMgr.unregisterEvent("init_info");
        Game.Inst.networkMgr.unregisterEvent("player_action");
        Game.Inst.networkMgr.unregisterEvent("deal_cards");
        Game.Inst.networkMgr.unregisterEvent("game_results");
        Game.Inst.networkMgr.unregisterEvent("recover_info");
        Game.Inst.networkMgr.unregisterEvent("spam_message");
        Game.Inst.networkMgr.unregisterEvent("announce_banker");
        Game.Inst.networkMgr.unregisterEvent("available_bet_rates");
        Game.Inst.networkMgr.unregisterEvent("max_grab_rate");
        Game.Inst.networkMgr.unregisterEvent("recover_info");
        cc.log("End");
    }

    // protocol

    /**
     * 收到連線成功Respone
     * @param msg 
     */
    receiveServerConnect(msg: Define.WebSocketResp) {
        if (!msg.success) {
            cc.error("[TWGameMgr] Websocket connect fail!");
        }
    }

    /**
     * 收到斷線重連Respone
     * @param msg 
     */
    receiveServerRecorver(msg) {
    }

    /**
     * 收到連線錯誤Respone
     * @param msg 
     */
    receiveServerError(msg) {
    }

    receiveMyUID(msg){
        Define.GameInfo.Inst.myUID = msg.pf_account;
    }

    /**
     * 收到stage初始時間
     * @param msg 
     */
    receiveTimeInfo(msg: Define.TimeBroadcast) {
        //cc.log(msg);
        //update remain time
        Define.GameInfo.Inst.remainTime = msg.seconds;
        cc.log("set clock time " + msg.seconds);
        switch(msg.cur_state){
            case "grab_banker_state":
                cc.log("switch to grab_banker_state");
                this.FSM.setState(Define.GameState.GrabBanker);
                break;
            case "bet_state":
                cc.log("switch to PlaceBet");
                this.FSM.setState(Define.GameState.PlaceBet);
                break;
            case "play_card_state":
                cc.log("PlayCard CountDown");
                UIMgr.Inst.startPlayCardCountDown();
                break;    
        }
        
    }

    /**
     * 收到deal stage 初始資訊
     * @param msg 
     */
    receiveDealInfo(msg : Define.DealInfo){
        this.FSM.setState(Define.GameState.PlayCard);
        //save my card & type
        Define.GameInfo.Inst.players[0].poker = msg.cards;
        Define.GameInfo.Inst.players[0].cardType = msg.card_type;
        if(msg.card_type == -1) Define.GameInfo.Inst.players[0].cardType = Define.CardType.noCow;
        if(msg.card_type == 0) Define.GameInfo.Inst.players[0].cardType = Define.CardType.cowCow;
        //cc.warn("my cards : " + Define.GameInfo.Inst.players[0].poker + "type : " + Define.GameInfo.Inst.players[0].cardType);
    }

    /**
     * 收到結算資訊
     * @param msg 
     */
    receiveCalcInfo(msg : Define.CalcInfo){
        //push myself first
        for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
            //map correct player
            let playerInfoIndex : number = 0;
            for(playerInfoIndex = 0; playerInfoIndex < Define.GameInfo.Inst.playerCount; playerInfoIndex++){
                if(msg.players_info[playerInfoIndex].pf_account != Define.GameInfo.Inst.players[i].UID) {
                    cc.warn(msg.players_info[playerInfoIndex].pf_account +"!="+Define.GameInfo.Inst.players[i].UID);
                    continue;
                }
                // cc.warn("find @" +playerInfoIndex );
                break;
            }
            //save data
            Define.GameInfo.Inst.players[i].win_bet = msg.players_info[playerInfoIndex].profit;
            Define.GameInfo.Inst.players[i].final_coin = msg.players_info[playerInfoIndex].money_src;
        }
        //goto final result state
        this.FSM.setState(Define.GameState.Calc);
    }

    receiveRecoverInfo(msg : Define.RecoverInfo){
        cc.warn("receive recover info ");
        cc.log(msg);
        let gameInfo: Define.GameInfo = Define.GameInfo.Inst;

        let msgPlayer : Define.PlayersInfo[] = msg.data.common.players_info;

        //RoomInfo Setting
        gameInfo.baseBet = msg.data.common.game_info.base_bet;
        gameInfo.coinsLimit = msg.data.common.game_info.coins_limit;
        gameInfo.levyRate = msg.data.common.game_info.levy_rate;
        gameInfo.roomID = msg.data.common.game_info.room_id;
        gameInfo.myUID = msg.data.pf_account;
        gameInfo.remainTime = msg.seconds;

        //Player Setting
        gameInfo.playerCount = msgPlayer.length;
        gameInfo.players.length = 0;

        let myUID : string = gameInfo.myUID;

        //push myself first
        for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
            if(msgPlayer[i].pf_account != myUID) continue;
            let player: Define.Player = new Define.Player();
            player.UID = msgPlayer[i].pf_account;
            player.money = msgPlayer[i].money_src;
            player.name = msgPlayer[i].name;
            player.iconID = msgPlayer[i].avatar;
            player.gender = msgPlayer[i].gender;
            player.vip = msgPlayer[i].vip;
            gameInfo.players.push(player);
        }
        //skip mySelf
        for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
            if(msgPlayer[i].pf_account == myUID) continue;
            let player: Define.Player = new Define.Player();
            player.UID = msgPlayer[i].pf_account;
            player.money = msgPlayer[i].money_src;
            player.name = msgPlayer[i].name;
            player.iconID = msgPlayer[i].avatar;
            player.gender = msgPlayer[i].gender;
            player.vip = msgPlayer[i].vip;
            gameInfo.players.push(player);
        }

        UIMgr.Inst.initPlayerInfo();

        gameInfo.mainPlayer = Converter.getServerPlayerCount(myUID);

        //room info UI set
        UIMgr.Inst.roomInfo.setRoomInfo(gameInfo.roomID);
        UIMgr.Inst.roomInfo.setRoomName(Converter.getServerRoomName(NetworkManager.Oid));
        UIMgr.Inst.roomInfo.setAntes(gameInfo.baseBet);
        UIMgr.Inst.roomInfo.setVisible(true);

        /**recover to correct stage */
        switch(msg.cur_state){
            case "grab_banker_state":
                cc.log("switch to grab_banker_state");
                this.FSM.setState(Define.GameState.GrabBanker);
                for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
                    //grab rate already show
                    if(msgPlayer[i].is_finish_grab){
                        UIMgr.Inst.getPlayerByUID(msgPlayer[i].pf_account).setStatus(Define.BetType.RobBet,msgPlayer[i].grab_rate);
                    }
                }
                break;
            case "bet_state":
                cc.log("switch to PlaceBet");
                this.FSM.setState(Define.GameState.PlaceBet);
                for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
                    //banker
                    if(msgPlayer[i].is_banker){
                        gameInfo.bankerIndex = UIMgr.Inst.getPlayerIndexByUID(msgPlayer[i].pf_account);
                        UIMgr.Inst.players[gameInfo.bankerIndex].setBanker(true);
                    }
                    //bet rate already show
                    else if(msgPlayer[i].is_finish_bet){
                        UIMgr.Inst.getPlayerByUID(msgPlayer[i].pf_account).setStatus(Define.BetType.PlaceBet,msgPlayer[i].bet_rate);
                    }
                    else if(msgPlayer[i].pf_account != myUID){
                        UIMgr.Inst.BetUIMgr.setRate(msg.data.common.available_bet_rates);
                    }
                }
                break;
            case "play_card_state":
                cc.log("PlayCard CountDown");
                for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
                    if(msgPlayer[i].pf_account != myUID) continue;
                    //get index
                    let curPlayerIndex : number = UIMgr.Inst.getPlayerIndexByUID(msgPlayer[i].pf_account);
                    //set card info
                    gameInfo.players[curPlayerIndex].poker = msgPlayer[i].cards;
                    gameInfo.players[curPlayerIndex].cardType = msgPlayer[i].card_type;
                    //make api type serial match client
                    if(msgPlayer[i].card_type == -1) gameInfo.players[curPlayerIndex].cardType = 0;
                    else if(msgPlayer[i].card_type == 0) gameInfo.players[curPlayerIndex].cardType = 10;
                }
                this.FSM.setState(Define.GameState.PlayCard);
                for (let i = 0; i < Define.GameInfo.Inst.playerCount; i++) {
                    //get index
                    let curPlayerIndex : number = UIMgr.Inst.getPlayerIndexByUID(msgPlayer[i].pf_account);
                    //banker
                    if(msgPlayer[i].is_banker){
                        gameInfo.bankerIndex = curPlayerIndex;
                        UIMgr.Inst.players[gameInfo.bankerIndex].setBanker(true);
                    }
                    //bet rate already show
                    else{
                        UIMgr.Inst.getPlayerByUID(msgPlayer[i].pf_account).setStatus(Define.BetType.PlaceBet,msgPlayer[i].bet_rate);
                    }
                    //sync already finish play card player
                    if(msgPlayer[i].is_finish_play){
                        UIMgr.Inst.CardStatusUIMgr.setComplete(curPlayerIndex,true);
                        gameInfo.players[curPlayerIndex].poker = msgPlayer[i].cards;
                        gameInfo.players[curPlayerIndex].cardType = msgPlayer[i].card_type;
                        //make api type serial match client
                        if(msgPlayer[i].card_type == -1) gameInfo.players[curPlayerIndex].cardType = 0;
                        else if(msgPlayer[i].card_type == 0) gameInfo.players[curPlayerIndex].cardType = 10;
                    }
                }
                UIMgr.Inst.startPlayCardCountDown();
                break;    
        }
    }

    receiveSpamMsg(Msg : Define.SpamMsg){
        let index = UIMgr.Inst.getPlayerIndexByUID(Msg.speaker_uid);
        UIMgr.Inst.players[index].talk(Msg.message_index);
        cc.warn("player"+index+"rcv canned msg"+ Msg.message_index);
    }

}
