package dashboard;

import java.util.List;
import utils.EventHandler;
import utils.GuiError;

/**
 * Represents an own post, a subclass of Post.
 */
public class OwnPost extends Post {
    
    /**
     * Constructs a new OwnPost object.
     * @param id the unique identifier of the post
     * @param uid the user ID of the post creator
     * @param username the username of the post creator
     * @param title the title of the post
     * @param description the description of the post
     * @param votesFor the list of users who voted for the post
     * @param votesAgainst the list of users who voted against the post
     */
    public OwnPost(String id, String uid, String username, String title, String description, List<String> votesFor, List<String> votesAgainst) {
        super(id, uid, username, title, description, votesFor, votesAgainst);
    }
    
     /**
     * Votes for the own post (not allowed).
     * @return always false as voting is not allowed for own posts
     */
    @Override
    public boolean voteFor() {
        GuiError error = new GuiError(new Exception("You can't vote on your own post."), "Voting Error!");
        error.displayError();
        
        return false;
    }
    
    /**
     * Votes against the own post (not allowed).
     * @return always false as voting is not allowed for own posts
     */
    @Override
    public boolean voteAgainst() {
        GuiError error = new GuiError(new Exception("You can't vote on your own post."), "Voting Error!");
        error.displayError();
        
        return false;
    }

    /**
     * Deletes the own post.
     * @return true if the deletion is successful, otherwise false
     */
    @Override
    public boolean deletePost() {
        EventHandler eventHandler = new EventHandler();
        return eventHandler.deletePost(this.getId());
    }
}
