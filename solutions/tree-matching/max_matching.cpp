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
 * - dp[u][0] = max matching in subtree of u where u is not matched
 * - dp[u][1] = max matching in subtree of u where u is matched with its parent
 * - For each child, we can either match it with u or not
 * - Complex transition considering all combinations
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
    vector<int> children;
    for (int v : adj[u]) {
        if (v != parent) {
            dfs(v, u);
            children.push_back(v);
        }
    }
    
    // dp[u][0]: u is not matched
    // dp[u][1]: u is matched (with parent or a child)
    
    // If u is not matched, each child can be matched or not
    dp[u][0] = 0;
    for (int v : children) {
        dp[u][0] += max(dp[v][0], dp[v][1]);
    }
    
    // If u is matched with parent, children are free
    dp[u][1] = 0;
    for (int v : children) {
        dp[u][1] += max(dp[v][0], dp[v][1]);
    }
    
    // Try matching u with each child
    for (int v : children) {
        // Match u with v: gain = 1 + dp[v][0] + sum of other children's best
        int matching_gain = 1 + dp[v][0];
        for (int w : children) {
            if (w != v) {
                matching_gain += max(dp[w][0], dp[w][1]);
            }
        }
        dp[u][0] = max(dp[u][0], matching_gain);
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
