import * as THREE from 'three';
import { TextureEditor } from './TextureEditor';
import { CameraMgr } from './CameraMgr';
import { SurfaceDrawer } from './SurfaceDrawer';

/**
 * ThreeJS场景管理类
 * 负责初始化3D场景、渲染器，以及处理用户交互
 */
export class SceneMgr {
	private scene: THREE.Scene;
	private renderer: THREE.WebGLRenderer;
	private container: HTMLElement;
	private animationId: number | null = null;
	private textureEditor: TextureEditor; // 使用TextureEditor单例
	private cameraMgr!: CameraMgr; // 使用CameraMgr管理2D相机（在init()中初始化）
	private resizeHandler: (() => void) | null = null;
	private surfaceDrawer!: SurfaceDrawer;

	get canvas(): HTMLCanvasElement {
		return this.renderer.domElement;
	}

	/**
	 * 构造函数
	 * @param containerId 容器元素的ID
	 */
	constructor(containerId: string) {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Container element with id '${containerId}' not found`);
		}
		this.container = container;
		this.scene = new THREE.Scene();
		// 获取TextureEditor单例实例
		this.textureEditor = TextureEditor.getInstance();

		// 创建渲染器
		this.renderer = new THREE.WebGLRenderer({ antialias: true });

		// 初始化场景（需要在创建渲染器后）
		this.init();
	}

	/**
	 * 初始化场景
	 */
	private init(): void {
		// 设置渲染器
		// 确保canvas铺满整个容器
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		// 设置背景色为白色
		this.renderer.setClearColor(0xeeeeee);

		// 设置渲染器输出颜色空间为sRGB，确保颜色正确显示
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		// 启用色调映射，增强对比度
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.0;

		// 确保canvas样式设置为100%宽高，并设置为块级元素
		const canvas = this.renderer.domElement;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.display = 'block';
		canvas.style.margin = '0';
		canvas.style.padding = '0';

		this.container.appendChild(canvas);

		// 获取相机管理器单例（需要在渲染器初始化和canvas添加到DOM后）
		CameraMgr.init(this.container, this.renderer.domElement);
		this.cameraMgr = CameraMgr.getInstance();

		// 添加白色平面，水平放置，法线指向+y
		this.addWhitePlane();

		// 添加网格辅助线
		this.addGridHelper();

		this.addAxesHelper();

		// 设置窗口大小变化监听器（处理渲染器大小）
		this.resizeHandler = this.handleResize.bind(this);
		window.addEventListener('resize', this.resizeHandler);

		// 初始化SurfaceDrawer
		SurfaceDrawer.init(this.scene, this.renderer.domElement);
		this.surfaceDrawer = SurfaceDrawer.getInstance();
		
		// 开始动画循环（需要在cameraMgr创建后）
		this.animate();
	}


	/**
	 * 添加光源
	 */
	private addLights(): void {
		// 环境光
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		this.scene.add(ambientLight);

		// 平行光
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 10, 7.5);
		this.scene.add(directionalLight);
	}

	/**
	 * 添加网格辅助线
	 */
	private addGridHelper(): void {
		const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
		this.scene.add(gridHelper);
	}

	/**
	 * 添加坐标轴辅助
	 */
	private addAxesHelper(): void {
		const axesHelper = new THREE.AxesHelper(10);
		axesHelper.position.set(0, 0, 0);
		this.scene.add(axesHelper);
	}

	/**
	 * 在原点添加立方体
	 */
	private addCube(): void {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshStandardMaterial({
			color: 0x00ff00,
			wireframe: false,
			metalness: 0.5,
			roughness: 0.5
		});
		const cube = new THREE.Mesh(geometry, material);
		// 放在原点
		cube.position.set(0, 0, 0);
		this.scene.add(cube);
	}

	/**
	 * 添加白色平面
	 */
	private addWhitePlane(): void {
		const geometry = new THREE.PlaneGeometry(5, 5);
		
		// 使用TextureEditor初始化纹理
		const texture = this.textureEditor.initTexture('/1.png');
		
		// 添加键盘事件监听器（通过TextureEditor处理）
		this.textureEditor.addKeyboardListeners();
		
		// 使用MeshBasicMaterial，不需要光源即可显示颜色
		const material = new THREE.MeshBasicMaterial({
			map: texture, // 应用纹理
			side: THREE.DoubleSide
		});
		const plane = new THREE.Mesh(geometry, material);

		// 水平放置，法线指向+y轴
		// 绕x轴旋转90度，使平面与xy平面平行，法线指向+y
		plane.rotation.x = Math.PI / 2;
		plane.position.y = 0; // 放在y=0的位置

		this.scene.add(plane);
	}


	/**
	 * 处理窗口大小变化
	 */
	private handleResize(): void {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;

		// 更新渲染器
		this.renderer.setSize(width, height);

		// 相机大小变化由CameraMgr处理
	}

	/**
	 * 动画循环
	 */
	private animate(): void {
		this.animationId = requestAnimationFrame(() => this.animate());

		// 更新相机控制器（由CameraMgr管理）
		this.cameraMgr.update();

		// 渲染场景
		this.renderer.render(this.scene, this.cameraMgr.getCamera());
	}

	/**
	 * 销毁场景管理器
	 */
	public dispose(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
		}

		// 移除窗口大小变化监听器
		if (this.resizeHandler !== null) {
			window.removeEventListener('resize', this.resizeHandler);
		}

		// 销毁相机管理器
		if (this.cameraMgr) {
			this.cameraMgr.dispose();
		}
		
		// 销毁SurfaceDrawer
		if (this.surfaceDrawer) {
			this.surfaceDrawer.dispose();
		}

		// 清理DOM元素
		if (this.renderer.domElement.parentElement) {
			this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
		}

		// 释放渲染器资源
		this.renderer.dispose();

		// 清理场景中的对象
		while (this.scene.children.length > 0) {
			const child = this.scene.children[0];
			this.scene.remove(child);

			// 释放几何体和材质
			if (child instanceof THREE.Mesh) {
				if (child.geometry) child.geometry.dispose();
				if (Array.isArray(child.material)) {
					child.material.forEach(material => {
						if (material) material.dispose();
					});
				} else if (child.material) {
					child.material.dispose();
				}
			}
		}
	}
}