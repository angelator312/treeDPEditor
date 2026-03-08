# Distance-Related Tree DP Solutions

Problems involving distances, paths, and sum calculations on trees.

## Common Problems

1. **Sum of Distances**: Compute sum of distances from each node to all others
2. **Tree Diameter**: Find the longest path in the tree
3. **K-th Distance Queries**: Count nodes at distance K from given node

## Patterns

### Sum of Distances (Rerooting)
```cpp
// First pass: compute subtree sizes and distances
void dfs1(int u, int p) {
    size[u] = 1;
    dist_sum[u] = 0;
    for (int v : adj[u]) {
        if (v == p) continue;
        dfs1(v, u);
        size[u] += size[v];
        dist_sum[u] += dist_sum[v] + size[v];
    }
}

// Second pass: reroot
void dfs2(int u, int p) {
    for (int v : adj[u]) {
        if (v == p) continue;
        // When moving root from u to v:
        // - size[v] nodes get 1 closer
        // - (n - size[v]) nodes get 1 farther
        ans[v] = ans[u] - size[v] + (n - size[v]);
        dfs2(v, u);
    }
}
```

### Tree Diameter
```cpp
int diameter = 0;

int dfs(int u, int p) {
    int max1 = 0, max2 = 0;
    for (int v : adj[u]) {
        if (v == p) continue;
        int h = dfs(v, u) + 1;
        if (h > max1) max2 = max1, max1 = h;
        else if (h > max2) max2 = h;
    }
    diameter = max(diameter, max1 + max2);
    return max1;
}
```

## Problems

- Add your solutions here
