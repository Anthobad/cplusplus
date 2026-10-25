import type { ServerCodingChallenge } from './challengeRegistry.js';

const headers = `#include <algorithm>\n#include <functional>\n#include <iostream>\n#include <queue>\n#include <vector>\n`;
type Case = [input: string, expectedOutput: string];
const register = (id: string, title: string, driverCode: string, publicCases: Case[], hiddenCases: Case[]): ServerCodingChallenge => ({
  id, title, sourcePrefix: headers, alwaysUseDriver: true, driverCode, comparator: 'trimmed',
  publicTests: publicCases.map(([input, expectedOutput]) => ({ input, expectedOutput })),
  hiddenTests: hiddenCases.map(([input, expectedOutput]) => ({ input, expectedOutput, isHidden: true })),
});

const readGraph = `int n, edges; std::cin >> n >> edges;
    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < edges; ++i) {
        int from, to; std::cin >> from >> to;
        graph[from].push_back(to); graph[to].push_back(from);
    }`;

export const INTERVIEW_SERVER_CHALLENGES: Record<string, ServerCodingChallenge> = {
  'ip-binary-bound': register('ip-binary-bound', 'First element at least target', `
int main() {
    int n; std::cin >> n;
    std::vector<int> values(n);
    for (int& value : values) std::cin >> value;
    int target; std::cin >> target;
    std::cout << firstAtLeast(values, target) << '\\n';
}`, [['4 1 2 2 5 2', '1'], ['4 1 2 2 5 6', '4']],
    [['0 7', '0'], ['1 4 3', '0'], ['5 -8 -3 -3 0 9 -2', '3'], ['4 2 2 2 2 2', '0'], ['1 4 5', '1']]),
  'ip-bfs-distances': register('ip-bfs-distances', 'Unweighted shortest distances', `
int main() {
    ${readGraph}
    int source; std::cin >> source;
    auto distance = shortestDistances(graph, source);
    for (std::size_t i = 0; i < distance.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << distance[i];
    }
    std::cout << '\\n';
}`, [['5 4 0 1 0 2 1 3 2 3 0', '0 1 1 2 -1'], ['1 0 0', '0']],
    [['4 4 0 1 1 2 2 3 0 3 0', '0 1 2 1'], ['4 1 1 2 2', '-1 1 0 -1'],
      ['3 4 0 0 0 1 0 1 1 2 0', '0 1 2'], ['3 0 1', '-1 0 -1']]),
  'ip-dfs-components': register('ip-dfs-components', 'Count undirected components', `
int main() {
    ${readGraph}
    std::cout << countComponents(graph) << '\\n';
}`, [['5 3 0 1 1 2 3 4', '2'], ['0 0', '0']],
    [['4 0', '4'], ['4 5 0 1 1 2 2 0 2 2 0 1', '2'], ['1 1 0 0', '1'],
      [`1000 999 ${Array.from({ length: 999 }, (_, i) => `${i} ${i + 1}`).join(' ')}`, '1']]),
  'ip-backtracking-subsets': register('ip-backtracking-subsets', 'Generate all subsets', `
int main() {
    int n; std::cin >> n;
    std::vector<int> values(n);
    for (int& value : values) std::cin >> value;
    auto result = allSubsets(values);
    std::sort(result.begin(), result.end());
    std::cout << result.size() << '\\n';
    for (const auto& subset : result) {
        std::cout << '[';
        for (std::size_t i = 0; i < subset.size(); ++i) {
            if (i) std::cout << ',';
            std::cout << subset[i];
        }
        std::cout << "]\\n";
    }
}`, [['2 1 2', '4\n[]\n[1]\n[1,2]\n[2]'], ['0', '1\n[]']],
    [['1 7', '2\n[]\n[7]'], ['3 -2 0 5', '8\n[]\n[-2]\n[-2,0]\n[-2,0,5]\n[-2,5]\n[0]\n[0,5]\n[5]'],
      ['2 -5 -1', '4\n[]\n[-5]\n[-5,-1]\n[-1]']]),
  'ip-dp-min-coins': register('ip-dp-min-coins', 'Minimum reusable coins', `
int main() {
    int n; std::cin >> n;
    std::vector<int> coins(n);
    for (int& value : coins) std::cin >> value;
    int amount; std::cin >> amount;
    std::cout << minCoins(coins, amount) << '\\n';
}`, [['3 1 3 4 6', '2'], ['1 2 3', '-1']],
    [['0 0', '0'], ['0 9', '-1'], ['3 5 2 5 11', '4'], ['2 6 4 7', '-1'], ['1 1 1000', '1000']]),
};
