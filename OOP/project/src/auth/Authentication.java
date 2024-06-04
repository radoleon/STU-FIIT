package auth;

import java.sql.ResultSet;
import java.util.UUID;
import dashboard.Posts;
import utils.DatabaseHandler;
import utils.GuiError;

/**
 * Handles user authentication operations such as login and logout.
 */
public class Authentication {

    private DatabaseHandler databaseHandler = new DatabaseHandler();

    /**
     * Logs in the user with the provided username and password.
     * @param username the username of the user
     * @param password the password of the user
     * @return true if the login is successful, false otherwise
     */
    public boolean login(String username, String password) {
        try {
            // Validate input parameters
            if (username.length() == 0 || password.length() == 0 ) {
                throw new Exception("Username and password values are required.");
            }

            if (password.length() < 4) {
                throw new Exception("Password must be at least 4 characters long.");
            }
    
            databaseHandler.connect();
            ResultSet user = databaseHandler.getUser(username);
            
            if (user == null) {
                databaseHandler.disconnect();
                return false;
            }
    
            boolean success;
            
            if (!user.next()) {
                // Create a new user if the user doesn't exist
                String uuid = UUID.randomUUID().toString().replace("-", "");
                success = databaseHandler.addUser(uuid, username, password);
    
                if (success) {
                    User.getInstance(uuid, username);
                }
                else {
                    throw new Exception("Error occured while creating your account.");
                }
            }
            
            else {
                // Check if the provided password matches the stored password
                success = user.getString("password").equals(password);
    
                if (success) {
                    User.getInstance(user.getString("uid"), username);
                }
                else {
                    throw new Exception("Incorrect password or account with this username already exists.");
                }
            }
    
            databaseHandler.disconnect();
            return success;
        }
        catch (Exception e) {
            GuiError error = new GuiError(e, "Authentication Error!");
            error.displayError();

            return false;
        }
    }

    /**
     * Logs out the current user by removing user details and post details.
     */
    public void logout() {
        User userInstance = User.getInstance();
        userInstance.removeUserDetails();

        Posts postsInstance = Posts.getInstance();
        postsInstance.removePostsDetails();
    }
}
