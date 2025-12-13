import * as THREE from 'three';
import { TextureEditor } from './TextureEditor';
import { CameraMgr } from './CameraMgr';
import { GeometryEditor } from './GeometryEditor';
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
	private gridHelper: THREE.GridHelper | null = null;
	private axesHelper: THREE.AxesHelper | null = null;
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

		// GridHelper默认在XZ平面，需要旋转到XY平面（Z轴向上的坐标系）
		this.gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
		this.gridHelper.rotation.x = Math.PI / 2; // 旋转90度使其在XY平面
		this.gridHelper.position.z = -0.01; // 稍微下移避免z-fighting
		this.axesHelper = new THREE.AxesHelper(10);
		this.axesHelper.position.z = 0.0001;
		this.scene.add(this.gridHelper);
		this.scene.add(this.axesHelper);

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

		const vertices = [
			new THREE.Vector3(1.5, 0, 0),
			new THREE.Vector3(4.6, 0, 0),
			new THREE.Vector3(5.0, 2, 0),
			new THREE.Vector3(0, 2, 0),
			new THREE.Vector3(0, 1.6, 0)
		];
		let geoEditor = GeometryEditor.getInstance();
		let results = geoEditor.CutGeometry(vertices, 1, 1);
		console.log(results);
		
		// 绘制裁剪后的多边形
		this.drawPolygons(results);

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
	 * 绘制多个多边形
	 * @param polygons 多边形顶点数组的数组
	 */
	private drawPolygons(polygons: THREE.Vector3[][]): void {
		// 预定义的颜色数组，用于区分不同多边形
		const colors = [
			0xff6b6b, // 红
			0x4ecdc4, // 青
			0x45b7d1, // 蓝
			0xf7dc6f, // 黄
			0xbb8fce, // 紫
			0x58d68d, // 绿
			0xf0b27a, // 橙
			0x85c1e9, // 浅蓝
			0xf1948a, // 粉
			0x82e0aa, // 浅绿
		];

		polygons.forEach((polygon, index) => {
			if (polygon.length < 3) return; // 至少需要3个顶点

			// 创建 Shape（2D形状，使用 x, y 坐标）
			const shape = new THREE.Shape();
			shape.moveTo(polygon[0].x, polygon[0].y);
			for (let i = 1; i < polygon.length; i++) {
				shape.lineTo(polygon[i].x, polygon[i].y);
			}
			shape.closePath();

			// 从 Shape 创建几何体
			const geometry = new THREE.ShapeGeometry(shape);

			// 为每个多边形分配不同颜色
			const color = colors[index % colors.length];
			const material = new THREE.MeshBasicMaterial({
				color: color,
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 0.8
			});

			const mesh = new THREE.Mesh(geometry, material);
			// ShapeGeometry 默认在 XY 平面，这正是我们需要的
			mesh.position.z = 0.001; // 稍微抬高，避免与网格重叠
			this.scene.add(mesh);

			// 添加边框线，使多边形边界更清晰
			const edgesGeometry = new THREE.EdgesGeometry(geometry);
			const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
			const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);
			edges.position.z = 0.002;
			this.scene.add(edges);
		});
	}

	/**
	 * 添加白色平面（平躺在XY平面，法线指向+Z）
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

		// PlaneGeometry默认在XY平面，法线指向+Z，正是我们需要的（Z轴向上的坐标系）
		// 不需要旋转
		plane.position.z = 0; // 放在z=0的位置

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