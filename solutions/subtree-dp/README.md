# Subtree DP Solutions

Classic bottom-up tree DP problems where we compute values for each node based on its children.

## Common Patterns

1. **Basic Subtree DP**
   ```cpp
   void dfs(int u, int p) {
       dp[u] = base_value;
       for (int v : adj[u]) {
           if (v == p) continue;
           dfs(v, u);
           dp[u] = combine(dp[u], dp[v]);
       }
   }
   ```

2. **Multi-State DP**
   ```cpp
   void dfs(int u, int p) {
       dp[u][0] = ...; // state 0
       dp[u][1] = ...; // state 1
       for (int v : adj[u]) {
           if (v == p) continue;
           dfs(v, u);
           // transition logic
       }
   }
   ```

## Problems

- Add your solutions here
