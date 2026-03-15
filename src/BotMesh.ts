import * as THREE from 'three';

export class BotMesh extends THREE.Mesh {
    private uvOrigin = new THREE.Vector2(0, 0);
    constructor(geometry: THREE.BufferGeometry, material: THREE.Material) {
        super(geometry, material);
    }

    /**
     * 设置UV原点
     * @param uvOrigin UV坐标的原点，范围[0, 1]
     */
    setUVOrigin(uvOrigin: THREE.Vector2) {
        this.uvOrigin.copy(uvOrigin);
    }   
    getUVOrigin() {
        return this.uvOrigin.clone();
    }

    draw(){
        let uvs = this.computeUVs();
        // 更新UV属性
        if(uvs.length)
        {
            let flatten = new Array<number>();
            uvs.forEach(uv => {
                flatten.push(uv.x, uv.y);
            });
            this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(flatten), 2));
        }
    }

    public setOrigin(value: number)
	{
		let mat = <THREE.Material>this.material;
		if(!mat) return ;
		let geo = <THREE.BufferGeometry>this.geometry;
		if(!geo) return ;
		let geoUserData = geo.userData;
		if(!geoUserData)
			return ;
		let aabb = geoUserData['AABB'];
		// let width = aabb.maxX - aabb.minX;
		// let height = aabb.maxY - aabb.minY;
        let maxY = aabb.maxY;
        let minY = aabb.minY;
        let maxX = aabb.maxX;
        let minX = aabb.minX;

		let pos = new Array<THREE.Vector2>;
		// 第一行（上到下，左到右）
		pos.push(new THREE.Vector2(minX, maxY));
		pos.push(new THREE.Vector2((minX + maxX) / 2, maxY));
		pos.push(new THREE.Vector2(maxX, maxY));
		// 第二行（上到下，左到右）
		pos.push(new THREE.Vector2(minX, (minY + maxY) / 2));
		pos.push(new THREE.Vector2((minX + maxX) / 2, (minY + maxY) / 2));
		pos.push(new THREE.Vector2(maxX, (minY + maxY) / 2));
		// 第三行（上到下，左到右）
		pos.push(new THREE.Vector2(minX, minY));
		pos.push(new THREE.Vector2((minX + maxX) / 2, minY));
		pos.push(new THREE.Vector2(maxX, minY));
		let uvOrigin = pos[(value - 1 ) % pos.length];

		let matUserData = mat.userData;
		if(!matUserData)
			return ;
		matUserData['alignPos'] = value;
        this.uvOrigin.copy(uvOrigin);

		this.draw();
	}



    computeUVs(){
        let vertices: THREE.Vector3[] = this.geometry.userData['position'];
        if(!vertices)
            return [];
        let tex: THREE.Texture | null = null;
        if (this.material instanceof THREE.MeshBasicMaterial) 
            tex = this.material.map;
        if(!tex)
            return [];
        let result: THREE.Vector2[] = [];

        let imgW = tex.width;
        let imgH = tex.height;
        let oriX = 0, oriY = 0;
        if (!imgH || !imgW) {
            let aabb = this.geometry.userData['userData'];
            let uMax = aabb.maxX;
            let uMin = aabb.minX;
            let vMax = aabb.maxY;
            let vMin = aabb.minY;
            let u_length = uMax - uMin;
            let v_length = vMax - vMin;
            if (u_length == 0 || v_length == 0)
                return result;
            imgW = u_length;
            imgH = v_length;
            oriX = uMin;
            oriY = vMin;
        }

        // 后面可以设置origin
        let uvOrigin = this.uvOrigin;
        // if(uvOrigin.x == 0 && uvOrigin.y == 0)
        //     uvOrigin.set(oriX, oriY);

        vertices.forEach(uv => {
            let newUV = new THREE.Vector2((uv.x - uvOrigin.x) / imgW, (uv.y - uvOrigin.y) / imgH);
            result.push(newUV);
        });
        tex.repeat.set(1, 1);
        return result;
    }

}