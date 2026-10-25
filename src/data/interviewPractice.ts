import type { CodingChallenge } from '../types';

export interface InterviewPracticeLesson {
  id: string;
  title: string;
  prerequisites: string;
  recognize: string;
  explanation: string;
  walkthrough: string;
  pitfalls: string;
  complexity: string;
  transfer: string;
  challenge: CodingChallenge;
}

const challenge = (id: string, title: string, signature: string, expectedBehavior: string,
  solutionCode: string, hints: string[], testCases: CodingChallenge['testCases'],
  constraints: string[]): CodingChallenge => ({
  id, title, difficulty: 'Medium', category: 'algorithm', expectedBehavior,
  description: `${expectedBehavior}\n\nSubmit the function only, with the exact signature in the starter. Do not define main; the evaluator provides it. Standard algorithm, vector, queue and functional headers are provided.`,
  initialCode: `${signature} {\n    // Implement the function.\n}\n`,
  solutionCode, hints, testCases, constraints,
});

export const INTERVIEW_PRACTICE: InterviewPracticeLesson[] = [
  {
    id: 'interview-binary-search', title: 'Binary search: find the first valid position',
    prerequisites: 'Topics 8–9 (loops/functions), 19 (vector), 34 (complexity), and 38 (binary search).',
    recognize: 'A sorted range, or a predicate that changes once from false to true. Ask for the first position satisfying a condition rather than only searching for an exact match.',
    explanation: 'An invariant is a fact you keep true after every loop step. Use a half-open candidate range [lo, hi): lo is included, hi is excluded. Initially lo = 0 and hi = n. Every position before lo is known to be too small; every position at or after hi is known to satisfy the condition. hi may equal n, a sentinel meaning “no array position remains”; do not read values[n].\n\nChoose mid = lo + (hi - lo) / 2. If values[mid] < target, sortedness proves that mid and all earlier positions cannot be the answer, so set lo = mid + 1. Otherwise mid might be the first valid position, so keep it by setting hi = mid. Each update reduces hi - lo. When lo equals hi, the boundary has been found. Return n when every element is smaller than target.\n\nThis is a lower-bound pattern. It handles absent targets and duplicates without special equality returns. The same reasoning can find the minimum feasible capacity when feasibility changes monotonically. You must prove that monotonicity; an arbitrary predicate cannot be binary-searched.',
    walkthrough: 'For [1, 2, 2, 5] and target 2: [lo, hi) = [0, 4), mid = 2, value 2 is sufficient → hi = 2. Now [0, 2), mid = 1, value 2 is sufficient → hi = 1. Now [0, 1), mid = 0, value 1 is too small → lo = 1. Stop at 1, the first matching position. An immediate return at the first equality would incorrectly return 2. For target 6, every probe is too small and the final result is 4.',
    pitfalls: 'An unsorted input breaks the elimination proof. Mixing inclusive and half-open bounds can skip answers or loop forever. Keep mid when it satisfies the condition; discard it with mid + 1 only when it is too small. Check the returned position before dereferencing it. Compute the midpoint by subtraction to avoid overflowing lo + hi within the stated index range.',
    complexity: 'O(log n) comparisons/time for a vector and O(1) auxiliary space. A linear scan may return correct answers but does not meet the interview complexity goal; passing finite tests alone does not certify complexity.',
    transfer: 'Change the predicate to values[mid] > target to find the first strictly greater value. Explain how subtracting lower bound from upper bound counts duplicates. For “minimum feasible capacity,” state what false and true mean before writing the loop.',
    challenge: challenge('ip-binary-bound', 'First element at least target',
      'int firstAtLeast(const std::vector<int>& values, int target)',
      'Return the first index i for which values[i] >= target, or values.size() when none exists. The vector is sorted in nondecreasing order; duplicates and an empty vector are allowed.',
      `int firstAtLeast(const std::vector<int>& values, int target) {
    int lo = 0, hi = static_cast<int>(values.size());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (values[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
      ['Write the meaning of [lo, hi) before choosing updates.', 'Equality may have an earlier duplicate: move hi to mid.', 'Return lo even when it equals values.size().'],
      [{ input: '4 1 2 2 5 2', expectedOutput: '1' }, { input: '4 1 2 2 5 6', expectedOutput: '4' }],
      ['0 <= n <= 10000; values and target are within [-1000000, 1000000].', 'Input format shown in examples: n, n sorted values, target.']),
  },
  {
    id: 'interview-bfs', title: 'BFS: shortest paths in an unweighted graph',
    prerequisites: 'Topics 8–9 (loops/functions), 19 (vector), 23 (queue), and 26 (graphs).',
    recognize: 'Minimum number of edges or moves when every edge has the same cost. Model states as vertices and legal transitions as edges.',
    explanation: 'A graph connects vertices through edges. An adjacency list stores the neighbors of each vertex. Breadth-first search (BFS) explores in layers: first the source, then all vertices one edge away, then two edges away. A FIFO queue removes items in the order they were inserted, which preserves these layers.\n\nInitialize all distances to -1, meaning undiscovered, set the source distance to 0 and enqueue it. Repeatedly remove the queue front. For each undiscovered neighbor, set its distance to the current vertex’s distance plus one and immediately enqueue it. Mark discovery at insertion time, not later when removing it: two parents should not repeatedly enqueue the same vertex. Stop when the queue is empty. Unreachable vertices keep -1.\n\nWhy is the first distance shortest? When processing distance d, every earlier layer has already been processed. A shorter route to a newly discovered neighbor would have come from an earlier layer and discovered it already. This argument uses equal edge costs; for general nonnegative weights, ordinary BFS is not a shortest-path algorithm.',
    walkthrough: 'Take vertices 0–4 with undirected edges 0–1, 0–2, 1–3, 2–3; vertex 4 is isolated. Start at 0: distances [0,-1,-1,-1,-1], queue [0]. Pop 0: discover 1 and 2 at distance 1, queue [1,2]. Pop 1: discover 3 at distance 2, queue [2,3]. Pop 2: 3 is already discovered, so leave it alone. Pop 3: no new vertices. Final distances are [0,1,1,2,-1]. Neighbor order can change the queue within a layer but not these shortest distances.',
    pitfalls: 'Use a visited/distance check for cycles, self-loops and duplicate edges. Marking only on removal can duplicate work. A stack gives depth-first traversal and does not establish shortest unweighted distances. One BFS from a source intentionally leaves disconnected vertices undiscovered.',
    complexity: 'O(V + E) time and O(V) auxiliary space for distances and the queue. An undirected edge appears in two adjacency lists, which changes a constant factor rather than the complexity.',
    transfer: 'For a grid, identify each cell as a vertex and valid adjacent moves as edges. To reconstruct a shortest path, store a parent when discovering each vertex. For several starting vertices, initialize every source to distance zero and enqueue all of them.',
    challenge: challenge('ip-bfs-distances', 'Unweighted shortest distances',
      'std::vector<int> shortestDistances(const std::vector<std::vector<int>>& graph, int source)',
      'Return one distance per vertex in an undirected, unweighted graph, using -1 for unreachable vertices. source is valid. Do not mutate graph.',
      `std::vector<int> shortestDistances(const std::vector<std::vector<int>>& graph, int source) {
    std::vector<int> distance(graph.size(), -1);
    std::queue<int> pending;
    distance[source] = 0;
    pending.push(source);
    while (!pending.empty()) {
        int vertex = pending.front();
        pending.pop();
        for (int next : graph[vertex]) {
            if (distance[next] == -1) {
                distance[next] = distance[vertex] + 1;
                pending.push(next);
            }
        }
    }
    return distance;
}`,
      ['Use -1 both as the undiscovered marker and unreachable result.', 'Set a neighbor’s distance before putting it in the queue.', 'Process a FIFO queue until no vertices remain.'],
      [{ input: '5 4 0 1 0 2 1 3 2 3 0', expectedOutput: '0 1 1 2 -1' }, { input: '1 0 0', expectedOutput: '0' }],
      ['1 <= V <= 1000; 0 <= E <= 5000; vertices are numbered 0 through V-1.', 'Input format: V E, E pairs of endpoints, source. Self-loops and duplicate edges are allowed.']),
  },
  {
    id: 'interview-dfs', title: 'DFS: explore connected components',
    prerequisites: 'Topics 8–9 (loops/functions), 19 (vector), 23 (stack), and 26 (graphs).',
    recognize: 'Reachability, grouping connected vertices, or exploring all vertices in one region. A connected component is a maximal group linked by paths in an undirected graph.',
    explanation: 'Depth-first search (DFS) follows a branch before returning to other choices. A stack implements that order: the most recently added vertex is explored next. You can use a vector as a stack with push_back, back and pop_back. Recursive function calls provide another stack, but a very deep graph can exhaust call storage; an explicit stack makes that storage visible.\n\nTo count components, begin with no visited vertices and count zero. Scan every vertex. If the vertex is unvisited, it belongs to a component not counted yet: increment the count, mark it and traverse every vertex reachable from it. Mark each neighbor when pushing it so cycles do not generate repeated work. When the stack becomes empty, that component is finished. Resume the outer scan to find the next unvisited component. An isolated vertex counts as a component; an empty graph has zero.\n\nThe invariant is that every marked vertex belongs to a component whose exploration has started. A finished exploration has marked all reachable vertices, so a later unvisited starting vertex cannot belong to an already counted component. This is an undirected connectivity task. Directed strongly connected components need different reasoning and algorithms.',
    walkthrough: 'For vertices 0–4 and edges 0–1, 1–2, 3–4: start at 0, count = 1. The stack explores and marks 0, 1 and 2. The outer scan skips 1 and 2 because they are visited. Vertex 3 is unvisited, so count = 2; its traversal also marks 4. The scan ends at count 2. Add isolated vertex 5 and the count becomes 3. Adding a cycle inside the first group does not create another component.',
    pitfalls: 'A single DFS counts only one reachable region. Keep the outer loop over every vertex. Mark discoveries before pushing to avoid revisiting cycles. Recursion depth can be linear in the number of vertices. DFS tree depth is not generally a shortest-path distance.',
    complexity: 'O(V + E) time and O(V) auxiliary space for the visited flags and stack. Every vertex is pushed once when marked; each adjacency list is scanned once.',
    transfer: 'Count islands in a grid by starting a traversal from each unvisited land cell. State whether diagonal cells count as adjacent. Compare BFS and DFS: either can find undirected components, but BFS additionally supplies shortest unweighted distances.',
    challenge: challenge('ip-dfs-components', 'Count undirected components',
      'int countComponents(const std::vector<std::vector<int>>& graph)',
      'Return the number of connected components in an undirected graph. Isolated vertices count individually. An empty graph has zero components. Do not mutate graph.',
      `int countComponents(const std::vector<std::vector<int>>& graph) {
    std::vector<bool> visited(graph.size(), false);
    int components = 0;
    for (int start = 0; start < static_cast<int>(graph.size()); ++start) {
        if (visited[start]) continue;
        ++components;
        std::vector<int> pending{start};
        visited[start] = true;
        while (!pending.empty()) {
            int vertex = pending.back();
            pending.pop_back();
            for (int next : graph[vertex]) {
                if (!visited[next]) {
                    visited[next] = true;
                    pending.push_back(next);
                }
            }
        }
    }
    return components;
}`,
      ['The outer loop must consider even vertices with no edges.', 'Increment the component count only when starting from an unvisited vertex.', 'Use a stack and mark each vertex as soon as you push it.'],
      [{ input: '5 3 0 1 1 2 3 4', expectedOutput: '2' }, { input: '0 0', expectedOutput: '0' }],
      ['0 <= V <= 1000; 0 <= E <= 5000; vertices are numbered 0 through V-1.', 'Input format: V E, then E pairs of endpoints. Self-loops and duplicate edges are allowed.']),
  },
  {
    id: 'interview-backtracking', title: 'Backtracking: choose, explore, undo',
    prerequisites: 'Topics 9 (functions), 19 (vector), and 39 (recursion).',
    recognize: 'Enumerate combinations, subsets, or arrangements where each partial choice leads to smaller choices. Expect output-sensitive or exponential work when the requested answer itself is large.',
    explanation: 'Backtracking explores a decision tree while keeping the current partial answer. For subsets of distinct input values, each index offers two choices: exclude this value, or include it. A recursive call handles the remaining indexes. A base case stops recursion when index equals the input length and copies the current subset into the result.\n\nTo include a value, push it into the path, recursively explore the remaining decisions, then pop it. This undo step restores exactly the state that existed before this branch. Sibling branches must not inherit each other’s choices. Excluding a value leaves the path unchanged. Every root-to-leaf path makes one decision for each index, so it represents exactly one subset.\n\nA recursive call gets its own index parameter, but a path captured by reference is shared mutable state. That is why increasing the index needs no explicit undo while push_back does. Store a value copy of the path in the result, not a reference to a buffer that will keep changing. Pruning skips branches that cannot satisfy a constraint; it is useful only when that impossibility is justified.',
    walkthrough: 'For [1, 2], begin with empty path. Exclude 1, exclude 2 → save []. Return, include 2 → save [2], then pop 2. Return to the first decision, include 1 → path [1]. Exclude 2 → save [1]. Include 2 → save [1,2], then pop 2. Finally pop 1. The four leaves produce four subsets. The empty input still has one subset: the empty set.',
    pitfalls: 'Missing the base case causes unbounded recursion; failing to advance the index repeats the same problem. Forgetting pop_back leaks choices into sibling branches. Distinct input values avoid duplicate subsets here; duplicate inputs require a deliberate deduplication policy. Order of returned subsets is not important for this contract, but values inside each subset must follow input order.',
    complexity: 'There are 2^n subsets. Copying their elements costs O(n · 2^n) time and output storage in the worst case. Excluding returned output, the recursion and current path use O(n) auxiliary space. Calling this O(n) total space would hide the dominant output cost.',
    transfer: 'For combinations of size k, stop with a saved answer when path.size() == k and prune when too few values remain. For permutations, track used positions rather than making a single include/exclude decision per input index. Explain how you restore that tracking state.',
    challenge: challenge('ip-backtracking-subsets', 'Generate all subsets',
      'std::vector<std::vector<int>> allSubsets(const std::vector<int>& values)',
      'Return every subset exactly once, including the empty subset. Input values are distinct and increasing. Preserve that order inside each subset; the outer result may use any order. For empty input return a result containing one empty vector.',
      `std::vector<std::vector<int>> allSubsets(const std::vector<int>& values) {
    std::vector<std::vector<int>> result;
    std::vector<int> path;
    std::function<void(int)> visit = [&](int index) {
        if (index == static_cast<int>(values.size())) {
            result.push_back(path);
            return;
        }
        visit(index + 1);
        path.push_back(values[index]);
        visit(index + 1);
        path.pop_back();
    };
    visit(0);
    return result;
}`,
      ['The base case saves a copy even when path is empty.', 'Explore both excluding and including values[index].', 'Undo the include with pop_back after its recursive call returns.'],
      [{ input: '2 1 2', expectedOutput: '4\n[]\n[1]\n[1,2]\n[2]' }, { input: '0', expectedOutput: '1\n[]' }],
      ['0 <= n <= 12; distinct increasing values within [-100, 100].', 'Input format: n, then n values. The driver sorts only the outer result lexicographically and prints count then each subset.']),
  },
  {
    id: 'interview-dp', title: 'Dynamic programming: define a state and reuse it',
    prerequisites: 'Topics 8–9 (loops/functions), 19 (vector), 34 (complexity), and 39 (recursion).',
    recognize: 'An optimization/counting problem revisits the same smaller problems, and the state contains enough information to combine their answers. Start from a brute-force recurrence before choosing a table.',
    explanation: 'For minimum coin count, denominations can be reused. Greedily taking the largest coin is not generally optimal: coins [1,3,4] for amount 6 give 4+1+1 (three coins), but 3+3 needs only two. Instead define dp[a] as the fewest coins needed to make amount a. This state definition specifies one answer for each smaller amount.\n\nThe base case is dp[0] = 0: making zero needs no coins. All other states begin unreachable. For every positive coin c <= a, a solution ending with c consists of an optimal solution for a-c plus one coin. Take the minimum of dp[a-c] + 1 over reachable predecessors. If no predecessor is reachable, a stays unreachable. Every optimal solution has a last coin, so considering every possible last coin does not omit a better answer.\n\nFill amounts from 1 upward. Because coins are positive, every dependency a-c is smaller and has already been computed. A sentinel amount+1 is larger than any possible number of coins needed for a reachable target under positive integer denominations; avoid adding to an unreachable state. Return -1 if the target stays unreachable.\n\nTabulation computes this table iteratively. Memoization instead caches answers while evaluating a recursive recurrence on demand. Both reuse states rather than repeating the same work. For a different problem, the state may need an item index or remaining capacity as well as an amount. If each coin could be used only once, this recurrence would not describe that restriction.',
    walkthrough: 'With coins [1,3,4] and target 6: dp[0]=0. dp[1]=1 using 1; dp[2]=2 using 1+1; dp[3]=1 using 3; dp[4]=1 using 4; dp[5]=2 using 4+1; dp[6]=min(dp[5]+1, dp[3]+1, dp[2]+1)=min(3,2,3)=2. With coins [2] and target 3, dp[1] is unreachable, dp[2]=1, and dp[3] stays unreachable. With target zero, the answer is zero even if there are no coins.',
    pitfalls: 'Do not initialize all states to zero: that would falsely make every amount free to form. Reject zero/negative coin values in a broader API, because they break the decreasing-state argument; this challenge guarantees positive coins. A greedy result passing some examples does not prove it optimal. Separate the number of ways from the minimum number of coins: they need different transitions.',
    complexity: 'For A = amount and C denominations, O(A · C) time and O(A) auxiliary space. These are numeric-amount bounds, not polynomial bounds in the number of bits needed to encode A (the algorithm is pseudo-polynomial).',
    transfer: 'Explain how storing the chosen last coin at each reachable amount would reconstruct a solution. For counting ways, decide whether coin order matters before choosing loop order. For 0/1 item selection, explain why an item cannot be reused within its own update.',
    challenge: challenge('ip-dp-min-coins', 'Minimum reusable coins',
      'int minCoins(const std::vector<int>& coins, int amount)',
      'Return the minimum number of coins summing to amount, or -1 when impossible. Each positive denomination can be used any number of times. Zero amount needs zero coins, including when coins is empty.',
      `int minCoins(const std::vector<int>& coins, int amount) {
    const int unreachable = amount + 1;
    std::vector<int> dp(amount + 1, unreachable);
    dp[0] = 0;
    for (int value = 1; value <= amount; ++value) {
        for (int coin : coins) {
            if (coin <= value && dp[value - coin] != unreachable) {
                dp[value] = std::min(dp[value], dp[value - coin] + 1);
            }
        }
    }
    return dp[amount] == unreachable ? -1 : dp[amount];
}`,
      ['Give dp[a] a precise meaning before writing loops.', 'Initialize only dp[0] to zero; other states start unreachable.', 'Try every possible last coin, using only reachable smaller amounts.'],
      [{ input: '3 1 3 4 6', expectedOutput: '2' }, { input: '1 2 3', expectedOutput: '-1' }],
      ['0 <= C <= 12; 1 <= coin <= 100; 0 <= amount <= 1000; repeated denominations are allowed.', 'Input format: C, C denomination values, amount.']),
  },
];
