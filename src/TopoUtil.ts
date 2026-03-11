import * as THREE from 'three'

function cross(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): number
{
    let ab = b.sub(a);
    let ac = c.sub(a);
    return ab.cross(ac).z;
}

// 判断p是否在三角形abc中
function pointInTriangle(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3):boolean
{
    let pab = cross(p, a, b);
    let pbc = cross(p, b, c);
    let pca = cross(p, c, a);

    return pab > 0 && pbc > 0 && pca > 0;
}

function isEar(prev: number, curr: number, next: number, indices: number[], vertices: THREE.Vector3[])
{
    let a = vertices[prev];
    let b = vertices[curr];
    let c = vertices[next];

    if(cross(a, b, c) <= 0)
        return false;
    for(let k of indices)
    {
        if(k == prev || k == curr || k == next)
            continue;

        if(pointInTriangle(vertices[k], a, b, c))
        {
            return false;
        }
    }
    return true;
}


export function triangulate(vertices: THREE.Vector3[]): number[][]
{
    let triangles: number[][] = [];
    let indices: number[] = [];
    for(let i=0; i<vertices.length; ++i)
    {
        indices.push(i);
    }

    while(indices.length > 3)
    {
        let earFound = false;
        let size = indices.length;

        for(let i=0; i<size; ++i)
        {
            let prev = indices[(i - 1 + size) % size];
            let curr = indices[i];
            let next = indices[(i + 1) % size];

            if(isEar(prev, curr, next, indices, vertices))
            {
                triangles.push([prev, curr, next]);
                indices.splice(i,1);
                earFound = true;
                break;
            }
        }
        if(!earFound)
        {
            console.error("Triangulation failed (polygon may be invalid)\n")
            break;
        }
    }

    if(indices.length == 3)
    {
        triangles.push([indices[0], indices[1], indices[2]])
    }

    return triangles;
}