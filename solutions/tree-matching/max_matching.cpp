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
    dp[u][0] = 0;  // u not matched
    dp[u][1] = 0;  // u matched with parent (invalid initially)
    
    int max_gain = 0;  // maximum gain from matching u with a child
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        
        // Best option for v when u is not matched
        int best_v = max(dp[v][0], dp[v][1]);
        
        // Gain from matching u with v
        int gain = (1 + dp[v][0]) - best_v;
        max_gain = max(max_gain, gain);
        
        dp[u][0] += best_v;
    }
    
    // If u matches with one of its children
    dp[u][0] = max(dp[u][0], dp[u][0] + max_gain);
    
    // If u is to be matched with parent
    dp[u][1] = 0;
    for (int v : adj[u]) {
        if (v == parent) continue;
        dp[u][1] += max(dp[v][0], dp[v][1]);
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
