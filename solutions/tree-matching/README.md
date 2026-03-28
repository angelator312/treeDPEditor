# Tree Matching and Independent Set Solutions

Problems involving matchings, independent sets, and vertex covers on trees.

## Common Problems

1. **Maximum Independent Set**: Select maximum nodes such that no two are adjacent
2. **Minimum Vertex Cover**: Select minimum nodes such that every edge has at least one endpoint selected
3. **Maximum Matching**: Select maximum edges such that no two share a vertex

## Patterns

### Independent Set DP
```cpp
void dfs(int u, int p) {
    dp[u][0] = 0; // u not taken
    dp[u][1] = value[u]; // u taken
    
    for (int v : adj[u]) {
        if (v == p) continue;
        dfs(v, u);
        dp[u][0] += max(dp[v][0], dp[v][1]);
        dp[u][1] += dp[v][0];
    }
}
```

### Maximum Matching DP
```cpp
void dfs(int u, int p) {
    dp[u][0] = 0; // u not matched with parent
    dp[u][1] = 0; // u matched with parent
    
    for (int v : adj[u]) {
        if (v == p) continue;
        dfs(v, u);
        // Complex transition logic
    }
}
```

## Problems

- Add your solutions here
