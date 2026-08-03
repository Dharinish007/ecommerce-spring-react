package com.ecommerce.project;

import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.repositories.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SbEcommerceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SbEcommerceApplication.class, args);

	}
    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository) {
        return args -> {
            if (roleRepository.findByRoleName(AppRole.ROLE_USER).isEmpty())
                roleRepository.save(new Role(AppRole.ROLE_USER));

            if (roleRepository.findByRoleName(AppRole.ROLE_ADMIN).isEmpty())
                roleRepository.save(new Role(AppRole.ROLE_ADMIN));

            if (roleRepository.findByRoleName(AppRole.ROLE_SELLER).isEmpty())
                roleRepository.save(new Role(AppRole.ROLE_SELLER));
        };
    }

}
