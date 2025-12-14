import * as THREE from 'three';
export class ClipInfo{
    constructor(points: THREE.Vector3[], stepX: number = 0, stepY: number = 0, bOffset: boolean = true){
        this.points = points;
        this.stepX = stepX;
        this.stepY = stepY;
        this.bOffset = bOffset;
        let minx = Infinity;
        let miny = Infinity;
        let maxx = -Infinity;
        let maxy = -Infinity;
        for (let p of this.points) {
            minx = Math.min(minx, p.x);
            miny = Math.min(miny, p.y);
            maxx = Math.max(maxx, p.x);
            maxy = Math.max(maxy, p.y);
        }
        this.box = new THREE.Box2(new THREE.Vector2(minx, miny), new THREE.Vector2(maxx, maxy));
        if (this.bOffset) {
            this.points = this.points.map(p => new THREE.Vector3(p.x - minx, p.y - miny, 0));
        }
    };
    public points: THREE.Vector3[];
    public stepX: number;
    public stepY: number;
    public box: THREE.Box2;
    private bOffset: boolean;
}