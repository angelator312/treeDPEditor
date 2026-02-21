/*
 * Problem: Tree Coloring (Binary)
 * Type: Multi-State Subtree DP
 * Difficulty: Medium
 * 
 * Description: 
 * Color the tree with 2 colors such that no two adjacent nodes have the same color.
 * Each color choice has a cost. Minimize the total cost.
 * 
 * Approach:
 * - dp[u][c] = minimum cost to color subtree of u when u has color c
 * - If u has color c, all children must have color 1-c
 * - Try all combinations and pick the best
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
const long long INF = 1e18;
vector<int> adj[MAXN];
long long cost[MAXN][2];  // cost[i][c] = cost to color node i with color c
long long dp[MAXN][2];    // dp[i][c] = min cost to color subtree i with node i having color c
int n;

void dfs(int u, int parent) {
    // Initialize with the cost of coloring u
    dp[u][0] = cost[u][0];
    dp[u][1] = cost[u][1];
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        
        // If u is color 0, v must be color 1
        dp[u][0] += dp[v][1];
        
        // If u is color 1, v must be color 0
        dp[u][1] += dp[v][0];
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cin >> n;
    
    for (int i = 1; i <= n; i++) {
        cin >> cost[i][0] >> cost[i][1];
    }
    
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    
    dfs(1, -1);
    
    cout << "Minimum coloring cost: " << min(dp[1][0], dp[1][1]) << "\n";
    
    return 0;
}
