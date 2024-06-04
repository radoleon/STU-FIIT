package utils;

import javafx.stage.Stage;

/**
 * Utility class to manage the primary stage of the JavaFX application.
 */
public class StageState {
    
    private static Stage primaryStage;

    public static void setPrimaryStage(Stage stage) {
        StageState.primaryStage = stage;
    }

    public static Stage getPrimaryStage() {
        return primaryStage;
    }
}
