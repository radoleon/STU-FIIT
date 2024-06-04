package utils;

import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;

/**
 * Utility class for displaying GUI error messages,subclass of Error.
 */
public class GuiError extends Error {

    private String title;

    /**
     * Constructs a GuiError object with the given exception and title.
     * @param e The exception to be handled.
     * @param title The title of the error message window.
     */
    public GuiError(Exception e, String title) {
        super(e);
        this.title = title;
    }

    /**
     * Displays the error message in a GUI window using JavaFX Alert.
     */
    @Override
    public void displayError() {
        Alert errorWindow = new Alert(AlertType.ERROR);
        errorWindow.setHeaderText(title);
        errorWindow.setContentText(exception.getMessage());
            
        errorWindow.showAndWait();
    }
}
