package auth;

/**
 * Represents a user in the system.
 */
public class User {

    private static User instance;
    private String uid;
    private String username;

    /**
     * Private constructor to enforce singleton pattern.
     * @param uid the unique identifier of the user
     * @param username the username of the user
     */
    private User(String uid, String username) {
        this.uid = uid;
        this.username = username;
    }
    
    /**
     * Returns the singleton instance of the User class with the specified uid and username.
     * @param uid the unique identifier of the user
     * @param username the username of the user
     * @return the singleton instance of the User class
     */
    public static User getInstance(String uid, String username) {
        if (instance == null) {
            instance = new User(uid, username);
        }
        
        return instance;
    }

    /**
     * Returns the singleton instance of the User class.
     * @return the singleton instance of the User class
     */
    public static User getInstance() {        
        return instance;
    }
    
    public String getUsername() {
        return username;
    }

    public String getUid() {
        return uid;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    /**
     * Removes user details and resets the singleton instance to null.
     */
    public void removeUserDetails() {
        uid = null;
        username = null;
        instance = null;
    }
}
