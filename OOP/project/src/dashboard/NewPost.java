package dashboard;

import java.util.List;

/**
 * Represents a new post, a subclass of Post.
 */
public class NewPost extends Post {

    private boolean hidden;

    /**
     * Constructs a new NewPost object.
     * @param id the unique identifier of the post
     * @param uid the user ID of the post creator
     * @param username the username of the post creator
     * @param title the title of the post
     * @param description the description of the post
     * @param votesFor the list of users who voted for the post
     * @param votesAgainst the list of users who voted against the post
     */
    public NewPost(String id, String uid, String username, String title, String description, List<String> votesFor, List<String> votesAgainst) {
        super(id, uid, username, title, description, votesFor, votesAgainst);
        this.hidden = true;
    }

    /**
     * Calculates the ratio of votes for the new post.
     * Since new posts have no votes, the ratio is always 0.
     * @param votesFor the list of users who voted for the post (unused)
     * @param votesAgainst the list of users who voted against the post (unused)
     */
    @Override
    public void calculateRatio(List<String> votesFor, List<String> votesAgainst) {
        this.ratio = 0.0f;
    }

    public boolean getHidden() {
        return hidden;
    }
}
