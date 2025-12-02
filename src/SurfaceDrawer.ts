import * as THREE from 'three';

export class SurfaceDrawer {
    private static instance: SurfaceDrawer | null = null;
    private scene: THREE.Scene;
    private canvas: HTMLCanvasElement;
    private isCustomCursor: boolean = false;
    // private customCursorStyle: string = 'crosshair'; // 先使用crosshair作为测试，确保基本功能正常
    private customCursorStyle: string = "url('./cursor/printing.png') 8 8, pointer"; // 指定的鼠标图标（使用public目录下的自定义图标，auto作为后备）
    
    private constructor(scene: THREE.Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
    }
    
    public static getInstance(): SurfaceDrawer {
        if (!SurfaceDrawer.instance) {
            throw new Error('SurfaceDrawer instance not initialized. Call SurfaceDrawer.init() first.');
        }
        return SurfaceDrawer.instance;
    }
    /**
     * 初始化单例实例
     */
    public static init(scene: THREE.Scene, canvas: HTMLCanvasElement): void {
        SurfaceDrawer.instance = new SurfaceDrawer(scene, canvas);
        
        // 设置canvas可聚焦，以便接收键盘事件
        canvas.tabIndex = 0;
        
        // 添加点击事件，确保canvas获得焦点
        canvas.addEventListener('click', () => {
            canvas.focus();
            console.log('Canvas focused');
        });
        
        // 添加键盘事件监听
        window.addEventListener('keydown', SurfaceDrawer.instance!.onKeyDown.bind(SurfaceDrawer.instance!));
        
        console.log('SurfaceDrawer initialized with custom cursor:', SurfaceDrawer.instance!.customCursorStyle);
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        console.log('Key pressed:', event.key);
        // 监听快捷键p，切换鼠标图标
        if (event.key.toLowerCase() === 'p') {
            console.log('Toggle cursor key pressed');
            this.toggleCursor();
        }
    }
    
    /**
     * 切换鼠标图标接口
     */
    public toggleCursor(): void {
        this.isCustomCursor = !this.isCustomCursor;
        
        console.log('Current cursor style:', this.canvas.style.cursor);
        console.log('Custom cursor style:', this.customCursorStyle);
        
        if (this.isCustomCursor) {
            // 切换到自定义鼠标图标
            console.log('Switching to custom cursor');
            this.canvas.style.cursor = this.customCursorStyle;
            // 直接使用crosshair作为测试，确保功能正常
            // this.canvas.style.cursor = 'crosshair';
        } else {
            // 恢复默认鼠标图标
            console.log('Switching to default cursor');
            this.canvas.style.cursor = 'default';
        }
        
        console.log(`Mouse cursor toggled to ${this.isCustomCursor ? this.customCursorStyle : 'default'}`);
        console.log('Final cursor style:', this.canvas.style.cursor);
    }
    
    /**
     * 设置自定义鼠标图标
     * @param cursorStyle CSS cursor样式值
     */
    public setCustomCursor(cursorStyle: string): void {
        // this.customCursorStyle = cursorStyle;
        // 如果当前是自定义鼠标图标，立即应用新样式
        // if (this.isCustomCursor) 
        {
            // this.canvas.style.cursor = this.customCursorStyle;
            this.canvas.style.cursor = "url('./cursor/printing.png') 8 8, pointer";
        }
    }
    
    /**
     * 销毁时清理事件监听
     */
    public dispose(): void {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        // 恢复默认鼠标图标
        this.canvas.style.cursor = 'default';
    }
}