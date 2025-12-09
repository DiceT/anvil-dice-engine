// Standalone Adjacency Analyzer

// Logic from DiceForge.ts
function create_d20_geometry() {
    var t = (1 + Math.sqrt(5)) / 2;
    // Vertices from DiceForge
    var vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];

    // Faces from DiceForge
    var faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];

    return { vertices, faces };
}

function analyze() {
    const { vertices, faces } = create_d20_geometry();

    console.log(`D20: ${vertices.length} vertices, ${faces.length} faces`);

    const adj = [];
    for (let i = 0; i < faces.length; i++) {
        adj[i] = [];
        for (let j = 0; j < faces.length; j++) {
            if (i === j) continue;
            // Count shared vertices
            let shared = 0;
            for (let k = 0; k < 3; k++) {
                if (faces[j].includes(faces[i][k])) shared++;
            }
            if (shared === 2) {
                adj[i].push(j);
            }
        }
    }

    // Print Adjacency for Solver
    console.log("const adjacency = [");
    adj.forEach((neighbors, i) => {
        console.log(`  [${neighbors.join(', ')}], // Face ${i}`);
    });
    console.log("];");
}

analyze();
