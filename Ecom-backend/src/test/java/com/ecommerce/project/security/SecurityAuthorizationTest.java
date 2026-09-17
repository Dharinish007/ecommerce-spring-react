package com.ecommerce.project.security;

import com.ecommerce.project.controller.AuthController;
import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.model.Address;
import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.model.User;
import com.ecommerce.project.repositories.AddressRepository;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.ecommerce.project.security.jwt.JwtUtils;
import com.ecommerce.project.security.services.UserDetailsImpl;
import com.ecommerce.project.service.AddressServiceImpl;
import com.ecommerce.project.util.AuthUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SecurityAuthorizationTest {

    private AuthController authController;
    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private AddressRepository addressRepository;
    private AuthUtil authUtil;
    private AddressServiceImpl addressService;
    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        JwtUtils mockJwtUtils = Mockito.mock(JwtUtils.class);
        AuthenticationManager authenticationManager = Mockito.mock(AuthenticationManager.class);
        userRepository = Mockito.mock(UserRepository.class);
        PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);
        roleRepository = Mockito.mock(RoleRepository.class);

        authController = new AuthController(
                mockJwtUtils,
                authenticationManager,
                userRepository,
                passwordEncoder,
                roleRepository
        );

        addressRepository = Mockito.mock(AddressRepository.class);
        authUtil = Mockito.mock(AuthUtil.class);
        ModelMapper modelMapper = new ModelMapper();
        addressService = new AddressServiceImpl(modelMapper, addressRepository, userRepository, authUtil);

        jwtUtils = new JwtUtils();
    }

    // --- Role Validation & Self-Demotion Tests ---

    @Test
    void testUpdateUserRoles_RejectsInvalidRole() {
        User targetUser = new User();
        targetUser.setUserId(10L);
        targetUser.setUserName("normalUser");
        when(userRepository.findById(10L)).thenReturn(Optional.of(targetUser));

        Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                new UserDetailsImpl(1L, "admin", "admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))),
                null
        );

        List<String> invalidRoles = List.of("SUPERADMIN");

        APIException exception = assertThrows(APIException.class, () ->
                authController.updateUserRoles(10L, invalidRoles, adminAuth)
        );

        assertTrue(exception.getMessage().contains("Invalid role specified: SUPERADMIN"));
    }

    @Test
    void testUpdateUserRoles_RejectsEmptyRolesList() {
        User targetUser = new User();
        targetUser.setUserId(10L);
        targetUser.setUserName("normalUser");
        when(userRepository.findById(10L)).thenReturn(Optional.of(targetUser));

        Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                new UserDetailsImpl(1L, "admin", "admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))),
                null
        );

        APIException exception = assertThrows(APIException.class, () ->
                authController.updateUserRoles(10L, Collections.emptyList(), adminAuth)
        );

        assertTrue(exception.getMessage().contains("At least one role must be assigned"));
    }

    @Test
    void testUpdateUserRoles_PreventsAdminSelfDemotion() {
        User adminUser = new User();
        adminUser.setUserId(1L);
        adminUser.setUserName("admin");
        Role adminRole = new Role(AppRole.ROLE_ADMIN);
        adminUser.setRoles(Set.of(adminRole));

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                new UserDetailsImpl(1L, "admin", "admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))),
                null
        );

        Role userRole = new Role(AppRole.ROLE_USER);
        when(roleRepository.findByRoleName(AppRole.ROLE_USER)).thenReturn(Optional.of(userRole));

        // Admin attempting to assign only 'user' role to themselves
        APIException exception = assertThrows(APIException.class, () ->
                authController.updateUserRoles(1L, List.of("user"), adminAuth)
        );

        assertTrue(exception.getMessage().contains("Administrators cannot remove their own ADMIN role"));
    }

    @Test
    void testUpdateUserRoles_SuccessfulWhenValid() {
        User targetUser = new User();
        targetUser.setUserId(2L);
        targetUser.setUserName("john");
        targetUser.setRoles(new HashSet<>());
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

        Role sellerRole = new Role(AppRole.ROLE_SELLER);
        when(roleRepository.findByRoleName(AppRole.ROLE_SELLER)).thenReturn(Optional.of(sellerRole));

        Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                new UserDetailsImpl(1L, "admin", "admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))),
                null
        );

        ResponseEntity<?> response = authController.updateUserRoles(2L, List.of("seller"), adminAuth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository, times(1)).save(targetUser);
        assertTrue(targetUser.getRoles().contains(sellerRole));
    }

    // --- IDOR / Resource Ownership Tests ---

    @Test
    void testAddressOwnership_ThrowsAccessDeniedException_WhenUserDoesNotOwnAddress() {
        User owner = new User();
        owner.setUserId(10L);

        Address address = new Address();
        address.setAddressId(100L);
        address.setUser(owner);

        User attacker = new User();
        attacker.setUserId(99L);
        Role userRole = new Role(AppRole.ROLE_USER);
        attacker.setRoles(Set.of(userRole));

        when(addressRepository.findById(100L)).thenReturn(Optional.of(address));
        when(authUtil.loggedInUser()).thenReturn(attacker);

        assertThrows(AccessDeniedException.class, () ->
                addressService.getAddressById(100L)
        );
    }

    @Test
    void testAddressOwnership_AllowsAdminAccessToAnyAddress() {
        User owner = new User();
        owner.setUserId(10L);

        Address address = new Address();
        address.setAddressId(100L);
        address.setCity("Metropolis");
        address.setUser(owner);

        User adminUser = new User();
        adminUser.setUserId(1L);
        Role adminRole = new Role(AppRole.ROLE_ADMIN);
        adminUser.setRoles(Set.of(adminRole));

        when(addressRepository.findById(100L)).thenReturn(Optional.of(address));
        when(authUtil.loggedInUser()).thenReturn(adminUser);

        assertDoesNotThrow(() -> {
            var dto = addressService.getAddressById(100L);
            assertNotNull(dto);
            assertEquals("Metropolis", dto.getCity());
        });
    }

    // --- JwtUtils Ephemeral Key Fallback Test ---

    @Test
    void testJwtUtils_FallbackToEphemeralKeyWhenSecretUnset() {
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000);
        ReflectionTestUtils.setField(jwtUtils, "jwtCookie", "sbecomcookie");

        UserDetailsImpl userPrincipal = new UserDetailsImpl(
                5L, "ephemeralUser", "ephem@test.com", "pass", Collections.emptyList()
        );

        // Should not throw even when jwtSecret is blank
        var cookie = jwtUtils.generateJwtCookie(userPrincipal);
        assertNotNull(cookie);
        assertNotNull(cookie.getValue());
        assertTrue(jwtUtils.validateJwtToken(cookie.getValue()));
        assertEquals("ephemeralUser", jwtUtils.getUsernameFromJwt(cookie.getValue()));
    }
}
