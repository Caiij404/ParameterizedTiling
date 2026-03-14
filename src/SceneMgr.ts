import * as THREE from 'three';
import { TextureEditor } from './TextureEditor';
import { CameraMgr } from './CameraMgr';
import { GeometryEditor } from './GeometryEditor';
import { SurfaceDrawer } from './SurfaceDrawer';
import { ClipInfo } from './types';
import { triangulate } from './TopoUtil';
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
		this.gridHelper = new THREE.GridHelper(2000, 10, 0x888888, 0x444444);
		this.gridHelper.rotation.x = Math.PI / 2; // 旋转90度使其在XY平面
		this.gridHelper.position.z = -0.01; // 稍微下移避免z-fighting
		this.axesHelper = new THREE.AxesHelper(1000);
		this.axesHelper.position.z = 0.0001;
		this.scene.add(this.gridHelper);
		this.scene.add(this.axesHelper);
		// this.createPlane();
		this.addWhitePlane();
		// 初始化场景（需要在创建渲染器后）
		this.init();
	}

	private addSomethingToScene(): void {
		
		const vertices = [
			new THREE.Vector3(1.5, 0, 0),
			new THREE.Vector3(4.6, 0, 0),
			new THREE.Vector3(5.0, 2, 0),
			new THREE.Vector3(0, 2, 0),
			new THREE.Vector3(0, 1.6, 0)
		];
		let geoEditor = GeometryEditor.getInstance();
		let meshes1 = geoEditor.drawPolygons([vertices])
		this.scene.add(...meshes1);

		const v2 = [
			new THREE.Vector3(0, 0.2, 0),
			new THREE.Vector3(0.2, 0, 0),
			new THREE.Vector3(0.8, 0, 0),
			new THREE.Vector3(1, 0.2, 0),
			new THREE.Vector3(1, 0.8, 0),
			new THREE.Vector3(0.8, 1, 0),
			new THREE.Vector3(0.2, 1, 0),
			new THREE.Vector3(0, 0.8, 0)
		]
		let meshes2 = geoEditor.drawPolygons([v2], new THREE.Vector3(0,-5,0));
		this.scene.add(...meshes2);

		let clipInfo = new ClipInfo(v2);
		let res = geoEditor.CutPolygonWithPolygon(vertices, clipInfo);
		console.log(res);
		let meshes3 = geoEditor.drawPolygons(res, new THREE.Vector3(-5, -5, 0));
		this.scene.add(...meshes3);

		// 设置窗口大小变化监听器（处理渲染器大小）
		this.resizeHandler = this.handleResize.bind(this);
		window.addEventListener('resize', this.resizeHandler);
	}

	private createPlane():void{
		const v2 = [
			new THREE.Vector3(0, 0.2, 0),
			new THREE.Vector3(0.2, 0, 0),
			new THREE.Vector3(0.8, 0, 0),
			new THREE.Vector3(1, 0.2, 0),
			new THREE.Vector3(1, 0.8, 0),
			new THREE.Vector3(0.8, 1, 0),
			new THREE.Vector3(0.2, 1, 0),
			new THREE.Vector3(0, 0.8, 0)
		];

		let result = triangulate(v2);
		console.log(result);

		// 绘制顶点数组的匿名函数
		const drawVertices = () => {
			let geoEditor = GeometryEditor.getInstance();
			let meshes = geoEditor.drawPolygons([v2], new THREE.Vector3(0, 0, 0));
			this.scene.add(...meshes);
		};

		// 调用匿名函数绘制顶点数组
		// drawVertices();

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

		// @ts-ignore
		window.camera = CameraMgr.getInstance()

		// 初始化SurfaceDrawer
		SurfaceDrawer.init(this.scene, this.renderer.domElement);
		this.surfaceDrawer = SurfaceDrawer.getInstance();
		
		// 开始动画循环（需要在cameraMgr创建后）
		this.animate();
	}


	/**
	 * 添加白色平面（平躺在XY平面，法线指向+Z）
	 */
	private async addWhitePlane(): Promise<void> {
		let vertices = [
			new THREE.Vector3(-500, -500, 0),
			new THREE.Vector3(500, -500, 0),
			new THREE.Vector3(500, 500, 0),
			new THREE.Vector3(-500, 500, 0)
		];
		let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
		// point data
		let pointsFlatten = new Array<number>;
		for(let p of vertices)
		{
			pointsFlatten.push(p.x, p.y, p.z);
		}
		let meshVertices = new Float32Array(pointsFlatten);
		let posAttr = new THREE.BufferAttribute(meshVertices, 3);
		geometry.setAttribute('position', posAttr);

		// index data
		let indexFlatten = new Array<number>;
		let triangles = triangulate(vertices);
		if(triangles.length)
		{
			for(let tri of triangles)
			{
				indexFlatten.push(tri[0], tri[1], tri[2]);
			}
		}
		geometry.setIndex(indexFlatten);
		
		// compute uvs
		// 使用TextureEditor初始化纹理
		const texture = await this.textureEditor.initTexture('/1.png');
		const uvs = this.textureEditor.computeUV(vertices, texture);
		if(uvs.length)
		{
			let uvsFlatten = new Array<number>;
			uvs.forEach(uv => {
				uvsFlatten.push(uv.x, uv.y);
			});
			let meshUvs = new Float32Array(uvsFlatten);
			let uvsAttr = new THREE.BufferAttribute(meshUvs, 2);
			geometry.setAttribute('uv', uvsAttr);
		}

		// // 添加键盘事件监听器（通过TextureEditor处理）
		// this.textureEditor.addKeyboardListeners();
		
		// 使用MeshBasicMaterial，不需要光源即可显示颜色
		const material = new THREE.MeshBasicMaterial({
			map: texture, // 应用纹理
			side: THREE.DoubleSide
		});
		const plane = new THREE.Mesh(geometry, material);

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
			if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
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