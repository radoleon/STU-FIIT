#include <stdio.h>
#include <stdlib.h>

#define INFINITY __INT_MAX__

int first_print = 1;

void print_error(char operation[], int vertex_1, int vertex_2) {
    if (!first_print) {
        printf("\n");
    }
    else {
        first_print = 0;
    }

    if (operation[0] == 's') {
        printf("%s %d failed", operation, vertex_1);
        return;
    }
    
    printf("%s %d %d failed", operation, vertex_1, vertex_2);
}

struct Edge {
    int vertex;
    int weight;
    struct Edge* next;
};

void insert(struct Edge **graph, int vertex_1, int vertex_2, int weight) {
    struct Edge *edge = graph[vertex_1];

    if (vertex_1 == vertex_2) {
        print_error("insert", vertex_1, vertex_2);
        return;
    }

    while (edge != NULL) {
        if (edge->vertex == vertex_2) {
            print_error("insert", vertex_1, vertex_2);
            return;
        }
            
        edge = edge->next;
    }

    struct Edge *new_edge = (struct Edge *) malloc(sizeof(struct Edge));
    new_edge->vertex = vertex_2;
    new_edge->weight = weight;
    new_edge->next = graph[vertex_1];
    graph[vertex_1] = new_edge;

    new_edge = (struct Edge *) malloc(sizeof(struct Edge));
    new_edge->vertex = vertex_1;
    new_edge->weight = weight;
    new_edge->next = graph[vertex_2];
    graph[vertex_2] = new_edge;
}

void update(struct Edge **graph, int vertex_1, int vertex_2, int weight) {
    struct Edge *edge = graph[vertex_1];

    while (edge != NULL) {
        
        if (edge->vertex == vertex_2) {
            
            if (edge->weight + weight >= 0) {
                edge->weight += weight;

                edge = graph[vertex_2];

                while (edge != NULL) {
                    if (edge->vertex == vertex_1) {
                        edge->weight += weight;

                        break;
                    }

                    edge = edge->next;
                }
            }
            else {
                print_error("update", vertex_1, vertex_2);
            }
            
            return;
        }

        edge = edge->next;
    }

    print_error("update", vertex_1, vertex_2);
}

void delete(struct Edge **graph, int vertex_1, int vertex_2) {
    struct Edge *edge = graph[vertex_1];
    struct Edge *previous = NULL;

    while (edge != NULL) {
        if (edge->vertex == vertex_2) {

            if (previous == NULL) {
                graph[vertex_1] = edge->next;
            }
            else {
                previous->next = edge->next;
            }
            
            free(edge);

            edge = graph[vertex_2];
            previous = NULL;

            while (edge != NULL) {
                if (edge->vertex == vertex_1) {

                    if (previous == NULL) {
                        graph[vertex_2] = edge->next;
                    }
                    else {
                        previous->next = edge->next;
                    }

                    free(edge);
                    return;
                }

                previous = edge;
                edge = edge->next;
            }
        }

        previous = edge;
        edge = edge->next;
    }

    print_error("delete", vertex_1, vertex_2);
}

void print_graph(struct Edge **graph, int N) {
    for (int i = 0; i < N; i++) {
        printf("Vertex %d: ->\t", i);

        struct Edge* current = graph[i];

        while (current != NULL) {
            printf("%d (%d)\t", current->vertex, current->weight);

            current = current->next;
        }

        printf("\n");
    }
}

struct MinHeapNode {
    int vertex;
    int weight;
};

struct MinHeap {
    int size;
    int capacity;
    int *position;
    struct MinHeapNode *array;
};

struct MinHeap *create_min_heap(int capacity) {
    struct MinHeap *min_heap = (struct MinHeap *) malloc(sizeof(struct MinHeap));
    
    min_heap->capacity = capacity;
    min_heap->size = 0;
    min_heap->position = (int *) malloc(capacity * sizeof(int));
    min_heap->array = (struct MinHeapNode *) malloc(capacity * sizeof(struct MinHeapNode));
    
    return min_heap;
}

void swap_min_heap_nodes(struct MinHeapNode *node_1, struct MinHeapNode *node_2) {
    struct MinHeapNode temp = *node_1;
    *node_1 = *node_2;
    *node_2 = temp;
}

void min_heapify(struct MinHeap *min_heap, int index) {
    int min = index;
    int left = 2 * index + 1;
    int right = 2 * index + 2;
 
    if (left < min_heap->size && min_heap->array[left].weight < min_heap->array[min].weight) {
        min = left;
    }

    if (right < min_heap->size && min_heap->array[right].weight < min_heap->array[min].weight) {
        min = right;
    }
 
    if (min != index) {
        struct MinHeapNode min_node = min_heap->array[min];
        struct MinHeapNode index_node = min_heap->array[index];
 
        min_heap->position[min_node.vertex] = index;
        min_heap->position[index_node.vertex] = min;
 
        swap_min_heap_nodes(&min_heap->array[min], &min_heap->array[index]);
 
        min_heapify(min_heap, min);
    }
}

int is_empty(struct MinHeap *min_heap) {
    return min_heap->size == 0;
}

struct MinHeapNode extract_min(struct MinHeap *min_heap) {
    if (is_empty(min_heap)) {
        struct MinHeapNode error;
        error.vertex = -1;
        return error;
    }
 
    struct MinHeapNode root_node = min_heap->array[0];

    struct MinHeapNode last_node = min_heap->array[min_heap->size - 1];
    min_heap->array[0] = last_node;
 
    min_heap->position[root_node.vertex] = min_heap->size - 1;
    min_heap->position[last_node.vertex] = 0;
 
    min_heap->size--;
    min_heapify(min_heap, 0);
 
    return root_node;
}

int in_min_heap(struct MinHeap *min_heap, int vertex) {
    if (min_heap->position[vertex] < min_heap->size) {
        return 1;
    }
    return 0;
}

void decrease_key(struct MinHeap *min_heap, int vertex, int weight) {
    int index = min_heap->position[vertex];
 
    min_heap->array[index].weight = weight;

    while (index && min_heap->array[index].weight < min_heap->array[(index - 1) / 2].weight) {
        
        min_heap->position[min_heap->array[index].vertex] = (index - 1) / 2;
        min_heap->position[min_heap->array[(index - 1) / 2].vertex] = index;
        
        swap_min_heap_nodes(&min_heap->array[index], &min_heap->array[(index - 1) / 2]);

        index = (index - 1) / 2;
    }
}

struct MstEdge {
    int vertex_1;
    int vertex_2;
};

void print_result(unsigned long long price, struct MstEdge *mst_edges, int count) {
    if (!first_print) {
        printf("\n");
    }
    else {
        first_print = 0;
    }

    int first_pair = 1;
    printf("%llu: [", price);

    for (int i = 0; i < count; i++) {
        if (first_pair) {
            printf("(%d, %d)", mst_edges[i].vertex_1, mst_edges[i].vertex_2);
            first_pair = 0;
        }
        else {
            printf(", (%d, %d)", mst_edges[i].vertex_1, mst_edges[i].vertex_2);
        }
    }

    printf("]");
}

void swap_mst_edges(struct MstEdge *edge_1, struct MstEdge *edge_2) {
    struct MstEdge temp = *edge_1;
    *edge_1 = *edge_2;
    *edge_2 = temp;
}

int partition(struct MstEdge *mst_edges, int low, int high) {
    struct MstEdge pivot = mst_edges[low + (high - low) / 2];
    
    int i = low - 1;
    int j = high + 1;

    while (1) {
        do {
            i++;
        } while (mst_edges[i].vertex_1 < pivot.vertex_1 || (mst_edges[i].vertex_1 == pivot.vertex_1 && mst_edges[i].vertex_2 < pivot.vertex_2));

        do {
            j--;
        } while (mst_edges[j].vertex_1 > pivot.vertex_1 || (mst_edges[j].vertex_1 == pivot.vertex_1 && mst_edges[j].vertex_2 > pivot.vertex_2));

        if (i >= j) {
            return j;
        }

        swap_mst_edges(&mst_edges[i], &mst_edges[j]);
    }
}

void quick_sort(struct MstEdge *mst_edges, int low, int high) {
    if (low < high) {
        int partition_index = partition(mst_edges, low, high);

        quick_sort(mst_edges, low, partition_index);
        quick_sort(mst_edges, partition_index + 1, high);
    }
}

void search(struct Edge **graph, int N, int vertex_1) {
    int parent[N];
    int distance[N];
    unsigned long long price = 0;
    int index = 0;
    
    struct MstEdge *mst_edges = (struct MstEdge *) malloc((N - 1) * sizeof(struct MstEdge));
    struct MinHeap *min_heap = create_min_heap(N);
    
    for (int i = 0; i < N; i++) {
        min_heap->array[i].vertex = i;
        min_heap->array[i].weight = INFINITY;
        min_heap->position[i] = i;
        
        distance[i] = INFINITY;
        parent[i] = -1;
    }
    
    min_heap->size = N;

    distance[vertex_1] = 0;
    decrease_key(min_heap, vertex_1, 0);

    while (!is_empty(min_heap)) {

        struct MinHeapNode min_node = extract_min(min_heap);

        if (min_node.vertex != vertex_1 && parent[min_node.vertex] == -1) {
            if (index == 0) {
                print_error("search", vertex_1, 0);
                goto free_memory;
            }

            break;
        }

        if (min_node.vertex != vertex_1) {
            mst_edges[index].vertex_1 = min_node.vertex > parent[min_node.vertex] ? parent[min_node.vertex] : min_node.vertex;
            mst_edges[index].vertex_2 = min_node.vertex > parent[min_node.vertex] ? min_node.vertex : parent[min_node.vertex];
        
            index++;
        }

        price += distance[min_node.vertex];

        struct Edge* edge = graph[min_node.vertex];

        while (edge != NULL) {
            
            if (in_min_heap(min_heap, edge->vertex) && edge->weight < distance[edge->vertex]){
                distance[edge->vertex] = edge->weight;
                parent[edge->vertex] = min_node.vertex;
                decrease_key(min_heap, edge->vertex, edge->weight);
            }

            edge = edge->next;
        }
    }

    quick_sort(mst_edges, 0, index - 1);
    print_result(price, mst_edges, index);

    free_memory:  
    free(min_heap->array);
    free(min_heap->position);
    free(min_heap);
    free(mst_edges);
}

void free_graph(struct Edge **graph, int N) {
    for (int i = 0; i < N; i++) {
        
        struct Edge *current = graph[i];
        
        while (current != NULL) {
            struct Edge *temp = current;
            current = current->next;
            free(temp);
        }
    }
    
    free(graph);
}

int main() {

    char buffer[32], command;
    int N;
    
    scanf("%d", &N);
    struct Edge **graph = (struct Edge **) malloc(N * sizeof(struct Edge *));

    for (int i = 0; i < N; i++) {
        graph[i] = NULL;
    }

    int vertex_1, vertex_2, weight;

    while(fgets(buffer, 32, stdin) != NULL) {

        switch (buffer[0]) {

            case '(':
                sscanf(buffer, "(%d, %d, %d)", &vertex_1, &vertex_2, &weight);
                insert(graph, vertex_1, vertex_2, weight);
                break;

            case 'i':
                sscanf(buffer, "%c %d %d %d", &command, &vertex_1, &vertex_2, &weight);
                insert(graph, vertex_1, vertex_2, weight);
                break;
            
            case 's':
                sscanf(buffer, "%c %d", &command, &vertex_1);
                search(graph, N, vertex_1);
                break;

            case 'u':
                sscanf(buffer, "%c %d %d %d", &command, &vertex_1, &vertex_2, &weight);
                update(graph, vertex_1, vertex_2, weight);
                break;

            case 'd':
                sscanf(buffer, "%c %d %d", &command, &vertex_1, &vertex_2);
                delete(graph, vertex_1, vertex_2);
                break;
        }
    }
    
    free_graph(graph, N);
    return 0;
}
