#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

struct Job {
    int id;
    int deadline;
    int profit;
};

bool compareProfit(Job a, Job b) {
    return a.profit > b.profit;
}

struct Node {
    int parent;
    int depth;
    int smallest;
};

vector<Node> U;

void makeSet(int i) {
    U[i].parent = i;
    U[i].depth = 0;
    U[i].smallest = i;
}

int find(int i) {
    while (U[i].parent != i) {
        i = U[i].parent;
    }

    return i;
}

void merge(int p, int q) {
    if (U[p].depth == U[q].depth) {
        U[p].depth++;
        U[q].parent = p;

        if (U[q].smallest < U[p].smallest) {
            U[p].smallest = U[q].smallest;
        }
    }
    else if (U[p].depth < U[q].depth) {
        U[p].parent = q;

        if (U[p].smallest < U[q].smallest) {
            U[q].smallest = U[p].smallest;
        }
    }
    else {
        U[q].parent = p;

        if (U[q].smallest < U[p].smallest) {
            U[p].smallest = U[q].smallest;
        }
    }
}

int small(int p) {
    return U[p].smallest;
}

void schedule(vector<Job>& jobs, vector<Job>& S) {
    int d = 0;
    for (auto& job : jobs) {
        d = max(d, job.deadline);
    }

    U.resize(d + 1);
    S.resize(d);

    for (int i = 0; i <= d; i++) {
        makeSet(i);
    }

    for (auto& job : jobs) {
        int root = find(job.deadline);
        int slot = small(root);

        if (slot == 0) {
            continue;
        }

        S[slot - 1] = job;
        merge(find(slot), find(slot - 1));
    }
}

int main() {
    vector<Job> jobs = {
        {1, 2, 40},
        {2, 4, 15},
        {3, 3, 60},
        {4, 2, 20},
        {5, 3, 10},
        {6, 1, 45},
        {7, 1, 55}
    };

    sort(jobs.begin(), jobs.end(), compareProfit);

    vector<Job> S;

    schedule(jobs, S);

    int totalProfit = 0;

    cout << "Scheduled Jobs:\n";

    for (auto& job : S) {
        if (job.id == -1) {
            continue;
        }

        cout
            << "Job ID: " << job.id << "\t"
            << "Deadline: " << job.deadline << "\t"
            << "Profit: " << job.profit << '\n';

        totalProfit += job.profit;
    }

    cout << "Total Profit: " << totalProfit;

    return 0;
}
