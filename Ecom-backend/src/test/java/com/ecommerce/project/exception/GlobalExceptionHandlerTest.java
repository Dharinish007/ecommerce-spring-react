package com.ecommerce.project.exception;

import com.ecommerce.project.payload.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private MyGlobalExceptionHandler exceptionHandler;
    private HttpServletRequest mockRequest;

    @BeforeEach
    void setUp() {
        exceptionHandler = new MyGlobalExceptionHandler();
        mockRequest = mock(HttpServletRequest.class);
        when(mockRequest.getRequestURI()).thenReturn("/api/test-endpoint");
    }

    @Test
    void testHandleMethodArgumentNotValidException_Returns400WithFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("user", "email", "must be a well-formed email address");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleMethodArgumentNotValidException(ex, mockRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.getStatus());
        assertEquals("VALIDATION_FAILED", body.getError());
        assertEquals("/api/test-endpoint", body.getPath());
        assertNotNull(body.getValidationErrors());
        assertEquals("must be a well-formed email address", body.getValidationErrors().get("email"));
    }

    @Test
    void testHandleConstraintViolationException_Returns400() {
        ConstraintViolation<?> violation = mock(ConstraintViolation.class);
        Path path = mock(Path.class);
        when(path.toString()).thenReturn("pincode");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("must be 6 digits");

        ConstraintViolationException ex = new ConstraintViolationException(Set.of(violation));

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleConstraintViolationException(ex, mockRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.getStatus());
        assertEquals("VALIDATION_FAILED", body.getError());
        assertEquals("must be 6 digits", body.getValidationErrors().get("pincode"));
    }

    @Test
    void testHandleHttpMessageNotReadableException_Returns400() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleHttpMessageNotReadableException(ex, mockRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.getStatus());
        assertEquals("MALFORMED_REQUEST", body.getError());
    }

    @Test
    void testHandleResourceNotFoundException_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Product", "productId", 42L);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFoundException(ex, mockRequest);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(404, body.getStatus());
        assertEquals("RESOURCE_NOT_FOUND", body.getError());
        assertTrue(body.getMessage().contains("Product is not found with productId : 42"));
    }

    @Test
    void testHandleAPIException_Returns400() {
        APIException ex = new APIException("Requested quantity exceeds available stock");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAPIException(ex, mockRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.getStatus());
        assertEquals("BAD_REQUEST", body.getError());
        assertEquals("Requested quantity exceeds available stock", body.getMessage());
    }

    @Test
    void testHandleBadCredentialsException_Returns401() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadCredentialsException(ex, mockRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(401, body.getStatus());
        assertEquals("UNAUTHORIZED", body.getError());
        assertEquals("Invalid username or password", body.getMessage());
    }

    @Test
    void testHandleAccessDeniedException_Returns403() {
        AccessDeniedException ex = new AccessDeniedException("Access is denied");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDeniedException(ex, mockRequest);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(403, body.getStatus());
        assertEquals("FORBIDDEN", body.getError());
        assertEquals("You do not have permission to access this resource", body.getMessage());
    }

    @Test
    void testHandleGeneralException_Returns500_DoesNotExposeInternalStackTrace() {
        Exception internalEx = new NullPointerException("Null reference in internal payment gateway adapter");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneralException(internalEx, mockRequest);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(500, body.getStatus());
        assertEquals("INTERNAL_SERVER_ERROR", body.getError());
        // Verify internal details/stack trace are hidden from client response
        assertFalse(body.getMessage().contains("Null reference"));
        assertFalse(body.getMessage().contains("payment gateway adapter"));
        assertEquals("An unexpected internal error occurred. Please try again later.", body.getMessage());
    }
}
