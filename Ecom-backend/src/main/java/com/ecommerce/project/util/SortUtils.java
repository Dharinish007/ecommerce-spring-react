package com.ecommerce.project.util;

import org.springframework.data.domain.Sort;

import java.util.Set;

public class SortUtils {

    private SortUtils() {
        // Private constructor for utility class
    }

    /**
     * Creates a safe Sort instance validated against an explicit allow-list.
     * Prevents database property leaks and Spring Data JPA property reference exceptions.
     *
     * @param sortBy        the field name requested by client
     * @param sortOrder     the direction requested by client ("asc" or "desc")
     * @param allowedFields set of allowed JPA entity field names
     * @param defaultField  safe fallback field name if requested field is not allowed
     * @return validated Sort instance
     */
    public static Sort createSafeSort(String sortBy, String sortOrder, Set<String> allowedFields, String defaultField) {
        String safeSortBy = defaultField;
        if (sortBy != null && !sortBy.isBlank()) {
            String trimmed = sortBy.trim();
            if (allowedFields.contains(trimmed)) {
                safeSortBy = trimmed;
            }
        }

        Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder != null ? sortOrder.trim() : "")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return Sort.by(direction, safeSortBy);
    }
}
