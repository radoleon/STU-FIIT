#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Id {
    char labelling;
    int numbering;
    char type;
};

struct Position {
    double latitude;
    double longitude;
};

typedef struct Node {
    struct Id id;
    struct Position position;
    char type[3];
    double value;
    char time[5];
    char date[9];
    struct Node* next;
} node;

int get_count_nodes() {
    FILE* file_dataloger = fopen("dataloger_V2.txt", "r");

    if (file_dataloger == NULL) {
        exit(1);
    }

    char buffer[32];
    int count = 0;

    while (fgets(buffer, sizeof(buffer), file_dataloger) != NULL) {
        if (strcmp(buffer, "$$$\n") == 0) {
            count++;
        }
    }
    
    fclose(file_dataloger);
    return count;
}

int get_minutes(char date[], char time[]) {
    int years, months, days, hours, minutes;
    
    sscanf(date, "%4d %2d %2d", &years, &months, &days);
    sscanf(time, "%2d %2d", &hours, &minutes);

    months += years * 12;
    days += months * 30;
    hours += days * 24;
    minutes += hours * 60;

    return minutes;
}

void command_n(node** head, int* count) {
    
    if (*head != NULL) {
        node* current = *head;
        node* temp;

        while (current != NULL) {
            temp = current;
            current = current->next;
            free(temp);
        }

        *head = NULL;
    }

    *count = get_count_nodes();
    
    FILE* file_dataloger = fopen("dataloger_V2.txt", "r");

    if (file_dataloger == NULL) {
        printf("Subory neboli nacitane.\n");
        return;
    }
    
    char buffer[32];
    int loaded_nodes = 0;
    node* newNode = (node*) malloc(sizeof(node));
    *head = newNode;

    for (int i = 0; i < *count; i++) {
        
        fscanf(file_dataloger, "%s", buffer);
        
        fscanf(file_dataloger, "%s", buffer);
        sscanf(buffer, "%c %d %c", &(newNode->id.labelling), &(newNode->id.numbering), &(newNode->id.type));

        fscanf(file_dataloger, "%s", buffer);
        sscanf(buffer, "%lf %lf", &(newNode->position.latitude), &(newNode->position.longitude));

        fscanf(file_dataloger, "%s", newNode->type);
        fscanf(file_dataloger, "%lf", &(newNode->value));
        fscanf(file_dataloger, "%s", newNode->time);
        fscanf(file_dataloger, "%s", newNode->date);

        node* current = newNode;

        if (i == *count - 1) {
            current->next = NULL;
            loaded_nodes++;
            break;
        }
        
        newNode = (node*) malloc(sizeof(node));
        current->next = newNode;

        loaded_nodes++;
    }

    if (loaded_nodes == *count) {
        printf("Nacitalo sa %d zaznamov.\n", loaded_nodes);
    }
    
    fclose(file_dataloger);
}

void command_v(node* head) {

    if (head == NULL) {
        return;
    }

    node* current = head;

    int index = 1;
    while (current != NULL) {
        printf("%d:\n", index);
        
        printf(
            "ID: %c%d%c\t%s\t%.2lf\n", 
            current->id.labelling,
            current->id.numbering,
            current->id.type,
            current->type,
            current->value
        );
       
        printf(
            "Poz: +%.4lf\t+%.4lf\n",
            current->position.latitude,
            current->position.longitude
        );

        printf(
            "DaC: %s\t%s\n",
            current->date,
            current->time
        );

        index++;
        current = current->next;
    } 
}

void command_p(node** head, int* count) {
    int position;
    scanf("%d", &position);

    node* newNode = (node*) malloc(sizeof(node));
    node* temp;
    node* current;
    
    char buffer[32];
    
    scanf("%s", buffer);
    sscanf(buffer, "%c %d %c", &(newNode->id.labelling), &(newNode->id.numbering), &(newNode->id.type));
    
    scanf("%s", buffer);
    sscanf(buffer, "%lf %lf", &(newNode->position.latitude), &(newNode->position.longitude));
    
    scanf("%s", newNode->type);
    scanf("%lf", &(newNode->value));
    scanf("%s", newNode->time);
    scanf("%s", newNode->date);
    

    if (*head == NULL) {
        *head = newNode;
        newNode->next = NULL;

        (*count)++;
        return;
    }

    if (position == 1) {
        temp = *head;
        *head = newNode;
        newNode->next = temp;

        (*count)++;
        return;
    }

    if (position > *count) {
        current = *head;

        while (current->next != NULL) {
            current = current->next;
        }

        current->next = newNode;
        newNode->next = NULL;

        (*count)++;
        return;
    }

    current = *head;
    for (int i = 0; i < position - 2; i++) {
        current = current->next;
    }
    
    temp = current->next;
    current->next = newNode;
    newNode->next = temp;

    (*count)++;
}

void command_z(node** head, int* count) {
    char id[6];
    scanf("%s", id);
    
    char id_labelling, id_type;
    int id_numbering;
    sscanf(id, "%c %d %c", &id_labelling, &id_numbering, &id_type);

    node* temp;
    node* current = *head;
    node* previous = NULL;

     while (current != NULL) {

        if (current->id.labelling == id_labelling &&
            current->id.numbering == id_numbering &&
            current->id.type == id_type) {

            if (previous == NULL) {
                temp = *head;
                *head = (*head)->next;
                free(temp);
                current = *head;
            }
            
            else {
                temp = current;
                previous->next = current->next;
                current = current->next;
                free(temp);
            }

            (*count)--;
            printf("Zaznam pre ID: %s bol vymazany.\n", id);
        }
        
        else {
            previous = current;
            current = current->next;
        }
    }
}

void command_u(node** head, int count) {
    
    if (*head == NULL || (*head)->next == NULL) {
        return;
    }

    node* current;
    node* previous;
    node* temp;

    for (int i = 0; i < count; i++) {
        current = *head;
        previous = NULL;

        while (current != NULL && current->next != NULL) {
            if (get_minutes(current->date, current->time) > get_minutes(current->next->date, current->next->time)) {
                temp = current->next;
                
                if (previous == NULL) {
                    *head = temp;
                } 
                else {
                    previous->next = temp;
                }

                current->next = temp->next;
                temp->next = current;
                current = temp;
            }

            previous = current;
            current = current->next;
        }
    }

    current = *head;
    int sorted = 0;
    
    while (current != NULL) {
        sorted++;
        current = current->next;
    }

    sorted == count ? printf("Spajany zoznam bol usporiadany.\n") : printf("Chyba usporiadania.\n");
}

void command_r(node** head, int count) {
    int positionX, positionY;
    scanf("%d %d", &positionX, &positionY);

    if (positionX == positionY || positionX > count || positionY > count) {
        return;
    }
    
    node *previousX = NULL, *previousY = NULL, *currentX = *head, *currentY = *head;

    for (int i = 0; i < positionX - 1; i++) {
        previousX = currentX;
        currentX = currentX->next;
    }

    for (int i = 0; i < positionY - 1; i++) {
        previousY = currentY;
        currentY = currentY->next;
    }

    if (previousX != NULL) {
        previousX->next = currentY;
    } 
    else {
        *head = currentY;
    }

    if (previousY != NULL) {
        previousY->next = currentX;
    }
    else {
        *head = currentX;
    }
    
    node* temp = currentX->next;
    currentX->next = currentY->next;
    currentY->next = temp;
}

int main(int argc, char *argv[]) {

    node* head = NULL;
    char command;
    int count = 0;
    
    do {
        fflush(stdin);
        command = getchar();
        
        switch (command) {
            case 'n':
                command_n(&head, &count);
                break;

            case 'v':
                command_v(head);
                break;

            case 'p':
                command_p(&head, &count);
                break;

            case 'z':
                command_z(&head, &count);
                break;

            case 'u':
                command_u(&head, count);
                break;

            case 'r':
                command_r(&head, count);
                break;
            
            default:
                break;
        }

    } while (command != 'k');

    if (command == 'k') {
        node* current = head, *temp;

        while (current != NULL) {
            temp = current;
            current = current->next;
            free(temp);
        }
    }

    return 0;
}
