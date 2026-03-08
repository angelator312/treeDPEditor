/*
 * Problem: Minimum Vertex Cover
 * Type: Multi-State Subtree DP
 * Difficulty: Medium
 * 
 * Description: 
 * Find the minimum vertex cover of a tree.
 * A vertex cover is a set of vertices such that every edge has at least one endpoint in the set.
 * 
 * Approach:
 * - dp[u][0] = minimum cover size in subtree of u when u is NOT included
 * - dp[u][1] = minimum cover size in subtree of u when u is included
 * - If u is not included, all children must be included
 * - If u is included, children can be included or not
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
int dp[MAXN][2];
int n;

void dfs(int u, int parent) {
    dp[u][0] = 0;  // u not in cover
    dp[u][1] = 1;  // u in cover
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        
        // If u is not in cover, v must be in cover
        dp[u][0] += dp[v][1];
        
        // If u is in cover, v can be in or out
        dp[u][1] += min(dp[v][0], dp[v][1]);
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
    
    dfs(1, -1);
    
    cout << "Minimum vertex cover size: " << min(dp[1][0], dp[1][1]) << "\n";
    
    return 0;
}
