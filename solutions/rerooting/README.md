# Rerooting (All Roots DP) Solutions

Rerooting technique to compute the answer for every possible root efficiently.

## Technique Overview

The rerooting technique uses two DFS passes:

1. **First DFS (Bottom-Up)**: Compute subtree information assuming each node's parent is the root
2. **Second DFS (Top-Down)**: Combine subtree info with parent information to get answer for each node as root

## Template

```cpp
// First DFS: compute subtree values
void dfs1(int u, int p) {
    subtree[u] = base_value;
    for (int v : adj[u]) {
        if (v == p) continue;
        dfs1(v, u);
        subtree[u] = combine(subtree[u], subtree[v]);
    }
}

// Second DFS: compute answer for all roots
void dfs2(int u, int p, int parent_contribution) {
    answer[u] = combine(subtree[u], parent_contribution);
    
    for (int v : adj[u]) {
        if (v == p) continue;
        // Remove v's contribution from u's subtree
        int without_v = remove(subtree[u], subtree[v]);
        // Pass it to child
        dfs2(v, u, combine(without_v, parent_contribution));
    }
}
```

## Common Applications

- Sum of distances from all nodes to all other nodes
- Tree diameter/center
- Maximum subtree size for each node as root

## Problems

- Add your solutions here
