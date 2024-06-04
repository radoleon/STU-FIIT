package dashboard;

/**
 * Interface for observing changes in the dashboard and updating posts.
 */
public interface DashboardObserver {
    
    /**
     * Method to display posts on the dashboard.
     */
    public void showPosts();
    
    /**
     * Default method to update posts on the dashboard.
     * It delegates the update operation to the showPosts() method.
     */
    default public void updatePosts() {
        showPosts();
    }
}
