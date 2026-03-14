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

    }

    computeUVs(){
        let vertices: THREE.Vector3[] = this.geometry.userData['position'];
        if(!vertices)
            return;
        let tex: THREE.Texture | null = null;
        if (this.material instanceof THREE.MeshBasicMaterial) 
            tex = this.material.map;
        if(!tex)
            return;
        let result: THREE.Vector2[] = [];

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
        let uvOrigin = this.uvOrigin;
        if(uvOrigin.x == 0 && uvOrigin.y == 0)
            uvOrigin.set(uMin, vMin);

        vertices.forEach(uv => {
            let newUV = new THREE.Vector2((uv.x - uvOrigin.x) / imgW, (uv.y - uvOrigin.y) / imgH);
            result.push(newUV);
        });
        tex.repeat.set(1, 1);
        return result;
    }

}