#include <stdlib.h>
#include <stdio.h>

#define TABLE_LENGTH 4000

int firstPrint = 1;

struct hashItem {
    char firstname[16];
    char lastname[16];
    int day;
    int month;
    int year;
    double balance;
    struct hashItem* next;
};

double balanceToFloat(char balanceString[]) {
    int i = 0;
    double balanceFloat;

    while (balanceString[i] != '\0') {
        
        if (balanceString[i] == ',') {
            balanceString[i] = '.';
            break;
        }
        i++;
    }

    sscanf(balanceString, "%lf", &balanceFloat);
    return balanceFloat;
}

void copyStrings(char destination[], char source[]) {
    for (int i = 0; i < 16; i++) {
        destination[i] = source[i];
    }
}

int compareItems(char firstname1[], char lastname1[], int day1, int month1, int year1, char firstname2[], char lastname2[], int day2, int month2, int year2) {

    for (int i = 0; i < 16; i++) {
        if (firstname1[i] == '\0' && firstname2[i] == '\0') break;
        if (firstname1[i] == '\0' && firstname2[i] != '\0') return 0;
        if (firstname1[i] != '\0' && firstname2[i] == '\0') return 0;
        
        if (firstname1[i] != firstname2[i]) return 0;
    }

    for (int i = 0; i < 16; i++) {
        if (lastname1[i] == '\0' && lastname2[i] == '\0') break;
        if (lastname1[i] == '\0' && lastname2[i] != '\0') return 0;
        if (lastname1[i] != '\0' && lastname2[i] == '\0') return 0;
        
        if (lastname1[i] != lastname2[i]) return 0;
    }

    if (day1 != day2 || month1 != month2 || year1 != year2) return 0;

    return 1;
}

void printError(char operation[]) {
    if (firstPrint) {
        printf("%s %s", operation, "failed");
        firstPrint--;
    }
   
    else printf("\n%s %s", operation, "failed");
}

void printResult(double balanceFloat) {
    char balanceString[16];
    sprintf(balanceString, "%.2lf", balanceFloat);

    int i = 0;
    while (balanceString[i] != '\0') {

        if (balanceString[i] == '.') {
            balanceString[i] = ',';
            break;
        }
        i++;
    }

    if (firstPrint) {
        printf("%s", balanceString);
        firstPrint--;
    }
    
    else printf("\n%s", balanceString);
}

void freeHashItems(struct hashItem* head) {
    struct hashItem* current = head;
    struct hashItem* temp;

    while (current != NULL) {
        temp = current;
        current = current->next;
        free(temp);
    }
}

void freeHashTable(struct hashItem** hashTable) {
    for (int i = 0; i < TABLE_LENGTH; i++) {
        freeHashItems(hashTable[i]);
    }

    free(hashTable);
}

int hash(char firstname[], char lastname[], int day, int month, int year) {
    unsigned long long hash = 5381;
    int i = 0;
    
    while (firstname[i] != '\0') {
        hash = ((hash << 5) + hash) + (firstname[i] * (i + 1));
        i++;
    }

    i = 0;
    while (lastname[i] != '\0') {
        hash = ((hash << 5) + hash) + (lastname[i] * (i + 1));
        i++;
    }

    hash = ((hash << 5) + hash) + (day * month * year * 31);

    return (int) (hash % TABLE_LENGTH);
}

struct hashItem* createItem(char firstname[], char lastname[], int day, int month, int year, double balance) {
    struct hashItem* newItem = (struct hashItem*) malloc(sizeof(struct hashItem));

    copyStrings(newItem->firstname, firstname);
    copyStrings(newItem->lastname, lastname);

    newItem->day = day;
    newItem->month = month;
    newItem->year = year;
    newItem->balance = balance;
    newItem->next = NULL;

    return newItem;
}

void insertItem(struct hashItem** hashTable, char firstname[], char lastname[], int day, int month, int year, double balance) {
    int index = hash(firstname, lastname, day, month, year);
    
    struct hashItem* head = hashTable[index];
    struct hashItem* current = head;

    struct hashItem* newItem = createItem(firstname, lastname, day, month, year, balance);

    if (current == NULL) {
        hashTable[index] = newItem;
        return;
    }

    while (current != NULL) {

        if (compareItems(current->firstname, current->lastname, current->day, current->month, current->year, firstname, lastname, day, month, year)) {
            printError("insert");
            free(newItem);
            return;
        }

        current = current->next;
    }

    current = head;
   
    while (current->next != NULL) {
        current = current->next;
    }
    
    current->next = newItem;
}

void searchItem(struct hashItem** hashTable, char firstname[], char lastname[], int day, int month, int year) {
    int index = hash(firstname, lastname, day, month, year);
    
    struct hashItem* head = hashTable[index];
    struct hashItem* current = head;

    while (current != NULL) {

        if (compareItems(current->firstname, current->lastname, current->day, current->month, current->year, firstname, lastname, day, month, year)) {
            printResult(current->balance);
            return;
        }

        current = current->next;
    }

    printError("search");
}

void updateItem(struct hashItem** hashTable, char firstname[], char lastname[], int day, int month, int year, double balance) {
    int index = hash(firstname, lastname, day, month, year);
    
    struct hashItem* head = hashTable[index];
    struct hashItem* current = head;

    if (head == NULL) {
        printError("update");
        return;
    }

    while (current != NULL) {

        if (compareItems(current->firstname, current->lastname, current->day, current->month, current->year, firstname, lastname, day, month, year)) {
            
            if (current->balance + balance >= 0) {
                current->balance += balance;
            }
            else {
                printError("update");
            }
            
            return;
        }

        current = current->next;
    }

    printError("update");
}

void deleteItem(struct hashItem** hashTable, char firstname[], char lastname[], int day, int month, int year) {
    int index = hash(firstname, lastname, day, month, year);
    
    struct hashItem* head = hashTable[index];
    struct hashItem* current = head;
    struct hashItem* previous = NULL;
    struct hashItem* temp;

    while (current != NULL) {

        if (compareItems(current->firstname, current->lastname, current->day, current->month, current->year, firstname, lastname, day, month, year)) {

            if (previous == NULL) {
                temp = head;
                head = head->next;
                free(temp);
                hashTable[index] = head;
            }
            
            else {
                temp = current;
                previous->next = current->next;
                current = current->next;
                free(temp);
            }

            return;
        }
        
        else {
            previous = current;
            current = current->next;
        }
    }

    printError("delete");
}

int main(){

    char buffer[64], command, firstname[16], lastname[16], balanceString[16];
    int day, month, year;

    struct hashItem** hashTable = (struct hashItem**) malloc(TABLE_LENGTH * sizeof(struct hashItem*));

    for (int i = 0; i < TABLE_LENGTH; i++) {
        hashTable[i] = NULL;
    }

    while(fgets(buffer, 64, stdin) != NULL) {
        
        sscanf(buffer, "%c %s %s %d.%d.%d %s", &command, firstname, lastname, &day, &month, &year, balanceString);

        switch (command) {
            case 'i':
                insertItem(hashTable, firstname, lastname, day, month, year, balanceToFloat(balanceString));
                break;
            
            case 's':
                searchItem(hashTable, firstname, lastname, day, month, year);
                break;

            case 'u':
                updateItem(hashTable, firstname, lastname, day, month, year, balanceToFloat(balanceString));
                break;

            case 'd':
                deleteItem(hashTable, firstname, lastname, day, month, year);
                break;
        }
    }

    freeHashTable(hashTable);
}
