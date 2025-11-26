<template>
  <div>
  </div>
</template>

<script setup lang="ts">
// import * as PIXI from "pixi.js"
// import {addHitArea, createGraphics, createLine, sweepHeight} from './function'
// const app = new PIXI.Application({
// 	width: window.innerWidth,
// 	height: window.innerHeight,
// 	backgroundColor: 0xffffff,
// 	resolution: window.devicePixelRatio | 1,
// 	resizeTo: window,
// });

// const test = new PIXI.Sprite();
// test.on

import { SweepEditorUI } from "./SweepEditorUI";

// document.body.appendChild(app.view as any);

// app.stage.position.set(window.innerWidth / 2, window.innerHeight / 2);

// window.addEventListener('wheel',(e)=>{
// 	const step = e.deltaY < 0 ? 0.03 : -0.03;
// 	if(app.stage.scale.x + step >= 0.03)
// 	{
// 		app.stage.scale.x += step;
// 		app.stage.scale.y += step;
// 	}
// });

// // 画图形
// createGraphics(app.stage);

// // 画数字
// sweepHeight(app.stage, 200);

// // 区域
// addHitArea(app.stage);

SweepEditorUI.get();

// createLine(app.stage);
// window.addEventListener('keydown',(e)=>{
// 	if(e.key == '8')
// 	{
// 		createLine(app.stage);
// 	}
// })


// 禁止右键菜单
document.addEventListener('contextmenu',(e)=>{
	e.preventDefault();
})
</script>

<style>
/* .logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
} */

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

canvas {
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	left: 0;
}
</style>
