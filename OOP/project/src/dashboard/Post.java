package dashboard;

import java.util.List;
import utils.EventHandler;
import utils.GuiError;

/**
 * Class that represents a generic post.
 */
public class Post implements PostInterface {

    private String id;
    private String uid;
    private String username;
    private String title;
    private String description;
    private List<String> votesFor;
    private List<String> votesAgainst;
    protected float ratio;

    /**
     * Constructs a post with the given attributes.
     * @param id the post ID
     * @param uid the user ID of the post creator
     * @param username the username of the post creator
     * @param title the title of the post
     * @param description the description of the post
     * @param votesFor the list of user IDs who voted for the post
     * @param votesAgainst the list of user IDs who voted against the post
     */
    public Post(String id, String uid, String username, String title, String description, List<String> votesFor, List<String> votesAgainst) {
        this.id = id;
        this.uid = uid;
        this.username = username;
        this.title = title;
        this.description = description;
        this.votesFor = votesFor;
        this.votesAgainst = votesAgainst;
        
        calculateRatio(votesFor, votesAgainst);
    } 

    public String getUid() {
        return uid;
    }
    
    public String getId() {
        return id;
    }
    
    public List<String> getVotesFor() {
        return votesFor;
    }
    
    public List<String> getVotesAgainst() {
        return votesAgainst;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getTitle() {
        return title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public float getRatio() {
        return ratio;
    }

    /**
     * Votes for the post.
     * @return true if the vote is successful, otherwise false
     */
    @Override
    public boolean voteFor() {
        EventHandler eventHandler = new EventHandler();
        return eventHandler.voteFor(id, votesFor, votesAgainst);
    }
    
    /**
     * Votes against the post.
     * @return true if the vote is successful, otherwise false
     */
    @Override
    public boolean voteAgainst() {
        EventHandler eventHandler = new EventHandler();
        return eventHandler.voteAgainst(id, votesFor, votesAgainst);
    }
    
    /**
     * Deletes the post (not allowed for generic posts).
     * @return always false as deletion is not allowed for generic posts
     */
    @Override
    public boolean deletePost() {
        GuiError error = new GuiError(new Exception("You can delete only your own post."), "Delete Error!");
        error.displayError();

        return false;
    }
    
    /**
     * Calculates the ratio of votes for the post.
     * @param votesFor the list of users who voted for the post
     * @param votesAgainst the list of users who voted against the post
     */
    @Override
    public void calculateRatio(List<String> votesFor, List<String> votesAgainst) {
        int totalVotes = votesFor.size() + votesAgainst.size();
        
        if (totalVotes == 0) {
            this.ratio = 0.0f;
            return;
        }
        
        double ratio = ((double) votesFor.size() / totalVotes) * 100;
        double roundedRatio = Math.round(ratio * 10.0) / 10.0;
    
        this.ratio = (float) roundedRatio;
    }
}
