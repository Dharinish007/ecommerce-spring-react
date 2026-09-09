package com.ecommerce.project.payload;

import com.ecommerce.project.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateDTO {
    @NotNull(message = "Order status is required")
    private OrderStatus orderStatus;
}
