import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceColors } from './DiceColors';
import type { DiceTheme } from './types';
import { DEFAULT_THEME } from './types';

export class DiceForge {
    private diceColors: DiceColors;
    private geometryCache: Record<string, THREE.Geometry> = {};

    // Standard Dice Maps
    // D2 (Coin)
    private static readonly D2_LABELS = ['1', '2'];
    // D100: Matches D10 geometry pattern
    private static readonly D100_LABELS = ['10', '20', '50', '40', '70', '60', '30', '80', '90', '00'];

    private static readonly D4_LABELS = ['1', '2', '3', '4'];
    private static readonly D6_LABELS = ['1', '2', '3', '4', '5', '6'];
    private static readonly D60_LABELS = ['10', '20', '30', '40', '50', '60']; // Tens d6

    private static readonly D8_LABELS = ['1', '7', '5', '3', '6', '4', '2', '8'];
    private static readonly D80_LABELS = ['10', '70', '50', '30', '60', '40', '20', '80']; // Tens d8

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

    public createdice(type: string, theme: DiceTheme = DEFAULT_THEME): THREE.Mesh {
        let geometry: THREE.Geometry;
        let baseLabels: string[] = [];

        // Apply Scale from Theme
        const scale = theme.scale || 1.0;

        switch (type) {
            case 'd2':
                geometry = this.getGeometry('d2', 1.0 * scale);
                baseLabels = DiceForge.D2_LABELS;
                break;
            case 'd4':
                geometry = this.getGeometry('d4', 1.0 * scale);
                baseLabels = DiceForge.D4_LABELS;
                break;
            case 'd6':
                geometry = this.getGeometry('d6', 1.0 * scale);
                baseLabels = DiceForge.D6_LABELS;
                break;
            case 'd60':
                geometry = this.getGeometry('d6', 1.0 * scale);
                baseLabels = DiceForge.D60_LABELS;
                break;
            case 'd8':
                geometry = this.getGeometry('d8', 1.0 * scale);
                baseLabels = DiceForge.D8_LABELS;
                break;
            case 'd80':
                geometry = this.getGeometry('d8', 1.0 * scale);
                baseLabels = DiceForge.D80_LABELS;
                break;
            case 'd10':
                geometry = this.getGeometry('d10', 1.0 * scale);
                baseLabels = DiceForge.D10_LABELS;
                break;
            case 'd12':
                geometry = this.getGeometry('d12', 0.9 * scale);
                baseLabels = DiceForge.D12_LABELS;
                break;
            case 'd20':
                geometry = this.getGeometry('d20', 1.0 * scale);
                baseLabels = DiceForge.D20_LABELS;
                break;
            case 'd100':
                geometry = this.getGeometry('d100', 1.0 * scale);
                baseLabels = DiceForge.D100_LABELS;
                break;
            default:
                throw new Error(`Unknown dice type: ${type}`);
        }

        if (!geometry) throw new Error("Geometry failed");

        const labels = this.calculateLabels(type, baseLabels);
        const materials = this.createMaterials(type, labels, theme);
        const mesh = new THREE.Mesh(geometry, materials);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (mesh as any).body_shape = (geometry as any).cannon_shape;

        // Store Face Normals and Values for Result Detection
        mesh.userData.faceValues = [];
        for (const face of geometry.faces) {
            // Check bounds just in case
            if (face.materialIndex >= 0 && face.materialIndex < labels.length) {
                let value = labels[face.materialIndex];

                // Skip materials representing edges (empty labels)
                if (!value || (Array.isArray(value) && value.length === 0)) continue;

                // For D4, the label is an array of numbers. We store the array.
                // For others, it's a primitive (string/number).

                // Store local normal and value
                mesh.userData.faceValues.push({
                    normal: face.normal.clone(),
                    value: value
                });
            }
        }

        return mesh;
    }

    private calculateLabels(type: string, baseLabels: string[]): any[] {
        if (type === 'd2') {
            // Edge (0), Face1 (1), Face2 (2)
            // Geometry faces will have materialIndex 0 for edge, 1 for top, 2 for bottom?
            // Or simpler: index 1 and 2 are top/bottom. 0 is edge.
            return ['', baseLabels[0], baseLabels[1]];
        }
        if (type === 'd4') {
            const a = baseLabels[0];
            const b = baseLabels[1];
            const c = baseLabels[2];
            const d = baseLabels[3];
            return [[], [], [b, d, c], [a, c, d], [b, a, d], [a, b, c]];
        }
        const labels = [...baseLabels];
        if (type === 'd10' || type === 'd100') { labels.unshift(''); }
        else { labels.unshift(''); labels.unshift(''); }
        return labels;
    }

    private getGeometry(type: string, radius: number): THREE.Geometry {
        if (this.geometryCache[type]) return this.geometryCache[type];
        let geom: THREE.Geometry | null = null;
        switch (type) {
            case 'd2': geom = this.create_d2_geometry(radius); break;
            case 'd4': geom = this.create_d4_geometry(radius); break;
            case 'd6': geom = this.create_d6_geometry(radius); break;
            case 'd8': geom = this.create_d8_geometry(radius); break;
            case 'd10': geom = this.create_d10_geometry(radius); break;
            case 'd100': geom = this.create_d10_geometry(radius); break; // Reuse D10 geometry
            case 'd12': geom = this.create_d12_geometry(radius); break;
            case 'd20': geom = this.create_d20_geometry(radius); break;
        }
        if (geom) { this.geometryCache[type] = geom; return geom; }
        throw new Error(`Failed to create geometry for ${type}`);
    }

    private createMaterials(type: string, labels: any[], theme: DiceTheme): THREE.Material[] {
        const materials: THREE.Material[] = [];

        // Theme Colors
        const labelColor = theme.labelColor || '#000000';
        const textureDef = this.diceColors.getImage(theme.texture);

        // If texture is used, default base color to white so texture isn't darkened
        // If no texture, keep grey default
        const defaultBase = (textureDef && textureDef.texture) ? '#ffffff' : '#dddddd';
        const diceColor = theme.diceColor || defaultBase;

        const outlineColor = theme.outlineColor || '#000000';
        const fontName = theme.font || 'Arial';

        // Material Props
        let roughness = 0.5;
        let metalness = 0.1;

        // Simple Material Mapping
        switch (theme.material) {
            case 'metal': roughness = 0.2; metalness = 0.8; break;
            case 'wood': roughness = 0.8; metalness = 0.0; break;
            case 'glass': roughness = 0.1; metalness = 0.1; break;
            case 'plastic': default: roughness = 0.5; metalness = 0.1; break;
        }

        for (let i = 0; i < labels.length; i++) {
            let labelText = labels[i];
            let isEdge = false;
            if (!labelText || (Array.isArray(labelText) && labelText.length === 0)) isEdge = true;

            if (isEdge) {
                materials.push(new THREE.MeshStandardMaterial({
                    color: diceColor, roughness, metalness, side: THREE.DoubleSide
                }));
                continue;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d')!;

            // 1. Background Color
            ctx.fillStyle = diceColor; ctx.fillRect(0, 0, 256, 256);

            // 2. Texture Overlay
            if (textureDef && textureDef.texture) {
                ctx.globalCompositeOperation = 'multiply';

                // Apply Contrast
                const contrast = theme.textureContrast !== undefined ? theme.textureContrast : 1.0;
                ctx.filter = `contrast(${contrast})`;

                ctx.drawImage(textureDef.texture, 0, 0, 256, 256);

                ctx.filter = 'none'; // Reset filter
                ctx.globalCompositeOperation = 'source-over';
            }

            // 3. Text (Color Map)
            ctx.fillStyle = labelColor;
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 8;

            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.save(); ctx.translate(128, 128);

            // Font Scaling based on Family
            let fontScale = 1.0;
            if (fontName.includes('Faculty') || fontName.includes('Orbitron')) {
                fontScale = 0.85;
            } else if (fontName.includes('IM Fell')) {
                fontScale = 1.15;
            }

            // Reduce font size for double-digit dice types (d100, d80, d60)
            if (type === 'd100' || type === 'd80' || type === 'd60') {
                fontScale *= 0.6; // 40% reduction
            }
            // Draw Text Function (Reused for Bump)
            const drawText = (context: CanvasRenderingContext2D) => {
                if (type === 'd4' && Array.isArray(labelText)) {
                    const fSize = Math.round(60 * fontScale);
                    context.font = `bold ${fSize}px ${fontName}`;
                    let ts = 256;
                    for (let k = 0; k < labelText.length; k++) {
                        context.strokeText(labelText[k], 0, -ts * 0.3);
                        context.fillText(labelText[k], 0, -ts * 0.3);
                        context.rotate(Math.PI * 2 / 3);
                    }
                } else {
                    const fSize = Math.round(120 * fontScale);
                    context.font = `bold ${fSize}px ${fontName}`;
                    let angleDeg = 0;
                    if (type === 'd8') angleDeg = (i % 2 === 0) ? -7.5 : -127.5;
                    else if (type === 'd10') angleDeg = -6;
                    else if (type === 'd12') angleDeg = 5;
                    else if (type === 'd20') angleDeg = -7.5;

                    if (angleDeg !== 0) context.rotate(angleDeg * Math.PI / 180);

                    let textStr = String(labelText);
                    if ((textStr === '6' || textStr === '9') && type !== 'd6') textStr += '.';

                    context.strokeText(textStr, 0, 0);
                    context.fillText(textStr, 0, 0);
                }
            };

            drawText(ctx);
            ctx.restore();

            const tex = new THREE.CanvasTexture(canvas);
            tex.encoding = THREE.sRGBEncoding; // Fix: Treat canvas colors as sRGB input

            // --- Bump Map Generation ---
            let bumpTex = tex; // Default to color map if no specific bump
            if (textureDef && textureDef.bump) {
                const canvasBump = document.createElement('canvas');
                canvasBump.width = 256; canvasBump.height = 256;
                const ctxBump = canvasBump.getContext('2d')!;

                // 1. Background (White = High, unless texture says otherwise)
                ctxBump.fillStyle = '#ffffff';
                ctxBump.fillRect(0, 0, 256, 256);

                // 2. Bump Texture
                if (textureDef.bump) {
                    ctxBump.drawImage(textureDef.bump, 0, 0, 256, 256);
                }

                // 3. Text (Engraved = Black)
                ctxBump.fillStyle = '#000000';
                ctxBump.strokeStyle = '#000000';
                ctxBump.lineWidth = 8;
                ctxBump.textAlign = 'center'; ctxBump.textBaseline = 'middle';

                ctxBump.save(); ctxBump.translate(128, 128);
                drawText(ctxBump); // Re-run draw logic with black fill
                ctxBump.restore();

                bumpTex = new THREE.CanvasTexture(canvasBump);
            }

            // Use MeshPhysicalMaterial for advanced properties (Glass, Metal)
            const materialParams: THREE.MeshPhysicalMaterialParameters = {
                map: tex,
                bumpMap: bumpTex,
                bumpScale: 0.08, // Strength of the bump effect
                roughness,
                metalness,
                flatShading: true // CRITICAL: Ensures crisp edges, reducing "blob" look
            };

            if (theme.material === 'glass') {
                materialParams.transparent = true;
                materialParams.opacity = 0.85; // 85% opacity (Final User Choice)
                materialParams.side = THREE.DoubleSide;
                // depthWrite default is true
                materialParams.transmission = 0.0;
            }
            // Note: For real glass refraction, we'd use transmission > 0...

            const mat = new THREE.MeshPhysicalMaterial(materialParams);
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

    private create_d2_geometry(radius: number) {
        const segments = 24; // Optimization: Reduced from 40 to 24 for physics stability
        const h = 0.1 * radius; // THINNNER! Reduced from 0.2 to 0.1
        const bevel = 0.05 * radius; // Bevel size
        const r_outer = radius;
        const r_inner = radius - bevel;
        const h_inner = h;
        const h_outer = h - bevel;

        const geom = new THREE.Geometry();

        // Vertex Indices Offset
        let idx = 0;

        // Vertices Helper
        const pushVert = (x: number, y: number, z: number) => { geom.vertices.push(new THREE.Vector3(x, y, z)); return idx++; };

        // 1. Top Center
        const topCenter = pushVert(0, h, 0);
        // 2. Bot Center
        const botCenter = pushVert(0, -h, 0);

        // Rings
        const topInnerStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_inner, h_inner, Math.sin(a) * r_inner);
        }
        const topOuterStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_outer, h_outer, Math.sin(a) * r_outer);
        }
        const botOuterStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_outer, -h_outer, Math.sin(a) * r_outer);
        }
        const botInnerStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_inner, -h_inner, Math.sin(a) * r_inner);
        }

        const centerUV = new THREE.Vector2(0.5, 0.5);

        // UV Logic: Top needs FLIP X (1-u). Bottom needs NORMAL (u).
        const getUV_Top = (r_ratio: number, i: number) => {
            const ang = (i / segments) * Math.PI * 2;
            return new THREE.Vector2(0.5 - 0.5 * Math.cos(ang) * r_ratio, 0.5 + 0.5 * Math.sin(ang) * r_ratio);
        };
        const getUV_Bot = (r_ratio: number, i: number) => {
            const ang = (i / segments) * Math.PI * 2;
            return new THREE.Vector2(0.5 + 0.5 * Math.cos(ang) * r_ratio, 0.5 + 0.5 * Math.sin(ang) * r_ratio);
        };

        // --- FACES ---

        // 1. Top Face (Center -> Inner)
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const f = new THREE.Face3(topCenter, topInnerStart + next, topInnerStart + i);
            f.materialIndex = 1;
            geom.faces.push(f);
            geom.faceVertexUvs[0].push([
                centerUV,
                getUV_Top(0.9, next),
                getUV_Top(0.9, i)
            ]);
        }

        // 2. Top Chamfer (Inner -> Outer)
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const i1 = topInnerStart + i; const i2 = topInnerStart + next;
            const o1 = topOuterStart + i; const o2 = topOuterStart + next;

            // Quad: i1, i2, o2, o1. Split into 2 tris.
            // Tri 1: i1, o2, o1 (Check winding: Inner is "Up". Outer is "Down". Normal Up/Out)
            // Vector Inner->Outer is Out.
            // CCW: i1->o2->o1?
            const f1 = new THREE.Face3(i1, i2, o1); // i1->i2->o1
            f1.materialIndex = 1; // Chamfer gets Face Color
            geom.faces.push(f1);
            geom.faceVertexUvs[0].push([getUV_Top(0.9, i), getUV_Top(0.9, next), getUV_Top(1.0, i)]);

            const f2 = new THREE.Face3(i2, o2, o1);
            f2.materialIndex = 1;
            geom.faces.push(f2);
            geom.faceVertexUvs[0].push([getUV_Top(0.9, next), getUV_Top(1.0, next), getUV_Top(1.0, i)]);
        }

        // 3. Side (Outer Top -> Outer Bot) - Material 0 (Edge)
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const t1 = topOuterStart + i; const t2 = topOuterStart + next;
            const b1 = botOuterStart + i; const b2 = botOuterStart + next;

            // Quads
            const f1 = new THREE.Face3(t1, b1, t2);
            f1.materialIndex = 0;
            geom.faces.push(f1);
            geom.faceVertexUvs[0].push([new THREE.Vector2(0, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 1)]);

            const f2 = new THREE.Face3(t2, b1, b2);
            f2.materialIndex = 0;
            geom.faces.push(f2);
            geom.faceVertexUvs[0].push([new THREE.Vector2(1, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)]);
        }

        // 4. Bot Chamfer (Outer -> Inner) - Material 2
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const o1 = botOuterStart + i; const o2 = botOuterStart + next;
            const i1 = botInnerStart + i; const i2 = botInnerStart + next;

            // Winding: Pointing Down.
            // CCW from Bottom. CW from Top.
            // i1->i2 is CW from top?
            // Let's use logic from Top and flip.
            // Top: i1, i2, o1. 
            // Bot: i1, o1, i2?

            const f1 = new THREE.Face3(i1, o1, i2);
            f1.materialIndex = 2;
            geom.faces.push(f1);
            geom.faceVertexUvs[0].push([getUV_Bot(0.9, i), getUV_Bot(1.0, i), getUV_Bot(0.9, next)]);

            const f2 = new THREE.Face3(o1, o2, i2);
            f2.materialIndex = 2;
            geom.faces.push(f2);
            geom.faceVertexUvs[0].push([getUV_Bot(1.0, i), getUV_Bot(1.0, next), getUV_Bot(0.9, next)]);
        }

        // 5. Bot Face (Inner -> Center)
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            // Top was: Center, Next, i
            // Bot should include reverse?
            // Bot viewed from top is CW (Center, i, Next).
            // Normal needs to point Down.
            // Center->i->Next is CW? No, Center->Next->i is CCW.
            // So Center->i->Next is CW (Down).
            const f = new THREE.Face3(botCenter, i + botInnerStart, next + botInnerStart);
            f.materialIndex = 2;
            geom.faces.push(f);
            geom.faceVertexUvs[0].push([
                centerUV,
                getUV_Bot(0.9, i),
                getUV_Bot(0.9, next)
            ]);
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
