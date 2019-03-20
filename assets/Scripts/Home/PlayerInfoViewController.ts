//import PlayerInfo from "../PlayerInfo/Model/PlayerInfo";
import global from "../Common/Global";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerInfoViewController extends cc.Component {

    //ctor
    //=====================================================================
    private playerInfo: any = null; // �Ҧ����a���W�l�B�����B�U�ު��A
    private playerScript: any = {
        PreRival: null,
        Me: null,
        NextRival: null,
        PrePreRival: null,
        NextNextRival: null
    };
    private defaultImgs: any = ["newnew/common/playerPic1", "newnew/common/playerPic2", "newnew/common/playerPic3", "newnew/common/playerPic4", "newnew/common/playerPic5", "newnew/common/playerPic6"];
    private autoPlaying: cc.Node;
    //=====================================================================

    //property
    //================================================
    @property(cc.Node)
    Me: cc.Node = null;

    @property(cc.Node)
    PreRival: cc.Node = null;

    @property(cc.Node)
    NextRival: cc.Node = null;

    @property(cc.Node)
    PrePreRival: cc.Node = null;

    @property(cc.Node)
    NextNextRival: cc.Node = null;

    @property(cc.Node)
    Autoplaying: cc.Node = null;
    //=================================================

   

    autoPlay() {
        global.Instance.EventListener.notify("AIswitch");
    }

    onLoad() {
        var self = this;
        //this.autoPlaying = cc.find("AutoPlaying", this.node.parent);
        // �bplayerInfo��parent folder(PlayGround)��AutoPlaying node�A�s�Jctor�ŧi��this.autoPlaying

        this.playerScript.PreRival = this.PreRival.getComponent("player");
        this.playerScript.Me = this.Me.getComponent("player");
        this.playerScript.NextRival = this.NextRival.getComponent("player");
        this.playerScript.PrePreRival = this.PrePreRival.getComponent("player");
        this.playerScript.NextNextRival = this.NextNextRival.getComponent("player");
        //�s�J���Ӫ��a��player(scrpit)

        cc.loader.loadResDir("newnew/common", function (err, assets) { });
        //load newnew/common ��] ���N��

        global.Instance.EventListener.on("roomReady", function (event, Info) {
            cc.log("roomReady in PlayerInfoViewCtrlr");
            cc.log("piv get ", Info);
            self.UpdateRoom(Info);
            cc.log("RoomReady in Player Done");
        });

        /*global.Instance.network.socket()("roomReady", function (Info) {
            self.UpdateRoom(Info);
            cc.log("getRoomReady");
        });*/
        //����server�^�ǩҦ����a��Info�A�s�JplayerInfo�A�éI�s�禡

    }




    showKingAnime(kingUID) {
        this.Me.getChildByName("dizhuIcon").active = true;
    }

    // ������A���H���A���禡�Q�I�s�A���W�l�A�����A���L�U��
    UpdateRoom(playerInfo) {
        cc.log("updateRoom");
        var self = this;

        cc.log(playerInfo);
        
        this.playerScript.Me.setName(playerInfo.Me.name);
        this.playerScript.PreRival.setName(playerInfo.Pre.name);
        this.playerScript.NextRival.setName(playerInfo.Next.name);
        this.playerScript.PrePreRival.setName(playerInfo.PrePre.name);
        this.playerScript.NextNextRival.setName(playerInfo.NextNext.name);


        this.playerScript.Me.setCoin(playerInfo.Me.coin);
        this.playerScript.PreRival.setCoin(playerInfo.Pre.coin);
        this.playerScript.NextRival.setCoin(playerInfo.Next.coin);
        this.playerScript.PrePreRival.setCoin(playerInfo.PrePre.coin);
        this.playerScript.NextNextRival.setCoin(playerInfo.NextNext.coin);
        // ��缾�a�U�ު��A
        // this.autoPlaying.active = playerInfo.isAI;


        // load���a�Ϥ��A�éI�s�C�Ӫ��aplayer.js���禡setImg�A���Ҧ����a��W���a�Ϥ�
        if (playerInfo.Me.img != null)
            cc.loader.loadRes(this.defaultImgs[playerInfo.Me.img], cc.SpriteFrame, function (err, spriteFrame) {

                self.playerScript.Me.setImg(spriteFrame);
            });


        if (playerInfo.Pre.img != null)
            cc.loader.loadRes(this.defaultImgs[playerInfo.Pre.img], cc.SpriteFrame, function (err, spriteFrame) {
                self.playerScript.PreRival.setImg(spriteFrame);
            });


        if (playerInfo.Next.img != null)
            cc.loader.loadRes(this.defaultImgs[playerInfo.Next.img], cc.SpriteFrame, function (err, spriteFrame) {
                self.playerScript.NextRival.setImg(spriteFrame);
            });

        if (playerInfo.PrePre.img != null)
            cc.loader.loadRes(this.defaultImgs[playerInfo.PrePre.img], cc.SpriteFrame, function (err, spriteFrame) {
                self.playerScript.PrePreRival.setImg(spriteFrame);
            });


        if (playerInfo.NextNext.img != null)
            cc.loader.loadRes(this.defaultImgs[playerInfo.NextNext.img], cc.SpriteFrame, function (err, spriteFrame) {
                self.playerScript.NextNextRival.setImg(spriteFrame);
            });


    }
}
