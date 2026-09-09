package com.ecommerce.project.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendURL;

    @Value("${project.image:images/}")
    private String imageDir;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        String cleanOrigin = (frontendURL != null && frontendURL.endsWith("/"))
                ? frontendURL.substring(0, frontendURL.length() - 1)
                : frontendURL;

        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173", cleanOrigin)
                .allowedMethods("GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Set-Cookie")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String normalizedDir = imageDir.endsWith("/") ? imageDir : imageDir + "/";
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + normalizedDir, "classpath:/static/images/");
    }
}
