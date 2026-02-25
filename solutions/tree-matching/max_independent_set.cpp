/*
 * Problem: Maximum Independent Set
 * Type: Multi-State Subtree DP
 * Difficulty: Medium
 * 
 * Description: 
 * Find the maximum weight independent set in a tree.
 * An independent set is a set of vertices with no edges between them.
 * 
 * Approach:
 * - dp[u][0] = maximum value in subtree of u when u is NOT included
 * - dp[u][1] = maximum value in subtree of u when u is included
 * - If u is included, children cannot be included
 * - If u is not included, children can be included or not
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
long long dp[MAXN][2];
long long value[MAXN];
int n;

void dfs(int u, int parent) {
    dp[u][0] = 0;            // u not taken
    dp[u][1] = value[u];     // u taken
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        
        // If u is not taken, we can take v or not
        dp[u][0] += max(dp[v][0], dp[v][1]);
        
        // If u is taken, we cannot take v
        dp[u][1] += dp[v][0];
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cin >> n;
    
    for (int i = 1; i <= n; i++) {
        cin >> value[i];
    }
    
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    
    dfs(1, -1);
    
    cout << max(dp[1][0], dp[1][1]) << "\n";
    
    return 0;
}
