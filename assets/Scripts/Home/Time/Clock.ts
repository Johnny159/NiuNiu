const {ccclass, property} = cc._decorator;

@ccclass
export default class Clock extends cc.Component {

    private Obj: any = {
        time: null,
        time2: null
    }

    onLoad() {
        this.Obj.time = cc.find("time", this.node).getComponent("Num2Sprite");
        this.Obj.time2 = cc.find("time2", this.node).getComponent("Num2Sprite");
    }

    settime(time, timer) {
        if (time.toString().length == 2) {
            timer.Obj.time2.active = true;
            timer.Obj.time.active = false;
        }
        else {
            timer.Obj.time2.active = false;
            timer.Obj.time.active = true;
        }
        this.Obj.time.setNum(time);
    }
}
