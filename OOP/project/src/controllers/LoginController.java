package controllers;

import auth.Authentication;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import utils.StageState;
import utils.Error;

/**
 * Controller class for managing the login view.
 */
public class LoginController {

    public Stage primaryStage = StageState.getPrimaryStage();

    @FXML
    private TextField usernameField;
    @FXML
    private PasswordField passwordField;
    @FXML
    private Button loginButton;

    /**
     * Initializes the login view.
     */
    @FXML
    public void initialize() {
        loginButton.setOnAction(e -> handleLogin());
    }

    /**
     * Handles the login action.
     */
    private void handleLogin() {
        try {
            Authentication auth = new Authentication();
            boolean success = auth.login(usernameField.getText(), passwordField.getText());
 
            if (success) {
                new DashboardController().showDashboardScene();
            }
        } 
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
        }
    }

    /**
     * Shows the login scene.
     * @throws Exception if an error occurs while loading the scene
     */
    public void showLoginScene() throws Exception {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("../fxml/Login.fxml"));
        Parent loginScene = loader.load();

        primaryStage.setTitle("SuggestPolls | Login");
        primaryStage.setScene(new Scene(loginScene));
        primaryStage.show();
    }
}
