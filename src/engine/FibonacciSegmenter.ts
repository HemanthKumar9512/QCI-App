// Fibonacci Spiral Customer Clustering with PCA
const PHI = 1.618033988749895;

function powerIteration(matrix: number[][], dims: number, iterations = 50): number[][] {
  const eigenvectors: number[][] = [];
  const mat = matrix.map(r => [...r]);
  
  for (let ev = 0; ev < dims; ev++) {
    let v = Array.from({ length: mat.length }, () => Math.random());
    for (let iter = 0; iter < iterations; iter++) {
      const mv = mat.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
      const norm = Math.sqrt(mv.reduce((s, x) => s + x * x, 0)) || 1;
      v = mv.map(x => x / norm);
    }
    eigenvectors.push(v);
    // Deflate
    const lambda = v.reduce((s, _, i) => s + mat[i].reduce((ss, val, j) => ss + val * v[j], 0) * v[i], 0);
    for (let i = 0; i < mat.length; i++)
      for (let j = 0; j < mat.length; j++)
        mat[i][j] -= lambda * v[i] * v[j];
  }
  return eigenvectors;
}

export function fibonacciCluster(features: number[][]): { cluster: number; radius: number; coords: [number, number] }[] {
  if (features.length === 0) return [];
  const n = features.length;
  const d = features[0].length;
  
  // Compute mean
  const mean = Array(d).fill(0);
  features.forEach(f => f.forEach((v, i) => mean[i] += v));
  mean.forEach((_, i) => mean[i] /= n);
  
  // Center data
  const centered = features.map(f => f.map((v, i) => v - mean[i]));
  
  // Covariance matrix
  const cov: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  for (const row of centered)
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++)
        cov[i][j] += row[i] * row[j] / n;
  
  // PCA: get 2 principal components
  const eigvecs = powerIteration(cov, 2);
  
  // Project to 2D
  const projected = centered.map(row => [
    row.reduce((s, v, i) => s + v * (eigvecs[0]?.[i] || 0), 0),
    row.reduce((s, v, i) => s + v * (eigvecs[1]?.[i] || 0), 0),
  ] as [number, number]);
  
  // Fibonacci arc radii
  const arcRadii: number[] = [];
  for (let i = 0; i < 9; i++) {
    arcRadii.push(Math.pow(PHI, i) / Math.sqrt(5));
  }
  
  // Assign clusters
  return projected.map(([x, y]) => {
    const r = Math.sqrt(x * x + y * y);
    let cluster = 0;
    for (let i = 0; i < arcRadii.length; i++) {
      if (r <= arcRadii[i]) { cluster = i; break; }
      cluster = i;
    }
    return { cluster, radius: arcRadii[cluster], coords: [x, y] };
  });
}
