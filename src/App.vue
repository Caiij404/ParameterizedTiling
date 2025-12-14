<template>
  <div id="scene-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { SceneMgr } from './SceneMgr';
let sceneMgr: SceneMgr | null = null;

onMounted(() => {
  // 初始化3D场景
  sceneMgr = new SceneMgr('scene-container');
  
  // 将sceneMgr暴露到全局作用域，方便在DevTools中使用
  (window as any).sceneMgr = sceneMgr;
  
  // 禁止右键菜单
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
});

onUnmounted(() => {
  // 清理资源
  if (sceneMgr) {
    sceneMgr.dispose();
    sceneMgr = null;
    // 从全局作用域移除sceneMgr
    delete (window as any).sceneMgr;
  }
});
</script>

<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body, html, #app {
	width: 100%;
	height: 100%;
	overflow: hidden;
}

#scene-container {
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	left: 0;
}

canvas {
	width: 100%;
	height: 100%;
}
</style>
