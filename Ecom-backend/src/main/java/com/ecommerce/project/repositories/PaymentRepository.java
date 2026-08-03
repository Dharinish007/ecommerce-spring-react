package com.ecommerce.project.repositories;

import com.ecommerce.project.model.Payment;
import com.ecommerce.project.payload.PaymentDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment,Long> {
}
