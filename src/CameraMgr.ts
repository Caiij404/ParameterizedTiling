import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * 相机管理类（单例模式）
 * 负责管理固定向负y方向观察的相机，用作2D相机
 * 特性：
 * 1. 相机固定向负y方向看（向下看）
 * 2. 鼠标右键拖动：只在xoz平面移动，不改变y值
 * 3. 鼠标左键：不改变相机任何值
 * 4. 鼠标滚轮：改变y值（高度）
 * 5. 相机移动有阻尼感
 */
export class CameraMgr {
	private static instance: CameraMgr | null = null;
	
	// 高度和 zoom 的配置常量
	private static readonly MIN_HEIGHT = 2;
	private static readonly MIN_ZOOM = 1;
	private static readonly MAX_ZOOM = 10;
	private static readonly REFERENCE_HEIGHT = 100; // 用于计算 zoom 的参考高度（不限制实际高度）
	
	private camera2D: THREE.OrthographicCamera;
	private controls2D: OrbitControls;
	private camera3D: THREE.PerspectiveCamera;
	private controls3D: OrbitControls;
	private container: HTMLElement;
	private canvas: HTMLCanvasElement;
	private resizeHandler: () => void;
	private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
	private currentCameraType: '2D' | '3D' = '2D'; // 当前激活的相机类型

	/**
	 * 获取单例实例
	 * @param container 容器元素
	 * @param canvas 渲染器的canvas元素
	 */
	public static getInstance(): CameraMgr {
		return CameraMgr.instance!;
	}

	public static init(container: HTMLElement, canvas: HTMLCanvasElement) {
		CameraMgr.instance = new CameraMgr(container, canvas);
	}

	/**
	 * 私有构造函数
	 * @param container 容器元素
	 * @param canvas 渲染器的canvas元素
	 */
	private constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
		this.container = container;
		this.canvas = canvas;

		// 创建正交相机
		const width = container.clientWidth;
		const height = container.clientHeight;
		const aspect = width / height;
		const size = 10; // 视野大小的一半（单位）
		
		this.camera2D = new THREE.OrthographicCamera(
			-size * aspect, // left
			size * aspect,  // right
			size,           // top
			-size,          // bottom
			0.1,            // near
			1000            // far
		);

		// 创建2D相机的轨道控制器
		this.controls2D = new OrbitControls(this.camera2D, this.canvas);

		// 设置2D相机初始位置，固定朝着-z方向观察（向下看）
		// 相机在z轴正方向，看向xy平面（z=0），即看向负z方向
		this.camera2D.up.set(0, 1, 0); // 屏幕Y轴向上对应世界Y轴
		this.camera2D.position.set(0, 0, 500);
		this.camera2D.lookAt(0, 0, 0);

		// 配置2D相机轨道控制器
		this.setupControls2D();

		// 添加2D相机滚轮事件监听器
		this.setupWheelHandler();

		// 创建3D透视相机
		const aspect3D = container.clientWidth / container.clientHeight;
		this.camera3D = new THREE.PerspectiveCamera(
			75, // 视野角度（FOV）
			aspect3D, // 宽高比
			0.1, // 近裁剪面
			1000 // 远裁剪面
		);

		// 设置3D相机初始位置（Z轴向上的坐标系）
		// 必须在创建OrbitControls之前设置up向量，否则控制器会使用默认的(0,1,0)
		this.camera3D.up.set(0, 0, 1); // Z轴向上
		this.camera3D.position.set(0, -5, 5);
		this.camera3D.lookAt(0, 0, 0);

		// 创建3D相机的轨道控制器（不做任何限制）
		this.controls3D = new OrbitControls(this.camera3D, this.canvas);
		
		// 配置3D相机控制器：启用滚轮缩放和阻尼效果
		this.controls3D.enableDamping = true;
		this.controls3D.dampingFactor = 0.05;
		this.controls3D.enableZoom = true; // 启用滚轮缩放
		
		// 初始状态下禁用3D相机控制器（默认使用2D相机）
		this.controls3D.enabled = false;

		// 设置窗口大小变化监听器
		this.resizeHandler = this.handleResize.bind(this);
		window.addEventListener('resize', this.resizeHandler);

		// 添加键盘事件监听器
		this.setupKeyboardListeners();
	}

	/**
	 * 获取当前激活的相机实例
	 */
	public getCamera(): THREE.OrthographicCamera | THREE.PerspectiveCamera {
		return this.currentCameraType === '2D' ? this.camera2D : this.camera3D;
	}

	/**
	 * 获取当前激活的控制器实例
	 */
	public getControls(): OrbitControls {
		return this.currentCameraType === '2D' ? this.controls2D : this.controls3D;
	}

	/**
	 * 切换到2D相机
	 */
	public switchTo2D(): void {
		// 如果之前是3D相机，需要清除2D相机的阻尼状态
		if (this.currentCameraType === '3D') {
			// 清除2D相机控制器的阻尼状态
			this.clearDampingState(this.controls2D);
		}
		
		// 禁用3D相机控制器，防止其继续响应输入和更新
		this.controls3D.enabled = false;
		
		// 启用2D相机控制器
		this.controls2D.enabled = true;
		
		this.currentCameraType = '2D';
		console.log('Switched to 2D camera');
	}

	/**
	 * 清除控制器的阻尼状态
	 */
	private clearDampingState(controls: OrbitControls): void {
		// 访问控制器的内部状态并清零，以清除阻尼效果
		const controlsAny = controls as any;
		
		// 清零球面增量（用于旋转阻尼）
		if (controlsAny.sphericalDelta) {
			controlsAny.sphericalDelta.set(0, 0, 0);
		}
		
		// 清零缩放增量（用于缩放阻尼）
		if (controlsAny.scale !== undefined) {
			controlsAny.scale = 1;
		}
		
		// 清零平移增量（用于平移阻尼）
		if (controlsAny.panOffset) {
			controlsAny.panOffset.set(0, 0, 0);
		}
		
		// 清零旋转增量
		if (controlsAny.rotateStart) {
			controlsAny.rotateStart.set(0, 0, 0);
		}
		if (controlsAny.rotateEnd) {
			controlsAny.rotateEnd.set(0, 0, 0);
		}
		
		// 强制完成阻尼动画
		if (controlsAny.update) {
			// 临时禁用阻尼，更新一次，然后重新启用
			const wasDamping = controls.enableDamping;
			controls.enableDamping = false;
			controls.update();
			controls.enableDamping = wasDamping;
		}
	}

	/**
	 * 切换到3D相机
	 */
	public switchTo3D(): void {
		// 如果之前是2D相机，需要清除3D相机的阻尼状态
		if (this.currentCameraType === '2D') {
			// 清除3D相机控制器的阻尼状态
			this.clearDampingState(this.controls3D);
		}
		
		// 禁用2D相机控制器，防止其继续响应输入和更新
		this.controls2D.enabled = false;
		
		// 启用3D相机控制器
		this.controls3D.enabled = true;
		
		this.currentCameraType = '3D';
		console.log('Switched to 3D camera');
	}

	/**
	 * 配置2D相机轨道控制器
	 * 1. 相机看向负z方向（Z轴向上的坐标系）
	 * 2. 鼠标右键拖动：只在xy平面移动，不改变z值
	 * 3. 鼠标左键：不改变相机任何值
	 * 4. 鼠标滚轮：改变z值（高度）
	 * 5. 相机移动要有阻尼感
	 */
	private setupControls2D(): void {
		// 启用阻尼效果
		this.controls2D.enableDamping = true;
		this.controls2D.dampingFactor = 0.05;

		// 禁用旋转
		this.controls2D.enableRotate = false;

		// 禁用缩放（我们自定义滚轮行为）
		this.controls2D.enableZoom = false;

		// 设置平移速度
		this.controls2D.panSpeed = 1.0;

		// 设置鼠标按钮映射：左键禁用，右键平移
		this.controls2D.mouseButtons = {
			LEFT: null as any, // 禁用左键
			RIGHT: THREE.MOUSE.PAN, // 右键平移
			MIDDLE: null as any // 禁用中键
		};

		// 启用屏幕空间平移
		this.controls2D.screenSpacePanning = true;

		// 使用对象存储fixedZ，以便在所有闭包中共享（Z轴向上的坐标系）
		const state = {
			fixedZ: this.camera2D.position.z
		};

		// 根据初始高度设置初始 zoom，避免第一次滚轮时的跳跃
		const initialHeight = state.fixedZ;
		// 使用参考高度计算 zoom：高度越高，zoom 越小
		// zoom = MAX_ZOOM / (1 + (height - MIN_HEIGHT) / REFERENCE_HEIGHT)
		const heightRatio = (initialHeight - CameraMgr.MIN_HEIGHT) / CameraMgr.REFERENCE_HEIGHT;
		this.camera2D.zoom = CameraMgr.MAX_ZOOM / (1 + heightRatio);
		this.camera2D.updateProjectionMatrix();

		// 重写平移方法，只允许x/y方向移动，保持z值不变（Z轴向上的坐标系）
		const controlsAny = this.controls2D as any;
		const originalPan = controlsAny.pan?.bind(this.controls2D);
		if (originalPan) {
			controlsAny.pan = function (deltaX: number, deltaY: number) {
				const camera = this.object as THREE.OrthographicCamera;
				const prevZ = camera.position.z;

				// 执行原始平移
				originalPan.call(this, deltaX, deltaY);

				// 恢复z值，只允许x/y方向移动
				camera.position.z = prevZ;
				state.fixedZ = prevZ;
			};
		}

		// 保存state到controls对象，以便在事件处理中访问
		controlsAny._state = state;

		// 重写update方法，确保相机始终看向负z方向（向下看）
		const originalUpdate = this.controls2D.update.bind(this.controls2D);
		this.controls2D.update = function () {
			const camera = this.object as THREE.OrthographicCamera;

			// 执行原始update（处理阻尼等）
			const result = originalUpdate();

			// 保存当前x和y值（平移可能改变了它们）
			const currentX = camera.position.x;
			const currentY = camera.position.y;

			// 强制设置z值为固定值
			camera.position.z = state.fixedZ;

			// 确保相机始终看向负z方向（向下看，看向xy平面）
			camera.lookAt(currentX, currentY, 0);

			// 确保位置值没有被lookAt改变
			camera.position.set(currentX, currentY, state.fixedZ);

			return result ?? false;
		};
	}

	/**
	 * 设置滚轮事件处理
	 */
	private setupWheelHandler(): void {
		const controlsAny = this.controls2D as any;
		const state = controlsAny._state;

		if (!state) {
			console.warn('State not found in controls, wheel handler not set up');
			return;
		}

		const cameraMgr = this; // 保存 this 引用，用于在闭包中访问
		const onWheel = (event: WheelEvent) => {
			// 只有在2D相机激活时才处理滚轮事件
			if (cameraMgr.currentCameraType !== '2D') {
				return; // 让3D相机的OrbitControls自己处理滚轮事件
			}

			event.preventDefault();
			event.stopImmediatePropagation();

			const sensitivity = 8.0; // 增大灵敏度，使滚轮响应更快

			// 根据滚轮方向调整高度（deltaY > 0 向下滚动，相机应该升高；deltaY < 0 向上滚动，相机应该降低）
			// Z轴向上的坐标系：改变z值
			const oldZ = state.fixedZ;
			state.fixedZ += event.deltaY * 0.01 * sensitivity;

			// 只限制最小高度，不限制最大高度
			state.fixedZ = Math.max(CameraMgr.MIN_HEIGHT, state.fixedZ);

			// 如果z值改变了，更新相机
			if (Math.abs(state.fixedZ - oldZ) > 0.001) {
				// 直接更新相机位置
				cameraMgr.camera2D.position.z = state.fixedZ;

				// 更新相机朝向（看向xy平面）
				const currentX = cameraMgr.camera2D.position.x;
				const currentY = cameraMgr.camera2D.position.y;
				cameraMgr.camera2D.lookAt(currentX, currentY, 0);

				// 确保z值没有被lookAt改变
				cameraMgr.camera2D.position.z = state.fixedZ;

				// 对于正交相机，根据高度调整 zoom（高度越高，zoom 越小，视野越大）
				// 使用参考高度计算 zoom：zoom = MAX_ZOOM / (1 + (height - MIN_HEIGHT) / REFERENCE_HEIGHT)
				const heightRatio = (state.fixedZ - CameraMgr.MIN_HEIGHT) / CameraMgr.REFERENCE_HEIGHT;
				cameraMgr.camera2D.zoom = CameraMgr.MAX_ZOOM / (1 + heightRatio);
				// 确保 zoom 不会小于 MIN_ZOOM
				cameraMgr.camera2D.zoom = Math.max(CameraMgr.MIN_ZOOM, cameraMgr.camera2D.zoom);
				cameraMgr.camera2D.updateProjectionMatrix();

				console.log('Wheel: fixedZ changed from', oldZ, 'to', state.fixedZ, 'camera2D.z:', cameraMgr.camera2D.position.z, 'zoom:', cameraMgr.camera2D.zoom);
			}
		};

		// 直接在canvas上添加监听器
		this.canvas.addEventListener('wheel', onWheel, { passive: false, capture: true });

		// 保存事件监听器引用以便清理
		controlsAny._customWheelHandler = onWheel;
	}

	/**
	 * 处理窗口大小变化
	 */
	private handleResize(): void {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		const aspect = width / height;
		const size = 10; // 视野大小的一半（单位）

		// 更新2D正交相机
		this.camera2D.left = -size * aspect;
		this.camera2D.right = size * aspect;
		this.camera2D.top = size;
		this.camera2D.bottom = -size;
		this.camera2D.updateProjectionMatrix();

		// 更新3D透视相机
		this.camera3D.aspect = aspect;
		this.camera3D.updateProjectionMatrix();
	}

	/**
	 * 更新当前激活的控制器（在动画循环中调用）
	 */
	public update(): void {
		if (this.currentCameraType === '2D') {
			this.controls2D.update();
		} else {
			this.controls3D.update();
		}
	}

	/**
	 * 设置键盘事件监听器
	 */
	private setupKeyboardListeners(): void {
		this.keyboardHandler = (e: KeyboardEvent) => {
			// Alt + 2 切换到2D相机
			if (e.altKey && e.key === '2') {
				e.preventDefault();
				this.switchTo2D();
			}
			// Alt + 3 切换到3D相机
			else if (e.altKey && e.key === '3') {
				e.preventDefault();
				this.switchTo3D();
			}
		};
		window.addEventListener('keydown', this.keyboardHandler);
	}

	/**
	 * 销毁相机管理器
	 */
	public dispose(): void {
		// 移除窗口大小变化监听器
		window.removeEventListener('resize', this.resizeHandler);

		// 移除键盘事件监听器
		if (this.keyboardHandler) {
			window.removeEventListener('keydown', this.keyboardHandler);
		}

		// 清理2D相机自定义滚轮事件监听器
		const controlsAny = this.controls2D as any;
		const customWheelHandler = controlsAny._customWheelHandler;
		if (customWheelHandler) {
			this.canvas.removeEventListener('wheel', customWheelHandler, { capture: true } as any);
		}

		// 释放控制器资源
		this.controls2D.dispose();
		this.controls3D.dispose();
	}
}

