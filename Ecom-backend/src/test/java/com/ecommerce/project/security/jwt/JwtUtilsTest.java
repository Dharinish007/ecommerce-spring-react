package com.ecommerce.project.security.jwt;

import com.ecommerce.project.security.services.UserDetailsImpl;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "YXRzdG9uZWJlZ2FuZHJld2ZhbW91c3NvbGRpZXJjbGltYmNhc2VtaWNlZmxpZ2h0bG8=");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 86400000);
        ReflectionTestUtils.setField(jwtUtils, "jwtCookie", "sbecomcookie");
    }

    @Test
    void testGenerateJwtCookie() {
        UserDetailsImpl userPrincipal = new UserDetailsImpl(
                1L, "testuser", "test@example.com", "password", Collections.emptyList()
        );

        ResponseCookie cookie = jwtUtils.generateJwtCookie(userPrincipal);
        assertNotNull(cookie);
        assertEquals("sbecomcookie", cookie.getName());
        assertTrue(cookie.isHttpOnly());
        assertEquals("/api", cookie.getPath());
        assertEquals("Lax", cookie.getSameSite());
        assertTrue(cookie.getMaxAge().getSeconds() > 0);
        assertNotNull(cookie.getValue());
        assertTrue(jwtUtils.validateJwtToken(cookie.getValue()));
        assertEquals("testuser", jwtUtils.getUsernameFromJwt(cookie.getValue()));
    }

    @Test
    void testGetCleanJwtCookie() {
        ResponseCookie cleanCookie = jwtUtils.getCleanJwtCookie();
        assertNotNull(cleanCookie);
        assertEquals("sbecomcookie", cleanCookie.getName());
        assertEquals("", cleanCookie.getValue());
        assertEquals(0, cleanCookie.getMaxAge().getSeconds());
        assertEquals("/api", cleanCookie.getPath());
        assertTrue(cleanCookie.isHttpOnly());
    }

    @Test
    void testGetJwtFromCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        String token = jwtUtils.generateJwtFromUsername("cookieuser");
        request.setCookies(new Cookie("sbecomcookie", token));

        String extracted = jwtUtils.getJwtFromCookies(request);
        assertEquals(token, extracted);
    }

    @Test
    void testGetJwtFromHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer sampletoken123");

        String extracted = jwtUtils.getJwtFromHeader(request);
        assertEquals("sampletoken123", extracted);
    }
}
