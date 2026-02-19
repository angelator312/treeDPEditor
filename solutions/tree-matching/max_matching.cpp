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
 * - dp[u][0] = max matching in subtree of u where u is not matched with any edge
 * - dp[u][1] = max matching in subtree of u where u is matched with parent edge
 * - When u is not matched, we can either match it with a child or leave it unmatched
 * - When u is matched with parent, children must use dp[v][0] (not matched with u)
 * 
 * Time Complexity: O(n^2) or O(n) with optimization
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
    
    // dp[u][0]: u is not matched with any edge
    // Start by not matching u with any child
    dp[u][0] = 0;
    for (int v : children) {
        // Child v can be unmatched or matched with one of its children
        dp[u][0] += dp[v][0];
    }
    
    // Try matching u with each child
    for (int v : children) {
        // Match u with v: we get 1 edge, v uses dp[v][1] (matched with parent=u)
        int matching_value = 1 + dp[v][1];
        // Other children use dp[w][0] (not matched with u)
        for (int w : children) {
            if (w != v) {
                matching_value += dp[w][0];
            }
        }
        dp[u][0] = max(dp[u][0], matching_value);
    }
    
    // dp[u][1]: u is matched with its parent edge
    // All children must not be matched with u
    dp[u][1] = 0;
    for (int v : children) {
        dp[u][1] += dp[v][0];
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
    
    cout << "Maximum matching size: " << dp[1][0] << "\n";
    
    return 0;
}
