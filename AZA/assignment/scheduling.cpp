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

bool compareDeadline(Job a, Job b) {
    return a.deadline < b.deadline;
}

bool isFeasible(vector<Job>& K) {
    sort(K.begin(), K.end(), compareDeadline);

    for (int i = 0; i < K.size(); i++) {
        int timeUnit = i + 1;

        if (timeUnit > K[i].deadline) {
            return false;
        }
    }

    return true;
}

void schedule(int n, vector<Job>& jobs, vector<Job>& J) {
    int i;
    vector<Job> K;

    J.push_back(jobs[0]);

    for (i = 1; i < n; i++) {
        K = J;
        K.push_back(jobs[i]);

        if (isFeasible(K)) {
            J = K;
        }
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

    vector<Job> J;

    schedule(jobs.size(), jobs, J);

    int totalProfit = 0;

    cout << "Scheduled Jobs:\n";

    for (auto& job : J) {
        cout
            << "Job ID: " << job.id << "\t"
            << "Deadline: " << job.deadline << "\t"
            << "Profit: " << job.profit << '\n';

        totalProfit += job.profit;
    }

    cout << "Total Profit: " << totalProfit;

    return 0;
}
