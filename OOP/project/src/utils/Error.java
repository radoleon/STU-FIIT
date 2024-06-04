package utils;

/**
 * Utility class for displaying error messages.
 */
public class Error {

    protected Exception exception;

    /**
     * Constructs an Error object with the given exception.
     * @param e The exception to be handled.
     */
    public Error(Exception e) {
        this.exception = e;
    }

    /**
     * Displays the error message to the standard error stream.
     */
    public void displayError() {
        System.err.println(exception);
    }
}
