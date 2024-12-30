import numpy as np
import matplotlib.pyplot as plt

class Linear:
    def __init__(self, input_size, output_size, learning_rate, momentum=None, activation_fn_linear=False):
        self.learning_rate = learning_rate
        self.momentum = momentum

        if activation_fn_linear:
            self.weights = np.random.randn(input_size, output_size) * np.sqrt(2 / input_size)
        else:
            self.weights = np.random.randn(input_size, output_size) * np.sqrt(1 / (input_size + output_size))

        self.bias = np.zeros((1, output_size))

        if self.momentum is not None:
            self.velocity_weights = np.zeros_like(self.weights)
            self.velocity_bias = np.zeros_like(self.bias)

    def forward(self, x):
        self.input = x
        output = np.dot(x, self.weights) + self.bias
        return output

    def backward(self, grad_output):
        self.grad_weights = np.dot(self.input.T, grad_output)
        self.grad_bias = np.sum(grad_output, axis=0, keepdims=True)
        
        output = np.dot(grad_output, self.weights.T)
        self.update()
        
        return output

    def update(self):
        if self.momentum is not None:
            self.velocity_weights = self.momentum * self.velocity_weights - self.learning_rate * self.grad_weights
            self.velocity_bias = self.momentum * self.velocity_bias - self.learning_rate * self.grad_bias

            self.weights += self.velocity_weights
            self.bias += self.velocity_bias
        else:
            self.weights -= self.learning_rate * self.grad_weights
            self.bias -= self.learning_rate * self.grad_bias

class Sigmoid:
    def forward(self, x):
        self.output = 1 / (1 + np.exp(-x))
        return self.output

    def backward(self, grad_output):
        return grad_output * self.output * (1 - self.output)

class Tanh:
    def forward(self, x):
        self.output = np.tanh(x)
        return self.output

    def backward(self, grad_output):
        return grad_output * (1 - self.output ** 2)

class ReLU:
    def forward(self, x):
        self.input = x
        return np.maximum(0, x)

    def backward(self, grad_output):
        return grad_output * (self.input > 0)

class MSELoss:
    def forward(self, predictions, labels):
        self.predictions = predictions
        self.labels = labels
        
        return np.mean((predictions - labels) ** 2)

    def backward(self):
        grad_output = 2 * (self.predictions - self.labels) / len(self.labels)
        return grad_output

class MLPModel:
    def __init__(self, layers, epochs):
        self.layers = layers
        self.epochs = epochs

    def forward(self, x):
        for layer in self.layers:
            x = layer.forward(x)
        
        return x

    def backward(self, grad_output):
        for layer in reversed(self.layers):
            grad_output = layer.backward(grad_output)

def print_accuracy(labels, predictions):
    if len(labels) != len(predictions):
        raise RuntimeError

    print(f'\nTest Predictions:\t {predictions.flatten().tolist()}')
    print(f'Test Values:\t\t {labels.flatten().tolist()}')

    total, correct = 0, 0

    for i, pred in enumerate(predictions):
        if (pred < 0.5 and labels[i] == 0) or (pred > 0.5 and labels[i] == 1):
            correct += 1
        
        total += 1

    print(f'Model Accuracy:\t\t ({(correct/total)*100:.2f}%)')

def visualise_loss_progress(model, problem, loss_proggress):
    plt.figure(figsize=(10, 6))
    plt.plot(range(1, model.epochs + 1), loss_proggress, label=problem, color='red')
    plt.title('Training Loss Progress')
    plt.xlabel('Epochs')
    plt.ylim(0, 1)
    plt.legend()
    plt.grid()
    plt.show()

def train_and_evaluate_model(model, X_train, y_train, X_test, y_test, problem):
    print(f'\n{problem}\n-----\t\t----\nEpoch\t\tLoss\n-----\t\t----')
    
    loss_function = MSELoss()
    loss_proggress = []

    for epoch in range(1, model.epochs + 1):
        predictions = model.forward(X_train)
        
        loss = loss_function.forward(predictions, y_train)
        grad_output = loss_function.backward()
        
        model.backward(grad_output)

        if epoch == 1 or epoch % 50 == 0:
            print(f'{epoch:03}\t\t{loss:.6f}')

        loss_proggress.append(loss)

    predictions = model.forward(X_test)
    print_accuracy(y_test, predictions)

    for i in range(model.epochs):
        if loss_proggress[i] < 0.01:
            print(f'Loss < 0.01 (Epoch):\t {i + 1}\n')
            break
    
    visualise_loss_progress(model, problem, loss_proggress)

XOR_problem = {
    'X_train': np.array([[0, 0], [0, 1], [1, 0], [1, 1]]),
    'y_train': np.array([[0], [1], [1], [0]]),
    'X_test': np.array([[0, 1], [1, 0], [0, 0], [1, 1]]),
    'y_test': np.array([[1], [1], [0], [0]]),
    'problem': '[XOR problem] lr=0.1 m=0.9 (activation function: Tanh) (hidden layers: 2)',
    'model': MLPModel(
        layers=[
            Linear(input_size=2, output_size=4, learning_rate=0.1, momentum=0.9),
            Tanh(),
            Linear(input_size=4, output_size=4, learning_rate=0.1, momentum=0.9),
            Tanh(),
            Linear(input_size=4, output_size=1, learning_rate=0.1, momentum=0.9),
            Sigmoid()
        ],
        epochs=500
    )
}

AND_problem = {
    'X_train': np.array([[0, 0], [0, 1], [1, 0], [1, 1]]),
    'y_train': np.array([[0], [0], [0], [1]]),
    'X_test': np.array([[0, 1], [1, 0], [0, 0], [1, 1]]),
    'y_test': np.array([[0], [0], [0], [1]]),
    'problem': '[AND problem] lr=0.1 m=0.9 (activation function: ReLU) (hidden layers: 1)',
    'model': MLPModel(
        layers=[
            Linear(input_size=2, output_size=4, learning_rate=0.1, momentum=0.9, activation_fn_linear=True),
            ReLU(),
            Linear(input_size=4, output_size=1, learning_rate=0.1, momentum=0.9),
            Sigmoid()
        ],
        epochs=500
    )
}

OR_problem = {
    'X_train': np.array([[0, 0], [0, 1], [1, 0], [1, 1]]),
    'y_train': np.array([[0], [1], [1], [1]]),
    'X_test': np.array([[0, 1], [1, 0], [0, 0], [1, 1]]),
    'y_test': np.array([[1], [1], [0], [1]]),
    'problem': '[OR problem] lr=0.1 m=0.9 (activation function: Tanh) (hidden layers: 1)',
    'model': MLPModel(
        layers=[
            Linear(input_size=2, output_size=4, learning_rate=0.1, momentum=0.9),
            Tanh(),
            Linear(input_size=4, output_size=1, learning_rate=0.1, momentum=0.9),
            Sigmoid()
        ],
        epochs=500
    )
}

if __name__ == '__main__':
    for problem in [XOR_problem, AND_problem, OR_problem]:
        model, X_train, y_train, X_test, y_test, problem = problem['model'], problem['X_train'], problem['y_train'], problem['X_test'], problem['y_test'], problem['problem']
        train_and_evaluate_model(model, X_train, y_train, X_test, y_test, problem)