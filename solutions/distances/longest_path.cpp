/*
 * Problem: Longest Path in Tree (with node weights)
 * Type: Distance DP
 * Difficulty: Medium
 * 
 * Description: 
 * Find the longest path in a tree where each node has a weight.
 * Path weight is the sum of node weights on the path.
 * 
 * Approach:
 * - Similar to tree diameter but considering node weights
 * - For each node, track the best and second-best paths to leaves
 * - Answer is the maximum sum of best two paths through any node
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
long long value[MAXN];
long long max_path = 0;
int n;

// Returns the maximum path sum going down from u
long long dfs(int u, int parent) {
    long long max1 = 0, max2 = 0;
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        
        long long path = dfs(v, u);
        
        if (path > max1) {
            max2 = max1;
            max1 = path;
        } else if (path > max2) {
            max2 = path;
        }
    }
    
    // Update answer: best path through u
    max_path = max(max_path, value[u] + max1 + max2);
    
    // Return best path from u downwards
    return value[u] + max1;
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
    
    cout << "Longest path weight: " << max_path << "\n";
    
    return 0;
}
