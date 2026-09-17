package com.ecommerce.project.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.model.Category;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByCategory(Category category, Pageable pageDetails);

    Page<Product> findByProductNameContainingIgnoreCase(String keyword, Pageable pageDetails);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.quantity = p.quantity - :quantity WHERE p.productId = :productId AND p.quantity >= :quantity")
    int deductStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.quantity = p.quantity + :quantity WHERE p.productId = :productId")
    int restoreStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
}
