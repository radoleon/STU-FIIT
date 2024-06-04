package utils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import auth.User;
import dashboard.NewPost;
import dashboard.OwnPost;
import dashboard.Post;
import dashboard.Posts;

/**
 * Handles events such as creating, voting for, voting against, and deleting posts.
 */
public class EventHandler {
    
    private DatabaseHandler databaseHandler = new DatabaseHandler();
    private Posts postsInstance = Posts.getInstance();
    private User userInstance = User.getInstance();

    /**
     * Creates a new post.
     * @param title The title of the post.
     * @param description The description of the post.
     * @return True if the post creation is successful, otherwise false.
     */
    public boolean createPost(String title, String description) {
        try {
            // Validate input parameters
            if (title.length() == 0 || description.length() == 0) {
                throw new Exception("Title and description values are required.");
            }

            String uuid = UUID.randomUUID().toString().replace("-", "");
            AtomicBoolean success = new AtomicBoolean();
            
            // Database update thread
            Thread databaseUpdateThread = new Thread(() -> {
                databaseHandler.connect();
                success.set(databaseHandler.addPost(uuid, title, description));
                databaseHandler.disconnect();
            });

            // Client update thread
            Thread clientUpdateThread = new Thread(() -> {
                postsInstance.getPosts().add(
                    new OwnPost(uuid, userInstance.getUid(), userInstance.getUsername(), title, description, new ArrayList<String>(), new ArrayList<String>())
                );
                
                postsInstance.sortPosts();
            });

            databaseUpdateThread.start();
            clientUpdateThread.start();
            
            databaseUpdateThread.join();
            clientUpdateThread.join();
            
            return success.get();
        }
        
        catch (Exception e) {
            GuiError error = new GuiError(e, "Create Error!");
            error.displayError();

            return false;
        }
    }

    /**
     * Votes for a post.
     * @param id The id of the post to vote for.
     * @param votesFor The list of users who voted for the post.
     * @param votesAgainst The list of users who voted against the post.
     * @return True if the vote operation is successful, otherwise false.
     */
    public boolean voteFor(String id, List<String> votesFor, List<String> votesAgainst) {
        try {
            String currentUser = userInstance.getUid();
            AtomicBoolean success = new AtomicBoolean();
            
            // update votes array lists based on current state
            if (!votesFor.contains(currentUser) && !votesAgainst.contains(currentUser)) {
                votesFor.add(currentUser);
            }
            
            else if (votesFor.contains(currentUser) && !votesAgainst.contains(currentUser)) {
                votesFor.remove(currentUser);
            }
    
            else if (!votesFor.contains(currentUser) && votesAgainst.contains(currentUser)) {
                votesAgainst.remove(currentUser);
                votesFor.add(currentUser);
            }
            
            // Database update thread
            Thread databaseUpdateThread = new Thread(() -> {
                databaseHandler.connect();
                success.set(databaseHandler.updateVotes(id, votesFor.toArray(new String[0]), votesAgainst.toArray(new String[0])));
                databaseHandler.disconnect();
            });
            
            // Client update thread
            Thread clientUpdateThread = new Thread(() -> {
                Post postToUpdate = null;
                Post updatedPost = null;
        
                for (Post post: postsInstance.getPosts()) {
                    if (post.getId().equals(id) && post instanceof NewPost) {
                        postToUpdate = post;
        
                        updatedPost = new Post(
                            post.getId(),
                            post.getUid(),
                            post.getUsername(),
                            post.getTitle(),
                            post.getDescription(),
                            votesFor,
                            votesAgainst
                        );
        
                        break;
                    }
        
                    if (post.getId().equals(id) && !(post instanceof NewPost)) {
                        post.calculateRatio(votesFor, votesAgainst);
                        break;
                    }
                }
        
                if (updatedPost != null && postToUpdate != null) {
                    postsInstance.getPosts().remove(postToUpdate);
                    postsInstance.getPosts().add(updatedPost);
                }
        
                postsInstance.sortPosts();
            });

            databaseUpdateThread.start();
            clientUpdateThread.start();
            
            databaseUpdateThread.join();
            clientUpdateThread.join();

            return success.get();
        } 
        
        catch (Exception e) {
            GuiError error = new GuiError(e, "Voting Error!");
            error.displayError();

            return false;
        }
    }

    /**
     * Votes against a post.
     * @param id The id of the post to vote against.
     * @param votesFor The list of users who voted for the post.
     * @param votesAgainst The list of users who voted against the post.
     * @return True if the vote operation is successful, otherwise false.
     */
    public boolean voteAgainst(String id, List<String> votesFor, List<String> votesAgainst) {
        try {
            String currentUser = userInstance.getUid();
            AtomicBoolean success = new AtomicBoolean();
            
            // update votes array lists based on current state
            if (!votesFor.contains(currentUser) && !votesAgainst.contains(currentUser)) {
                votesAgainst.add(currentUser);
            }
            
            else if (!votesFor.contains(currentUser) && votesAgainst.contains(currentUser)) {
                votesAgainst.remove(currentUser);
            }
    
            else if (votesFor.contains(currentUser) && !votesAgainst.contains(currentUser)) {
                votesFor.remove(currentUser);
                votesAgainst.add(currentUser);
            }
            
            // Database update thread
            Thread databaseUpdateThread = new Thread(() -> {
                databaseHandler.connect();
                success.set(databaseHandler.updateVotes(id, votesFor.toArray(new String[0]), votesAgainst.toArray(new String[0])));
                databaseHandler.disconnect();
            });
            
            // Client update thread
            Thread clientUpdateThread = new Thread(() -> {
                Post postToUpdate = null;
                Post updatedPost = null;
        
                for (Post post: postsInstance.getPosts()) {
                    if (post.getId().equals(id) && post instanceof NewPost) {
                        postToUpdate = post;
        
                        updatedPost = new Post(
                            post.getId(),
                            post.getUid(),
                            post.getUsername(),
                            post.getTitle(),
                            post.getDescription(),
                            votesFor,
                            votesAgainst
                        );
        
                        break;
                    }
        
                    if (post.getId().equals(id) && !(post instanceof NewPost)) {
                        post.calculateRatio(votesFor, votesAgainst);
        
                        break;
                    }
                }
        
                if (updatedPost != null && postToUpdate != null) {
                    postsInstance.getPosts().remove(postToUpdate);
                    postsInstance.getPosts().add(updatedPost);
                }
        
                postsInstance.sortPosts();
            });

            databaseUpdateThread.start();
            clientUpdateThread.start();
            
            databaseUpdateThread.join();
            clientUpdateThread.join();

            return success.get();
        }
        
        catch (Exception e) {
            GuiError error = new GuiError(e, "Voting Error!");
            error.displayError();

            return false;
        }
    }

    /**
     * Deletes a post.
     * @param id The id of the post to delete.
     * @return True if the deletion operation is successful, otherwise false.
     */
    public boolean deletePost(String id) {
        try {
            AtomicBoolean success = new AtomicBoolean();
            
            // Database update thread
            Thread databaseUpdateThread = new Thread(() -> {
                databaseHandler.connect();
                success.set(databaseHandler.deletePost(id));
                databaseHandler.disconnect();
            });
            
            // Client update thread
            Thread clientUpdateThread = new Thread(() -> {
                Post postToRemove = null;
                
                for (Post post : postsInstance.getPosts()) {
                    if (post.getId().equals(id)) {
                        postToRemove = post;
                        break;
                    }
                }
        
                postsInstance.getPosts().remove(postToRemove);
            });
            
            databaseUpdateThread.start();
            clientUpdateThread.start();

            databaseUpdateThread.join();
            clientUpdateThread.join();

            return success.get();
        }

        catch (Exception e) {
            GuiError error = new GuiError(e, "Delete Error!");
            error.displayError();

            return false;
        }
    }
}
