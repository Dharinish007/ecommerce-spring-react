package com.ecommerce.project.controller;

import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.ecommerce.project.security.jwt.JwtUtils;
import com.ecommerce.project.security.request.LoginRequest;
import com.ecommerce.project.security.response.UserInfoResponse;
import com.ecommerce.project.security.services.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    private JwtUtils jwtUtils;
    private AuthenticationManager authenticationManager;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private RoleRepository roleRepository;
    private AuthController authController;

    @BeforeEach
    void setUp() {
        jwtUtils = Mockito.mock(JwtUtils.class);
        authenticationManager = Mockito.mock(AuthenticationManager.class);
        userRepository = Mockito.mock(UserRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        roleRepository = Mockito.mock(RoleRepository.class);

        authController = new AuthController(
                jwtUtils,
                authenticationManager,
                userRepository,
                passwordEncoder,
                roleRepository
        );
    }

    @Test
    void testAuthenticateUserSuccess_SetsCookieAndOmitsJwtFromBody() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        UserDetailsImpl userDetails = new UserDetailsImpl(
                1L, "testuser", "test@example.com", "encodedpass",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        ResponseCookie cookie = ResponseCookie.from("sbecomcookie", "mocked-jwt-token")
                .path("/api")
                .httpOnly(true)
                .build();
        when(jwtUtils.generateJwtCookie(userDetails)).thenReturn(cookie);

        ResponseEntity<?> response = authController.authenticateUser(loginRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getHeaders().containsKey(HttpHeaders.SET_COOKIE));
        assertTrue(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE).contains("sbecomcookie=mocked-jwt-token"));

        assertTrue(response.getBody() instanceof UserInfoResponse);
        UserInfoResponse userInfo = (UserInfoResponse) response.getBody();
        assertEquals(1L, userInfo.getId());
        assertEquals("testuser", userInfo.getUsername());
        assertEquals("test@example.com", userInfo.getEmail());
        assertEquals(List.of("ROLE_USER"), userInfo.getRoles());
    }

    @Test
    void testAuthenticateUserFailure_ReturnsUnauthorized() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrongpass");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseEntity<?> response = authController.authenticateUser(loginRequest);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testGetUserDetailsUnauthenticated_ReturnsUnauthorized() {
        ResponseEntity<?> response = authController.getUserDetails(null);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testGetUserDetailsAnonymousPrincipal_ReturnsUnauthorized() {
        Authentication anonymousAuth = new UsernamePasswordAuthenticationToken("anonymousUser", null);
        ResponseEntity<?> response = authController.getUserDetails(anonymousAuth);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testGetUserDetailsAuthenticated_ReturnsUserInfoWithoutJwt() {
        UserDetailsImpl userDetails = new UserDetailsImpl(
                2L, "admin", "admin@example.com", "encodedpass",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        ResponseEntity<?> response = authController.getUserDetails(auth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof UserInfoResponse);
        UserInfoResponse userInfo = (UserInfoResponse) response.getBody();
        assertEquals(2L, userInfo.getId());
        assertEquals("admin", userInfo.getUsername());
        assertEquals(List.of("ROLE_ADMIN"), userInfo.getRoles());
    }

    @Test
    void testSignoutUser_ReturnsCleanCookie() {
        ResponseCookie cleanCookie = ResponseCookie.from("sbecomcookie", "")
                .path("/api")
                .maxAge(0)
                .httpOnly(true)
                .build();
        when(jwtUtils.getCleanJwtCookie()).thenReturn(cleanCookie);

        ResponseEntity<?> response = authController.signoutUser();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getHeaders().containsKey(HttpHeaders.SET_COOKIE));
        assertTrue(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE).contains("Max-Age=0"));
    }
}
