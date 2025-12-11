import * as THREE from 'three';

type rect = {minX:number, maxX:number, minY:number, maxY: number}

export class GeometryEditor {
    private static instance: GeometryEditor | null = null;
    private constructor() {
    }
    public static getInstance(): GeometryEditor {
        if (!GeometryEditor.instance) {
            GeometryEditor.instance = new GeometryEditor();
        }
        return GeometryEditor.instance;
    }

    public CutGeometry(vertices: THREE.Vector3[], gridSizeX: number, gridSizeY: number): THREE.Vector3[][] {
        if(vertices.length === 0) {
            return [];
        }
        let results: THREE.Vector3[][] = [];
        let bBox = this.calculateBoundingBox(vertices);
        let width = bBox.max.x - bBox.min.x;
        let height = bBox.max.y - bBox.min.y;
        let gridCountX = Math.ceil(width / gridSizeX);
        let gridCountY = Math.ceil(height / gridSizeY);
        for(let i = 0; i < gridCountX; i++) {
            for(let j = 0; j < gridCountY; j++) {
                let gridX = bBox.min.x + i * gridSizeX;
                let gridY = bBox.min.y + j * gridSizeY;
                let rect:rect = {minX:gridX, maxX:gridX + gridSizeX, minY:gridY, maxY:gridY + gridSizeY};
                let result = this.cutPlaneWithRect(vertices, rect);
                if(result.length >= 3)
                {
                    results.push(result);
                }
            }
        }
        return results;
    }

    // sutherlandHodgman 多边形裁剪
    private cutPlaneWithRect(polygon: THREE.Vector3[], clip: rect): THREE.Vector3[]{
        let output: THREE.Vector3[] = [...polygon];

        // 因为这里是矩形，所以inside的判断比较简单

        // 左
        output = this.clipPolygonWithEdge(output, (p1) => { return p1.x >= clip.minX; }, (p1, p2) => {
            let t = (p1.x - clip.minX) / (p1.x - p2.x);
            return new THREE.Vector3(clip.minX, p1.y + t * (p2.y - p1.y), p1.z + t * (p2.z - p1.z));
        });

        // 右
        output = this.clipPolygonWithEdge(output, (p1) => { return p1.x <= clip.maxX; }, (p1, p2) => {
            let t = (clip.maxX - p1.x) / (p2.x - p1.x);
            return new THREE.Vector3(clip.maxX, p1.y + t * (p2.y - p1.y), p1.z + t * (p2.z - p1.z));
        });

        // 下
        output = this.clipPolygonWithEdge(output, (p1) => { return p1.y >= clip.minY; }, (p1, p2) => {
            let t = (clip.minY - p1.y) / (p2.y - p1.y);
            return new THREE.Vector3(p1.x + t * (p2.x - p1.x), clip.minY, p1.z + t * (p2.z - p1.z));
        });

        // 上
        output = this.clipPolygonWithEdge(output, (p1) => { return p1.y <= clip.maxY; }, (p1, p2) => {
            let t = (clip.maxY - p1.y) / (p2.y - p1.y);
            return new THREE.Vector3(p1.x + t * (p2.x - p1.x), clip.maxY, p1.z + t * (p2.z - p1.z));
        });


        return output;
    }


    /*
    * current next
    * 两点都在inside 则输出current
    * current在inside，next不在，则输出current 和 交点
    * current不在，next在，输出交点
    * 都不在则不输出
    * 
    * 裁剪窗口只能是矩形 因为isInside的判断比较简单粗暴
    */
    private clipPolygonWithEdge(input: THREE.Vector3[], 
        isInside: (point: THREE.Vector3) => boolean, 
        getIntersection:(p1: THREE.Vector3, p2: THREE.Vector3) => THREE.Vector3): THREE.Vector3[] {
            let output:THREE.Vector3[] = [];
            for(let i = 0; i < input.length; i++) {
                let current = input[i];
                let next = input[(i + 1) % input.length];
                let inside1 = isInside(current);
                let inside2 = isInside(next);
                if(inside1)
                {
                    output.push(current)
                    if(!inside2)
                    {
                        output.push(getIntersection(current,next));
                    }
                }
                else
                {
                    if(inside2)
                    {
                        output.push(getIntersection(current,next));
                    }
                }
            }
            return output;
        }

    private calculateBoundingBox(vertices: THREE.Vector3[]): THREE.Box2 {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for(let vertex of vertices) {
            minX = Math.min(minX, vertex.x);
            minY = Math.min(minY, vertex.y);
            maxX = Math.max(maxX, vertex.x);
            maxY = Math.max(maxY, vertex.y);
        }
        return new THREE.Box2(new THREE.Vector2(minX, minY), new THREE.Vector2(maxX, maxY));
    }
}