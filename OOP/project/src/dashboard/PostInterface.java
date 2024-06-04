package dashboard;

import java.util.List;

/**
 * Interface for a post in the dashboard.
 */
public interface PostInterface {
    public boolean deletePost();
    public boolean voteFor();
    public boolean voteAgainst();
    public void calculateRatio(List<String> votesFor, List<String> votesAgainst);
}
