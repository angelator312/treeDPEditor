/*
 * Problem: Maximum Matching on Tree
 * Type: Multi-State Subtree DP
 * Difficulty: Hard
 * 
 * Description: 
 * Find the maximum matching in a tree.
 * A matching is a set of edges with no common vertices.
 * 
 * Approach:
 * - dp[u][0] = max matching in subtree of u where edge (u, parent) is NOT in the matching
 * - dp[u][1] = max matching in subtree of u where edge (u, parent) IS in the matching
 * - When computing dp[u][0], u can either:
 *   1. Not be matched at all (children use dp[v][0])
 *   2. Be matched with one child v (use 1 + dp[v][1] + sum of dp[w][0] for other children)
 * - When computing dp[u][1], u is matched with parent, so children cannot match with u
 * 
 * Time Complexity: O(n) with optimization
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
int dp[MAXN][2];
int n;

void dfs(int u, int parent) {
    vector<int> children;
    for (int v : adj[u]) {
        if (v != parent) {
            dfs(v, u);
            children.push_back(v);
        }
    }
    
    // dp[u][0]: edge (u, parent) is NOT in the matching
    // Start by not matching u with any child - all children use dp[v][0]
    dp[u][0] = 0;
    for (int v : children) {
        dp[u][0] += dp[v][0];
    }
    
    // Try matching u with each child (O(n) optimization)
    int sum_dp0 = dp[u][0];  // Sum of all dp[v][0]
    for (int v : children) {
        // Match u with v: we get 1 edge + dp[v][1] + (sum of other children's dp[w][0])
        int matching_value = 1 + dp[v][1] + (sum_dp0 - dp[v][0]);
        dp[u][0] = max(dp[u][0], matching_value);
    }
    
    // dp[u][1]: edge (u, parent) IS in the matching
    // All children must not be matched with u, so they use dp[v][0]
    dp[u][1] = sum_dp0;
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
    
    cout << "Maximum matching size: " << dp[1][0] << "\n";
    
    return 0;
}
