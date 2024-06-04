package controllers;

import java.util.List;
import auth.Authentication;
import auth.User;
import dashboard.DashboardObserver;
import dashboard.NewPost;
import dashboard.OwnPost;
import dashboard.Post;
import dashboard.Posts;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import utils.EventHandler;
import utils.StageState;
import utils.Error;

/**
 * Controller class for managing the dashboard view.
 */
public class DashboardController implements DashboardObserver {

    public Stage primaryStage = StageState.getPrimaryStage();
    
    @FXML
    private Button logoutButton;
    @FXML
    private Label usernameLabel;
    @FXML
    private TextField titleField;
    @FXML
    private TextArea descriptionField;
    @FXML
    private Button createButton;
    @FXML
    private ScrollPane postsContainer;
    @FXML
    private Label postCountLabel;
    @FXML
    private Label ownCountLabel;
    @FXML
    private Label newCountLabel;

    /**
     * Initializes the dashboard view.
     */
    @FXML
    public void initialize() {
        logoutButton.setOnAction(e -> handleLogout());
        createButton.setOnAction(e -> handleCreate());

        User userInstance = User.getInstance();
        usernameLabel.setText("Welcome, " + userInstance.getUsername());
        
        showPosts();
    }

    /**
     * Handles logout action.
     */
    public void handleLogout() {
        try {
            Authentication auth = new Authentication();
            auth.logout();

            new LoginController().showLoginScene();
        }
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
        }
    }

    /**
     * Handles post creation action.
     */
    public void handleCreate() {
        EventHandler eventHandler = new EventHandler();
        boolean success = eventHandler.createPost(titleField.getText(), descriptionField.getText());

        if (success) {
            titleField.clear();
            descriptionField.clear();

            updatePosts();
        }
    }

    /**
     * Shows the dashboard scene.
     * @throws Exception if an error occurs while loading the scene
     */
    public void showDashboardScene() throws Exception {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("../fxml/Dashboard.fxml"));
        Parent dashboardScene = loader.load();

        primaryStage.setTitle("SuggestPolls | Dashboard");
        primaryStage.setScene(new Scene(dashboardScene));
    }

    /**
     * Updates and displays the posts on the dashboard.
     */
    public void showPosts() {

        VBox container = new VBox(10);
        postsContainer.setContent(container);
        
        Posts postsInstance = Posts.getInstance();
        List<Post> posts = postsInstance.getPosts();

        int postCount = 0, newCount = 0, ownCount = 0;
        
        for (Post post : posts) {
            if (post instanceof OwnPost) {
                loadPost(container, post);
                
                postCount++;
                ownCount++;
            }
        }

        for (Post post : posts) {
            if (post instanceof NewPost) {
                loadPost(container, post);
                
                postCount++;
                newCount++;
            }
        }
        
        for (Post post : posts) {
            if (!(post instanceof NewPost) && !(post instanceof OwnPost)) {
                loadPost(container, post);
                
                postCount++;
            }
        }

        postCountLabel.setText("Posts " + postCount);
        ownCountLabel.setText("Own " + ownCount);
        newCountLabel.setText("New " + newCount);
    }

    /**
     * Loads and displays a post in the dashboard.
     * @param container the container to which the post is added
     * @param post the post to display
     */
    public void loadPost(VBox container, Post post) {
        
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("../fxml/Post.fxml"));
            Parent node = loader.load();
            
            PostController postController = loader.getController();
            
            postController.setPost(post);
            postController.setObserver(this);
            
            container.getChildren().add(node);
        } 
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
        }
    } 
}
