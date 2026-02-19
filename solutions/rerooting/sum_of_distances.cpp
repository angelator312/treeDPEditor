/*
 * Problem: Sum of Distances (All Pairs)
 * Type: Rerooting DP
 * Difficulty: Hard
 * 
 * Description: 
 * For each node, find the sum of distances to all other nodes.
 * 
 * Approach:
 * - First DFS: compute subtree sizes and sum of distances assuming node 1 is root
 * - Second DFS: use rerooting to compute answer for each node as root
 * - When moving root from u to v:
 *   - size[v] nodes become closer by 1
 *   - (n - size[v]) nodes become farther by 1
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
long long subtree_size[MAXN];
long long dist_sum[MAXN];
long long ans[MAXN];
int n;

// First DFS: compute subtree sizes and distance sums
void dfs1(int u, int parent) {
    subtree_size[u] = 1;
    dist_sum[u] = 0;
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs1(v, u);
        
        subtree_size[u] += subtree_size[v];
        dist_sum[u] += dist_sum[v] + subtree_size[v];
    }
}

// Second DFS: reroot to compute answer for all nodes
void dfs2(int u, int parent) {
    for (int v : adj[u]) {
        if (v == parent) continue;
        
        // Move root from u to v
        // - subtree_size[v] nodes get 1 closer
        // - (n - subtree_size[v]) nodes get 1 farther
        ans[v] = ans[u] - subtree_size[v] + (n - subtree_size[v]);
        
        dfs2(v, u);
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cin >> n;
    
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    
    dfs1(1, -1);
    ans[1] = dist_sum[1];
    dfs2(1, -1);
    
    for (int i = 1; i <= n; i++) {
        cout << "Sum of distances from node " << i << ": " << ans[i] << "\n";
    }
    
    return 0;
}
