package utils;

import java.sql.Array;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;
import auth.User;

/**
 * Utility class for handling database operations.
 */
public class DatabaseHandler {
    
    private Connection connection;
    private PreparedStatement statement;

    /**
     * Establishes a connection to the database using environment variables.
     */
    public void connect() {
        try {
            Class.forName("org.postgresql.Driver");
            
            this.connection = DriverManager.getConnection(
                System.getenv("DATABASE_URL"),
                System.getenv("DATABASE_USER"),
                System.getenv("DATABASE_PASSWORD")
            );
        }
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
        }
    }

    /**
     * Closes the database connection and prepared statement.
     */
    public void disconnect() {
        try {
            connection.close();
            statement.close();
            this.connection = null;
            this.statement = null;
        }
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
        }
    }

     /**
     * Adds a new user to the database.
     * @param uid The unique identifier for the user.
     * @param username The username of the user.
     * @param password The password of the user.
     * @return True if the user was added successfully, false otherwise.
     */
    public boolean addUser(String uid, String username, String password) {
        try {
            String query = "INSERT INTO users (uid, username, password) VALUES (?, ?, ?);";

            this.statement = connection.prepareStatement(query);
            
            statement.setString(1, uid);
            statement.setString(2, username);
            statement.setString(3, password);
    
            statement.executeUpdate();
            return true;
        } 
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();

            return false;
        }
    }

    /**
     * Retrieves a user from the database based on the username.
     * @param username The username of the user to retrieve.
     * @return ResultSet containing the user information if found, null otherwise.
     */
    public ResultSet getUser(String username) {
        try {
            String query = "SELECT * FROM users WHERE username = ?;";

            this.statement = connection.prepareStatement(query);
            statement.setString(1, username);

            ResultSet resultSet = statement.executeQuery();
            return resultSet;
        } 
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();

            return null;
        }
    }

    /**
     * Adds a new post to the database.
     * @param id The unique identifier for the post.
     * @param title The title of the post.
     * @param description The description of the post.
     * @return True if the post was added successfully, false otherwise.
     */
    public boolean addPost(String id, String title, String description) {
        try {

            String query = (
                "INSERT INTO posts (id, uid, username, title, description, votes_for, votes_against)" +
                "VALUES (?, ?, ?, ?, ?, ?, ?);"
            );

            this.statement = connection.prepareStatement(query);
            User userInstance = User.getInstance();

            statement.setString(1, id);
            statement.setString(2, userInstance.getUid());
            statement.setString(3, userInstance.getUsername());
            statement.setString(4, title);
            statement.setString(5, description);
            statement.setNull(6, Types.ARRAY);
            statement.setNull(7, Types.ARRAY);

            statement.executeUpdate();
            return true;
        } 
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();

            return false;
        }
    }

    /**
     * Deletes a post from the database based on its id.
     * @param id The id of the post to delete.
     * @return True if the post was deleted successfully, false otherwise.
     */
    public boolean deletePost(String id) {
        try {
            String query = "DELETE FROM posts WHERE id = ?;";
            this.statement = connection.prepareStatement(query);

            statement.setString(1, id);
            statement.executeUpdate();

            return true;
        }
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();

            return false;
        }
    }

    /**
     * Retrieves all posts from the database.
     * @return ResultSet containing all posts if retrieval is successful, null otherwise.
     */
    public ResultSet getPosts() {
        try {
            String query = "SELECT * FROM posts;";
            this.statement = connection.prepareStatement(query);

            ResultSet resultSet = statement.executeQuery();
            return resultSet;
        }
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();

            return null;
        }
    }

    /**
     * Updates the votes for and against a post in the database.
     * @param id The id of the post to update.
     * @param votesFor An array of user ids who voted for the post.
     * @param votesAgainst An array of user ids who voted against the post.
     * @return True if the votes were updated successfully, false otherwise.
     */
    public boolean updateVotes(String id, String[] votesFor, String[] votesAgainst) {
        try {
            String query = "UPDATE posts SET votes_for = ?, votes_against = ? WHERE id = ?;";
            this.statement = connection.prepareStatement(query);

            Array votesForArray = connection.createArrayOf("TEXT", votesFor);
            Array votesAgainstArray = connection.createArrayOf("TEXT", votesAgainst);

            statement.setArray(1, votesForArray);
            statement.setArray(2, votesAgainstArray);
            statement.setString(3, id);

            statement.executeUpdate();
            return true;
        } 
        catch (Exception e) {
            Error error = new Error(e);
            error.displayError();
            
            return false;
        }
    }
}
