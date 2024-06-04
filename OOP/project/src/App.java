import controllers.LoginController;
import javafx.application.Application;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import utils.StageState;

/**
 * Main class representing the entry point of the application.
 * @author Leon Rado
 * @version 1.4.
 */
public class App extends Application {
    
    /**
     * Initializes and starts the JavaFX application.
     * @param primaryStage The primary stage of the application.
     * @throws Exception If an error occurs during initialization.
     */
    @Override
    public void start(Stage primaryStage) throws Exception {
        primaryStage.setResizable(false);
        
        Image icon = new Image(getClass().getResource("assets/favicon.png").toExternalForm());
        primaryStage.getIcons().add(icon);
    
        StageState.setPrimaryStage(primaryStage);
        new LoginController().showLoginScene();
    }
    
    /**
     * The entry point of the application.
     * @param args command-line arguments.
     */
    public static void main(String[] args) {
        launch(args);
    }
}
