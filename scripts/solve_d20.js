
// Logic from DiceForge.ts
function create_d20_geometry() {
    var t = (1 + Math.sqrt(5)) / 2;
    var vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    var faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    return { vertices, faces };
}

// Vector math helper
class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    distanceTo(v) { return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2) + Math.pow(this.z - v.z, 2)); }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    divideScalar(s) { return new Vector3(this.x / s, this.y / s, this.z / s); }
}

function get_centroid(verts, faceIndices) {
    let x = 0, y = 0, z = 0;
    for (let idx of faceIndices) { x += verts[idx][0]; y += verts[idx][1]; z += verts[idx][2]; }
    return new Vector3(x / 3, y / 3, z / 3);
}

function compute_opposites() {
    const { vertices, faces } = create_d20_geometry();
    const map = {};
    for (let i = 0; i < faces.length; i++) {
        let c1 = get_centroid(vertices, faces[i]);
        let maxD = -1;
        let best = -1;
        for (let j = 0; j < faces.length; j++) {
            if (i === j) continue;
            let c2 = get_centroid(vertices, faces[j]);
            let d = c1.distanceTo(c2);
            if (d > maxD) { maxD = d; best = j; }
        }
        map[i] = best;
    }
    return map;
}

const opposites = compute_opposites();
// console.log("Opposites Map:", opposites);

let solution = null;
const used = new Array(21).fill(false);
const labels = new Array(20).fill(0);

function solve() {
    labels[0] = 20; used[20] = true;
    labels[opposites[0]] = 1; used[1] = true;

    // Neighbors of 0. Calculate strictly from geometry in this run to be safe.
    const { faces } = create_d20_geometry();
    const neighbors0 = [];
    for (let i = 0; i < faces.length; i++) {
        if (i === 0) continue;
        // Count shared
        let shared = 0;
        for (let v of faces[i]) if (faces[0].includes(v)) shared++;
        if (shared === 2) neighbors0.push(i);
    }
    // neighbors0 should be [1, 4, 6] but let's trust code.

    // Permute {2, 8, 14}
    const perms = [
        [2, 8, 14], [2, 14, 8], [8, 2, 14], [8, 14, 2], [14, 2, 8], [14, 8, 2]
    ];

    for (let p of perms) {
        assign(neighbors0[0], p[0]);
        assign(neighbors0[1], p[1]);
        assign(neighbors0[2], p[2]);

        assign(opposites[neighbors0[0]], 21 - p[0]);
        assign(opposites[neighbors0[1]], 21 - p[1]);
        assign(opposites[neighbors0[2]], 21 - p[2]);

        if (recurse_fill()) return;

        unassign(neighbors0[0], opposites[neighbors0[0]]);
        unassign(neighbors0[1], opposites[neighbors0[1]]);
        unassign(neighbors0[2], opposites[neighbors0[2]]);
    }
}

function assign(face, val) {
    labels[face] = val;
    used[val] = true;
}
function unassign(face, oppFace) {
    used[labels[face]] = false; labels[face] = 0;
    used[labels[oppFace]] = false; labels[oppFace] = 0;
}

function recurse_fill() {
    if (!labels.includes(0)) {
        console.log("SOLUTION FOUND:");
        console.log("const D20_LABELS = " + JSON.stringify(labels.map(String)) + ";");
        return true;
    }

    let nextF = labels.indexOf(0);
    let oppF = opposites[nextF];

    for (let v = 1; v <= 20; v++) {
        if (!used[v]) {
            let oppV = 21 - v;
            if (used[oppV]) continue;

            assign(nextF, v);
            assign(oppF, oppV);
            if (recurse_fill()) return true;
            unassign(nextF, oppF);
        }
    }
    return false;
}

solve();
