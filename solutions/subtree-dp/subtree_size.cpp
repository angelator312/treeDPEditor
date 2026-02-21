/*
 * Problem: Subtree Size
 * Type: Basic Subtree DP
 * Difficulty: Easy
 * 
 * Description: 
 * Calculate the size of subtree rooted at each node.
 * 
 * Approach:
 * - Classic bottom-up DP
 * - For each node, size = 1 + sum of all children's sizes
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
int subtree_size[MAXN];
int n;

void dfs(int u, int parent) {
    subtree_size[u] = 1;
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        subtree_size[u] += subtree_size[v];
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
    
    for (int i = 1; i <= n; i++) {
        cout << "Subtree size of node " << i << ": " << subtree_size[i] << "\n";
    }
    
    return 0;
}
