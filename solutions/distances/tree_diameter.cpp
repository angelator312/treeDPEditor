/*
 * Problem: Tree Diameter
 * Type: Distance DP
 * Difficulty: Medium
 * 
 * Description: 
 * Find the diameter of a tree (longest path between any two nodes).
 * 
 * Approach:
 * - For each node, track the two longest paths going down to its subtrees
 * - The diameter passing through a node is the sum of its two longest paths
 * - The answer is the maximum diameter found at any node
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
int diameter = 0;
int n;

// Returns the height of the subtree rooted at u
int dfs(int u, int parent) {
    int max1 = 0, max2 = 0;  // Two largest heights
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        
        int height = dfs(v, u) + 1;
        
        if (height > max1) {
            max2 = max1;
            max1 = height;
        } else if (height > max2) {
            max2 = height;
        }
    }
    
    // Update diameter: max path through u is max1 + max2
    diameter = max(diameter, max1 + max2);
    
    return max1;
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
    
    cout << "Tree diameter: " << diameter << "\n";
    
    return 0;
}
