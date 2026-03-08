/*
 * Problem: Subtree Sum Queries
 * Type: Basic Subtree DP
 * Difficulty: Easy
 * 
 * Description: 
 * Calculate the sum of all node values in each subtree.
 * 
 * Approach:
 * - Classic bottom-up DP
 * - For each node, sum = node value + sum of all children's subtree sums
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
long long value[MAXN];
long long subtree_sum[MAXN];
int n;

void dfs(int u, int parent) {
    subtree_sum[u] = value[u];
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        subtree_sum[u] += subtree_sum[v];
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
    
    for (int i = 1; i <= n; i++) {
        cout << "Subtree sum of node " << i << ": " << subtree_sum[i] << "\n";
    }
    
    return 0;
}
