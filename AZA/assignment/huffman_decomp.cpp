#include <bitset>
#include <fstream>
#include <iostream>
#include <memory>
#include <queue>
#include <unordered_map>
#include <iterator>

using namespace std;

int main() {
    ifstream input("output.bin", ios::binary);
    vector<uint8_t> bytes(istreambuf_iterator<char>(input), {});
    input.close();

    vector<uint8_t> lengths(256);

    for (int i = 0; i < 256; i++) {
        lengths[i] = bytes[i];
    }

    int bytePos = 256;
    int bitPos = 0;

    unordered_map<string, char> codes;

    for (int i = 0; i < 256; i++) {
        int len = lengths[i];

        if (len == 0) {
            continue;
        }

        string code;
        code.reserve(len);

        for (int j = 0; j < len; j++) {
            bitset<8> bits(bytes[bytePos]);

            int b = bits[7 - bitPos];
            code.push_back(b ? '1' : '0');

            bitPos++;

            if (bitPos == 8) {
                bitPos = 0;
                bytePos++;
            }
        }

        codes[code] = (char)i;
    }

    int end = bytes.size() - 2;
    uint8_t padding = bytes.back();

    string currCode;
    ofstream output("decoded.txt", ios::binary);

    for (bytePos; bytePos < end; bytePos++) {
        bitset<8> bits(bytes[bytePos]);
        for (int b = 7 - bitPos; b >= 0; b--) {
            currCode.push_back(bits[b] ? '1' : '0');

            if (codes.count(currCode)) {
                output.put(codes[currCode]);
                currCode.clear();
            }
        }
        bitPos = 0;
    }

    bitset<8> lastBits(bytes[end]);

    for (int b = 7; b >= (int)padding; b--) {
        currCode.push_back(lastBits[b] ? '1' : '0');

        if (codes.count(currCode)) {
            output.put(codes[currCode]);
            currCode.clear();
        }
    }

    output.close();

    return 0;
}
