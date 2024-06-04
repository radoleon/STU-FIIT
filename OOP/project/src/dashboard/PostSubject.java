package dashboard;

/**
 * Interface for subjects that notify observer of changes in posts.
 */
public interface PostSubject {
    
    /**
     * Notifies the observer to update posts.
     * @param observer observer to be notified
     */
    default void notifyObserver(DashboardObserver observer) {
        observer.updatePosts();
    }
}
