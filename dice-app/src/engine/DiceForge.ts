import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceColors } from './DiceColors';

export class DiceForge {
    private diceColors: DiceColors;
    private geometryCache: Record<string, THREE.Geometry> = {};

    // Standard Dice Maps
    private static readonly D4_LABELS = ['1', '2', '3', '4'];
    private static readonly D6_LABELS = ['1', '2', '3', '4', '5', '6'];
    private static readonly D8_LABELS = ['1', '7', '5', '3', '6', '4', '2', '8'];
    // D10: Swapped 3<->5<->7 to fix order (1,5,7,3,9 -> 1,7,3,5,9)
    private static readonly D10_LABELS = ['1', '2', '5', '4', '7', '6', '3', '8', '9', '0'];
    private static readonly D12_LABELS = ['1', '11', '7', '9', '10', '5', '8', '3', '4', '6', '2', '12'];
    // D20: Manual User Map (Corrected: 17 at Slot 17, then 16 14 18)
    private static readonly D20_LABELS = [
        '1', '13', '11', '9', '19', '5', '7', '3', '6', '4',
        '12', '10', '8', '20', '2', '15', '17', '16', '14', '18'
    ];

    constructor() {
        this.diceColors = new DiceColors();
    }

    public createdice(type: string): THREE.Mesh {
        let geometry: THREE.Geometry;
        let baseLabels: string[] = [];

        switch (type) {
            case 'd4':
                geometry = this.getGeometry('d4', 1.2);
                baseLabels = DiceForge.D4_LABELS;
                break;
            case 'd6':
                geometry = this.getGeometry('d6', 0.9);
                baseLabels = DiceForge.D6_LABELS;
                break;
            case 'd8':
                geometry = this.getGeometry('d8', 1.0);
                baseLabels = DiceForge.D8_LABELS;
                break;
            case 'd10':
                geometry = this.getGeometry('d10', 0.9);
                baseLabels = DiceForge.D10_LABELS;
                break;
            case 'd12':
                geometry = this.getGeometry('d12', 0.9);
                baseLabels = DiceForge.D12_LABELS;
                break;
            case 'd20':
                geometry = this.getGeometry('d20', 1.0);
                baseLabels = DiceForge.D20_LABELS;
                break;
            default:
                throw new Error(`Unknown dice type: ${type}`);
        }

        if (!geometry) throw new Error("Geometry failed");

        const labels = this.calculateLabels(type, baseLabels);
        const materials = this.createMaterials(type, labels);
        const mesh = new THREE.Mesh(geometry, materials);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (mesh as any).body_shape = (geometry as any).cannon_shape;

        return mesh;
    }

    private calculateLabels(type: string, baseLabels: string[]): any[] {
        if (type === 'd4') {
            const a = baseLabels[0];
            const b = baseLabels[1];
            const c = baseLabels[2];
            const d = baseLabels[3];
            return [[], [], [b, d, c], [a, c, d], [b, a, d], [a, b, c]];
        }
        const labels = [...baseLabels];
        if (type === 'd10') { labels.unshift(''); }
        else { labels.unshift(''); labels.unshift(''); }
        return labels;
    }

    private getGeometry(type: string, radius: number): THREE.Geometry {
        if (this.geometryCache[type]) return this.geometryCache[type];
        let geom: THREE.Geometry | null = null;
        switch (type) {
            case 'd4': geom = this.create_d4_geometry(radius); break;
            case 'd6': geom = this.create_d6_geometry(radius); break;
            case 'd8': geom = this.create_d8_geometry(radius); break;
            case 'd10': geom = this.create_d10_geometry(radius); break;
            case 'd12': geom = this.create_d12_geometry(radius); break;
            case 'd20': geom = this.create_d20_geometry(radius); break;
        }
        if (geom) { this.geometryCache[type] = geom; return geom; }
        throw new Error(`Failed to create geometry for ${type}`);
    }

    private createMaterials(type: string, labels: any[]): THREE.Material[] {
        const materials: THREE.Material[] = [];
        const labelColor = '#000000';
        const diceColor = '#dddddd';
        const textureDef = this.diceColors.getImage('ledgerandink');

        for (let i = 0; i < labels.length; i++) {
            let labelText = labels[i];
            let isEdge = false;
            if (!labelText || (Array.isArray(labelText) && labelText.length === 0)) isEdge = true;

            if (isEdge) {
                materials.push(new THREE.MeshStandardMaterial({
                    color: diceColor, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide
                }));
                continue;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d')!;

            ctx.fillStyle = diceColor; ctx.fillRect(0, 0, 128, 128);

            if (textureDef && textureDef.texture) {
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(textureDef.texture, 0, 0, 128, 128);
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.fillStyle = labelColor;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.save(); ctx.translate(64, 64);

            if (type === 'd4' && Array.isArray(labelText)) {
                ctx.font = 'bold 30px Arial';
                let ts = 128;
                for (let k = 0; k < labelText.length; k++) {
                    ctx.fillText(labelText[k], 0, -ts * 0.3);
                    ctx.rotate(Math.PI * 2 / 3);
                }
            } else {
                ctx.font = 'bold 60px Arial';
                let angleDeg = 0;
                if (type === 'd8') angleDeg = (i % 2 === 0) ? -7.5 : -127.5;
                else if (type === 'd10') angleDeg = -6;
                else if (type === 'd12') angleDeg = 5;
                else if (type === 'd20') angleDeg = -7.5;

                if (angleDeg !== 0) ctx.rotate(angleDeg * Math.PI / 180);

                let textStr = String(labelText);
                if (textStr === '6' || textStr === '9') textStr += '.';
                ctx.fillText(textStr, 0, 0);
            }
            ctx.restore();

            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshStandardMaterial({
                map: tex, roughness: 0.5, metalness: 0.1, bumpScale: 0.05
            });
            materials.push(mat);
        }
        return materials;
    }

    private create_geom(vertices: any[], faces: any[], radius: number, tab: number, af: number): THREE.Geometry {
        return this.make_geom(vertices, faces, radius, tab, af);
    }

    private make_geom(vertices: any[], faces: number[][], radius: number, tab: number, af: number) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            // FIX: Normalize vertices before scaling to ensure consistent radius
            var vertex = (new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2])).normalize().multiplyScalar(radius);
            (vertex as any).index = geom.vertices.push(vertex) - 1;
        }
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], undefined, ii[fl] + 1));
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
        if (CANNON) {
            const points = geom.vertices.map(v => new CANNON.Vec3(v.x, v.y, v.z));
            const facesC = geom.faces.map(f => [f.a, f.b, f.c]);
            (geom as any).cannon_shape = new CANNON.ConvexPolyhedron({ vertices: points as any, faces: facesC as any });
        }
        return geom;
    }

    private make_d10_geom(vertices: THREE.Vector3[], faces: number[][], radius: number, tab: number, af: number) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            // FIX: Normalize vertices before scaling
            var vertex = vertices[i].normalize().multiplyScalar(radius);
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
                geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], undefined, ii[fl] + 1));

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
        if (CANNON) {
            const points = geom.vertices.map(v => new CANNON.Vec3(v.x, v.y, v.z));
            const facesC = geom.faces.map(f => [f.a, f.b, f.c]);
            (geom as any).cannon_shape = new CANNON.ConvexPolyhedron({ vertices: points as any, faces: facesC as any });
        }
        return geom;
    }

    private create_d4_geometry(radius: number) {
        var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
        var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
        return this.create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6);
    }

    private create_d6_geometry(radius: number) {
        var vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        var faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
        [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
        return this.create_geom(vertices, faces, radius, 0.1, Math.PI / 4);
    }

    private create_d8_geometry(radius: number) {
        var vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        var faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
        [1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
        return this.create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2);
    }

    private create_d10_geometry(radius: number) {
        var a = Math.PI * 2 / 10, h = 0.105;
        var vertices = [];
        for (var i = 0, b = 0; i < 10; ++i, b += a) {
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        }
        vertices.push([0, 0, -1]); vertices.push([0, 0, 1]);
        var faces = [
            [5, 6, 7, 11, 0], [4, 3, 2, 10, 1], [1, 2, 3, 11, 2], [0, 9, 8, 10, 3],
            [7, 8, 9, 11, 4], [8, 7, 6, 10, 5], [9, 0, 1, 11, 6], [2, 1, 0, 10, 7],
            [3, 4, 5, 11, 8], [6, 5, 4, 10, 9]
        ];
        return this.make_d10_geom(vertices.map(v => new THREE.Vector3(v[0], v[1], v[2])), faces, radius, 0.3, Math.PI);
    }

    private create_d12_geometry(radius: number) {
        var p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
        var vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
        [p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
        [-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
        [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
        var faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
        [6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
        [13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
        return this.create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2);
    }

    private create_d20_geometry(radius: number) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
        [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
        [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
        [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return this.create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2);
    }
}
