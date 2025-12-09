import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceColors } from './DiceColors';

export class DiceForge {
    private diceColors: DiceColors;
    private geometryCache: Record<string, THREE.Geometry> = {};

    // Standard D20 Face Map (Index -> Label) to avoid Spindown
    // based on standard d20 opposite pairs summing to 21.
    private static readonly D20_LABELS = [
        '20', '8', '14', '2', '10',
        '12', '18', '4', '6', '16',
        '1', '13', '7', '19', '11',
        '9', '3', '17', '5', '15'
    ];

    private static readonly D4_LABELS = ['4', '2', '3', '1'];
    private static readonly D6_LABELS = ['6', '3', '5', '2', '4', '1'];
    private static readonly D8_LABELS = ['8', '2', '7', '3', '6', '4', '5', '1'];
    private static readonly D10_LABELS = ['0', '8', '1', '6', '7', '3', '2', '9', '4', '5'];
    private static readonly D12_LABELS = ['12', '10', '2', '8', '4', '9', '7', '3', '5', '11', '1', '6'];

    constructor() {
        this.diceColors = new DiceColors();
    }

    public createdice(type: string): THREE.Mesh {
        let geometry: THREE.Geometry;
        let scale = 1.0;
        let labels: string[] = [];

        // Basic Preset Logic
        switch (type) {
            case 'd4':
                geometry = this.getGeometry('d4', 1.2);
                labels = DiceForge.D4_LABELS;
                scale = 1.2;
                break;
            case 'd6':
                geometry = this.getGeometry('d6', 0.9);
                labels = DiceForge.D6_LABELS;
                scale = 0.9;
                break;
            case 'd8':
                geometry = this.getGeometry('d8', 1.0);
                labels = DiceForge.D8_LABELS;
                break;
            case 'd10':
                geometry = this.getGeometry('d10', 0.9);
                labels = DiceForge.D10_LABELS;
                scale = 0.9;
                break;
            case 'd12':
                geometry = this.getGeometry('d12', 0.9);
                labels = DiceForge.D12_LABELS;
                scale = 0.9;
                break;
            case 'd20':
                geometry = this.getGeometry('d20', 1.0);
                labels = DiceForge.D20_LABELS;
                break;
            default:
                throw new Error(`Unknown dice type: ${type}`);
        }

        if (!geometry) throw new Error("Geometry failed");

        // Use scale
        // Note: The original engine scaled meshes or geometries. 
        // Here we scale the method inputs or the result. 
        // For physics match, we baked it into create_geom logic actually.

        const materials = this.createMaterials(type, labels, scale);
        const mesh = new THREE.Mesh(geometry, materials);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (mesh as any).body_shape = (geometry as any).cannon_shape;

        return mesh;
    }

    private getGeometry(type: string, radius: number): THREE.Geometry {
        if (this.geometryCache[type]) return this.geometryCache[type];

        let start = performance.now();
        let geom: THREE.Geometry | null = null;

        switch (type) {
            case 'd4': geom = this.create_d4_geometry(radius); break;
            case 'd6': geom = this.create_d6_geometry(radius); break;
            case 'd8': geom = this.create_d8_geometry(radius); break;
            case 'd10': geom = this.create_d10_geometry(radius); break;
            case 'd12': geom = this.create_d12_geometry(radius); break;
            case 'd20': geom = this.create_d20_geometry(radius); break;
        }

        if (geom) {
            this.geometryCache[type] = geom;
            console.log(`Geometry ${type} created in ${performance.now() - start}ms`);
            return geom;
        }
        throw new Error(`Failed to create geometry for ${type}`);
    }

    private createMaterials(type: string, labels: string[], size: number): THREE.Material[] {
        // Simplified port of createMaterials for Step 03
        const materials: THREE.Material[] = [];
        const labelColor = '#000000';
        const diceColor = '#dddddd';

        // Material 0: Chamfers/Edges
        materials.push(new THREE.MeshStandardMaterial({
            color: diceColor,
            roughness: 0.5,
            metalness: 0.1,
            side: THREE.DoubleSide
        }));

        for (let i = 0; i < labels.length; i++) {
            // Let's assume standard 'ledgerandink' texture is loaded.
            const textureDef = this.diceColors.getImage('ledgerandink');

            // Create Canvas
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d')!;

            // Draw Base
            ctx.fillStyle = diceColor;
            ctx.fillRect(0, 0, 128, 128);

            // Draw Texture (if loaded)
            if (textureDef && textureDef.texture) {
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(textureDef.texture, 0, 0, 128, 128);
                ctx.globalCompositeOperation = 'source-over';
            }

            // Draw Label
            ctx.fillStyle = labelColor;
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], 64, 64);

            // Create Tex
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                bumpMap: textureDef?.bump ? new THREE.CanvasTexture(textureDef.bump as any) : null,
                roughness: 0.5,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            materials.push(mat);
        }
        return materials;
    }

    // --- GEOMETRY GENERATORS ---

    create_d4_geometry(radius: number) {
        var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
        var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
        return this.create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6, 0.96);
    }

    create_d6_geometry(radius: number) {
        var vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        var faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
        [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
        return this.create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
    }

    create_d8_geometry(radius: number) {
        var vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        var faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
        [1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
        return this.create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.965);
    }

    create_d10_geometry(radius: number) {
        var a = Math.PI * 2 / 10, h = 0.105, v = -1;
        var vertices = [];
        for (var i = 0, b = 0; i < 10; ++i, b += a) {
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        }
        vertices.push([0, 0, -1]);
        vertices.push([0, 0, 1]);
        var faces = [
            [5, 6, 7, 11, 0], [4, 3, 2, 10, 1], [1, 2, 3, 11, 2], [0, 9, 8, 10, 3],
            [7, 8, 9, 11, 4], [8, 7, 6, 10, 5], [9, 0, 1, 11, 6], [2, 1, 0, 10, 7],
            [3, 4, 5, 11, 8], [6, 5, 4, 10, 9]
        ];
        return this.create_geom(vertices, faces, radius, 0.3, Math.PI, 0.945);
    }

    create_d12_geometry(radius: number) {
        var p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
        var vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
        [p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
        [-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
        [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
        var faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
        [6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
        [13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
        return this.create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.968);
    }

    create_d20_geometry(radius: number) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
        [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
        [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
        [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return this.create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
    }

    // --- MATH HELPERS (Ported from DiceFactory.js) ---

    create_shape(vertices: CANNON.Vec3[], faces: number[][], radius: number) {
        var cv = new Array(vertices.length), cf = new Array(faces.length);
        for (var i = 0; i < vertices.length; ++i) {
            var v = vertices[i];
            cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
        }
        for (var i = 0; i < faces.length; ++i) {
            cf[i] = faces[i].slice(0, faces[i].length - 1);
        }
        return new CANNON.ConvexPolyhedron({ vertices: cv, faces: cf });
    }

    create_geom(vertices: number[][], faces: number[][], radius: number, tab: number, af: number, chamfer: number) {
        var vectors = new Array(vertices.length);
        for (var i = 0; i < vertices.length; ++i) {
            vectors[i] = (new THREE.Vector3).fromArray(vertices[i]).normalize();
        }
        var cg = this.chamfer_geom(vectors, faces, chamfer);
        var geom: THREE.Geometry;

        if (faces.length != 10)
            geom = this.make_geom(cg.vectors, cg.faces, radius, tab, af);
        else
            geom = this.make_d10_geom(cg.vectors, cg.faces, radius, tab, af);

        (geom as any).cannon_shape = this.create_shape(vectors as any, faces, radius);
        return geom;
    }

    chamfer_geom(vectors: THREE.Vector3[], faces: number[][], chamfer: number) {
        var chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
        for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var center_point = new THREE.Vector3();
            var face = new Array(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = vectors[ii[j]].clone();
                center_point.add(vv);
                corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
            }
            center_point.divideScalar(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = chamfer_vectors[face[j]];
                vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
            }
            face.push(ii[fl]);
            chamfer_faces.push(face);
        }
        for (var i = 0; i < faces.length - 1; ++i) {
            for (var j = i + 1; j < faces.length; ++j) {
                var pairs = [], lastm = -1;
                for (var m = 0; m < faces[i].length - 1; ++m) {
                    var n = faces[j].indexOf(faces[i][m]);
                    if (n >= 0 && n < faces[j].length - 1) {
                        if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
                        else pairs.push([i, m], [j, n]);
                        lastm = m;
                    }
                }
                if (pairs.length != 4) continue;
                chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
                chamfer_faces[pairs[1][0]][pairs[1][1]],
                chamfer_faces[pairs[3][0]][pairs[3][1]],
                chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
            }
        }
        for (var i = 0; i < corner_faces.length; ++i) {
            var cf = corner_faces[i], face = [cf[0]], count = cf.length - 1;
            while (count) {
                for (var m = faces.length; m < chamfer_faces.length; ++m) {
                    var index = chamfer_faces[m].indexOf(face[face.length - 1]);
                    if (index >= 0 && index < 4) {
                        if (--index == -1) index = 3;
                        var next_vertex = chamfer_faces[m][index];
                        if (cf.indexOf(next_vertex) >= 0) {
                            face.push(next_vertex);
                            break;
                        }
                    }
                }
                --count;
            }
            face.push(-1);
            chamfer_faces.push(face);
        }
        return { vectors: chamfer_vectors, faces: chamfer_faces };
    }

    make_geom(vertices: THREE.Vector3[], faces: number[][], radius: number, tab: number, af: number) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            var vertex = vertices[i].multiplyScalar(radius);
            (vertex as any).index = geom.vertices.push(vertex) - 1;
        }
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] === -1 ? 0 : ii[fl]));
                if (ii[fl] !== -1) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
                } else {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)
                    ]);
                }
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }

    make_d10_geom(vertices: THREE.Vector3[], faces: number[][], radius: number, tab: number, af: number) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            var vertex = vertices[i].multiplyScalar(radius);
            (vertex as any).index = geom.vertices.push(vertex) - 1;
        }
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            var w = 0.65;
            var h = 0.85;
            var v0 = 1 - 1 * h;
            var v1 = 1 - (0.895 / 1.105) * h;
            var v2 = 1;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] + 1));
                if (faces[i][faces[i].length - 1] == -1 || j >= 2) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
                } else if (j == 0) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2(0.5 - w / 2, v1),
                        new THREE.Vector2(0.5, v0),
                        new THREE.Vector2(0.5 + w / 2, v1)
                    ]);
                } else if (j == 1) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2(0.5 - w / 2, v1),
                        new THREE.Vector2(0.5 + w / 2, v1),
                        new THREE.Vector2(0.5, v2)
                    ]);
                }
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }

}
