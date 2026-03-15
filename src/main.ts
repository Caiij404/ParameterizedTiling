import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import * as THREE from 'three'
import { EventBus } from './Utils/EventBus'

// 将THREE暴露到全局作用域，方便在DevTools中使用
(window as any).THREE = THREE;

// 将EventBus暴露到全局作用域，使其全局可用
(window as any).EventBus = EventBus;

createApp(App).mount('#app')
