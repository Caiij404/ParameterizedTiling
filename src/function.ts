//@ts-nocheck
import * as PIXI from 'pixi.js'
let n = 100;
export function createGraphics(stage: PIXI.Container<PIXI.DisplayObject>){
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
	stage.addChild(graphics);

	const line1 = new PIXI.Graphics();
	line1.lineStyle(2, 0xb1b1b1, 1);
	line1.moveTo(0, 0);
	line1.lineTo(20, 0);
	line1.position.set(410, -298);
	stage.addChild(line1);

	const line2 = line1.clone();
	line2.position.set(410, 0);
	stage.addChild(line2);

	const line3 = new PIXI.Graphics();
	// line3.lineStyle(2, 0xb1b1b1, 1);
	line3.lineStyle({
		width: 2,
		color: 0xb1b1b1,
		alpha: 1,
		dash: [10, 5]
	})
	line3.moveTo(0, 0);
	line3.lineTo(0, -300);
	line3.position.set(420, 0);
	stage.addChild(line3);
}

export function sweepHeight(stage: PIXI.Container<PIXI.DisplayObject>, num: number){
    const textStyle = {fontSize: 15};
	const text = new PIXI.Text(num, textStyle);
	text.rotation = Math.PI / 2;
	// text.scale.y = -1;
	// text.scale.x = -1;
	text.pivot.set(text.width / 2, text.height / 2);
	text.position.set(445,-150);
	stage.addChild(text);

	window.addEventListener('keydown',(e)=>{
		if(e.key == '6')
		{
			text.text = n.toString();
			n++;
		}
	})

	// const textStyle = { fontFamily : "Arial", fontSize: 24, fill : "#ffffff" };
 
	// // 创建文本对象
	// const text = new PIXI.Text("Hello World!", textStyle);
	// text.anchor.x = 0; // 水平居左
	// text.anchor.y = 1; // 垂直居右（从顶部开始）
	// text.rotation = -Math.PI / 2; // 旋转90度
	// text.width = 50; // 限定宽度
	// text.height = 300; // 高度自动调整
	// text.lineHeight = 36; // 行间距
	// text.style.wordWrap = true; // 换行
	// text.style.breakWords = false; // 不断字符换行
}

export function addHitArea(stage: PIXI.Container<PIXI.DisplayObject>){
    const rect1 = new PIXI.Graphics();
	// rect1.lineStyle(2, 0xb1b1b1, 1);
	rect1.lineStyle({
		width: 2,
		color: 0xb1b1b1,
		alpha: 0.8,
		alignment: 0.5,
	});
	rect1.pivot.set(0,50)
	rect1.beginFill(0xffffff);
	rect1.drawRect(0,0,80,50);
	rect1.endFill();
	stage.addChild(rect1);

	const rect2 = rect1.clone();
	rect2.pivot.set(80,0);
	stage.addChild(rect2);

	const rect3 = new PIXI.Graphics();
	rect3.lineStyle(2, 0xb1b1b1, 1);
	rect3.pivot.set(0,300);
	rect3.beginFill(0xffffff);
	rect3.drawRect(0,0,80,80);
	rect3.endFill();
	stage.addChild(rect3);

	// rect1.cursor = 'pointer';
	// rect1.mark = 'zoom1';
	// rect1.eventMode = 'static';
	// rect1.on('pointerdown',(e)=>{
	// 	console.log('rect1 pointerdown')

	// },rect1);

	// rect1.addEventListener('pointerdown',(e)=>{
	// 	console.log('rect1')
	// 	// rect1.destroy();
	// 	rect1.alpha = 0;
	// 	console.log(rect1.mark);
	// })

	// rect1.addEventListener('pointerenter',(e)=>{

	// })
	// rect1.hitArea
}

export function createLine(stage: PIXI.Container<PIXI.DisplayObject>){
    const texture = PIXI.Texture.from('./line.jpg');
	const line = new PIXI.Sprite(texture);
	line.anchor.set(0.5);
	line.scale.set(0.5,0.5);
	line.eventMode = 'none';
	let lineCreating = (e)=>{
		let mousePoint = [e.clientX, e.clientY];
		let original = [stage.position.x, stage.position.y];
		line.position.set(mousePoint[0] - original[0], mousePoint[1] - original[1])
		console.log('111111')
	};

	window.addEventListener('mousemove',lineCreating)
	window.addEventListener('keydown',(e)=>{
		if(e.key == 'Escape' && !line.destroyed)
		{
			console.log('Line Destroy');
			line.destroy();
			window.removeEventListener('mousemove',lineCreating);
		}
	});
	window.addEventListener('mousedown',(e)=>{
		if(e.button == 2 && !line.destroyed)
		{
			console.log('Line Destroy')
			line.destroy();
			window.removeEventListener('mousemove',lineCreating);
		}
	})
	stage.addChild(line);
}

export default {createGraphics, sweepHeight, addHitArea, createLine};