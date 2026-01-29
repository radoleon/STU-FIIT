#include <bitset>
#include <fstream>
#include <iostream>
#include <memory>
#include <queue>
#include <unordered_map>
#include <iterator>

using namespace std;

class HuffmanNode {
public:
    char data;
    unsigned freq;
    shared_ptr<HuffmanNode> left;
    shared_ptr<HuffmanNode> right;

    HuffmanNode(char d, unsigned f) {
        data = d;
        freq = f;
        left = nullptr;
        right = nullptr;
    }

    bool isLeaf() const {
        return !left && !right;
    }
};

struct CompareNode {
    bool operator() (const shared_ptr<HuffmanNode> &a, const shared_ptr<HuffmanNode> &b) const {
        return a->freq > b->freq;
    }
};

class HuffmanCoder {
private:
    shared_ptr<HuffmanNode> root;

    void generateCodes(shared_ptr<HuffmanNode> node, string code) {
        if (!node) {
            return;
        }

        if (node->isLeaf()) {
            codes[node->data] = code.empty() ? "0" : code;
            return;
        }

        generateCodes(node->left, code + "0");
        generateCodes(node->right, code + "1");
    }

public:
    unordered_map<char, string> codes;

    HuffmanCoder() {
        root = nullptr;
    }

    void buildTree(const vector<unsigned> &frequencies) {

        priority_queue<shared_ptr<HuffmanNode>, vector<shared_ptr<HuffmanNode>>, CompareNode> minHeap;

        for (int i = 0; i < 256; i++) {
            if (frequencies[i] > 0) {
                minHeap.push(make_shared<HuffmanNode>(i, frequencies[i]));
            }
        }

        while (minHeap.size() > 1) {
            auto left = minHeap.top();
            minHeap.pop();

            auto right = minHeap.top();
            minHeap.pop();


            auto parent = make_shared<HuffmanNode>('\0', left->freq + right->freq);
            parent->left = left;
            parent->right = right;

            minHeap.push(parent);
        }

        root = minHeap.top();

        generateCodes(root, "");
    }
};

vector<uint8_t> outBytes;
bitset<8> currByte(0);
int bitPos = 0;

void writeBit(int bit) {
    currByte[7 - bitPos] = bit;
    bitPos++;

    if (bitPos == 8) {
        outBytes.push_back(currByte.to_ulong());
        currByte.reset();
        bitPos = 0;
    }
}

int main() {
    ifstream input("input.txt", ios::binary);
    vector<unsigned char> data(istreambuf_iterator<char>(input), {});
    input.close();

    vector<unsigned int> frequencies(256, 0);

    for (auto byte : data) {
        frequencies[byte]++;
    }

    HuffmanCoder coder;
    coder.buildTree(frequencies);

    for (int i = 0; i < 256; i++) {
        char c = (char)i;
        uint8_t len = coder.codes.count(c) ? coder.codes[c].size() : 0;

        outBytes.push_back(len);
    }

    for (int i = 0; i < 256; i++) {
        char c = (char)i;

        if (coder.codes.count(c)) {
            for (char bit : coder.codes[c]) {
                writeBit(bit == '1');
            }
        }
    }

    for (unsigned char c : data) {
        for (char bit : coder.codes[c]) {
            writeBit(bit == '1');
        }
    }

    uint8_t padding = 0;

    if (bitPos != 0) {
        padding = 8 - bitPos;

        while (bitPos != 0) {
            writeBit(0);
        }
    }

    outBytes.push_back(padding);

    ofstream output("output.bin", ios::binary);

    output.write((char*)outBytes.data(), outBytes.size());
    output.close();

    return 0;
}
