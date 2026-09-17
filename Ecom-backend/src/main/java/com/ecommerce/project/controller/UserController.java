package com.ecommerce.project.controller;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.exception.ResourceNotFoundException;
import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.UserDTO;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.ecommerce.project.security.response.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserController(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    private UserDTO mapToUserDTO(User user) {
        List<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(r -> r.getRoleName().name()).toList()
                : List.of();
        return new UserDTO(user.getUserId(), user.getUserName(), user.getEmail(), roleNames);
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDTO> userDTOs = users.stream().map(this::mapToUserDTO).toList();
        return ResponseEntity.ok(userDTOs);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "userId", userId));
        return ResponseEntity.ok(mapToUserDTO(user));
    }

    @PutMapping("/{userId}/roles")
    public ResponseEntity<MessageResponse> updateUserRoles(@PathVariable Long userId, @RequestBody Set<String> newRoles) {
        if (newRoles == null || newRoles.isEmpty()) {
            throw new APIException("Role set cannot be empty. At least one valid role must be specified.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "userId", userId));

        Set<Role> roles = new HashSet<>();
        for (String roleStr : newRoles) {
            if (roleStr == null || roleStr.trim().isEmpty()) {
                throw new APIException("Role name cannot be empty.");
            }
            switch (roleStr.trim().toUpperCase()) {
                case "ADMIN":
                case "ROLE_ADMIN":
                    Role adminRole = roleRepository.findByRoleName(AppRole.ROLE_ADMIN)
                            .orElseThrow(() -> new APIException("Role ROLE_ADMIN not found"));
                    roles.add(adminRole);
                    break;
                case "SELLER":
                case "ROLE_SELLER":
                    Role sellerRole = roleRepository.findByRoleName(AppRole.ROLE_SELLER)
                            .orElseThrow(() -> new APIException("Role ROLE_SELLER not found"));
                    roles.add(sellerRole);
                    break;
                case "USER":
                case "ROLE_USER":
                    Role defaultUserRole = roleRepository.findByRoleName(AppRole.ROLE_USER)
                            .orElseThrow(() -> new APIException("Role ROLE_USER not found"));
                    roles.add(defaultUserRole);
                    break;
                default:
                    throw new APIException("Invalid role: '" + roleStr + "'. Allowed roles are: ROLE_USER, ROLE_SELLER, ROLE_ADMIN");
            }
        }

        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth != null && currentAuth.getName().equals(user.getUserName())) {
            boolean stillAdmin = roles.stream().anyMatch(r -> r.getRoleName() == AppRole.ROLE_ADMIN);
            if (!stillAdmin) {
                throw new APIException("Administrators cannot remove their own ADMIN role.");
            }
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User roles updated successfully"));
    }
}
