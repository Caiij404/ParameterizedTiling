import * as THREE from 'three';
import {ClipInfo} from './types';
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
    * 多边形裁剪
    * polygon 被裁剪的多边形
    * clip 裁剪窗口 以窗口中心为原点，逆时针输入各个顶点
    * stepSize 每个
    * 返回裁剪后的多边形
    */
    public CutPolygonWithPolygon(polygon: THREE.Vector3[], clip: ClipInfo): THREE.Vector3[][] {
        let results: THREE.Vector3[][] = [];
        let points = clip.points;
        let bBox = this.calculateBoundingBox(polygon);
        let step_x = clip.stepX + (clip.box.max.x - clip.box.min.x);
        let step_y = clip.stepY + (clip.box.max.y - clip.box.min.y);
        let gridCountX = Math.ceil((bBox.max.x - bBox.min.x) / step_x);
        let gridCountY = Math.ceil((bBox.max.y - bBox.min.y) / step_y);

        const clipPolygonWithEdge = (input: THREE.Vector3[], 
            isInside: (point: THREE.Vector3) => boolean, 
            getIntersection:(p1: THREE.Vector3, p2: THREE.Vector3) => THREE.Vector3): THREE.Vector3[] => {
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

        for(let i=0; i<gridCountX; i++) {
            for(let j=0; j<gridCountY; j++) {
                let output: THREE.Vector3[] = [...polygon];
                let clipVertices = points.map((p) => {
                    return new THREE.Vector3(p.x + i * step_x, p.y + j * step_y, p.z);
                });
                for (let k = 0; k < clipVertices.length; ++k)
                {
                    let edge_start = clipVertices[k];
                    let edge_end = clipVertices[(k + 1) % clipVertices.length];
                    // output = this.clipPolygonWithEdge(output, (p1) => {
                    //     let a = edge_end.sub(edge_start);
                    //     let b = p1.sub(edge_start);
                    //     return a.dot(b) >= 0;
                    // }, (p1, p2)=>{

                    // })
                }
                results.push(output);
            }
        }
        return results;
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

    /**
     * 创建正多边形顶点数组
     * @param center 中心坐标
     * @param radius 半径
     * @param sides 边数
     * @returns 正多边形顶点数组
     */
    public createHexagon(center: THREE.Vector2, radius: number, sides: number): THREE.Vector3[] {
        const vertices: THREE.Vector3[] = [];

        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            vertices.push(new THREE.Vector3(x, y, 0));
        }

        return vertices;
    }

    /**
     * 绘制从一个点到顶点数组中每个点的直线
     * @param origin 起点
     * @param vertices 目标顶点数组
     * @param color 直线颜色，默认为红色
     */
    public drawLinesFromPoint(origin: THREE.Vector3, vertices: THREE.Vector3[], color: number = 0xff0000): THREE.LineSegments {
        // 创建直线几何体
        const lineGeometry = new THREE.BufferGeometry();
        const positions: number[] = [];

        // 为每个顶点创建一条从origin到该顶点的直线
        vertices.forEach(vertex => {
            // 起点
            let start = new THREE.Vector3(origin.x, origin.y, origin.z);
            positions.push(start.x, start.y, start.z);
            // 终点
            let end = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
            positions.push(end.x, end.y, end.z);

            console.log(`从(${start.x},${start.y},${start.z})到(${end.x},${end.y},${end.z})的直线\n`, "距离是:", start.distanceTo(end));
        });

        // 设置几何体位置属性
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // 创建直线材质
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 2
        });

        // 创建直线对象
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        lines.position.z = 0.003; // 稍微抬高，确保可见
        return lines;
    }

    /**
     * 绘制多个多边形
     * @param polygons 多边形顶点数组的数组
     */
    public drawPolygons(polygons: THREE.Vector3[][]): any[] {
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
        const results: any[] = [];
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
            results.push(mesh);

            // 添加边框线，使多边形边界更清晰
            const edgesGeometry = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
            const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);
            edges.position.z = 0.002;
            results.push(edges);
        });
        return results;
    }
}