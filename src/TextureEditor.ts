import * as THREE from 'three';
import { BotMesh } from './BotMesh';

export class TextureEditor {
	private static instance: TextureEditor | null = null;
	private texture: THREE.Texture | null = null;
	private planeTexture: THREE.Texture | null = null;

	private constructor() {
		// 私有构造函数，防止外部实例化
	}

	public static getInstance(): TextureEditor {
		if (!TextureEditor.instance) {
			TextureEditor.instance = new TextureEditor();
		}
		return TextureEditor.instance;
	}

	public async initTexture(texturePath: string = '/1.png'): Promise<THREE.Texture> {
		const textureLoader = new THREE.TextureLoader();
		const texture = await textureLoader.loadAsync(texturePath);

		this.texture = texture;
		this.planeTexture = texture;

		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		// 设置只使用图片的左半部分作为纹理
		texture.offset.set(0, 0);   // 从左上角开始
		texture.repeat.set(1, 1);
		texture.flipY = true;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.generateMipmaps = false;
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.center.set(0, 0);
		return texture;
	}

	public rotateTextureRight(angle: number = Math.PI / 90): void {
		if (this.planeTexture) {
			this.planeTexture.rotation += angle;
		}
	}

	public rotateTextureLeft(angle: number = Math.PI / 90): void {
		if (this.planeTexture) {
			this.planeTexture.rotation -= angle;
		}
	}

	public computeUV(vertices: THREE.Vector3[], tex: THREE.Texture): THREE.Vector2[] {
		let result: THREE.Vector2[] = [];
		if (!tex)
			return result;

		let vMax = Math.max(...vertices.map(v => v.y));
		let vMin = Math.min(...vertices.map(v => v.y));
		let uMax = Math.max(...vertices.map(v => v.x));
		let uMin = Math.min(...vertices.map(v => v.x));

		let u_length = uMax - uMin;
		let v_length = vMax - vMin;
		if (u_length == 0 || v_length == 0)
			return result;

		let imgW = tex.width;
		let imgH = tex.height;
		if (!imgH || !imgW) {
			imgW = u_length;
			imgH = v_length;
		}

		// 后面可以设置origin
		let uvOrigin = new THREE.Vector2(uMin, vMin);

		vertices.forEach(uv => {
			let newUV = new THREE.Vector2((uv.x - uvOrigin.x) / imgW, (uv.y - uvOrigin.y) / imgH);
			result.push(newUV);
		});
		tex.repeat.set(1, 1);
		return result;
	}

	public setOrigin(mesh: BotMesh, value: number)
	{
		let mat = <THREE.Material>mesh.material;
		if(!mat) return ;
		let geo = <THREE.BufferGeometry>mesh.geometry;
		if(!geo) return ;
		let geoUserData = geo.userData;
		if(!geoUserData)
			return ;
		let points = geoUserData['position'];
		let aabb = geoUserData['AABB'];
		let width = aabb.maxX - aabb.minX;
		let height = aabb.maxY - aabb.minY;

		let pos = new Array<THREE.Vector2>;
		pos.push(new THREE.Vector2(0, height));
		pos.push(new THREE.Vector2(width / 2 , height));
		pos.push(new THREE.Vector2(width, height));
		pos.push(new THREE.Vector2(0, height / 2));
		pos.push(new THREE.Vector2(width / 2, height / 2));
		pos.push(new THREE.Vector2(width, height / 2));
		pos.push(new THREE.Vector2(0, 0));
		pos.push(new THREE.Vector2(width / 2, 0));
		pos.push(new THREE.Vector2(width, 0));
		let uvOrigin = pos[(value - 1) % pos.length];

		let matUserData = mat.userData;
		if(!matUserData)
			return ;
		matUserData['alignPos'] = value;
		mesh.setUVOrigin(uvOrigin);

		let result = mesh.computeUVs();
		
	}
	public setTextureRepeat(x: number, y: number): void {
		if (this.texture) {
			this.texture.repeat.set(x, y);
		}
	}

	public setTextureRotation(rotation: number): void {
		if (this.texture) {
			this.texture.rotation = rotation;
		}
	}

	public setTextureCenter(x: number, y: number): void {
		if (this.texture) {
			this.texture.center.set(x, y);
		}
	}

	public getTexture(): THREE.Texture | null {
		return this.texture;
	}

	public addKeyboardListeners(): void {
		window.addEventListener("keydown", (e) => {
			if (e.key === "+" || e.key === "=") {
				console.log("+++++++++++++");
				this.rotateTextureRight();
			}
			else if (e.key === "-" || e.key === "_") {
				console.log("----------");
				this.rotateTextureLeft();
			}
		});
	}
}