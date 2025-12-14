import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import * as THREE from 'three'

// 将THREE暴露到全局作用域，方便在DevTools中使用
(window as any).THREE = THREE

createApp(App).mount('#app')
