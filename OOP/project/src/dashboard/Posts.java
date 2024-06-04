package dashboard;

import java.sql.Array;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import auth.User;
import utils.DatabaseHandler;
import utils.Error;

/**
 * Singleton class representing a collection of posts.
 */
public class Posts {

    private static Posts instance;
    private DatabaseHandler databaseHandler;
    private List<Post> posts;

    /**
     * Private constructor to prevent instantiation from outside of the class.
     */
    private Posts() {
        
        databaseHandler = new DatabaseHandler();
        posts = new ArrayList<Post>();

        databaseHandler.connect();
        // Retrieves posts from the database
        ResultSet result = databaseHandler.getPosts();
        
        if (result == null) {
            return;
        }

        try {
            User userInstance = User.getInstance();

            while (result.next()) {

                Array votesFor = result.getArray("votes_for");
                Array votesAgainst = result.getArray("votes_against");

                ArrayList<String> votesForArrayList = new ArrayList<String>();
                ArrayList<String> votesAgainstArrayList = new ArrayList<String>();

                if (votesFor != null) {
                    votesForArrayList = new ArrayList<String>(Arrays.asList((String[]) votesFor.getArray()));
                }
                if (votesAgainst != null) {
                    votesAgainstArrayList = new ArrayList<String>(Arrays.asList((String[]) votesAgainst.getArray()));
                }
                
                // Divides posts into categories
                if (result.getString("uid").equals(userInstance.getUid())) {
                    posts.add(new OwnPost(
                        result.getString("id"),
                        result.getString("uid"),
                        result.getString("username"),
                        result.getString("title"),
                        result.getString("description"),
                        votesForArrayList,
                        votesAgainstArrayList
                    ));
                }
                
                else if (votesFor == null && votesAgainst == null) {
                    posts.add(new NewPost(
                        result.getString("id"),
                        result.getString("uid"),
                        result.getString("username"),
                        result.getString("title"),
                        result.getString("description"),
                        votesForArrayList,
                        votesAgainstArrayList
                    ));
                }

                else {
                    posts.add(new Post(
                        result.getString("id"),
                        result.getString("uid"),
                        result.getString("username"),
                        result.getString("title"),
                        result.getString("description"),
                        votesForArrayList,
                        votesAgainstArrayList
                    ));
                }
            }
        }
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
        }
        
        databaseHandler.disconnect();
        sortPosts();
    }

    /**
     * Gets the singleton instance of Posts.
     * @return the singleton instance of Posts
     */
    public static Posts getInstance() {
        if (instance == null) {
            instance = new Posts();
        }
        
        return instance;
    }

    /**
     * Sorts the posts based on their ratio in descending order.
     */
    public void sortPosts() {
        Collections.sort(posts, new Comparator<Post>() {
            
            @Override
            public int compare(Post p1, Post p2) {
                return Float.compare(p2.ratio, p1.ratio);
            }
        });
    }

    public List<Post> getPosts() {
        return posts;
    }

    /**
     * Removes posts details and resets the singleton instance to null.
     */
    public void removePostsDetails() {
        databaseHandler = null;
        posts = null;
        instance = null;
    }
}
