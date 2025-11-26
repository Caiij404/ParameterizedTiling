import * as PIXI from 'pixi.js';
import { LineManager } from './LineManager';
import { StatusManager } from './StatusManager';
import { Creation } from './Creation';

type Size = {
    w: number;
    h: number;
}


export class SweepEditorUI{
    private static instance: SweepEditorUI;
    private app: PIXI.Application;
    private stage: PIXI.Container
    private baseGraphics: PIXI.Container;
    private heightText: PIXI.Text;
    private height: number = 200;
    private hitArea: PIXI.Container<PIXI.Graphics>;

    public lineManager: LineManager;
    public statusManager: StatusManager;

    private constructor(){
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0xffffff,
            resolution: window.devicePixelRatio | 1,
            resizeTo: window,
        });
        document.body.appendChild(this.app.view as any);

        // window.addEventListener('wheel',(e)=>{
        // 	const step = e.deltaY < 0 ? 0.03 : -0.03;
        // 	if(this.stage.scale.x + step >= 0.03)
        // 	{
        // 		this.stage.scale.x += step;
        // 		this.stage.scale.y += step;
        // 	}
        // });

        this.stage = this.app.stage;
        this.stage.position.set(window.innerWidth / 2, window.innerHeight / 2);

        this.baseGraphics = this.createGraphics();
        this.stage.addChild(this.baseGraphics);

        this.heightText = this.createSweepHeight();
        this.stage.addChild(this.heightText);

        this.hitArea = this.createHitArea();
        this.stage.addChild(this.hitArea);

        this.lineManager = LineManager.get();
        this.lineManager.initStage(this.stage);

        this.statusManager = StatusManager.get();

        window.addEventListener('keydown',(e)=>{
            if(e.key == '8')
            {
                Creation.get().start();
            }
        })
    }

    public static get(): SweepEditorUI{
        if(!this.instance)
        {
            this.instance = new SweepEditorUI();
        }
        return this.instance;
    }

    private createGraphics(): PIXI.Container{
        const baseGraphicsContain = new PIXI.Container();
        
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, 0xb1b1b1, 1);
        graphics.beginFill(0xdddddd);
        const path = [
            0, 0, 0, 300, 450, 300, 450, 320, -20, 320, -20, 20, -200, 20, -200, 0,
        ];
        graphics.drawPolygon(path);
        graphics.endFill();
    
        // graphics.position.set(500, 500);
        graphics.scale.y = -1;
        baseGraphicsContain.addChild(graphics);
    
        const line1 = new PIXI.Graphics();
        line1.lineStyle(2, 0xb1b1b1, 1);
        line1.moveTo(0, 0);
        line1.lineTo(20, 0);
        line1.position.set(410, -298);
        baseGraphicsContain.addChild(line1);
    
        const line2 = line1.clone();
        line2.position.set(410, 0);
        baseGraphicsContain.addChild(line2);
    
        const line3 = new PIXI.Graphics();
        line3.lineStyle(2, 0xb1b1b1, 1);
        line3.moveTo(0, 0);
        line3.lineTo(0, -300);
        line3.position.set(420, 0);
        baseGraphicsContain.addChild(line3);

        return baseGraphicsContain;
    }

    private createSweepHeight(): PIXI.Text{
        const textStyle = {fontSize: 15};
        const text = new PIXI.Text(this.height.toString(), textStyle);
        text.rotation = Math.PI / 2;
        // text.scale.y = -1;
        // text.scale.x = -1;
        text.pivot.set(text.width / 2, text.height / 2);
        text.position.set(445,-150);
        return text;
    }

    public getHeight(): number{
        return this.height;
    }

    public setHeight(n: number){
        this.height = n;
        this.heightText.text = n.toString();
    }

    private createHitArea(): PIXI.Container<PIXI.Graphics>{
        let areas = new PIXI.Container<PIXI.Graphics>();
        const area1 = this.createArea('zone1');
        areas.addChild(area1);
        
        const area2 = this.createArea('zone2');
        areas.addChild(area2);

        const area3 = this.createArea('zone3');
        areas.addChild(area3);

        return areas;
    }

    private createArea(mark: string):PIXI.Graphics{
        const area = new PIXI.Graphics();
        //@ts-ignore
        area.mark = mark;
        area.lineStyle(2, 0xb1b1b1, 1);
        let size = [0,0];
        if(mark == 'zone1')
        {
            area.pivot.set(80,0);
            size = [80,50];
        }
        else if(mark == 'zone2')
        {
            area.pivot.set(0,50);
            size = [80,50];
        }
        else if(mark == 'zone3')
        {
            area.pivot.set(0,300);
            size = [80,80];
        }

        area.beginFill(0xffffff);
        area.drawRect(0,0,size[0],size[1]);
        area.endFill();

        // @ts-ignore
        area.eventMode = 'static';
        
        const pointerOver = ()=>{
            this.statusManager.setHoverZone(mark);
            console.log(mark, 'over')
        }
        const pointerOut = ()=>{
            this.statusManager.setHoverZone();
            console.log(mark, 'out');
        }
        const onClick = ()=>{
            console.log(mark, 'onClick');
        }

        // @ts-ignore
        area.on('pointerover',pointerOver,area);
        // @ts-ignore
        area.on('pointerout',pointerOut,area);
        // @ts-ignore
        area.on('pointerdown',onClick,area);

        
        return area;
    }

}