package controllers;

import auth.User;
import dashboard.DashboardObserver;
import dashboard.NewPost;
import dashboard.OwnPost;
import dashboard.Post;
import dashboard.PostSubject;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;

/**
 * Controller class for managing individual post views.
 */
public class PostController implements PostSubject {
    
    private Post post;
    private DashboardObserver observer;

    @FXML
    private AnchorPane postContainer;
    @FXML
    private Label titleLabel;
    @FXML
    private Label descriptionLabel;
    @FXML
    private Label typeLabel;
    @FXML
    private Label ratioLabel;
    @FXML
    private Label ownerLabel;
    @FXML
    private Button forButton;
    @FXML
    private Button againstButton;
    @FXML
    private Button deleteButton;

    /**
     * Initializes the post view.
     */
    @FXML
    public void initialize() {
        forButton.setOnAction(e -> handleVoteFor());
        againstButton.setOnAction(e -> handleVoteAgainst());
        deleteButton.setOnAction(e -> handleDelete());
    }

    /**
     * Handles voting for the post.
     */
    public void handleVoteFor() {
        boolean success = post.voteFor();
        
        if (success) {
            notifyObserver(observer);
        }
    }

    /**
     * Handles voting against the post.
     */
    public void handleVoteAgainst() {
        boolean success = post.voteAgainst();

        if (success) {
            notifyObserver(observer);
        }
    }

    /**
     * Handles post deletion.
     */
    public void handleDelete() {
        boolean success = post.deletePost();

        if (success) {
            notifyObserver(observer);
        }
    }

    public void setPost(Post post) {
        this.post = post;
        updatePostVisuals();
    }

    public void setObserver(DashboardObserver dashboardObserver) {
        this.observer = dashboardObserver;
    }

    /**
     * Updates the visual representation of the post.
     */
    public void updatePostVisuals() {
        
        titleLabel.setText(post.getTitle());
        descriptionLabel.setText(post.getDescription());
        ownerLabel.setText("by: " + post.getUsername());
        ratioLabel.setText(post.getRatio() + "%");

        forButton.setText("⬆" + post.getVotesFor().size());
        againstButton.setText("⬇" + post.getVotesAgainst().size());

        // Conditionaly sets css classes
        if (post instanceof OwnPost) {
            typeLabel.setText("Own!");
            postContainer.getStyleClass().add("own-post");
        }

        else if (post instanceof NewPost) {

            typeLabel.setText("New!");
            postContainer.getStyleClass().add("new-post");
            
            if (((NewPost) post).getHidden()) {
                postContainer.getStyleClass().add("hidden");
            }
        }

        else if (post instanceof Post) {

            User userInstance = User.getInstance();
            postContainer.getStyleClass().add("post");

            if (post.getVotesFor().contains(userInstance.getUid())) {
                postContainer.getStyleClass().add("voted-for");
            }
            else if (post.getVotesAgainst().contains(userInstance.getUid())) {
                postContainer.getStyleClass().add("voted-against");
            }

            if (post.getRatio() >= 33.33 && post.getRatio() < 66.67) {
                postContainer.getStyleClass().add("medium-ratio");
            }
            else if (post.getRatio() >= 66.67) {
                postContainer.getStyleClass().add("high-ratio");
            }
            else {
                postContainer.getStyleClass().add("low-ratio");
            }
        }
    }
}
