import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * ThreeJS场景管理类
 * 负责初始化3D场景、相机、渲染器，以及处理用户交互
 */
export class SceneMgr {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private controls: OrbitControls;
	private container: HTMLElement;
	private animationId: number | null = null;
	private planeTexture: THREE.Texture | null = null;
	public texture: THREE.Texture | null = null;

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

		// 创建透视相机
		const aspect = container.clientWidth / container.clientHeight;
		this.camera = new THREE.PerspectiveCamera(
			75, // 视野角度（FOV）
			aspect, // 宽高比
			0.1, // 近裁剪面
			1000 // 远裁剪面
		);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

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

		// 设置相机位置，固定朝着-y方向观察（向下看）
		// 相机在y轴正方向，看向xoz平面（y=0），即看向负y方向
		this.camera.position.set(0, 10, 0);
		this.camera.lookAt(0, 0, 0);

		// 配置轨道控制器
		this.setupControls();

		// 添加光源
		// this.addLights();

		// 添加白色平面，水平放置，法线指向+y
		this.addWhitePlane();

		// 设置窗口大小变化监听器
		window.addEventListener('resize', this.handleResize.bind(this));

		// 添加滚轮事件监听器（在setupControls之后，确保OrbitControls已初始化）
		this.setupWheelHandler();

		// 开始动画循环
		this.animate();
	}

	/**
	 * 配置轨道控制器
	 * 1. 相机看向负y方向
	 * 2. 鼠标右键拖动：只在xoz平面移动，不改变y值
	 * 3. 鼠标左键：不改变相机任何值
	 * 4. 鼠标滚轮：改变y值
	 * 5. 相机移动要有阻尼感
	 */
	private setupControls(): void {
		// 启用阻尼效果
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		// 禁用旋转
		this.controls.enableRotate = false;

		// 禁用缩放（我们自定义滚轮行为）
		this.controls.enableZoom = false;

		// 设置平移速度
		this.controls.panSpeed = 1.0;

		// 设置鼠标按钮映射：左键禁用，右键平移
		this.controls.mouseButtons = {
			LEFT: null as any, // 禁用左键
			RIGHT: THREE.MOUSE.PAN, // 右键平移
			MIDDLE: null as any // 禁用中键
		};

		// 启用屏幕空间平移
		this.controls.screenSpacePanning = true;

		// 使用对象存储fixedY，以便在所有闭包中共享
		const state = {
			fixedY: this.camera.position.y
		};

		// 重写平移方法，只允许x/z方向移动，保持y值不变
		const controlsAny = this.controls as any;
		const originalPan = controlsAny.pan?.bind(this.controls);
		if (originalPan) {
			controlsAny.pan = function (deltaX: number, deltaY: number) {
				const camera = this.object as THREE.PerspectiveCamera;
				const prevY = camera.position.y;

				// 执行原始平移
				originalPan.call(this, deltaX, deltaY);

				// 恢复y值，只允许x/z方向移动
				camera.position.y = prevY;
				state.fixedY = prevY;
			};
		}

		// 保存state到controls对象，以便在事件处理中访问
		controlsAny._state = state;

		// 重写update方法，确保相机始终看向负y方向（向下看）
		const originalUpdate = this.controls.update.bind(this.controls);
		this.controls.update = function () {
			const camera = this.object as THREE.PerspectiveCamera;

			// 执行原始update（处理阻尼等）
			const result = originalUpdate();

			// 保存当前x和z值（平移可能改变了它们）
			const currentX = camera.position.x;
			const currentZ = camera.position.z;

			// 强制设置y值为固定值
			camera.position.y = state.fixedY;

			// 确保相机始终看向负y方向（向下看，看向xoz平面）
			// 使用setFromMatrixPosition或直接设置旋转，避免lookAt改变位置
			camera.lookAt(currentX, 0, currentZ);

			// 确保位置值没有被lookAt改变（对于正交相机，lookAt不应该改变位置）
			camera.position.set(currentX, state.fixedY, currentZ);

			return result ?? false;
		};
	}

	/**
	 * 设置滚轮事件处理
	 */
	private setupWheelHandler(): void {
		const controlsAny = this.controls as any;
		const state = controlsAny._state;

		if (!state) {
			console.warn('State not found in controls, wheel handler not set up');
			return;
		}

		const canvas = this.renderer.domElement;
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const minHeight = 2;
			const maxHeight = 50;
			const sensitivity = 0.5;

			// 根据滚轮方向调整高度（deltaY > 0 向下滚动，相机应该升高；deltaY < 0 向上滚动，相机应该降低）
			const oldY = state.fixedY;
			state.fixedY += event.deltaY * 0.01 * sensitivity;

			// 限制高度范围
			state.fixedY = Math.max(minHeight, Math.min(maxHeight, state.fixedY));

			// 如果y值改变了，更新相机
			if (Math.abs(state.fixedY - oldY) > 0.001) {
				// 直接更新相机位置
				this.camera.position.y = state.fixedY;

				// 更新相机朝向（看向xoz平面）
				// 注意：对于正交相机，lookAt不应该改变位置，但为了确保正确，我们在lookAt后再次设置y值
				const currentX = this.camera.position.x;
				const currentZ = this.camera.position.z;
				this.camera.lookAt(currentX, 0, currentZ);

				// 确保y值没有被lookAt改变（理论上不应该，但为了安全）
				this.camera.position.y = state.fixedY;

				console.log('Wheel: fixedY changed from', oldY, 'to', state.fixedY, 'camera.y:', this.camera.position.y);
			}
		};

		// 直接在canvas上添加监听器
		canvas.addEventListener('wheel', onWheel, { passive: false, capture: true });

		// 保存事件监听器引用以便清理
		controlsAny._customWheelHandler = onWheel;
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
		const axesHelper = new THREE.AxesHelper(5);
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
		const geometry = new THREE.PlaneGeometry(10, 10);
		
		// 加载纹理
		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load('/1.png');
		
		// 将纹理赋值给实例变量，以便在键盘事件中访问
		this.planeTexture = texture;
		this.texture = texture;
		
		// 设置纹理重复和平铺
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		// 设置纹理重复次数（3x3 = 9个纹理）
		texture.repeat.set(3, 3);
		texture.flipY = false;
		
		// 设置纹理颜色空间为sRGB，确保颜色正确显示
		texture.colorSpace = THREE.SRGBColorSpace;
		// 禁用mipmap，避免纹理模糊
		texture.generateMipmaps = false;
		// 设置纹理过滤方式，确保清晰显示
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		
		// 设置纹理旋转中心为纹理中心
		texture.center.set(1, 1);
		// 设置纹理旋转15度（转换为弧度）
		texture.rotation = Math.PI / 12;
		
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

		const canvas = this.renderer.domElement;

		// 添加键盘事件监听器
		window.addEventListener("keydown",(e)=>{
			if(e.key=="+"){
				console.log("+++++++++++++")
				if(this.planeTexture)
				this.planeTexture.rotation += Math.PI / 90;
			}
			else if(e.key=="-"){
				console.log("----------")

				if(this.planeTexture)
				this.planeTexture.rotation -= Math.PI / 90;
			}
		})
		this.scene.add(plane);
	}


	/**
	 * 处理窗口大小变化
	 */
	private handleResize(): void {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;

		// 更新透视相机
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		// 更新渲染器
		this.renderer.setSize(width, height);
	}

	/**
	 * 动画循环
	 */
	private animate(): void {
		this.animationId = requestAnimationFrame(() => this.animate());

		// 更新控制器
		this.controls.update();

		// 渲染场景
		this.renderer.render(this.scene, this.camera);
	}

	/**
	 * 销毁场景管理器
	 */
	public dispose(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
		}

		window.removeEventListener('resize', this.handleResize.bind(this));

		// 清理自定义滚轮事件监听器（需要指定capture选项）
		const controlsAny = this.controls as any;
		const customWheelHandler = controlsAny._customWheelHandler;
		if (customWheelHandler) {
			this.renderer.domElement.removeEventListener('wheel', customWheelHandler, { capture: true } as any);
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