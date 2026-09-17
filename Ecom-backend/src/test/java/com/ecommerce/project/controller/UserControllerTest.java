package com.ecommerce.project.controller;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.model.User;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.ecommerce.project.security.response.MessageResponse;
import com.ecommerce.project.security.services.UserDetailsImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private UserController userController;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        roleRepository = Mockito.mock(RoleRepository.class);
        userController = new UserController(userRepository, roleRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdateUserRoles_RejectsNullOrEmptySet() {
        APIException ex1 = assertThrows(APIException.class, () ->
                userController.updateUserRoles(1L, null)
        );
        assertTrue(ex1.getMessage().contains("Role set cannot be empty"));

        APIException ex2 = assertThrows(APIException.class, () ->
                userController.updateUserRoles(1L, Collections.emptySet())
        );
        assertTrue(ex2.getMessage().contains("Role set cannot be empty"));
    }

    @Test
    void testUpdateUserRoles_RejectsInvalidRoleString() {
        User user = new User();
        user.setUserId(2L);
        user.setUserName("john");
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        APIException ex = assertThrows(APIException.class, () ->
                userController.updateUserRoles(2L, Set.of("ROLE_SUPER_ADMIN"))
        );
        assertTrue(ex.getMessage().contains("Invalid role specified: ROLE_SUPER_ADMIN"));
    }

    @Test
    void testUpdateUserRoles_PreventsAdminSelfDemotion() {
        User adminUser = new User();
        adminUser.setUserId(1L);
        adminUser.setUserName("admin");
        Role adminRole = new Role(AppRole.ROLE_ADMIN);
        adminUser.setRoles(Set.of(adminRole));

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        UserDetailsImpl userDetails = new UserDetailsImpl(
                1L, "admin", "admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        Role userRole = new Role(AppRole.ROLE_USER);
        when(roleRepository.findByRoleName(AppRole.ROLE_USER)).thenReturn(Optional.of(userRole));

        APIException ex = assertThrows(APIException.class, () ->
                userController.updateUserRoles(1L, Set.of("user"))
        );
        assertTrue(ex.getMessage().contains("Administrators cannot remove their own ADMIN role"));
    }

    @Test
    void testUpdateUserRoles_SuccessWhenValid() {
        User user = new User();
        user.setUserId(3L);
        user.setUserName("alice");
        user.setRoles(new HashSet<>());

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        Role sellerRole = new Role(AppRole.ROLE_SELLER);
        when(roleRepository.findByRoleName(AppRole.ROLE_SELLER)).thenReturn(Optional.of(sellerRole));

        ResponseEntity<MessageResponse> response = userController.updateUserRoles(3L, Set.of("seller"));
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getMessage().contains("Roles updated successfully"));
        verify(userRepository, times(1)).save(user);
    }
}
